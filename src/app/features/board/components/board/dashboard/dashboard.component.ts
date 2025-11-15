import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Column } from '../../../models/board.model';
import { AnalyticsService, Metricas, CFDData } from '../../../services/analytics.service';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, registerables, TooltipItem } from 'chart.js';

Chart.register(...registerables);

// Interfaz para los snapshots del CFD
interface ColumnaSnapshot {
  id_columna: number;
  nombre: string;
  cantidad: number;
  status_fijas: string | null;
}

interface Snapshot {
  fecha: string;
  columnas: ColumnaSnapshot[];
}

@Component({
  selector: 'app-board-dashboard',
  standalone: true,
  imports: [CommonModule],
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
    
    <!-- Burndown Chart y Métricas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-800">Cumulative Flow Diagram</h3>
            <p class="text-xs text-gray-500 mt-1">Últimos {{ diasCFD }} días - Workflow Stages</p>
          </div>
          
          <!-- Selector de período -->
          <div class="flex gap-1">
            <button 
              *ngFor="let d of periodosDisponibles"
              (click)="cambiarPeriodoCFD(d)"
              [class]="d === diasCFD ? 'bg-cyan-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              class="px-3 py-1 rounded text-xs font-medium transition-colors">
              {{ d }}d
            </button>
          </div>
        </div>

        <!-- Canvas para el gráfico CFD -->
        <div class="relative h-80 mb-4">
          <canvas #cfdCanvas></canvas>
        </div>

        <!-- Nota informativa -->
        <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-xs text-blue-800">
            <strong>💡 Cómo interpretar:</strong> Las bandas muestran el trabajo acumulado en cada etapa. 
            Una banda que se ensancha indica un cuello de botella.
          </p>
        </div>
      </div>

      <!-- Métricas de tiempo -->
      <div class="space-y-6">
        <!-- Cycle Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Cycle Time Promedio</h4>
          <div class="text-3xl font-bold text-cyan-500 mb-2">{{ metricas.cycle_time_promedio }} Días</div>
          <p class="text-xs text-gray-500">Tiempo desde "En Progreso" hasta "Finalizado"</p>
        </div>
        
        <!-- Lead Time -->
        <div class="bg-white rounded-2xl shadow-lg p-6" style="border: 2px solid #c1cdd8; border-radius: 15px;">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Lead Time Promedio</h4>
          <div class="text-3xl font-bold text-purple-500 mb-2">{{ metricas.lead_time_promedio }} Días</div>
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
  
  // ✅ CORRECCIÓN 1: Cambiar nombre de ViewChild para que coincida con el template
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
  diasCFD: number = 30;
  periodosDisponibles: number[] = [ 30];

  lastUpdate: Date = new Date();
  private refreshSubscription?: Subscription;
  private cfdSubscription?: Subscription;

  get completionPercentage(): number {
    return Math.min(100, Math.round(this.metricas.rendimiento_porcentaje));
  }
  
  private readonly COLORES_CFD = [
    { color: 'rgb(33, 150, 243)', alpha: 0.85 },    // Azul claro (Done)
    { color: 'rgb(3, 169, 244)', alpha: 0.85 },     // Cyan (Ready for Delivery)
    { color: 'rgb(156, 204, 101)', alpha: 0.85 },   // Verde lima (Follow up)
    { color: 'rgb(255, 167, 38)', alpha: 0.85 },    // Naranja (In Progress)
    { color: 'rgb(41, 182, 246)', alpha: 0.85 },    // Cyan más claro (Ready for Review)
    { color: 'rgb(255, 238, 88)', alpha: 0.85 },    // Amarillo (Peer Review)
    { color: 'rgb(239, 83, 80)', alpha: 0.85 },     // Rojo (Waiting on Link)
    { color: 'rgb(129, 199, 132)', alpha: 0.85 },   // Verde (Ready for Delivery alt)
    { color: 'rgb(66, 165, 245)', alpha: 0.85 },    // Azul (Conceptual)
  ];

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
    console.log("📊 Dashboard iniciando - Proyecto ID:", this.proyectoId);
    this.loadMetricas();
    this.loadCFDData();
    
    // Auto-refresh cada 30 segundos (aumentado de 5 segundos para no sobrecargar)
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
      console.log("🛑 Auto-refresh detenido");
    }
    if (this.cfdSubscription) {
      this.cfdSubscription.unsubscribe();
    }
    if (this.cfdChart) {
      this.cfdChart.destroy();
    }
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
    this.cfdSubscription = this.analyticsService.getCFDData(this.proyectoId, this.diasCFD).subscribe({
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

    // Destruir gráfico anterior si existe
    if (this.cfdChart) {
      this.cfdChart.destroy();
    }

    const ctx = this.cfdCanvasRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // ✅ CORRECCIÓN 2: Agregar tipo explícito al parámetro 's'
    const labels = this.cfdData.snapshots.map((s: Snapshot) => {
      const fecha = new Date(s.fecha);
      return fecha.toLocaleDateString('es-ES', { month: '2-digit', day: '2-digit' });
    });

    // Preparar datasets - IMPORTANTE: En orden inverso para que se apilen correctamente
    const columnas = [...this.cfdData.columnas].reverse();
    const datasets = columnas.map((columna, index) => {
      const color = this.COLORES_CFD[index % this.COLORES_CFD.length];
      
      // ✅ CORRECCIÓN 3: Agregar tipos explícitos a 'snapshot' y 'c'
      const data = this.cfdData!.snapshots.map((snapshot: Snapshot) => {
        // Buscar la columna en este snapshot
        const col = snapshot.columnas.find((c: ColumnaSnapshot) => c.id_columna === columna.id);
        return col ? col.cantidad : 0;
      });

      return {
        label: columna.nombre,
        data: data,
        backgroundColor: color.color.replace('rgb', 'rgba').replace(')', `, ${color.alpha})`),
        borderColor: color.color,
        borderWidth: 0.5,
        fill: true,
        tension: 0.4,  // Curva suave
        pointRadius: 0,
        pointHoverRadius: 4,
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
              boxWidth: 12,
              padding: 8,
              font: { size: 10 },
              usePointStyle: true,
              pointStyle: 'rect'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            callbacks: {
              title: (tooltipItems) => {
                const index = tooltipItems[0].dataIndex;
                const snapshot = this.cfdData!.snapshots[index];
                return `📅 ${snapshot.fecha}`;
              },
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `  ${label}: ${value} tareas`;
              },
              footer: (tooltipItems) => {
                // ✅ CORRECCIÓN 4: Validar que item.parsed.y no sea null
                const total = tooltipItems.reduce((sum, item) => {
                  const value = item.parsed.y ?? 0;  // Usar 0 si es null
                  return sum + value;
                }, 0);
                return `\nTotal: ${total} tareas`;
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
              font: { size: 11 }
            },
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { size: 9 }
            }
          },
          y: {
            stacked: true,  
            title: {
              display: true,
              text: 'Work Items',
              font: { size: 11 }
            },
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              font: { size: 10 },
              stepSize: 5
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

  cambiarPeriodoCFD(dias: number) {
    if (this.diasCFD !== dias) {
      this.diasCFD = dias;
      this.loadCFDData();
    }
  }

  refreshMetricas() {
    console.log('🔄 Refrescando métricas manualmente...');
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
    
    // Refrescar también CFD
    this.loadCFDData();
  }
}