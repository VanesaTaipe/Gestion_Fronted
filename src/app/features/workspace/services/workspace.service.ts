import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { CreateWorkspaceRequest, Espacio } from '../models/espacio.interface';


@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private http = inject(HttpClient);
  
  private readonly apiUrl = `${environment.apiUrl}/espacios`;
  
  // Subject para manejar el estado de espacios
  private workspacesSubject = new BehaviorSubject<Espacio[]>([]);
  public workspaces$ = this.workspacesSubject.asObservable();

  // Usuario temporal hasta implementar autenticación
  private currentUserId = this.getStoredUserId();

  /**
   * Configurar headers para las peticiones HTTP
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener todos los espacios del usuario
   */
  getWorkspaces(): Observable<Espacio[]> {
  const url = `${this.apiUrl}?id_usuario=${this.currentUserId}`;
  
  return this.http.get<any>(url, {
    headers: this.getHeaders()
  }).pipe(
    map(response => {
   
      if (response.error) {
        console.log('Backend response:', response.error);
        this.workspacesSubject.next([]);
        return [];
      }
      
      // Manejar respuesta exitosa con datos
      const espacios = response.data || response.espacios || response;
      this.workspacesSubject.next(espacios);
      return espacios;
    }),
    catchError(error => {
      console.error('Error al obtener espacios:', error);
      this.workspacesSubject.next([]);
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
   * Crear un nuevo espacio
   */
  createWorkspace(workspaceData: CreateWorkspaceRequest): Observable<Espacio> {
    const dataWithUser = {
      espacio: {
        nombre: workspaceData.title,
        descripcion: workspaceData.description,
        id_usuario: this.currentUserId
      }
    };

    return this.http.post<any>(this.apiUrl, dataWithUser, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || response.espacio || response),
      tap(newEspacio => {
        const currentEspacios = this.workspacesSubject.value;
        this.workspacesSubject.next([...currentEspacios, newEspacio]);
      }),
      catchError(error => {
        console.error('Error al crear espacio:', error);
        throw error;
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
   * Obtener el ID del usuario almacenado localmente
   */
  private getStoredUserId(): number {
    const storedUserId = localStorage.getItem('tempUserId');
    return storedUserId ? parseInt(storedUserId) : 1; // Por defecto usuario 1
  }

  /**
   * Establecer un usuario temporal (hasta implementar autenticación real)
   */
  setTemporaryUser(userId: number): void {
    this.currentUserId = userId;
    localStorage.setItem('tempUserId', userId.toString());
    // Recargar espacios con el nuevo usuario
    this.getWorkspaces().subscribe();
  }

  /**
   * Obtener el ID del usuario actual
   */
  getCurrentUserId(): number {
    return this.currentUserId;
  }

  /**
   * Obtener token de autenticación (placeholder para futura implementación)
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Establecer token de autenticación (placeholder para futura implementación)
   */
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
    // Aquí podrías agregar el token a los headers automáticamente
  }

  /**
   * Limpiar datos de autenticación y espacios
   */
  clearAuth(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('tempUserId');
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
}