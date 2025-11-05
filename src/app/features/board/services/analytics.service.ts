import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private analyticsApi = 'http://localhost:8001';

  constructor(private http: HttpClient) {}

  getMetricas(proyectoId: number): Observable<Metricas> {
    console.log(`📊 Solicitando métricas para proyecto ${proyectoId}:`, `${this.analyticsApi}/proyectos/${proyectoId}/metricas`);
    return this.http.get<Metricas>(`${this.analyticsApi}/proyectos/${proyectoId}/metricas`);
  }
}
