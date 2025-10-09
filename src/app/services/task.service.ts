// src/app/services/task.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface TaskCreateDTO {
  id_proyecto: number | string;
  id_columna:  number | string;
  title:       string;
  prioridad?: 'baja'|'media'|'alta';
  descripcion?: string;
  due_at?:      string | Date;   // "YYYY-MM-DD" del Date
  id_asignado?: number;         
}

export interface Card {
  id: number;
  id_columna: number;
  title: string;
  descripcion: string;
  id_asignado?: number;
  asignado_a?: string;
  fecha_vencimiento?: string;
  tag?: string;
  prioridad?: 'baja'|'media'|'alta';
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private api = environment.apiBase; // '/api' si usas proxy o 'http://localhost:8000/api'

  constructor(private http: HttpClient) {}

  /** Convierte "YYYY-MM-DD" o Date a "YYYY-MM-DD HH:MM:SS" (MySQL TIMESTAMP) */
  private toMySQLDateTime(value?: string | Date): string | undefined {
    if (!value) return undefined;
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return undefined;

    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm   = pad(d.getMonth() + 1);
    const dd   = pad(d.getDate());
    const hh   = pad(0);
    const mi   = pad(0);
    const ss   = pad(0);
    // guardamos a las 00:00:00; ajusta si quieres hora real
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }

  /** Crear tarea y devolverla mapeada a Card */
  createCard(p: TaskCreateDTO): Observable<Card> {
    const body: any = {
      id_proyecto: Number(p.id_proyecto),
      id_columna : Number(p.id_columna),
      titulo     : p.title,
      prioridad  : (p as any).prioridad ?? 'media',
      descripcion: p.descripcion ?? '',
      id_creador : 1,   // id del usuario logueado
      status     : '0',
    };

    const dueMySQL = this.toMySQLDateTime(p.due_at);
    if (dueMySQL) body.due_at = dueMySQL;
    if (p.id_asignado != null) body.id_asignado = Number(p.id_asignado);

    return this.http.post(`${this.api}/tareas`, body).pipe(
      map((res: any) => {
        const t = res?.tarea?.data ?? res?.tarea ?? res;
        const card: Card = {
          id               : t.id_tarea ?? t.id,
          id_columna       : t.id_columna ?? Number(p.id_columna),
          title            : t.titulo ?? p.title,
          prioridad        : ((t.prioridad ?? (p as any).prioridad ?? 'media') as any),
          descripcion      : t.descripcion ?? body.descripcion,
          id_asignado      : t.id_asignado ?? p.id_asignado,
          fecha_vencimiento: t.due_at ?? dueMySQL,
          asignado_a       : '',
        };
        return card;
      }),
      catchError(err => {
        console.error('POST /tareas falló:', err);
        return throwError(() => err);
      })
    );
  }

  moveCard(taskId: number | string, toColumnId: number | string, toIndex1Based: number): Observable<any> { //mover carta (drag and drop)
    return this.http.patch(`${this.api}/tareas/${taskId}/move`, {
      id_columna: Number(toColumnId),
      position  : Number(toIndex1Based),
    });
  }

  reorderCard(columnId: number | string, items: { id: number | string; position: number }[]): Observable<any> { //funcion para ordenar el orden de posiciones 
    return this.http.post(`${this.api}/tareas/bulk/reorder`, {
      id_columna: Number(columnId),
      items: items.map(i => ({ id: Number(i.id), position: Number(i.position) })),
    });
  }

  savePriority(taskId: number | string, prio: 'baja'|'media'|'alta') { //guardar prioridad (solo visual no afecta al back)
    try { localStorage.setItem(`task_prio_${taskId}`, prio); } catch {}
  }
  getPriority(taskId: number | string): 'baja'|'media'|'alta' { //obtener prioridad elegida 
    try {
      const v = localStorage.getItem(`task_prio_${taskId}`) as any;
      return v === 'baja' || v === 'alta' ? v : 'media';
    } catch { return 'media'; }
  }


  saveDueDate(taskId: number | string, iso?: string) { //guardar fecha
    try {
      if (iso) localStorage.setItem(`task_due_${taskId}`, iso);
      else localStorage.removeItem(`task_due_${taskId}`);
    } catch {}
  }

  getDueDate(taskId: number | string): string | undefined { //Obtener fecha 
    try {
      const v = localStorage.getItem(`task_due_${taskId}`);
      return v || undefined;
    } catch { return undefined; }
  }


  //  Eliminar tarea en backend
  deleteCard(id: number | string) {
    return this.http.delete(`${this.api}/tareas/${id}`, {
      headers: { Accept: 'application/json' }
    });
  }

}
