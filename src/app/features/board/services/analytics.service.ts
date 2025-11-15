import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith } from 'rxjs';

export interface Metricas {
  cycle_time_promedio: number;  // En DÍAS
  lead_time_promedio: number;   // En DÍAS
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

export interface ColumnaSnapshot {
  id_columna: number;
  nombre: string;
  cantidad: number;
  status_fijas: string | null;
}

export interface Snapshot {
  fecha: string;
  columnas: ColumnaSnapshot[];
}

export interface ColumnaInfo {
  id: number;
  nombre: string;
  orden: number;
  status_fijas: string | null;
}

export interface CFDData {
  snapshots: Snapshot[];
  columnas: ColumnaInfo[];
  fecha_inicio: string;
  fecha_fin: string;
  total_tareas_analizadas: number;
  nota?: string;
  mensaje?: string;
}

// Mantener por compatibilidad (deprecated)
export interface BurndownData {
  linea_ideal: Array<{dia: number, dias_restantes: number}>;
  progreso_diario: Array<{dia: number, dias_restantes: number, fecha: string, tareas_completadas_dia: number}>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = 'http://localhost:8001';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las métricas generales del proyecto
   * NOTA: cycle_time_promedio y lead_time_promedio vienen en DÍAS
   */
 getMetricas(projectId: number): Observable<Metricas> {
    return this.http.get<Metricas>(`${this.apiUrl}/proyectos/${projectId}/metricas`);
  }

  getCFDData(projectId: number, dias: number = 30): Observable<CFDData> {
    return this.http.get<CFDData>(`${this.apiUrl}/proyectos/${projectId}/cfd?dias=${dias}`);
  }

  /**
   * Obtiene métricas generales + CFD en una sola llamada
   */
  getMetricasAgiles(projectId: number): Observable<{
    metricas_generales: Metricas;
    cumulative_flow_diagram: CFDData;
  }> {
    return this.http.get<any>(`${this.apiUrl}/proyectos/${projectId}/metricas-agiles`);
  }

  /**
   * Refresca las métricas manualmente
   */
  refreshMetricas(projectId: number): Observable<Metricas> {
    return this.getMetricas(projectId);
  }

  /**
   * Auto-refresh de métricas cada X milisegundos
   */
  startAutoRefresh(projectId: number, intervalMs: number = 30000): Observable<Metricas> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getMetricas(projectId))
    );
  }

  /**
   * @deprecated Usa getCFDData() en su lugar
   * Mantenido por compatibilidad con código antiguo
   */
  getBurndownData(projectId: number): Observable<any> {
    console.warn('getBurndownData() está deprecated. Usa getCFDData() en su lugar.');
    // Retornar CFD como fallback
    return this.getCFDData(projectId, 30);
  }
}