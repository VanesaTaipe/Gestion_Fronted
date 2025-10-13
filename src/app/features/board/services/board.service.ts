import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Board, Card, Column } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private api = environment.apiBase;

  constructor(private http: HttpClient) {}

  private palette = [
    'bg-teal-200','bg-blue-200','bg-amber-200','bg-lime-200','bg-rose-200',
    'bg-cyan-200','bg-purple-200','bg-orange-200','bg-emerald-200','bg-pink-200'
  ];

  private getSavedColumnColor(colId: number | string): string | null {
    try { return localStorage.getItem(`col_color_${colId}`); } catch { return null; }
  }

  private defaultColorByIndex(idx: number): string {
    return this.palette[idx % this.palette.length] || 'bg-gray-200';
  }

  private unwrapArray(res: any, key?: string): any[] {
    const source = key ? (res?.[key] ?? res) : res;
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    if (key && Array.isArray(res?.[key]?.data)) return res[key].data;
    return [];
  }

  private mapColumnFromBackend(c: any, idx: number): Column {
    const id = c.id_columna ?? c.id;
    const saved = this.getSavedColumnColor(id);
    
    return {
      id: id,
      title: c.nombre ?? c.title ?? '',
      nombre: c.nombre ?? c.title ?? '',
      color: saved || this.defaultColorByIndex(idx),
      cards: [],
      order: c.posicion ?? 0,
      posicion: c.posicion ?? 0,
      status: c.status ?? 0
    } as Column;
  }

  createBoard(projectId: number, name: string): Observable<Board> {
    return this.http.post<Board>(`${this.api}/boards`, {
      id_proyecto: projectId,
      nombre: name
    });
  }

  getBoard(id: number | string = 1): Observable<Board> {
    const projectId = Number(id);
    if (isNaN(projectId)) {
      return of(this.createEmptyBoard());
    }

    return this.http.get<any>(`${this.api}/proyectos/${projectId}`).pipe(
      switchMap((resProyecto: any) => {
        const proyecto = resProyecto?.proyecto?.data ?? resProyecto?.proyecto ?? resProyecto;

        const columnas$ = this.http.get<any>(`${this.api}/proyectos/${projectId}/columnas`).pipe(
          map(res => this.unwrapArray(res, 'columnas')),
          catchError(() => of([]))
        );

        const tareas$ = this.http.get<any>(`${this.api}/tareas?proyecto=${projectId}`).pipe(
          map(res => {
            const items = this.unwrapArray(res, 'items');
            if (items.length) return items;
            const tareas = this.unwrapArray(res, 'tareas');
            if (tareas.length) return tareas;
            return this.unwrapArray(res);
          }),
          catchError(() => of([]))
        );

        return forkJoin([columnas$, tareas$]).pipe(
          switchMap(([cols, tasks]) => {
            const columns: Column[] = (cols || [])
              .filter((c: any) => {const status = String(c.status);return status === '0';})
              .sort((a: any, b: any) => (a.posicion ?? 0) - (b.posicion ?? 0))
              .map((c: any, idx: number) => this.mapColumnFromBackend(c, idx));

            console.log('Columnas mapeadas:', columns);

            const taskFilesRequests = (tasks as any[]).map(task => 
              this.http.get<any>(`${this.api}/tareas/${task.id_tarea ?? task.id}/archivos`).pipe(
                map(filesRes => {
                  const files = filesRes?.archivos?.data ?? filesRes?.archivos ?? filesRes;
                  return {
                    taskId: task.id_tarea ?? task.id,
                    images: Array.isArray(files) 
                      ? files.filter((f: any) => f.tipo === 'imagen').map((f: any) => f.url)
                      : []
                  };
                }),
                catchError(() => of({ taskId: task.id_tarea ?? task.id, images: [] }))
              )
            );

            return taskFilesRequests.length > 0 
              ? forkJoin(taskFilesRequests).pipe(
                  map(taskFiles => ({ cols, tasks, columns, taskFiles }))
                )
              : of({ cols, tasks, columns, taskFiles: [] });
          }),
          map(({ cols, tasks, columns, taskFiles }) => {
            const imagesByTask = new Map();
            taskFiles.forEach(({ taskId, images }) => {
              imagesByTask.set(taskId, images);
            });

            const colById = new Map<number, Column>(columns.map(c => [Number(c.id), c]));
            (tasks as any[]).forEach(t => {
              const taskId = t.id_tarea ?? t.id;
              const card: Card = {
                id: taskId,
                id_columna: Number(t.id_columna),
                title: t.titulo ?? t.title ?? '',
                descripcion: t.descripcion ?? '',
                prioridad: t.prioridad ?? 'media',
                asignado_a: t.asignado_a ?? '',
                fecha_vencimiento: t.due_at ?? t.fecha_vencimiento,
                images: imagesByTask.get(taskId) || [],
                comentarios: t.comentarios ?? []
              };
              const col = colById.get(card.id_columna);
              if (col) col.cards.push(card);
            });

            columns.forEach(c => c.cards.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)));

            return {
              id: proyecto.id_proyecto ?? proyecto.id ?? projectId,
              nombre: proyecto.nombre ?? proyecto.name ?? 'Nombre de Tablero',
              columns
            } as Board;
          })
        );
      }),
      catchError(() => of(this.createEmptyBoard(projectId)))
    );
  }

  private createEmptyBoard(id?: number | string): Board {
    const projectId = id ? Number(id) : 1;
    return {
      id: isNaN(projectId) ? 1 : projectId,
      nombre: `Tablero Proyecto ${id}`,
      columns: []
    };
  }

  updateColumnPosition(colId: number | string, posicion: number) {
    const body = { columna: { posicion: Number(posicion) } };
    return this.http.put(`${this.api}/columnas/${colId}`, body, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
  }


  createColumn(projectId: number | string, nombre: string, posicion: number): Observable<Column> {
    const body = { 
      columna: { 
        id_proyecto: Number(projectId), 
        nombre, 
        posicion: Number(posicion), 
        status: '0' 
      } 
    };
    
    console.log('Enviando columna:', body);
    
    return this.http.post<any>(`${this.api}/columnas`, body).pipe(
      map((res: any) => {
        console.log('Respuesta crear columna:', res);
        
        const c = res?.columna?.data ?? res?.columna ?? res?.data ?? res;
        
        const column: Column = {
          id: c.id_columna ?? c.id,
          nombre: c.nombre ?? nombre,
          color: 'bg-gray-200',
          cards: [],
          order: c.posicion ?? posicion,
          posicion: c.posicion ?? posicion,
          status: 0
        };
        
        console.log('Columna mapeada:', column);
        return column;
      }),
      catchError(error => {
        console.error(' Error crear columna:', error);
        if (error.error?.error?.includes('ya existe')) {
          throw new Error(`Ya existe una columna con el nombre "${nombre}"`);
        }
        throw error;
      })
    );
  }

  updateColumn(columnId: number | string, data: { nombre: string }) {
    const body = { columna: { nombre: data.nombre } };
    return this.http.put(`${this.api}/columnas/${columnId}`, body, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
  }

  deleteColumn(columnId: number | string) {
    return this.http.delete(`${this.api}/columnas/${columnId}`, { 
      headers: { Accept: 'application/json' } 
    });
  }
updateColumnPositions(projectId: number, positions: { id: number; position: number }[]): Observable<any> {
  return this.http.post(`${this.api}/proyectos/${projectId}/columnas/reorder`, {
    positions: positions
  });
}

  saveColumnColor(colId: number | string, color: string) {
    try { localStorage.setItem(`col_color_${colId}`, color); } catch {}
  }
}