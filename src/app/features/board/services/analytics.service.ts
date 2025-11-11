import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, interval, BehaviorSubject } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

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

export interface BurndownData {
  progreso_diario: ProgresoDiario[];
  linea_ideal: LineaIdeal[];

}

export interface ProgresoDiario {
  dia: number;
  fecha: string;
  dias_restantes: number;
  tareas_completadas_dia: number;

}

export interface LineaIdeal {
  dia: number;
  dias_restantes: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private analyticsApi = 'http://localhost:8001';

  private metricasSubject = new BehaviorSubject<Metricas | null>(null);
  public metricas$ = this.metricasSubject.asObservable();


  private burndownSubject = new BehaviorSubject<BurndownData | null>(null);
  public burndown$ = this.burndownSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene métricas del servidor
   * @param proyectoId ID del proyecto
   */
  getMetricas(proyectoId: number): Observable<Metricas> {
    const url = `${this.analyticsApi}/proyectos/${proyectoId}/metricas`;
    console.log(` Solicitando métricas para proyecto ${proyectoId}:`, url);
    
    return this.http.get<Metricas>(url).pipe(
      tap((data) => {
        console.log('Métricas recibidas:', data);
        this.metricasSubject.next(data); 
      }),
      catchError((error) => {
        console.error(' Error obteniendo métricas:', error);
        return of(null as any);
      })
    );
  }

  /**
   * Obtiene datos para el burndown chart
   * @param proyectoId ID del proyecto
   */
  getBurndownData(proyectoId: number): Observable<BurndownData> {
    const url = `${this.analyticsApi}/proyectos/${proyectoId}/burndown`;
    console.log(` Solicitando burndown para proyecto ${proyectoId}:`, url);
    
    return this.http.get<BurndownData>(url).pipe(
      tap((data) => {
        console.log(' Burndown data recibida:', data);
        this.burndownSubject.next(data); 
      }),
      catchError((error) => {
        console.error('Error obteniendo burndown:', error);
        return of(null as any);
      })
    );
  }

  /**
   * 
   * @param proyectoId ID del proyecto
   * @param intervalMs Intervalo en milisegundos (default 5000ms = 5seg)
   */
  startAutoRefresh(proyectoId: number, intervalMs: number = 5000): Observable<Metricas> {
    console.log(`Auto-refresh iniciado para proyecto ${proyectoId} cada ${intervalMs}ms`);
    
    return interval(intervalMs).pipe(
      switchMap(() => this.getMetricas(proyectoId)),
      catchError((error) => {
        console.error(' Error en auto-refresh:', error);
        return of(null as any);
      })
    );
  }

  /**

   * @param proyectoId ID del proyecto
   * @param intervalMs Intervalo en milisegundos (default 30000ms = 30seg)
   */
  startBurndownAutoRefresh(proyectoId: number, intervalMs: number = 30000): Observable<BurndownData> {
    console.log(` Auto-refresh burndown iniciado para proyecto ${proyectoId} cada ${intervalMs}ms`);
    
    return interval(intervalMs).pipe(
      switchMap(() => this.getBurndownData(proyectoId)),
      catchError((error) => {
        console.error('Error en auto-refresh burndown:', error);
        return of(null as any);
      })
    );
  }

  /**
   * Obtener métricas en caché (última obtenida)
   */
  getMetricasCache(): Metricas | null {
    return this.metricasSubject.value;
  }

  /**
   * Obtener burndown data en caché (última obtenida)
   */
  getBurndownDataCache(): BurndownData | null {
    return this.burndownSubject.value;
  }

  /**
   * Forzar actualización inmediata de métricas
   */
  refreshMetricas(proyectoId: number): Observable<Metricas> {
    console.log(` Refrescando métricas manualmente para proyecto ${proyectoId}`);
    return this.getMetricas(proyectoId);
  }

  /**
   * Forzar actualización inmediata de burndown
   */
  refreshBurndown(proyectoId: number): Observable<BurndownData> {
    console.log(` Refrescando burndown manualmente para proyecto ${proyectoId}`);
    return this.getBurndownData(proyectoId);
  }
}