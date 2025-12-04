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
  private readonly apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<any>(this.apiUrl).pipe(
      map(response => this.extractUsersArray(response)),
      catchError(this.handleError)
    );
  }

  getUserById(userId: number): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/${userId}`).pipe(
      map(response => this.extractUserObject(response)),
      catchError(this.handleError)
    );
  }

  searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm?.trim()) {
      return this.getUsers();
    }

    const params = new HttpParams().set('query', searchTerm.trim());
    
    return this.http.get<any>(`${this.apiUrl}/buscar`, { params }).pipe(
      map(response => this.transformSearchResponse(response)),
      catchError(() => this.fallbackLocalSearch(searchTerm))
    );
  }

  searchByEmail(correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/search-by-email`, { correo }).pipe(
      catchError(this.handleError)
    );
  }

  createTemporalUser(data: TemporalUserRequest): Observable<TemporalUserResponse> {
    return this.http.post<TemporalUserResponse>(`${this.apiUrl}/temporal`, data).pipe(
      catchError(error => {
        if (error.status === 409) {
          return throwError(() => new Error('El correo ya está registrado'));
        }
        return this.handleError(error);
      })
    );
  }

  updateUser(
    userId: number, 
    userData: { nombre?: string; password?: string; correo: string; dni?: string }
  ): Observable<any> {
    const payload = this.buildUpdatePayload(userData);
    return this.http.put(`${this.apiUrl}/${userId}`, payload).pipe(
      tap(response => console.log(`Usuario ${userId} actualizado correctamente`)),
      catchError(this.handleError)
    );
  }

  updateUserData(data: { 
    correo: string;
    dni: string;
    esTemporal: boolean;
    user: { nombre?: string; password: string };
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, data).pipe(
      tap(() => console.log(`Datos actualizados para ${data.correo}`)),
      catchError(this.handleError)
    );
  }

  updateProfile(userId: number, data: { nombre: string; correo: string }): Observable<any> {
    const url = `${environment.apiUrl}/perfil/updatePerfil/${userId}`;
    return this.http.put(url, { user: data }).pipe(
      tap(() => console.log(`Perfil actualizado: ${data.nombre} (${data.correo})`)),
      catchError(this.handleError)
    );
  }

  updatePasswordByEmail(data: { user: { correo: string; password: string } }): Observable<any> {
    return this.http.put(`${this.apiUrl}/update`, data).pipe(
      tap(() => console.log(`Contraseña actualizada para ${data.user.correo}`)),
      catchError(this.handleError)
    );
  }

  validateDni(correo: string, dni: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validate-dni-correo`, { correo, dni }).pipe(
      catchError(this.handleError)
    );
  }

  private extractUsersArray(response: any): User[] {
    if (response?.users?.data && Array.isArray(response.users.data)) {
      return response.users.data;
    }
    if (response?.users && Array.isArray(response.users)) {
      return response.users;
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    return [];
  }

  private extractUserObject(response: any): User {
    return response?.user || response?.data || response;
  }

  private transformSearchResponse(response: any): User[] {
    if (response?.users && Array.isArray(response.users)) {
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
    
    if (Array.isArray(response?.users)) {
      return response.users;
    }
    
    if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  }

  private fallbackLocalSearch(searchTerm: string): Observable<User[]> {
    return this.getUsers().pipe(
      map(users => {
        const term = searchTerm.toLowerCase();
        return users.filter(user => 
          user.username?.toLowerCase().includes(term) ||
          user.email?.toLowerCase().includes(term)
        );
      })
    );
  }

  private buildUpdatePayload(userData: { 
    nombre?: string; 
    password?: string; 
    correo: string; 
    dni?: string 
  }): any {
    const payload: any = {
      correo: userData.correo,
      dni: userData.dni || '',
      user: {}
    };

    if (userData.nombre) {
      payload.user.nombre = userData.nombre;
    }
    
    if (userData.password) {
      payload.user.password = userData.password;
    }

    return payload;
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || 
                     error.error?.error || 
                     error.message ||
                     `Error ${error.status}`;
    }
    
    console.error('Error en UserService:', errorMessage);
    
    return throwError(() => ({
      status: error.status,
      message: errorMessage,
      error: error.error
    }));
  }
}