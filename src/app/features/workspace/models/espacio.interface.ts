export interface Espacio {
  id: number;
  nombre: string;
  id_usuario:number;
  descripcion?: string;
  created_at?: Date;
  updated_at?: Date;
}
export interface CreateWorkspaceRequest {
  title: string;
  description: string;
}