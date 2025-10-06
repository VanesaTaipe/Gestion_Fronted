import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Proyecto } from '../models/proyecto.interfacce';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
  private apiUrl = `${environment.apiBase}/proyectos`;
  private proyectosSubject = new BehaviorSubject<Proyecto[]>([]);
  public proyectos$ = this.proyectosSubject.asObservable();

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
    
    // Llamar a la ruta de todos los proyectos
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: any) => {
        let proyectos = [];
        
        // Manejar diferentes formatos de respuesta
        if (response.proyectos && Array.isArray(response.proyectos)) {
          proyectos = response.proyectos;
        } else if (Array.isArray(response)) {
          proyectos = response;
        }
        
        // Filtrar por workspace en el frontend
        return proyectos.filter((p: any) => p.id_espacio === workspaceId);
      }),
      tap(proyectos => console.log('Proyectos filtrados:', proyectos.length)),
      catchError(error => {
        console.error('Error obteniendo proyectos:', error);
        return of([]); // Retornar array vacío en caso de error
      })
    );
  }

  /**
   * Crear un nuevo proyecto en la base de datos
   */
  createProyecto(proyecto: any): Observable<any> {
    console.log('Creando proyecto en BD:', proyecto);
    return this.http.post<any>(this.apiUrl, proyecto).pipe(
      tap(response => {
        console.log('Respuesta completa:', response);
        
        const newProyecto = response.proyecto || response;
        console.log('Proyecto creado:', newProyecto);
        
        const currentProyectos = this.proyectosSubject.value;
        this.proyectosSubject.next([...currentProyectos, newProyecto]);
      }),
      catchError(error => {
        console.error('Error creando proyecto:', error);
        throw error;
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