import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Column } from '../../../models/board.model';
import { AnalyticsService, Metricas, CFDData, Snapshot, ColumnaSnapshot } from '../../../services/analytics.service';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-board-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="max-w-7xl mx-auto p-6">
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-3xl font-bold text-gray-900">Panel de Analíticas</h2>
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
    <div class="bg-white rounded-2xl shadow-lg p-8 mb-6" style="border: 2px solid #c1cdd8;">
      <h3 class="text-xl font-semibold text-gray-800 mb-6">Rendimiento del equipo</h3>
      
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <span class="text-3xl font-bold text-gray-900">{{ completionPercentage }}%</span>
          <span class="text-sm text-gray-600">Completado</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            class="bg-cyan-400 h-3 rounded-full transition-all duration-500"
            [style.width.%]="completionPercentage">
          </div>
        </div>
      </div>
      
      <!-- Indicadores -->
      <div class="flex justify-between items-center text-center mt-8">
        <div class="flex flex-col items-center">
          <div class="w-3 h-3 rounded-full bg-green-500 mb-2"></div>
          <span class="text-sm text-gray-600">{{ metricas.tareas_completadas }}</span>
          <span class="text-xs text-gray-500">Finalizadas</span>
        </div>
        <div class="flex flex-col items-center">
          <div class="w-3 h-3 rounded-full bg-blue-500 mb-2"></div>
          <span class="text-sm text-gray-600">{{ metricas.tareas_en_progreso }}</span>
          <span class="text-xs text-gray-500">En progreso</span>
        </div>
        <div class="flex flex-col items-center">
          <div class="w-3 h-3 rounded-full bg-orange-400 mb-2"></div>
          <span class="text-sm text-gray-600">{{ metricas.tareas_pendientes }}</span>
          <span class="text-xs text-gray-500">Pendientes</span>
        </div>
      </div>
    </div>
    
    <!-- Tarjetas de Métricas -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <!-- Total de tareas -->
      <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8;">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-semibold text-gray-700">Total de tareas</span>
          <svg class="w-8 h-8 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="text-4xl font-bold text-gray-900 mb-1">{{ metricas.total_tareas }}</div>
        <div class="text-xs text-gray-500">En total</div>
      </div>
    
      <!-- Tareas asignadas -->
      <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8;">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-semibold text-gray-700">Tareas asignadas</span>
          <svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        </div>
        <div class="text-4xl font-bold text-gray-900 mb-1">{{ metricas.tareas_asignadas }}</div>
        <div class="text-xs text-gray-500">En total</div>
      </div>
    
      <!-- Entregas a tiempo -->
      <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8;">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">Entregas a Tiempo</h4>
        <div class="flex items-center">
          <div class="text-3xl font-bold text-green-500 mr-3">{{ metricas.entregas_a_tiempo }}</div>
          <div class="text-sm text-gray-600">/ {{ metricas.entregas_a_tiempo + metricas.entregas_tarde }} tareas</div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Completadas antes de la fecha límite</p>
      </div>
    
      <!-- Entregas tarde -->
      <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8;">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">Entregas Tarde</h4>
        <div class="flex items-center">
          <div class="text-3xl font-bold text-red-500 mr-3">{{ metricas.entregas_tarde }}</div>
          <div class="text-sm text-gray-600">/ {{ metricas.entregas_a_tiempo + metricas.entregas_tarde }} tareas</div>
        </div>
        <p class="text-xs text-gray-500 mt-2">Completadas después de la fecha límite</p>
      </div>
    </div>
    
    <!-- CFD Chart y Métricas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- CFD Chart -->
      <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8;">
        <div class="flex flex-col gap-4 mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-800">Diagrama de Flujo Acumulado</h3>
            <p class="text-xs text-gray-500 mt-1">{{ getCFDSubtitle() }}</p>
          </div>
          
          <!-- Selector de rango de fechas -->
          <div class="flex flex-wrap items-center gap-2">
            <input
              type="date"
              class="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[140px]"
              [(ngModel)]="fromDate"
              (change)="onDateRangeChange()" 
              placeholder="Desde"/>
            <span class="text-sm text-gray-500">a</span>
            <input
              type="date"
              class="border border-gray-300 rounded px-3 py-2 text-sm flex-1 min-w-[140px]"
              [(ngModel)]="toDate"
              (change)="onDateRangeChange()" 
              placeholder="Hasta"/>
            <button
              type="button"
              class="px-4 py-2 rounded text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 whitespace-nowrap"
              (click)="clearDateRange()">
              Limpiar
            </button>
          </div>
        </div>
        
        <!-- Canvas para el gráfico CFD -->
        <div class="relative w-full" style="height: 400px;">
          <canvas #cfdCanvas class="w-full h-full"></canvas>
        </div>

        <!-- Nota informativa -->
        <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-xs text-blue-800">
            <strong>📊 Cómo interpretar:</strong> Las bandas muestran el trabajo acumulado en cada etapa del flujo. 
            Una banda que se ensancha indica un cuello de botella en esa fase.
          </p>
        </div>
      </div>

      <!-- Métricas de tiempo -->
      <div class="space-y-6">
        <!-- Cycle Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Tiempo de Ciclo Promedio</h4>
          <div class="text-3xl font-bold text-cyan-500 mb-2">
            {{ formatDays(metricas.cycle_time_promedio) }}
          </div>
          <p class="text-xs text-gray-500">Tiempo desde "En Progreso" hasta "Finalizado"</p>
        </div>
        
        <!-- Lead Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Tiempo de Entrega Promedio</h4>
          <div class="text-3xl font-bold text-purple-500 mb-2">
            {{ formatDays(metricas.lead_time_promedio) }}
          </div>
          <p class="text-xs text-gray-500">Tiempo desde creación hasta completado</p>
        </div>
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
export class BoardDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() proyectoId!: number;
  @Input() columns: Column[] = [];
  
  @ViewChild('cfdCanvas', { static: false }) cfdCanvasRef!: ElementRef<HTMLCanvasElement>;
  
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
  
  cfdData?: CFDData;
  cfdChart?: Chart;
  fromDate?: string;
  toDate?: string;

  lastUpdate: Date = new Date();
  private refreshSubscription?: Subscription;
  private cfdSubscription?: Subscription;

  get completionPercentage(): number {
    return Math.min(100, Math.round(this.metricas.rendimiento_porcentaje));
  }
  
  // Paleta de colores distinguibles
  private readonly COLORES_CFD = [
    { color: 'rgb(34, 197, 94)', alpha: 0.85 },    // Verde
    { color: 'rgb(59, 130, 246)', alpha: 0.85 },   // Azul
    { color: 'rgb(251, 146, 60)', alpha: 0.85 },   // Naranja
    { color: 'rgb(168, 85, 247)', alpha: 0.85 },   // Púrpura
    { color: 'rgb(236, 72, 153)', alpha: 0.85 },   // Rosa
    { color: 'rgb(14, 165, 233)', alpha: 0.85 },   // Cyan
    { color: 'rgb(234, 179, 8)', alpha: 0.85 },    // Amarillo
    { color: 'rgb(239, 68, 68)', alpha: 0.85 },    // Rojo
    { color: 'rgb(107, 114, 128)', alpha: 0.85 },  // Gris
  ];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() {
    console.log("📊 Dashboard iniciando - Proyecto ID:", this.proyectoId);
    this.loadMetricas();
    this.loadCFDData();
    
    this.refreshSubscription = this.analyticsService.startAutoRefresh(this.proyectoId, 30000)
      .subscribe({
        next: (data) => {
          if (data) {
            this.metricas = data;
            this.lastUpdate = new Date();
          }
        },
        error: (err) => {
          console.error('❌ Error en auto-refresh:', err);
        }
      });
  }

  ngAfterViewInit() {
    if (this.cfdData) {
      setTimeout(() => this.createCFDChart(), 100);
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.cfdSubscription) {
      this.cfdSubscription.unsubscribe();
    }
    if (this.cfdChart) {
      this.cfdChart.destroy();
    }
  }

  // ✅ NUEVA FUNCIÓN: Formatear días (backend ya envía en días)
  formatDays(days: number): string {
    if (days === 0) {
      return '0 días';
    }
    
    // Si es menos de 1 día, mostrar en horas
    if (days < 1) {
      const hours = Math.round(days * 24);
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Si tiene decimales, mostrar con 1 decimal
    if (days % 1 !== 0) {
      return `${days.toFixed(1)} días`;
    }
    
    // Si es entero
    const roundedDays = Math.round(days);
    return `${roundedDays} ${roundedDays === 1 ? 'día' : 'días'}`;
  }

  getCFDSubtitle(): string {
    if (this.cfdData) {
      const inicio = this.formatDateSpanish(this.cfdData.fecha_inicio);
      const fin = this.formatDateSpanish(this.cfdData.fecha_fin);
      if (inicio === fin) {
        return `Día ${inicio}`;
      }
      return `Del ${inicio} al ${fin}`;
    }
    return 'Cargando datos...';
  }

  formatDateSpanish(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  onDateRangeChange() {
    this.loadCFDData();
  }

  clearDateRange() {
    this.fromDate = undefined;
    this.toDate = undefined;
    this.loadCFDData();
  }

  private loadMetricas() {
    this.analyticsService.getMetricas(this.proyectoId).subscribe({
      next: (data) => {
        console.log('📈 Métricas recibidas:', data);
        this.metricas = data;
        this.lastUpdate = new Date();
      },
      error: (err) => {
        console.error('❌ Error cargando métricas:', err);
      }
    });
  }

  private loadCFDData() {
    if (this.cfdSubscription) {
      this.cfdSubscription.unsubscribe();
    }

    this.cfdSubscription = this.analyticsService
      .getCFDData(this.proyectoId, this.fromDate, this.toDate)
      .subscribe({
        next: (data) => {
          console.log('📊 Datos CFD recibidos:', data);
          this.cfdData = data;
          if (this.cfdCanvasRef) {
            this.createCFDChart();
          }
        },
        error: (err) => {
          console.error('❌ Error cargando CFD:', err);
        }
      });
  }

  private createCFDChart() {
    if (!this.cfdData || !this.cfdCanvasRef || !this.cfdData.snapshots || this.cfdData.snapshots.length === 0) {
      console.warn('⚠️ No hay datos de CFD o canvas disponible');
      return;
    }

    if (this.cfdChart) {
      this.cfdChart.destroy();
    }

    const ctx = this.cfdCanvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.cfdData.snapshots.map((s: Snapshot) => {
      const [year, month, day] = s.fecha.split('-');
      return `${day}/${month}`;
    });

    const columnas = [...this.cfdData.columnas].reverse();
    const datasets = columnas.map((columna, index) => {
      const color = this.COLORES_CFD[index % this.COLORES_CFD.length];
      
      const data = this.cfdData!.snapshots.map((snapshot: Snapshot) => {
        const col = snapshot.columnas.find((c: ColumnaSnapshot) => c.id_columna === columna.id);
        return col ? col.cantidad : 0;
      });

      return {
        label: columna.nombre,
        data: data,
        backgroundColor: color.color.replace('rgb', 'rgba').replace(')', `, ${color.alpha})`),
        borderColor: color.color,
        borderWidth: 1,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color.color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      };
    });

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              boxWidth: 15,
              padding: 10,
              font: { 
                size: 11,
                family: 'system-ui, -apple-system, sans-serif'
              },
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                const snapshot = this.cfdData!.snapshots[index];
                const [year, month, day] = snapshot.fecha.split('-');
                return `📅 ${day}/${month}/${year}`;
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `  ${label}: ${value} ${value === 1 ? 'tarea' : 'tareas'}`;
              },
              footer: (tooltipItems) => {
                const total = tooltipItems.reduce((sum, item) => {
                  const value = item.parsed.y ?? 0;
                  return sum + value;
                }, 0);
                return `\nTotal: ${total} ${total === 1 ? 'tarea' : 'tareas'}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            title: {
              display: true,
              text: 'Fecha',
              font: { 
                size: 12,
                weight: 600
              },
              color: '#374151'
            },
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { size: 10 },
              color: '#6B7280'
            }
          },
          y: {
            stacked: true,
            title: {
              display: true,
              text: 'Tareas Acumuladas',
              font: { 
                size: 12,
                weight: 600
              },
              color: '#374151'
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.06)'
            },
            ticks: {
              font: { size: 10 },
              stepSize: 1,
              color: '#6B7280'
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

    this.cfdChart = new Chart(ctx, config);
  }

  refreshMetricas() {
    console.log('🔄 Refrescando datos...');
    this.analyticsService.refreshMetricas(this.proyectoId).subscribe({
      next: (data) => {
        if (data) {
          this.metricas = data;
          this.lastUpdate = new Date();
          console.log('✅ Métricas refrescadas');
        }
      },
      error: (err) => {
        console.error('❌ Error refrescando:', err);
      }
    });
    
    this.loadCFDData();
  }
}