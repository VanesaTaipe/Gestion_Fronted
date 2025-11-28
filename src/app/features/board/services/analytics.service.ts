import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, interval, switchMap, startWith } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Metricas {
  cycle_time_promedio: number;
  lead_time_promedio: number;
  tareas_completadas: number;
  tareas_en_progreso: number;
  tareas_pendientes: number;
  entregas_a_tiempo: number;
  entregas_tarde: number;
  total_tareas: number;
  tareas_asignadas: number;
  velocidad: number;
  miembros_activos: number;
  rendimiento_porcentaje: number;
}

// Estructura que devuelve el backend
interface CFDBackendResponse {
  proyecto_id: number;
  from: string;
  to: string;
  columns: Array<{ id: number; name: string }>;
  data: Array<{
    date: string;
    counts: { [key: string]: number };
  }>;
}

// Estructura adaptada para el frontend
export interface ColumnaSnapshot {
  id_columna: number;
  nombre: string;
  cantidad: number;
}

export interface Snapshot {
  fecha: string;
  columnas: ColumnaSnapshot[];
}

export interface ColumnaInfo {
  id: number;
  nombre: string;
}

export interface CFDData {
  snapshots: Snapshot[];
  columnas: ColumnaInfo[];
  fecha_inicio: string;
  fecha_fin: string;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:8001';

  constructor(private http: HttpClient) {}

  getMetricas(projectId: number): Observable<Metricas> {
    return this.http.get<Metricas>(`${this.apiUrl}/proyectos/${projectId}/metricas`);
  }

  getCFDData(
    projectId: number,
    from?: string,
    to?: string
  ): Observable<CFDData> {
    let params = new HttpParams();

    if (from) {
      params = params.set('from', from);
    }
    if (to) {
      params = params.set('to', to);
    }

    return this.http.get<CFDBackendResponse>(
      `${this.apiUrl}/proyectos/${projectId}/cfd`,
      { params }
    ).pipe(
      map(response => {
        console.log('📦 Respuesta raw del backend:', response);
        return this.transformCFDResponse(response);
      })
    );
  }

  private transformCFDResponse(response: CFDBackendResponse): CFDData {
    console.log('🔄 Iniciando transformación de CFD...');
    
    // Validación de datos
    if (!response || !response.data || response.data.length === 0) {
      console.warn('⚠️ Backend devolvió data vacía o undefined');
      return {
        snapshots: [],
        columnas: response?.columns?.map(col => ({
          id: col.id,
          nombre: col.name
        })) || [],
        fecha_inicio: response?.from || '',
        fecha_fin: response?.to || ''
      };
    }

    if (!response.columns || response.columns.length === 0) {
      console.warn('⚠️ Backend no devolvió columnas');
      return {
        snapshots: [],
        columnas: [],
        fecha_inicio: response.from,
        fecha_fin: response.to
      };
    }

    console.log('📊 Transformando datos:', {
      totalDias: response.data.length,
      totalColumnas: response.columns.length,
      columnas: response.columns.map(c => c.name)
    });

    // Transformar cada día
    const snapshots: Snapshot[] = response.data.map((dayData, dayIndex) => {
      console.log(`  📅 Día ${dayIndex + 1} (${dayData.date}):`, dayData.counts);
      
      const columnasSnapshot: ColumnaSnapshot[] = response.columns.map(col => {
        const cantidad = dayData.counts[col.id.toString()] || 0;
        return {
          id_columna: col.id,
          nombre: col.name,
          cantidad: cantidad
        };
      });

      return {
        fecha: dayData.date,
        columnas: columnasSnapshot
      };
    });

    console.log('✅ Transformación completada:', {
      totalSnapshots: snapshots.length,
      primeraFecha: snapshots[0]?.fecha,
      ultimaFecha: snapshots[snapshots.length - 1]?.fecha
    });

    return {
      snapshots,
      columnas: response.columns.map(col => ({
        id: col.id,
        nombre: col.name
      })),
      fecha_inicio: response.from,
      fecha_fin: response.to
    };
  }

  getCFDDataHoy(projectId: number): Observable<CFDData> {
    return this.getCFDData(projectId);
  }

  refreshMetricas(projectId: number): Observable<Metricas> {
    return this.getMetricas(projectId);
  }

  startAutoRefresh(projectId: number, intervalMs: number = 30000): Observable<Metricas> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getMetricas(projectId))
    );
  }

  getProyectosEspacio(espacioId: number, idUsuario?: number): Observable<any[]> {
    let params = new HttpParams();
    if (idUsuario) {
      params = params.set('id_usuario', String(idUsuario));
    }
    return this.http.get<any[]>(`${this.apiUrl}/espacios/${espacioId}/proyectos`, { params });
  }

  healthCheck(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }
}