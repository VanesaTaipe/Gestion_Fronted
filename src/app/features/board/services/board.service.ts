import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Board, Card, Column } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private api = environment.apiBase;
  private columnColors=new Map<number,string>();

  private palette = [
    '#72DED3', '#48B2FF', '#FFC27C','#F6EC7D', '#FB89D9',
      '#7BFAAA', '#CF8AD5', '#F58686', '#A4A4A4', '#AAAAFF'
  ];
 constructor(private http: HttpClient) {}
  private defaultColorByIndex(idx: number): string {
    return this.palette[idx % this.palette.length];
  }
  getColumnColor(columnId: number): string {
    return this.columnColors.get(columnId) || this.palette[0];
  }
  setColumnColor(columnId: number, color: string): void {
    this.columnColors.set(columnId, color);
  }

  private unwrapArray(res: any, key?: string): any[] {
    const source = key ? (res?.[key] ?? res) : res;
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    if (key && Array.isArray(res?.[key]?.data)) return res[key].data;
    return [];
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

        const miembros$ = this.http.get<any>(`${this.api}/proyectos/${projectId}/miembros`).pipe(
          map(res => res?.miembros || res?.data || []),
          catchError(() => of([]))
        );

        return forkJoin([columnas$, tareas$, miembros$]).pipe(
          switchMap(([cols, tasks, miembros]) => {
            const usuariosMap = new Map<number, string>();
            (miembros as any[]).forEach((m: any) => {
              usuariosMap.set(m.id_usuario, m.nombre);
            });

            const columns: Column[] = (cols || [])
              .filter((c: any) => {
                const status = String(c.status);
                return status === '0';
              })
              .sort((a: any, b: any) => (a.posicion ?? 0) - (b.posicion ?? 0))
              .map((c: any, idx: number) => {
                const id = c.id_columna ?? c.id;
                const colorFinal = this.defaultColorByIndex(idx);
                this.setColumnColor(id, colorFinal);
                console.log(`[BoardService] Columna ${c.nombre}: color_frontend=${colorFinal}`);                
                return {
                  id: id,
                  title: c.nombre ?? c.title ?? '',
                  nombre: c.nombre ?? c.title ?? '',
                  color: colorFinal,
                  cards: [],
                  order: c.posicion ?? 0,
                  posicion: c.posicion ?? 0,
                  status: c.status ?? 0
                } as Column;
              });

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
                  map(taskFiles => ({ cols, tasks, columns, taskFiles, usuariosMap }))
                )
              : of({ cols, tasks, columns, taskFiles: [], usuariosMap });
          }),
          map(({ cols, tasks, columns, taskFiles, usuariosMap }) => {
            const imagesByTask = new Map();
            taskFiles.forEach(({ taskId, images }) => {
              imagesByTask.set(taskId, images);
            });

            const colById = new Map<number, Column>(columns.map(c => [Number(c.id), c]));
            (tasks as any[]).forEach(t => {
              const taskId = t.id_tarea ?? t.id;
              const nombreAsignado = t.id_asignado ? usuariosMap.get(t.id_asignado) || 'Sin asignar' : 'Sin asignar';

              const card: Card = {
                id: taskId,
                id_columna: Number(t.id_columna),
                title: t.titulo ?? t.title ?? '',
                descripcion: t.descripcion ?? '',
                prioridad: t.prioridad ?? 'media',
                asignado_a: nombreAsignado,
                id_asignado: t.id_asignado,
                fecha_vencimiento: t.due_at ?? t.fecha_vencimiento,
                archivos: imagesByTask.get(taskId) || [],
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

createColumn(projectId: number | string, nombre: string, posicion: number, color: string, tipo_columna: 'normal' | 'fija' = 'normal'): Observable<Column> {
  const body = { 
    columna: { 
      id_proyecto: Number(projectId), 
      nombre, 
      posicion: Number(posicion), 
      color: color,
      tipo_columna
    } 
  };
  
  
  return this.http.post<any>(`${this.api}/columnas`, body).pipe(
    map((res: any) => {
      const c = res?.columna?.data ?? res?.columna ?? res?.data ?? res;
      const colorFinal = c.color || color;
      const columnId = c.id_columna ?? c.id;
      this.setColumnColor(columnId, colorFinal);
      
      const column: Column = {
        id: c.id_columna ?? c.id,
        nombre: c.nombre || nombre,
        color: colorFinal, 
        cards: [],
        order: c.posicion ?? posicion,
        posicion: c.posicion ?? posicion,
        status: 0
      };
      
      return column;
    })
  );
}
  //Actualizado añadiendo nueva propierdad tipo_columna
 updateColumn(columnId: number | string, data: { nombre?: string; color?: string}) {
  const body: any = { columna: {} };
  
  if (data.nombre !== undefined) body.columna.nombre = data.nombre;
  if (data.color !== undefined) body.columna.color = data.color;

  return this.http.put(`${this.api}/columnas/${columnId}`, body, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
  });
}


//Nueva funcion para actualizar tipo_columna
updateColumnType(
  projectId: number | string,
  columnId: number | string,
  tipo_columna: 'normal' | 'fija'
) {
  const body = {
    gestion: {
      columnas: [
        {
          id_columna: Number(columnId),
          tipo_columna: tipo_columna
        }
      ]
    }
  };

  console.log('📤 Payload enviado al backend:', JSON.stringify(body, null, 2));

  return this.http.put(
    `${this.api}/proyectos/${projectId}/columnas/gestionar-tipos`,
    body,
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }
  );
}


  deleteColumn(columnId: number | string) {
    return this.http.delete(`${this.api}/columnas/${columnId}`, { 
      headers: { Accept: 'application/json' } 
    });
  }

  updateColumnPositions(columnId: number, positions: { id: number; position: number }[]): Observable<any> {
    return this.http.put(`${this.api}/columnas/${columnId}`, {
      positions: positions
    });
  }
}