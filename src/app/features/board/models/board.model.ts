export type CartaPrioridad = 'baja' | 'media' | 'alta' | 'No asignada';

export interface Card {
  id: number;                    // = id_tarea
  id_columna: number;            // = id_columna
  title: string;                 // = titulo
  descripcion: string;
  asignado_a?: string;           // solo UI (nombre)
  id_asignado?: number;          // id numérico (backend)
  fecha_vencimiento?: string;    // = due_at (ISO o YYYY-MM-DD HH:mm:ss)
  prioridad?: CartaPrioridad;    // baja | media | alta| No asignada
  tag?: string;
  images?: string[];             // URLs de imágenes adjuntas
  comentarios?: Comentario[];    // Lista de comentarios
}

export interface Comentario {
  id?: number;
  usuario: string;               // Nombre del usuario que comentó
  texto: string;                 // Contenido del comentario
  fecha: string;                 // Fecha del comentario (ISO string)
  avatar?: string;               // URL del avatar del usuario
}

export interface Column {
  id: number;        
  nombre: string;
  color: string;
  cards: Card[];
  order?: number;
  status?: number; 
  posicion?: number;  
}

export interface Board {
  id: number;       
  nombre: string;
  columns: Column[];
}