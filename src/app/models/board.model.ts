export type CartaPrioridad = 'baja' | 'media' | 'alta';

export interface Card {
  id: number;               // = id_tarea
  id_columna: number;       // = id_columna
  title: string;            // = titulo
  descripcion: string;
  asignado_a?: string;      // solo UI (nombre)
  id_asignado?: number;     // id numérico (backend)
  fecha_vencimiento?: string; // = due_at (ISO o YYYY-MM-DD HH:mm:ss)
  prioridad?: CartaPrioridad;  // la manejarás luego al editar
  tag?: string;
}

export interface Column {
  id: number;     // = id_columna
  title: string;
  color: string;
  cards: Card[];
  order?: number;
}

export interface Board {
  id: number;     // = id_proyecto
  name: string;
  columns: Column[];
}
