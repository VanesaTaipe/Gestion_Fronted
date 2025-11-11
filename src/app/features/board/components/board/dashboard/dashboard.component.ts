import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef ,AfterViewInit} from '@angular/core';
import { Column } from '../../../models/board.model';
import { AnalyticsService, Metricas, BurndownData } from '../../../services/analytics.service';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables, TooltipItem, ChartTypeRegistry } from 'chart.js';
Chart.register(...registerables);
@Component({
  selector: 'app-board-dashboard',
  standalone: true,
  imports: [CommonModule],
  // En dashboard.component.ts - actualiza el template

template: `
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-3xl font-bold text-gray-900">Dashboard</h2>
      <button 
        (click)="refreshMetricas()"
        class="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Actualizar
      </button>
    </div>
    
    <!-- Tarjeta de Rendimiento del Equipo -->
    <div class="bg-white rounded-2xl shadow-lg p-8 mb-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">Rendimiento del equipo</h3>
      
      <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-3xl font-bold text-gray-900">{{ completionPercentage }}%</span>
            <span class="text-sm text-gray-600">Completado</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              class="bg-cyan-400 h-3 rounded-full transition-all duration-500 max-w-full"
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
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
       <!-- Total de tareas -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold text-gray-700 mb-2">Total de tareas</span>
            <svg class="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
          </svg>
        </div>
          <div class="text-4xl font-bold text-gray-900 mb-1">{{ totalTareas }}</div>
          <div class="text-xs text-gray-500">En total</div>
        </div>
      
     <!-- Tareas asignadas -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-semibold text-gray-700 mb-2">Tareas asignadas</span>
            <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <div class="text-4xl font-bold text-gray-900 mb-1">{{ tareasAsignadas }}</div>
          <div class="text-xs text-gray-500">En total</div>
        </div>
      
       <!-- Entregas a tiempo -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Entregas a Tiempo</h4>
          <div class="flex items-center">
            <div class="text-3xl font-bold text-green-500 mr-3">{{ metricas.entregas_a_tiempo }}</div>
            <div class="text-sm text-gray-600">/ {{ metricas.entregas_a_tiempo + metricas.entregas_tarde }} tareas</div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Completadas antes de la fecha límite</p>
        </div>
      
      <!-- Entregas tarde -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Entregas Tarde</h4>
          <div class="flex items-center">
            <div class="text-3xl font-bold text-red-500 mr-3">{{ metricas.entregas_tarde }}</div>
            <div class="text-sm text-gray-600">/ {{ metricas.entregas_a_tiempo + metricas.entregas_tarde }} tareas</div>
          </div>
          <p class="text-xs text-gray-500 mt-2">Completadas después de la fecha límite</p>
        </div>
      </div>
    </div>
    
    <!-- Burndown Chart y Métricas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- BURNDOWN CHART -->
      <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;" >
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-semibold text-gray-800">Burndown Chart</h3>
        </div>

        <!-- Canvas para el gráfico -->
        <div class="relative h-80 mb-4">
          <canvas #burndownCanvas></canvas>
        </div>

        <!-- Leyenda -->
        <div class="flex justify-center gap-6 mb-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-4 h-0.5 bg-blue-500" style="border: 2px dashed rgb(59, 130, 246);"></div>
            <span class="text-gray-600">Línea Ideal</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-1 bg-red-500 rounded"></div>
            <span class="text-gray-600">Progreso Real</span>
          </div>
        </div>
      </div>

      <!-- Métricas de tiempo -->
      <div class="space-y-6">
        <!-- Cycle Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Cycle Time Promedio</h4>
          <div class="text-3xl font-bold text-cyan-500 mb-2">{{ metricas.cycle_time_promedio }} Horas</div>
          <p class="text-xs text-gray-500">Tiempo desde "En Progreso" hasta "Finalizado"</p>
        </div>
        
        <!-- Lead Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Lead Time Promedio</h4>
          <div class="text-3xl font-bold text-purple-500 mb-2">{{ metricas.lead_time_promedio }} Horas</div>
          <p class="text-xs text-gray-500">Tiempo desde creación hasta completado</p>
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
export class BoardDashboardComponent implements OnInit, OnDestroy {
  @Input() proyectoId!: number;
  @Input() columns: Column[] = [];
  @ViewChild('burndownCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
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
  burndownData?: BurndownData;
  burndownChart?:Chart;

  lastUpdate: Date = new Date();
  private refreshSubscription?: Subscription;
   private burndownSubscription?: Subscription;

  get completionPercentage(): number {
    return Math.min(100, Math.round(this.metricas.rendimiento_porcentaje));
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
    console.log("Dashboard iniciando - Proyecto ID:", this.proyectoId);
    this.loadMetricas();
    this.loadBurndownData();
    
    this.refreshSubscription = this.analyticsService.startAutoRefresh(this.proyectoId, 5000)
      .subscribe({
        next: (data) => {
          if (data) {
            this.metricas = data;
            this.lastUpdate = new Date();
          }
        },
        error: (err) => {
          console.error('Error en auto-refresh:', err);
        }
      });
  }
  ngAfterViewInit() {
    if (this.burndownData) {
      setTimeout(() => this.createBurndownChart(), 100);
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      console.log("Auto-refresh detenido");
    }
    if (this.burndownSubscription) {
      this.burndownSubscription.unsubscribe();
    }
    if (this.burndownChart) {
      this.burndownChart.destroy();
    }
  }

  private loadMetricas() {
    this.analyticsService.getMetricas(this.proyectoId).subscribe({
      next: (data) => {
        console.log(' Métricas recibidas del backend:', data);
        this.metricas = data;
        this.lastUpdate = new Date();
      },
      error: (err) => {
        console.error('Error cargando métricas:', err);
      }
    });
  }
  private loadBurndownData() {
    this.burndownSubscription = this.analyticsService.getBurndownData(this.proyectoId).subscribe({
      next: (data) => {
        console.log('📈 Datos de burndown recibidos:', data);
        this.burndownData = data;
        if (this.canvasRef) {
          this.createBurndownChart();
        }
      },
      error: (err) => {
        console.error('Error cargando burndown:', err);
      }
    });
  }
   private createBurndownChart() {
    if (!this.burndownData || !this.canvasRef) {
      console.warn('No hay datos de burndown o canvas disponible');
      return;
    }

    // Destruir gráfico anterior si existe
    if (this.burndownChart) {
      this.burndownChart.destroy();
    }

    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Preparar datos para la línea ideal
    const lineaIdealData = this.burndownData.linea_ideal.map(item => ({
      x: item.dia,
      y: item.dias_restantes
    }));

    // Preparar datos para la línea real
    const lineaRealData = this.burndownData.progreso_diario.map(item => ({
      x: item.dia,
      y: item.dias_restantes
    }));

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        datasets: [
          {
            label: 'Ideal',
            data: lineaIdealData,
            borderColor: 'rgb(59, 130, 246)', // blue-500
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            borderDash: [5, 5], // Línea punteada
            pointRadius: 0,
            tension: 0 // Línea recta
          },
          {
            label: 'Real',
            data: lineaRealData,
            borderColor: 'rgb(239, 68, 68)', // red-500
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: 'rgb(239, 68, 68)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.2 // Curva suave
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              title: (tooltipItems: TooltipItem<keyof ChartTypeRegistry>[]) => {
                const dia = tooltipItems[0].parsed.x;
                const diaData = this.burndownData?.progreso_diario.find(d => d.dia === dia);
                const fecha = diaData?.fecha;
                return `Día ${dia}${fecha ? ' (' + fecha + ')' : ''}`;
              },
              label: (context: TooltipItem<keyof ChartTypeRegistry>) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y?.toFixed(2);
                const dia = context.parsed.x;
                
                // Si es la línea real, mostrar info adicional
                if (label === 'Real') {
                  const diaData = this.burndownData?.progreso_diario.find(d => d.dia === dia);
                  if (diaData && diaData.tareas_completadas_dia > 0) {
                    return `${label}: ${value} días (${diaData.tareas_completadas_dia} tareas completadas)`;
                  }
                }
                
                return `${label}: ${value} días`;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Iteration Timeline (días)',
              font: { size: 14 }
            },
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: { stepSize: 1 }
          },
          y: {
            title: {
              display: true,
              text: 'Sum of Task Estimates (días)',
              font: { size: 14 }
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    };

    this.burndownChart = new Chart(ctx, config);
  }
  refreshMetricas() {
    console.log('Refrescando métricas manualmente...');
    this.analyticsService.refreshMetricas(this.proyectoId).subscribe({
      next: (data) => {
        if (data) {
          this.metricas = data;
          this.lastUpdate = new Date();
          console.log('Métricas refrescadas');
        }
      },
      error: (err) => {
        console.error('Error refrescando:', err);
      }
    });
 
 }
  refreshBurndown() {
    console.log('Refrescando burndown chart...');
    this.loadBurndownData();
  }
}