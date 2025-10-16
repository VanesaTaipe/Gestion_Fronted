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
  id_comentario?: number;        // ✅ ID del comentario
  id_usuario?: number;           // ✅ ID del usuario (para backend)
  usuario?: string;              // ✅ Nombre del usuario (para UI)
  nombre_usuario?: string;       // ✅ Alias del nombre (del backend)
  texto?: string;                // ✅ Para UI
  contenido?: string;            // ✅ Para backend
  fecha?: string;                // Fecha del comentario (ISO string)
  created_at?: string;           // ✅ Del backend
  avatar?: string;               // URL del avatar del usuario
  minutos_desde_creacion?: number; // ✅ Del backend
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
export interface ComentarioCreateDTO {
  id_tarea: number;
  id_usuario: number;
  contenido: string;
}
export interface TareaResumen {
  id_tarea: number;
  titulo: string;
  prioridad: CartaPrioridad;
  color: string | null;
  comentarios_count: number;
  ultima_actualizacion: string;
  position: number;
}

export interface ColumnaResumen {
  id_columna: number;
  columna: string;
  tareas: TareaResumen[];
}
