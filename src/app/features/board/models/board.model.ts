export type CartaPrioridad = 'baja' | 'media' | 'alta' | 'No asignada';

export interface Card {
  id: number;                    // = id_tarea
  id_columna: number;            // = id_columna
  title: string;                 // = titulo
  descripcion?: string;          // ✅ Opcional
  asignado_a?: string;           // solo UI (nombre)
  id_asignado?: number;          // id numérico (backend)
  fecha_vencimiento?: string;    // = due_at (ISO o YYYY-MM-DD HH:mm:ss)
  prioridad?: CartaPrioridad;    // baja | media | alta | No asignada
  tag?: string;
  images?: string[];             // URLs de imágenes adjuntas
  comentarios?: Comentario[];    // Lista de comentarios
}

export interface Comentario {
  id?: number;
  id_comentario?: number;        // ✅ Alias para backend
  usuario?: string;              // ✅ Opcional - Nombre del usuario que comentó
  texto: string;                 // Contenido del comentario
  fecha?: string;                // Fecha del comentario (ISO string)
  created_at?: string;           // ✅ Alias para backend
  avatar?: string;               // URL del avatar del usuario
}

export interface Column {
  id: number;
  title?: string;                // ✅ Alias para frontend
  nombre?: string;               // ✅ Para backend
  color: string;
  cards: Card[];
  order?: number;
  posicion?: number;             // ✅ Para backend
  status?: number | string;      // '0' = activa, '1' = eliminada
}

export interface Board {
  id: number;
  name?: string;                 // ✅ Alias para frontend
  nombre?: string;               // ✅ Para backend
  columns: Column[];
}