import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, switchMap, take, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { UserService } from '../../../core/auth/services/use.service';
import { CreateWorkspaceRequest, Espacio } from '../models/espacio.interface';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  
  private readonly apiUrl = `${environment.apiUrl}/espacios`;
  private readonly apiUrlS = `${environment.apiUrl}`;
  private workspacesSubject = new BehaviorSubject<Espacio[]>([]);
  public workspaces$ = this.workspacesSubject.asObservable();

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private getCurrentUserId(): Observable<number> {
    return this.userService.currentUser.pipe(
      take(1),
      map(user => {
        if (!user || !user.id_usuario) {
          throw new Error('Usuario no autenticado');
        }
        return user.id_usuario;
      })
    );
  }

  /**
   * Obtener espacios del usuario
   */
  getWorkspaces(): Observable<Espacio[]> {
    return this.getCurrentUserId().pipe(
      switchMap(userId => {
        const url = `${this.apiUrlS}/users/${userId}/espacios`;
        console.log(' Obteniendo espacios desde:', url);
        
        return this.http.get<any>(url).pipe(
          map(response => {
            console.log('Respuesta espacios raw:', response);
            
            let espacios: any[] = [];
            
            if (Array.isArray(response)) {
              espacios = response;
            } else if (response.Espacios && Array.isArray(response.Espacios)) {
              espacios = response.Espacios;
            } else if (response.espacios && Array.isArray(response.espacios)) {
              espacios = response.espacios;
            } else if (response.data && Array.isArray(response.data)) {
              espacios = response.data;
            }

            console.log(`${espacios.length} espacios recibidos del backend`);
            
            const espaciosMapeados = espacios.map(e => ({
              id: e.id,
              nombre: e.nombre,
              descripcion: e.descripcion,
              id_usuario: e.id_usuario,
              created_at: e.created_at,
              updated_at: e.updated_at
            }));

            return espaciosMapeados;
          }),
          tap(espacios => {
            this.workspacesSubject.next(espacios);
            console.log('Espacios cargados:', espacios.length);
            espacios.forEach(e => {
              const esCreador = e.id_usuario === userId;
              console.log(`  ${esCreador ? '' : ''} ${e.nombre} (ID: ${e.id})`);
            });
          }),
          catchError(error => {
            console.error('Error obteniendo espacios:', error);
            return of([]);
          })
        );
      }),
      catchError(error => {
        console.error('Error obteniendo userId:', error);
        return of([]);
      })
    );
  }

  /**
 * Obtener proyectos de un workspace filtrados por usuario
 */
getProjectsByWorkspaceId(workspaceId: number): Observable<any[]> {
  return this.getCurrentUserId().pipe(
    switchMap(userId => {
      const url = `${this.apiUrl}/${workspaceId}/proyectos?id_usuario=${userId}`;
      console.log('📡 Obteniendo proyectos desde:', url);
      
      return this.http.get<any>(url).pipe(
        map(response => {
          console.log('Respuesta proyectos raw:', response);
          
          const proyectos = response.proyecto || response.data || response.proyectos;
          
          if (!Array.isArray(proyectos)) {
            console.warn('No se encontraron proyectos');
            return [];
          }

          console.log(`${proyectos.length} proyectos encontrados para usuario ${userId}`);
          
          const proyectosMapeados = proyectos.map(proyecto => ({
            id: proyecto.id_proyecto || proyecto.id,
            id_proyecto: proyecto.id_proyecto || proyecto.id,
            nombre: proyecto.nombre,
            descripcion: proyecto.descripcion,
            id_usuario_creador: proyecto.id_usuario_creador,
            id_espacio: proyecto.id_espacio,
            created_at: proyecto.created_at,
            updated_at: proyecto.updated_at
          }));

          return proyectosMapeados;
        }),
        catchError(error => {
          console.error('Error obteniendo proyectos:', error);
          return of([]);
        })
      );
    })
  );
}

  getWorkspaceById(id: number): Observable<Espacio> {
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || response.espacio || response),
      catchError(error => {
        console.error('Error al obtener espacio:', error);
        throw error;
      })
    );
  }

  createWorkspace(workspaceData: CreateWorkspaceRequest): Observable<Espacio> {
    return this.getCurrentUserId().pipe(
      switchMap(userId => {
        const dataWithUser = {
          espacio: {
            nombre: workspaceData.title,
            descripcion: workspaceData.description,
            id_usuario: userId
          }
        };

        return this.http.post<any>(this.apiUrl, dataWithUser).pipe(
          map(response => {
            const nuevoEspacio = response.data || response.espacio || response;
            const currentEspacios = this.workspacesSubject.value;
            this.workspacesSubject.next([...currentEspacios, nuevoEspacio]);
            return nuevoEspacio;
          })
        );
      })
    );
  }

  updateWorkspace(id: number, workspaceData: Partial<CreateWorkspaceRequest>): Observable<Espacio> {
  const updateData = {
    espacio: {
      nombre: workspaceData.title,           
      descripcion: workspaceData.description 
    }
  };
  
  console.log('Enviando al backend:', JSON.stringify(updateData, null, 2));

  return this.http.put<any>(`${this.apiUrl}/${id}`, updateData, {
    headers: this.getHeaders()
  }).pipe(
    map(response => response.data || response.espacio || response),
    tap(updatedEspacio => {
      const currentEspacios = this.workspacesSubject.value;
      const index = currentEspacios.findIndex(w => w.id === id);
      if (index !== -1) {
        currentEspacios[index] = updatedEspacio;
        this.workspacesSubject.next([...currentEspacios]);
      }
    }),
    catchError(error => {
      console.error('Error completo:', error);
      throw error;
    })
  );
}

  deleteWorkspace(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => true),
      tap(() => {
        const currentEspacios = this.workspacesSubject.value;
        const filteredEspacios = currentEspacios.filter(w => w.id !== id);
        this.workspacesSubject.next(filteredEspacios);
      })
    );
  }

  clearWorkspaces(): void {
    this.workspacesSubject.next([]);
  }

  refreshWorkspaces(): Observable<Espacio[]> {
    return this.getWorkspaces();
  }

  hasWorkspaces(): boolean {
    return this.workspacesSubject.value.length > 0;
  }

  searchWorkspaces(searchTerm: string): Observable<Espacio[]> {
    const currentEspacios = this.workspacesSubject.value;
    const filteredEspacios = currentEspacios.filter(espacio =>
      espacio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (espacio.descripcion && espacio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return of(filteredEspacios);
  }

  getCurrentUser(): Observable<number> {
    return this.getCurrentUserId();
  }
editWorkspace(id: number, title: string, descripcion: string): Observable<any> {
  const updateData = {
    espacio: {
      nombre: title,
      descripcion: descripcion
    }
  };
  console.log('URL:', `${this.apiUrl}/${id}`);
  console.log('Datos enviados:', JSON.stringify(updateData, null, 2));
  
  return this.http.put<any>(`${this.apiUrl}/${id}`, updateData, {
    headers: this.getHeaders()
  }).pipe(
    tap(response => console.log('Respuesta del backend:', response)),
    catchError(error => {
      console.error('Error completo:', error);
      console.error(' Status:', error.status);
      console.error('Mensaje:', error.error);
      throw error;
    })
  );
}
  
}