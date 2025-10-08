import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { TemporalUserRequest, TemporalUserResponse, User } from '../models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los usuarios
   */
  getUsers(): Observable<User[]> {
    console.log('Obteniendo todos los usuarios desde:', this.apiUrl);
    
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('Respuesta raw del servidor:', response);
        console.log('Formato:', typeof response, Array.isArray(response) ? 'Array' : 'Objeto');
      }),
      map(response => {
        // Manejar diferentes formatos de respuesta
        if (response && response.users && Array.isArray(response.users.data)) {
          console.log('Formato: { users: { data: [...] } }');
          return response.users.data;
        }
        if (response && response.users && Array.isArray(response.users)) {
          console.log('Formato: { users: [...] }');
          return response.users;
        }
        if (response && response.data && Array.isArray(response.data)) {
          console.log('Formato: { data: [...] }');
          return response.data;
        }
        if (Array.isArray(response)) {
          console.log('Formato: [...]');
          return response;
        }
        console.warn('Formato inesperado, retornando array vacío');
        return [];
      }),
      tap(users => {
        console.log(`${users.length} usuarios obtenidos`, users.length <= 5 ? users : users.slice(0, 3));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Buscar usuarios por término (nombre o correo)
   * Endpoint: GET /api/usuarios/buscar?query=termino
   */
  searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return this.getUsers();
    }

    console.log('Buscando usuarios con término:', searchTerm);
    
    // Buscar
    const params = new HttpParams().set('query', searchTerm.trim());
    
    return this.http.get<any>(`${this.apiUrl}/buscar`, { params }).pipe(
      tap(response => {
        console.log('Respuesta de búsqueda:', response);
      }),
      map(response => {
        // Manejar el formato de respuesta del backend: { users: [...] }
        if (response && response.users && Array.isArray(response.users)) {
          console.log('Usuarios encontrados en formato { users: [...] }');
          
          // Mapear el formato del backend al formato esperado por el frontend
          return response.users.map((user: any) => ({
            id_usuario: user.id,              // Mapear 'id' a 'id_usuario'
            username: user.nombre,            // Mapear 'nombre' a 'username'
            email: user.correo,               // Mapear 'correo' a 'email'
            bio: user.bio,
            image: user.image,
            es_temporal: user.es_temporal
          }));
        }
        
        // Si ya viene en el formato correcto
        if (response && Array.isArray(response.users)) {
          return response.users;
        }
        
        if (Array.isArray(response)) {
          return response;
        }
        
        console.warn('Formato de búsqueda inesperado:', response);
        return [];
      }),
      tap(users => {
        console.log(`${users.length} usuarios encontrados para: "${searchTerm}"`, users);
      }),
      catchError(error => {
        console.error('Error en búsqueda de usuarios:', error);
        
        // Si hay error en la búsqueda, intentar filtrar localmente como fallback
        console.log('Intentando búsqueda local como fallback...');
        return this.getUsers().pipe(
          map(allUsers => {
            const term = searchTerm.toLowerCase();
            return allUsers.filter(user => 
              user.username?.toLowerCase().includes(term) ||
              user.email?.toLowerCase().includes(term)
            );
          }),
          tap(filteredUsers => {
            console.log(`Búsqueda local: ${filteredUsers.length} usuarios encontrados`);
          })
        );
      })
    );
  }

  /**
   * Crear usuario temporal con solo el correo
   * Endpoint: POST /api/usuarios/temporal
   * Body: { "correo": "usuario@ejemplo.com" }
   */
  createTemporalUser(data: TemporalUserRequest): Observable<TemporalUserResponse> {
    const url = `${this.apiUrl}/temporal`;
    
    console.log('Creando usuario temporal en:', url);
    console.log('Datos enviados:', data);

    return this.http.post<TemporalUserResponse>(url, data).pipe(
      tap(response => {
        console.log('Usuario temporal creado exitosamente:', response);
        
        if (response.password || response.contrasena_temporal) {
          const tempPassword = response.password || response.contrasena_temporal;
          console.log('Contraseña temporal generada:', tempPassword);
        }
      }),
      catchError(error => {
        console.error('Error al crear usuario temporal:', error);
        
        // Manejar errores específicos
        if (error.status === 400) {
          console.error('Solicitud incorrecta - Verificar formato del correo');
        } else if (error.status === 409) {
          console.error('El correo ya está registrado');
        } else if (error.status === 500) {
          console.error('Error del servidor');
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener información de un usuario específico
   */
  getUserById(userId: number): Observable<User> {
    console.log('Obteniendo usuario con ID:', userId);
    
    return this.http.get<any>(`${this.apiUrl}/${userId}`).pipe(
      map(response => {
        if (response && response.user) {
          return response.user;
        }
        if (response && response.data) {
          return response.data;
        }
        return response;
      }),
      tap(user => {
        console.log('Usuario obtenido:', user);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar información de usuario
   */
  updateUser(userId: number, userData: Partial<User>): Observable<User> {
    console.log('Actualizando usuario:', userId, userData);
    
    return this.http.put<any>(`${this.apiUrl}/${userId}`, userData).pipe(
      map(response => {
        if (response && response.user) {
          return response.user;
        }
        if (response && response.data) {
          return response.data;
        }
        return response;
      }),
      tap(user => {
        console.log('Usuario actualizado:', user);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
      console.error('Error del cliente:', errorMessage);
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.message || 
                     error.error?.error || 
                     `Error ${error.status}: ${error.statusText}`;
      console.error('Error del servidor:', {
        status: error.status,
        message: errorMessage,
        body: error.error
      });
    }
    
    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }
}