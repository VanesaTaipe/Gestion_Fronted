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
  
  private workspacesSubject = new BehaviorSubject<Espacio[]>([]);
  public workspaces$ = this.workspacesSubject.asObservable();

  /**
   * Configurar headers para las peticiones HTTP
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener el ID del usuario autenticado actual
   */
    private getCurrentUserId(): Observable<number> {
    return this.userService.currentUser.pipe(
      take(1),
      map(user => {
        console.log('Usuario en workspace service:', user);
        
        if (!user || !user.id_usuario) {
          throw new Error('Usuario no autenticado');
        }
        
        console.log('ID Usuario obtenido:', user.id_usuario);
        return user.id_usuario;
      })
    );
  }
   /**
   * ALTERNATIVA: Obtener userId sincrónicamente
   */
  private getUserIdSync(): number {
    const userId = this.userService.getCurrentUserId();
    
    if (!userId) {
      console.error('No hay usuario autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    console.log('ID Usuario (sync):', userId);
    return userId;
  }
  /**
   * Obtener espacios del usuario - OPCIÓN 1: Con Observable
   */
  getWorkspaces(): Observable<Espacio[]> {
    return this.getCurrentUserId().pipe(
      switchMap(userId => {
        const url = `${this.apiUrl}?id_usuario=${userId}`;
        console.log('📡 Obteniendo espacios desde:', url);
        
        return this.http.get<any>(url).pipe(
          map(response => {
            console.log('Respuesta espacios:', response);
            
            if (response.error) {
              return [];
            }
            
            const espacios = response.data || response.espacios || response;
            return Array.isArray(espacios) ? espacios : [];
          }),
          catchError(error => {
            console.error('Error obteniendo espacios:', error);
            return of([]);
          })
        );
      }),
      catchError(error => {
        console.error('Error obteniendo ID de usuario:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener un espacio por ID
   */
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
  /**
   * Crear workspace
   */
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

        console.log('Creando espacio:', dataWithUser);

        return this.http.post<any>(this.apiUrl, dataWithUser).pipe(
          map(response => {
            console.log('Espacio creado:', response);
            return response.data || response.espacio || response;
          })
        );
      })
    );
  }

  /**
   * Actualizar un espacio
   */
  updateWorkspace(id: number, workspaceData: Partial<CreateWorkspaceRequest>): Observable<Espacio> {
    const updateData = {
      espacio: {
        nombre: workspaceData.title,
        descripcion: workspaceData.description
      }
    };

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
        console.error('Error al actualizar espacio:', error);
        throw error;
      })
    );
  }

  /**
   * Eliminar un espacio
   */
  deleteWorkspace(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(() => true),
      tap(() => {
        const currentEspacios = this.workspacesSubject.value;
        const filteredEspacios = currentEspacios.filter(w => w.id !== id);
        this.workspacesSubject.next(filteredEspacios);
      }),
      catchError(error => {
        console.error('Error al eliminar espacio:', error);
        throw error;
      })
    );
  }

  /**
   * Limpiar datos de espacios al cerrar sesión
   */
  clearWorkspaces(): void {
    this.workspacesSubject.next([]);
  }

  /**
   * Refrescar la lista de espacios desde el servidor
   */
  refreshWorkspaces(): Observable<Espacio[]> {
    return this.getWorkspaces();
  }

  /**
   * Verificar si hay espacios cargados
   */
  hasWorkspaces(): boolean {
    return this.workspacesSubject.value.length > 0;
  }

  /**
   * Buscar espacios por nombre (filtro local)
   */
  searchWorkspaces(searchTerm: string): Observable<Espacio[]> {
    const currentEspacios = this.workspacesSubject.value;
    const filteredEspacios = currentEspacios.filter(espacio =>
      espacio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (espacio.descripcion && espacio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return of(filteredEspacios);
  }

  /**
   * Obtener el usuario actual (para uso externo)
   */
  getCurrentUser(): Observable<number> {
    return this.getCurrentUserId();
  }
}