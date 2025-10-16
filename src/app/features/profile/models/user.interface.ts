export interface User {
  id_usuario: number;
  email: string;
  username?: string;
  token?: string;
  bio?: string;
  image?: string;
  es_temporal?: boolean;
  correo?: string;
  contraseña?:String;
}
export interface UserResponse {
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}
export interface TemporalUserRequest {
  correo: string;
  
}
export interface TemporalUserData {
  id_usuario?: number;
  id?: number;
  correo?: string;
  email?: string;
  username?: string;
  nombre?: string;
  password?: string;
  contrasena_temporal?: string;
  es_temporal?: boolean;
  created_at?: string;
}
export interface TemporalUserResponse {
  message?: string;
  user?: TemporalUserData;
   id_usuario?: number;
  username?: string;
  email?: string;
  correo?: string;
  password?: string;           
  contrasena_temporal?: string; 
  es_temporal?: boolean;
}

