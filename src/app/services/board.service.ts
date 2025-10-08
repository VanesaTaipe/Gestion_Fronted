// src/app/services/board.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Board, Column, Card } from '../models/board.model';
import { environment } from '../../environments/environment';
import { TaskService } from './task.service';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private api = environment.apiBase;
  taskSvc: any;

  constructor(private http: HttpClient, taskSvc: TaskService) {
    this.taskSvc = taskSvc;
  }

  // Paleta para colores por defecto (Tailwind las “ve” y no las purga)
private palette = [
  'bg-teal-200','bg-blue-200','bg-amber-200','bg-lime-200','bg-rose-200',
  'bg-cyan-200','bg-purple-200','bg-orange-200','bg-emerald-200','bg-pink-200'
];

// Lee color guardado para una columna
private getSavedColumnColor(colId: number | string): string | null {
  try { return localStorage.getItem(`col_color_${colId}`); } catch { return null; }
}

// Color por defecto si no hay guardado
private defaultColorByIndex(idx: number): string {
  return this.palette[idx % this.palette.length] || 'bg-gray-200';
}

  /** Normaliza distintas formas de respuesta a un array */
  private unwrapArray(res: any, key?: string): any[] {
    const source = key ? (res?.[key] ?? res) : res;
    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    // a veces viene { key: { data: [...] } }
    if (key && Array.isArray(res?.[key]?.data)) return res[key].data;
    return [];
  }


  getBoard(id = 1): Observable<Board> {
    //Proyecto
    return this.http.get<any>(`${this.api}/proyectos/${id}`).pipe(
      switchMap((resProyecto: any) => {
        const proyecto = resProyecto?.proyecto?.data ?? resProyecto?.proyecto ?? resProyecto;

        //Columnas (desempaquetado robusto)
        const columnas$ = this.http.get<any>(`${this.api}/proyectos/${id}/columnas`).pipe(
          map(res => this.unwrapArray(res, 'columnas')),
          catchError(() => of([]))
        );

        //Tareas del proyecto 
        const tareas$ = this.http.get<any>(`${this.api}/tareas?proyecto=${id}`).pipe(
          map(res => {
            // acepta varias formas: { items: [...] } | { tareas: [...] } | [...]
            const items = this.unwrapArray(res, 'items');
            if (items.length) return items;
            const tareas = this.unwrapArray(res, 'tareas');
            if (tareas.length) return tareas;
            return this.unwrapArray(res);
          }),
          catchError(() => of([]))
        );

        return forkJoin([columnas$, tareas$]).pipe(
          map(([cols, tasks]) => {
            // Mapear columnas
            const columns: Column[] = (cols || [])
              .sort((a: any, b: any) => (a.posicion ?? 0) - (b.posicion ?? 0))
              .map((c: any, idx: number) => {
                const id = c.id_columna ?? c.id;
                const saved = this.getSavedColumnColor(id);
                return {
                  id,
                  title: c.nombre ?? c.title ?? '',
                  color: saved || this.defaultColorByIndex(idx), // aquí se aplica el color
                  cards: [],
                  order: c.posicion ?? 0,
                  status: Number(c.status ?? 0),
                } as Column;
              });
            // Distribuir tareas en su columna
            const colById = new Map<number, Column>(columns.map(c => [Number(c.id), c]));
            (tasks as any[]).forEach(t => {
              const taskId = t.id_tarea ?? t.id;
              const dueStored = this.taskSvc.getDueDate(taskId);
              const card: Card = {
                id: taskId,                                 
                id_columna: Number(t.id_columna),
                title: t.titulo ?? t.title ?? '',
                descripcion: t.descripcion ?? '',
                prioridad: this.taskSvc.getPriority(taskId),
                fecha_vencimiento: t.due_at ?? t.fecha_vencimiento ?? dueStored,  
              };
              const col = colById.get(card.id_columna);
              if (col) col.cards.push(card);
            });

            // Orden opcional de tarjetas
            columns.forEach(c => c.cards.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)));

            return {
              id: proyecto.id_proyecto ?? proyecto.id,
              name: proyecto.nombre ?? proyecto.name ?? 'Nombre de Tablero',
              columns
            } as Board;
          })
        );
      })
    );
  }

  updateColumnPosition(colId: number | string, posicion: number) { //actualizar POSICION de la columna
    const body = { columna: { posicion: Number(posicion) } };
    return this.http.put(`${this.api}/columnas/${colId}/`, body, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
    });
  }

  createColumn(projectId: number | string, nombre: string, posicion: number) { //crear columna 
    const body = { columna: { id_proyecto: Number(projectId), nombre, posicion: Number(posicion), status: '0' } };
    return this.http.post<any>(`${this.api}/columnas`, body).pipe(
      map((res: any) => {
        const c = res?.columna?.data ?? res?.columna ?? res;
        return {
          id: c.id_columna ?? c.id,
          title: c.nombre ?? nombre,
          color: 'bg-gray-200',
          cards: [],
          order: c.posicion ?? posicion
        } as Column;
      })
    );
  }

  deleteColumn(columnId: number | string) { //eliminar columna
    return this.http.delete(`${this.api}/columnas/${columnId}`, { headers: { Accept: 'application/json' } });
  }

  saveColumnColor(colId: number | string, color: string) { //funciona para guardar el color de la columna  por si se reinicia la pagina 
    try { localStorage.setItem(`col_color_${colId}`, color); } catch {}
  }


  updateColumn(colId: number | string, partial: { nombre?: string; posicion?: number; status?: '0'|'1' }) { //actualizar la columna nomas
  const body = { columna: { ...partial } };
  return this.http.put(`${this.api}/columnas/${colId}`, body, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
      }
    });
  }

}
