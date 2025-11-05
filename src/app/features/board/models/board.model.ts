export type CartaPrioridad = 'baja' | 'media' | 'alta' | 'No asignada';

export interface Card {
  id: number;                    
  id_columna: number;            
  title: string;                 
  descripcion?: string;          
  asignado_a?: string;           
  id_asignado?: number;         
  fecha_vencimiento?: string; 
  due_at?: string;  
  prioridad?: CartaPrioridad;   
  tag?: string;
  archivos?: ArchivoAdjunto[];           
  comentarios?: Comentario[];
   comentarios_count?: number;   
  position?: number;   
}

export interface Comentario {
  id?: number;
  id_comentario?: number;       
  id_usuario?: number;   
  id_tarea?:number;        
  usuario?: string;              
  nombre_usuario?: string;       
  texto?: string;                
  contenido?: string;         
  fecha?: string;                
  created_at?: string;          
  avatar?: string;               
  minutos_desde_creacion?: number;
  status?:string; 
}


export interface Column {
  id: number;
  title?: string;               
  nombre?: string;               
  color: string;
  cards: Card[];
  order?: number;
  posicion?: number;            
  status?: number | string;
  tipo_columna?: 'normal' | 'fija';
  status_fijas?: '1' | '2' | null;  // '1' = En Progreso, '2' = Finalizado
  cantidad_tareas?: number;
}

export interface Board {
  id: number;
  name?: string;                 
  nombre?: string;               
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
  due_at: string;
  position: number;
}

export interface ColumnaResumen {
  id_columna: number;
  columna: string;
  tareas: TareaResumen[];
}
export interface ArchivoAdjunto {
  id: number;
  id_tarea: number;
  archivo_nombre: string;
  archivo_ruta: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
}