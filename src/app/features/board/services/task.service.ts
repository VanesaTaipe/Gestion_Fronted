import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserService as AuthService } from '../../../core/auth/services/use.service';
import { Card, ComentarioCreateDTO, ColumnaResumen, CartaPrioridad, ArchivoAdjunto } from '../models/board.model';

export interface TaskCreateDTO {
  id_proyecto: number | string;
  id_columna: number | string;
  titulo: string;
  descripcion?: string;
  due_at?: string | Date;
  id_asignado?: number;
  id_creador?: number;
  position?: number;
  prioridad: string;
  images?: File[]; 
  imageUrls?: string[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private api = environment.apiBase;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private toMySQLDateTime(value?: string | Date): string | undefined {
    if (!value) return undefined;
    
    try {
      let date: Date;
      
      if (typeof value === 'string') {
        if (value.length === 10) {
          date = new Date(value + 'T23:59:59');
        } else {
          date = new Date(value);
        }
      } else {
        date = value;
      }
      
      if (Number.isNaN(date.getTime())) {
        console.warn('Fecha inválida:', value);
        return undefined;
      }

      const pad = (n: number) => n.toString().padStart(2, '0');
      const yyyy = date.getFullYear();
      const mm = pad(date.getMonth() + 1);
      const dd = pad(date.getDate());
      const hh = pad(date.getHours());
      const mi = pad(date.getMinutes());
      const ss = pad(date.getSeconds());
      
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return undefined;
    }
  }
  createCard(p: TaskCreateDTO): Observable<Card> {
    const currentUserId = this.authService.getCurrentUserId();
    if (!currentUserId) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    if (!p.prioridad) {
      return throwError(() => new Error('La prioridad es obligatoria'));
    }

    const body: any = {
      id_proyecto: Number(p.id_proyecto),
      id_columna: Number(p.id_columna),
      titulo: p.titulo,
      descripcion: p.descripcion ?? '',
      id_creador: currentUserId,
      position: p.position || 0,
      status: '0',
      prioridad: p.prioridad
    };

    const dueMySQL = this.toMySQLDateTime(p.due_at);
    if (dueMySQL) body.due_at = dueMySQL;
    
    if (p.id_asignado != null) body.id_asignado = Number(p.id_asignado);

    console.log('POST /tareas:', body);

    return this.http.post(`${this.api}/tareas`, body).pipe(
      switchMap((res: any) => {
        console.log('Tarea creada:', res);
        
        const t = res?.tarea?.data ?? res?.tarea ?? res;
        const taskId = t.id_tarea ?? t.id;
        
        if (!taskId) {
          throw new Error('No se pudo obtener el ID de la tarea creada');
        }

        const card: Card = {
          id: taskId,
          id_columna: t.id_columna ?? Number(p.id_columna),
          title: t.titulo ?? p.titulo,
          descripcion: t.descripcion ?? body.descripcion,
          id_asignado: t.id_asignado ?? p.id_asignado,
          asignado_a: '',
          due_at: t.due_at ?? dueMySQL,
          prioridad: this.normalizePriority(t.prioridad ?? p.prioridad),
          archivos: [],
          comentarios_count: 0,
        };
        if (p.images && p.images.length > 0) {
          console.log(`Subiendo ${p.images.length} archivo(s) para tarea ${taskId}`);
          
          if (p.images.length > 3) {
            console.warn('Solo se subirán los primeros 5.');
            p.images = p.images.slice(0, 3);
          }
          const uploadObservables = p.images.map(file => 
            this.uploadFileToTask(taskId, file)
          );

          return forkJoin(uploadObservables).pipe(
            map(archivos => {
              console.log('Todos los archivos subidos:', archivos);
              card.archivos = archivos;
              return card;
            }),
            catchError(err => {
              console.error('Error subiendo archivos:', err);
              return of(card);
            })
          );
        }

        return of(card);
      }),
      catchError(err => {
        console.error('Error creando tarea:', err);
        return throwError(() => err);
      })
    );
  }

  uploadFileToTask(taskId: number, file: File): Observable<ArchivoAdjunto> {
    const formData = new FormData();

    formData.append('archivo', file);
    formData.append('archivo[id_tarea]', taskId.toString());
    
    console.log('Subiendo archivo:', {
      nombre: file.name,
      tamaño: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      tipo: file.type,
      tareaId: taskId
    });
    
    return this.http.post<any>(`${this.api}/archivos`, formData).pipe(
      map((res: any) => {
        console.log('Respuesta del servidor:', res);
        
        const archivoData = res?.archivo?.data ?? res?.archivo ?? res;
        
        const archivo: ArchivoAdjunto = {
          id: archivoData.id,
          id_tarea: archivoData.id_tarea,
          archivo_nombre: archivoData.archivo_nombre,
          archivo_ruta: archivoData.archivo_ruta,
          status: archivoData.status
        };
        
        console.log('Archivo procesado:', archivo);
        return archivo;
      }),
      catchError(err => {
        console.error('Error subiendo archivo:', err);
        
        if (err.status === 400 && err.error?.error?.includes('límite')) {
          throw new Error('Límite de 5 archivos alcanzado');
        }
        
        if (err.status === 422) {
          throw new Error('Datos de validación incorrectos');
        }
        
        throw new Error(err.error?.error || 'Error al subir el archivo');
      })
    );
  }

  moveCard(taskId: number | string, toColumnId: number | string, toIndex1Based: number): Observable<any> {
    return this.http.put(`${this.api}/tareas/${taskId}`, {
      id_columna: Number(toColumnId),
      position: Number(toIndex1Based),
    });
  }

  reorderCard(columnId: number | string, items: { id: number | string; position: number }[]): Observable<any> {
    return this.http.post(`${this.api}/tareas/bulk/reorder`, {
      id_columna: Number(columnId),
      items: items.map(i => ({ id: Number(i.id), position: Number(i.position) })),
    });
  }
  checkDuplicateTaskName(
    projectId: number, 
    titulo: string, 
    excludeTaskId?: number
  ): Observable<boolean> {
    const tituloNormalizado = titulo.trim().toLowerCase();
    
    return this.http.get<any>(`${this.api}/proyectos/${projectId}/tareas`).pipe(
      map((response: any) => {
        const tareas = response?.data || response?.tareas || [];
        
        const duplicate = tareas.some((t: any) => {
          const taskId = t.id_tarea || t.id;
          const taskTitle = (t.titulo || '').trim().toLowerCase();
          
          if (excludeTaskId && taskId === excludeTaskId) {
            return false;
          }
          
          return taskTitle === tituloNormalizado;
        });
        
        return duplicate;
      }),
      catchError(err => {
        console.error('Error verificando duplicados:', err);
        return of(false);
      })
    );
  }

  updateCard(card: Card): Observable<any> {
    const body = {
      titulo: card.title,
      descripcion: card.descripcion,
      prioridad: card.prioridad,
      due_at: card.due_at,
      asignado_a: card.asignado_a,
      id_asignado: card.id_asignado
    };

    return this.http.put(`${this.api}/tareas/${card.id}`, body);
  }
  getTaskFilesComplete(tareaId: number): Observable<ArchivoAdjunto[]> {
  console.log(`GET archivos completos para tarea ${tareaId}`);
  
  return this.http.get<any>(`${this.api}/tareas/${tareaId}/archivos`).pipe(
    map(response => {
      console.log('Respuesta de archivos:', response);
      const archivos = response?.data || [];
      
      if (!Array.isArray(archivos)) {
        console.warn('Formato inesperado:', archivos);
        return [];
      }

      archivos.forEach((a: any) => {
        console.log('Archivo recibido:', {
          id: a.id,
          nombre: a.archivo_nombre,
          status: a.status,
          status_type: typeof a.status
        });
      });

      const archivosCompletos: ArchivoAdjunto[] = archivos.map((a: any) => ({
        id: a.id,
        id_tarea: a.id_tarea,
        archivo_nombre: a.archivo_nombre,
        archivo_ruta: a.archivo_ruta,
        status: a.status?.toString() || '0' 
      }));

      console.log(`${archivosCompletos.length} archivo(s) mapeado(s):`, archivosCompletos);
      return archivosCompletos;
    }),
    catchError(err => {
      console.error('Error obteniendo archivos:', err);
      return of([]);
    })
  );
}
  getTaskFiles(tareaId: number): Observable<string[]> {
    console.log(`GET archivos para tarea ${tareaId}`);
    
    return this.http.get<any>(`${this.api}/tareas/${tareaId}/archivos`).pipe(
      map(response => {
        console.log('Respuesta de archivos:', response);
        
        const archivos = response?.data || response?.archivos || [];
        
        if (!Array.isArray(archivos)) {
          console.warn('Formato inesperado de archivos:', archivos);
          return [];
        }

        const urls = archivos
          .filter((archivo: any) => archivo.status === '0' || archivo.status === 0)
          .map((archivo: any) => archivo.archivo_ruta || archivo.url || '')
          .filter((url: string) => url.length > 0);

        console.log(` ${urls.length} URL(s) de archivo(s) obtenida(s):`, urls);
        return urls;
      }),
      catchError(err => {
        console.error('Error obteniendo archivos:', err);
        return of([]);
      })
    );
  }
  deleteCard(id: number): Observable<any> {
    return this.http.delete(`${this.api}/tareas/${id}`);
  }

  addComment(data: ComentarioCreateDTO): Observable<any> {
    console.log('Enviando comentario:', data);
    
    return this.http.post(`${this.api}/comentarios`, data).pipe(
      tap(res => console.log('Comentario creado:', res)),
      catchError(err => {
        console.error('Error creando comentario:', err);
        return throwError(() => err);
      })
    );
  }

  getComments(taskId: number): Observable<any[]> {
    return this.http.get<any>(`${this.api}/tareas/${taskId}/comentarios`).pipe(
      map((res: any) => {
        console.log('Comentarios recibidos:', res);
        const comentarios = res?.comentarios?.data || res?.comentarios || res?.data || [];
        return comentarios;
      }),
      catchError(err => {
        console.error('Error obteniendo comentarios:', err);
        return of([]);
      })
    );
  }

  getResumenTareas(projectId: number): Observable<ColumnaResumen[]> {
    return this.http.get<ColumnaResumen[]>(`${this.api}/proyectos/${projectId}/tareas/resumen`).pipe(
      tap(resumen => console.log('Resumen de tareas recibido:', resumen)),
      catchError(err => {
        console.error('Error obteniendo resumen:', err);
        return of([]);
      })
    );
  }

  private normalizePriority(prioridad: string): CartaPrioridad {
    const p = prioridad?.toLowerCase();
    if (p === 'alta' || p === 'media' || p === 'baja') {
      return p as CartaPrioridad;
    }
    return 'No asignada';
  }

  mapResumenToCards(resumen: ColumnaResumen[]): Card[] {
    const cards: Card[] = [];
    
    resumen.forEach(columna => {
      columna.tareas.forEach(tarea => {
        cards.push({
          id: tarea.id_tarea,
          id_columna: columna.id_columna,
          title: tarea.titulo,
          prioridad: this.normalizePriority(tarea.prioridad),
          comentarios_count: tarea.comentarios_count,
          position: tarea.position,
          due_at: tarea.due_at ?? null,
          comentarios: [],
          archivos: []
        });
      });
    });
    
    console.log('Cards mapeadas con comentarios_count:', cards);
    return cards;
  }

  deleteFile(fileId: number): Observable<any> {
    console.log(`Eliminando archivo ${fileId}`);
    
    return this.http.delete(`${this.api}/archivos/${fileId}`).pipe(
      tap(res => console.log('Archivo eliminado:', res)),
      catchError(err => {
        console.error('Error eliminando archivo:', err);
        
        if (err.status === 400 && err.error?.error?.includes('eliminado')) {
          throw new Error('El archivo ya está eliminado');
        }
        
        if (err.status === 404) {
          throw new Error('Archivo no encontrado');
        }
        
        throw new Error(err.error?.error || 'Error al eliminar archivo');
      })
    );
  }


  getTaskById(id: number): Observable<Card> {
  return this.http.get<any>(`${this.api}/tareas/${id}`).pipe(
    map((res: any) => {
      const t = res?.tarea?.data ?? res?.tarea ?? res;
      return {
        id: t.id,
        id_columna: t.columna || t.id_columna,
        title: t.titulo,
        descripcion: t.descripcion,
        prioridad: t.prioridad,
        due_at: t.due_at,
        id_asignado: t.id_asignado,
        asignado_a: t.asignado?.nombre || 'Sin asignar',
        comentarios: t.comentarios || [],
        archivos: [],
        } as Card;
      })
    );
  }
}