import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserService as AuthUserService } from '../../../core/auth/services/use.service';
import { Proyecto } from '../models/proyecto.interfacce';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = `${environment.apiBase}/proyectos`;
  private proyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  public proyectos$ = this.proyectosSubject.asObservable();
  
  // Usar el servicio de AUTENTICACIÓN
  private authUserService = inject(AuthUserService);

  constructor(private http: HttpClient) {
    console.log('ProyectoService inicializado con HTTP');
  }

  /**
   * Obtener todos los proyectos
   */
  getProyectos(): Observable<Proyecto[]> {
    console.log('Obteniendo proyectos desde API:', this.apiUrl);
    return this.http.get<Proyecto[]>(this.apiUrl).pipe(
      tap(proyectos => {
        console.log('Proyectos obtenidos:', proyectos.length);
        this.proyectosSubject.next(proyectos);
      }),
      catchError(error => {
        console.error('Error obteniendo proyectos:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener un proyecto por ID
   */
  getProyecto(id: number): Observable<Proyecto> {
    console.log('Obteniendo proyecto ID:', id);
    return this.http.get<Proyecto>(`${this.apiUrl}/${id}`).pipe(
      tap(proyecto => console.log('Proyecto obtenido:', proyecto)),
      catchError(error => {
        console.error('Error obteniendo proyecto:', error);
        throw error;
      })
    );
  }

  /**
   * Obtener proyectos por workspace (filtrado en frontend)
   */

  getProyectosByWorkspace(workspaceId: number): Observable<Proyecto[]> {
    console.log('Obteniendo proyectos del workspace:', workspaceId);
    
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: any) => {
        let proyectos = [];
        
        if (response.proyectos && Array.isArray(response.proyectos)) {
          proyectos = response.proyectos;
        } else if (Array.isArray(response)) {
          proyectos = response;
        }
        
        return proyectos.filter((p: any) => p.id_espacio === workspaceId);
      }),
      tap(proyectos => console.log('Proyectos filtrados:', proyectos.length)),
      catchError(error => {
        console.error('Error obteniendo proyectos:', error);
        return of([]);
      })
    );
  }

  /**
   * Crear proyecto con usuario actual
   */
  createProyecto(proyectoData: any): Observable<any> {
    const userId = this.authUserService.getCurrentUserId();
    
    if (!userId) {
      console.error('No hay usuario autenticado');
      throw new Error('Usuario no autenticado. Por favor, inicia sesión.');
    }

    const data = {
      ...proyectoData,
      proyecto: {
        ...proyectoData.proyecto,
        id_usuario_creador: userId
      }
    };

    console.log('Creando proyecto:', data);
    console.log('Usuario creador ID:', userId);
    
    return this.http.post<any>(this.apiUrl, data).pipe(
      tap(response => {
        console.log('Proyecto creado exitosamente:', response);
        
        // Actualizar la lista de proyectos si el backend devuelve el proyecto
        const nuevoProyecto = response.proyecto || response;
        if (nuevoProyecto) {
          const currentProyectos = this.proyectosSubject.value;
          this.proyectosSubject.next([...currentProyectos, nuevoProyecto]);
        }
      }),
      catchError(error => {
        console.error('Error creando proyecto:', error);
        throw error;
      })
    );
  }


  /**
 * Agregar un miembro a un proyecto
 */
agregarMiembro(projectId: number, miembroData: { id_usuario: number, id_rol: number }): Observable<any> {
    const url = `${this.apiUrl}/${projectId}/miembros`;
    
    console.log('POST:', url);
    console.log('Body:', miembroData);
    
    return this.http.post<any>(url, miembroData).pipe(
      tap(response => {
        console.log('Respuesta:', response);
      }),
      catchError(error => {
        console.error('Error al agregar miembro:', error);
        console.error('Status:', error.status);
        console.error('Error body:', error.error);
        
        // Si el usuario ya existe (409 Conflict), no es crítico
        if (error.status === 409) {
          console.warn(' El usuario ya es miembro del proyecto');
          return of({ warning: 'Usuario ya existe' });
        }
        
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualizar un proyecto existente
   */
  updateProyecto(id: number, proyecto: Partial<Proyecto>): Observable<Proyecto> {
    console.log('Actualizando proyecto ID:', id, proyecto);
    return this.http.put<Proyecto>(`${this.apiUrl}/${id}`, proyecto).pipe(
      tap(updatedProyecto => {
        console.log('Proyecto actualizado:', updatedProyecto);
        const currentProyectos = this.proyectosSubject.value;
        const index = currentProyectos.findIndex(p => p.id === id);
        if (index !== -1) {
          currentProyectos[index] = updatedProyecto;
          this.proyectosSubject.next([...currentProyectos]);
        }
      }),
      catchError(error => {
        console.error('Error actualizando proyecto:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar un proyecto
   */
  deleteProyecto(id: number): Observable<void> {
    console.log('Eliminando proyecto ID:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('Proyecto eliminado');
        const currentProyectos = this.proyectosSubject.value;
        this.proyectosSubject.next(currentProyectos.filter(p => p.id !== id));
      }),
      catchError(error => {
        console.error('Error eliminando proyecto:', error);
        throw error;
      })
    );
  }

  /**
   * Verificar si un proyecto existe
   */
  exists(id: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${id}/exists`);
  }
  
}