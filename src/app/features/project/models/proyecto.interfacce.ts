export interface Proyecto {
  id?: number;
  id_proyecto?: number;  
  nombre: string;
  descripcion?: string;
  id_usuario_creador: number;
  id_espacio: number;
  created_at?: string;
  updated_at?: Date;
}