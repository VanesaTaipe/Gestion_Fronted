import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserService as AuthService } from '../../../core/auth/services/use.service';
import { Card} from '../models/board.model';
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

  /** Convierte "YYYY-MM-DD" a "YYYY-MM-DD HH:MM:SS" (MySQL TIMESTAMP) */
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
        console.warn('⚠️ Fecha inválida:', value);
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

    console.log('📤 POST /tareas:', body);

    return this.http.post(`${this.api}/tareas`, body).pipe(
      map((res: any) => {
        console.log('Tarea creada:', res);
        
        const t = res?.tarea?.data ?? res?.tarea ?? res;
        
        const card: Card = {
          id: t.id_tarea ?? t.id,
          id_columna: t.id_columna ?? Number(p.id_columna),
          title: t.titulo ?? p.titulo,
          descripcion: t.descripcion ?? body.descripcion,
          id_asignado: t.id_asignado ?? p.id_asignado,
          fecha_vencimiento: t.due_at ?? dueMySQL,
          prioridad: (t.prioridad ?? p.prioridad) as 'baja' | 'media' | 'alta' | 'No asignada',
          asignado_a: '',
          images: [],
        };
        
        if (p.images && p.images.length > 0 && card.id) {
          this.uploadFilesForTask(card.id, p.images).subscribe({
            next: (urls) => {
              console.log('Archivos subidos correctamente:', urls);
              card.images = urls;
            },
            error: (err) => console.error('Error subiendo archivos:', err)
          });
        }
        
        return card;
      }),
      catchError(err => {
        console.error('Error creando tarea:', err);
        console.error('Error details:', err.error);
        return throwError(() => err);
      })
    );
  }

  uploadFilesForTask(taskId: number, files: File[]): Observable<string[]> {
    if (!files.length) return of([]);
    
    const uploadRequests = files.map((file, index) => {
      return this.uploadFile(taskId, file, index + 1);
    });
    
    console.log(`Subiendo ${files.length} archivos para tarea ${taskId}`);
    return forkJoin(uploadRequests);
  }

  private uploadFile(taskId: number, file: File, order: number): Observable<string> {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('archivo[id_tarea]', taskId.toString());
    
    console.log('POST /archivos con FormData:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      taskId: taskId,
      order: order
    });
    
    return this.http.post<any>(`${this.api}/archivos`, formData).pipe(
      map((res: any) => {
        console.log('Archivo subido:', res);
        // Retornar la URL del archivo subido
        const archivo = res?.archivo?.data ?? res?.archivo ?? res;
        return archivo.url ?? '';
      }),
      catchError(err => {
        console.error('Error subiendo archivo:', err);
        return of('');
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

updateCard(card: Card): Observable<any> {
  const body = {
    titulo: card.title,
    descripcion: card.descripcion,
    prioridad: card.prioridad,
    fecha_vencimiento: card.fecha_vencimiento,
    asignado_a: card.asignado_a,
    id_asignado: card.id_asignado
  };

  return this.http.put(`${this.api}/tareas/${card.id}`, body);
}

deleteCard(id: number): Observable<any> {
  return this.http.delete(`${this.api}/tareas/${id}`);
}

addComment(taskId: number, texto: string, usuario: string): Observable<any> {
  return this.http.post(`${this.api}/comentarios`, {
    id_tarea: taskId,
    texto: texto,
    usuario: usuario
  });
}
}