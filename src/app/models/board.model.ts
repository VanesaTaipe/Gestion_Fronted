export type CartaPrioridad = 'baja' | 'media' | 'alta';

export interface Card {
  id: number;               // = id_tarea
  id_columna: number;       // = id_columna
  title: string;            // = titulo
  descripcion: string;
  asignado_a?: string;      // nombre del asignado (falta conectar)
  id_asignado?: number;     // id numérico (backend)
  fecha_vencimiento?: string; // = due_at (ISO o YYYY-MM-DD HH:mm:ss)
  prioridad?: CartaPrioridad;  
  tag?: string;
}

export interface Column {
  id: number;     
  title: string;
  color: string;
  cards: Card[];
  order?: number;
  status?: number;
}

export interface Board {
  id: number;     
  name: string;
  columns: Column[];
}
