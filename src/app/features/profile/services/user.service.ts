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

  getUsers(): Observable<User[]> {
    console.log('Obteniendo todos los usuarios desde:', this.apiUrl);
    
    return this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('Respuesta raw del servidor:', response);
        console.log('Formato:', typeof response, Array.isArray(response) ? 'Array' : 'Objeto');
      }),
      map(response => {
 
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

  searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return this.getUsers();
    }

    console.log('Buscando usuarios con término:', searchTerm);

    const params = new HttpParams().set('query', searchTerm.trim());
    
    return this.http.get<any>(`${this.apiUrl}/buscar`, { params }).pipe(
      tap(response => {
        console.log('Respuesta de búsqueda:', response);
      }),
      map(response => {
        if (response && response.users && Array.isArray(response.users)) {
          console.log('Usuarios encontrados en formato { users: [...] }');
          
          return response.users.map((user: any) => ({
            id_usuario: user.id,              
            username: user.nombre,           
            email: user.correo, 
            dni: user.dni ?? '',    
            bio: user.bio,
            image: user.image,
            es_temporal: user.es_temporal
          }));
        }
        
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


updateUser(userId: number, userData: { nombre?: string; password?: string; correo: string; dni?: string }): Observable<any> {
  const updateData: any = {
    correo: userData.correo,
    dni: userData.dni || '',
    user: {}
  };

  if (userData.nombre) {
    updateData.user.nombre = userData.nombre;
  }
  
  if (userData.password) {
    updateData.user.password = userData.password;
  }

  console.log(`Actualizando usuario ${userId}`);
  console.log('Datos a enviar:', JSON.stringify(updateData, null, 2));

  return this.http.put(`${environment.apiUrl}/users/${userId}`, updateData).pipe(
    tap(response => {
      console.log('Respuesta del servidor:', response);
    }),
    catchError(error => {
      console.error('Error completo:', error);
      console.error('Status:', error.status);
      console.error('Mensaje:', error.error);
      return throwError(() => error);
    })
  );
}

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
      console.error('Error del cliente:', errorMessage);
    } else {
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
  
    // ============================
  // 🔹 NUEVAS FUNCIONES ACTUALES (recuperación de contraseña)
  // ============================

  
   //Busca un usuario por correo electrónico.
   //Ruta: POST /api/users/search-by-email
   
  searchByEmail(correo: string): Observable<any> {
    const url = `${environment.apiUrl}/users/search-by-email`;
    console.log('📩 Buscando usuario por correo:', correo);

    return this.http.post(url, { correo }).pipe(
      tap(response => console.log('✅ Respuesta de búsqueda:', response)),
      catchError(error => {
        console.error('❌ Error en búsqueda de correo:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Valida si el DNI ingresado coincide con el registrado.
   * Ruta: POST /api/users/validate-dni
   */
  validateDni(correo: string, dni: string): Observable<any> {
    const url = `${environment.apiUrl}/users/validate-dni`;
    console.log(`🆔 Validando DNI para ${correo}: ${dni}`);

    return this.http.post(url, { correo, dni }).pipe(
      tap(response => console.log('✅ DNI validado:', response)),
      catchError(error => {
        console.error('❌ Error en validación de DNI:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza datos del usuario (temporal o registrado).
   * Ruta: PUT /api/users/update
   */
  updateUserData(data: {
    correo: string;
    dni: string;
    esTemporal: boolean;
    user: { nombre?: string; password: string };
  }): Observable<any> {
    const url = `${environment.apiUrl}/users/update`;
    console.log('🛠 Enviando actualización de usuario:', JSON.stringify(data, null, 2));

    return this.http.put(url, data).pipe(
      tap(response => console.log('✅ Respuesta de actualización:', response)),
      catchError(error => {
        console.error('❌ Error al actualizar usuario:', error);
        return throwError(() => error);
      })
    );
  }





}