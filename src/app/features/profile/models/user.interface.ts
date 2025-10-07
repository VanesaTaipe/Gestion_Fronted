export interface User {
  id: number;
  nombre: string;
  email: string;
  token?: string;
  bio?: string;
  image?: string;
  created_at?: Date;
  updated_at?: Date;
}
