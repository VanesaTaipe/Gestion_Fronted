// src/app/core/services/user.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { User } from '../../profile/models/user.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiBase}/user`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los usuarios
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /**
   * Buscar usuarios por nombre o apellido
   * @param searchTerm Término de búsqueda
   */
  searchUsers(searchTerm: string): Observable<User[]> {
    const params = new HttpParams().set('search', searchTerm.trim());
    return this.http.get<User[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Obtener un usuario por ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener usuarios de un proyecto
   */
  getProjectMembers(projectId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/project/${projectId}`);
  }

  /**
   * Agregar miembros a un proyecto
   */
  addProjectMembers(projectId: number, userIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/project/${projectId}/members`, { userIds });
  }

  /**
   * Remover un miembro de un proyecto
   */
  removeProjectMember(projectId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/project/${projectId}/members/${userId}`);
  }
}