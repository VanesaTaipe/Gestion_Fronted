import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Column } from '../../../models/board.model';
import { AnalyticsService, Metricas } from '../../../services/analytics.service';

@Component({
  selector: 'app-board-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <h2 class="text-3xl font-bold text-gray-900 mb-8">Dashboard</h2>
      
      <!-- Tarjeta de Rendimiento del Equipo -->
      <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6">Rendimiento del equipo</h3>
        
        <!-- Barra de progreso -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-3xl font-bold text-gray-900">{{ completionPercentage }}%</span>
            <span class="text-sm text-gray-600">Completado</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div 
              class="bg-cyan-400 h-3 rounded-full transition-all duration-500"
              [style.width.%]="completionPercentage">
            </div>
          </div>
        </div>
        
        <!-- Indicadores -->
        <div class="flex justify-between items-center text-center mt-8">
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 rounded-full bg-cyan-400 mb-2"></div>
            <span class="text-sm text-gray-600">{{ metricas.tareas_completadas }}</span>
            <span class="text-xs text-gray-500">Finalizadas</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 rounded-full bg-yellow-400 mb-2"></div>
            <span class="text-sm text-gray-600">{{ metricas.tareas_en_progreso }}</span>
            <span class="text-xs text-gray-500">En progreso</span>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-3 h-3 rounded-full bg-red-400 mb-2"></div>
            <span class="text-sm text-gray-600">{{ metricas.tareas_pendientes }}</span>
            <span class="text-xs text-gray-500">Pendientes</span>
          </div>
        </div>
      </div>
      
      <!-- Tarjetas de Métricas -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total de tareas -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-gray-600">Total de tareas</span>
            <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <div class="text-4xl font-bold text-gray-900 mb-1">{{ totalTareas }}</div>
          <div class="text-xs text-gray-500">En total</div>
        </div>
        
        <!-- Tareas asignadas -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-gray-600">Tareas asignadas</span>
            <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div class="text-4xl font-bold text-gray-900 mb-1">{{ tareasAsignadas }}</div>
          <div class="text-xs text-gray-500">En total</div>
        </div>
        
        <!-- Velocidad -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-gray-600">Velocidad</span>
            <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
          </div>
          <div class="text-4xl font-bold text-gray-900 mb-1">{{ velocidad }}</div>
          <div class="text-xs text-gray-500">Tareas por día</div>
        </div>
        
        <!-- Equipo -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm text-gray-600">Equipo</span>
            <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div class="text-4xl font-bold text-gray-900 mb-1">{{ metricas.miembros_activos }}</div>
          <div class="text-xs text-gray-500">Miembros activos</div>
        </div>
      </div>
      
      <!-- Métricas Adicionales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <!-- Cycle Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Cycle Time Promedio</h4>
          <div class="text-3xl font-bold text-cyan-500">{{ metricas.cycle_time_promedio }} min</div>
          <p class="text-xs text-gray-500 mt-2">Tiempo desde "En Progreso" hasta "Finalizado"</p>
        </div>
        
        <!-- Lead Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Lead Time Promedio</h4>
          <div class="text-3xl font-bold text-purple-500">{{ metricas.lead_time_promedio }} min</div>
          <p class="text-xs text-gray-500 mt-2">Tiempo desde creación hasta completado</p>
        </div>
        
        <!-- Entregas a tiempo -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Entregas a Tiempo</h4>
          <div class="flex items-center">
            <div class="text-3xl font-bold text-green-500 mr-3">{{ metricas.entregas_a_tiempo }}</div>
            <div class="text-sm text-gray-600">/ {{ metricas.entregas_a_tiempo + metricas.entregas_tarde }} tareas</div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Completadas antes de la fecha límite</p>
        </div>
        
        <!-- Entregas tarde -->
        <div class="bg-white rounded-2xl shadow-lg p-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Entregas Tarde</h4>
          <div class="flex items-center">
            <div class="text-3xl font-bold text-red-500 mr-3">{{ metricas.entregas_tarde }}</div>
            <div class="text-sm text-gray-600">/ {{ metricas.entregas_a_tiempo + metricas.entregas_tarde }} tareas</div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Completadas después de la fecha límite</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class BoardDashboardComponent implements OnInit {
  @Input() proyectoId!: number;
  @Input() columns: Column[] = [];

  metricas: Metricas = {
    cycle_time_promedio: 0,
    lead_time_promedio: 0,
    tareas_completadas: 0,
    tareas_en_progreso: 0,
    tareas_pendientes: 0,
    entregas_a_tiempo: 0,
    entregas_tarde: 0,
    total_tareas: 0,
    tareas_asignadas: 0,
    velocidad: 0,
    miembros_activos: 0,
    rendimiento_porcentaje: 0
  };

  // Estas propiedades ahora vienen directamente del backend
  get completionPercentage(): number {
    return Math.round(this.metricas.rendimiento_porcentaje);
  }

  get totalTareas(): number {
    return this.metricas.total_tareas;
  }

  get tareasAsignadas(): number {
    return this.metricas.tareas_asignadas;
  }

  get velocidad(): number {
    return this.metricas.velocidad;
  }

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    console.log("🚀 Dashboard iniciando - Proyecto ID:", this.proyectoId);
    this.loadMetricas();
  }

  private loadMetricas() {
    this.analyticsService.getMetricas(this.proyectoId).subscribe({
      next: (data) => {
        console.log('✅ Métricas recibidas del backend:', data);
        this.metricas = data;
        console.log('📊 Dashboard actualizado con:', {
          total_tareas: this.totalTareas,
          completado: this.completionPercentage + '%',
          velocidad: this.velocidad,
          miembros: this.metricas.miembros_activos
        });
      },
      error: (err) => {
        console.error('❌ Error cargando métricas:', err);
        console.error('Detalles del error:', {
          status: err.status,
          message: err.message,
          url: err.url
        });
      }
    });
  }
}