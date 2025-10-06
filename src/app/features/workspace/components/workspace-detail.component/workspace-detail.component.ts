import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';

import { WorkspaceService } from '../../services/workspace.service';
import { ProyectoService } from '../../../project/services/proyecto.service';
import { Espacio } from '../../models/espacio.interface';
import { Proyecto } from '../../../project/models/proyecto.interfacce';
import { CreateProjectDialogComponent } from '../../../project/components/create-project/create-project.component';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <button 
                (click)="goBack()"
                class="p-2 hover:bg-gray-100 rounded-lg transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h1 class="text-2xl font-bold text-gray-800">
                  {{ workspace?.nombre || 'Espacio de Trabajo' }}
                </h1>
                <p class="text-gray-600 text-sm">
                  {{ workspace?.descripcion || 'Sin descripción' }}
                </p>
              </div>
            </div>
            
            <button 
              *ngIf="!isLoading && proyectos.length > 0"
              (click)="createProject()"
              class="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition shadow-md">
              <span class="text-xl">+</span>
              Nuevo Proyecto
            </button>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="max-w-7xl mx-auto px-6 py-8">
        <!-- Loading -->
        <div *ngIf="isLoading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-cyan-500 border-t-transparent"></div>
          <p class="mt-4 text-gray-600">Cargando proyectos...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading && proyectos.length === 0" class="py-12">
          <p class="text-center text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            Estás a punto de transformar la manera en que gestionas tus proyectos. 
            Comencemos creando tu primer proyecto
          </p>

          <div class="grid md:grid-cols-2 gap-8 items-start">
            <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 border-4 border-dashed border-cyan-300 rounded-3xl p-8 text-center">
              <div class="w-48 h-48 mx-auto mb-6">
                <svg viewBox="0 0 200 200" fill="none" class="w-full h-full">
                  <circle cx="100" cy="100" r="90" fill="#B8E3DE" opacity="0.3"/>
                  <path d="M100 50 L120 90 L130 110 L120 130 L100 150 L80 130 L70 110 L80 90 Z" 
                        fill="#5FBDAF" stroke="#4A9B8E" stroke-width="2"/>
                  <circle cx="100" cy="95" r="15" fill="#E8F6F4"/>
                  <circle cx="100" cy="115" r="10" fill="#E8F6F4"/>
                  <path d="M85 140 L75 160 L85 155 Z" fill="#5FBDAF"/>
                  <path d="M115 140 L125 160 L115 155 Z" fill="#5FBDAF"/>
                </svg>
              </div>
              
              <h2 class="text-2xl font-bold text-gray-800 mb-4">
                ¡Comienza tu primer proyecto!
              </h2>
              <p class="text-gray-700 mb-6 leading-relaxed">
                Crea uno para comenzar a organizar tus tareas y colaborar con tu equipo de manera eficiente.
              </p>
              <button 
                (click)="createProject()"
                class="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-full inline-flex items-center gap-2 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <span class="text-2xl font-bold">+</span>
                Crear Mi Primer Proyecto
              </button>
            </div>

            <div class="space-y-4">
              <div class="bg-white border-2 border-cyan-100 hover:border-cyan-400 rounded-2xl p-6">
                <h3 class="text-lg font-bold text-gray-800 mb-2">Organiza Tareas</h3>
                <p class="text-gray-600 text-sm">
                  Crea, asigna y da seguimiento a tareas con fechas límite y prioridades.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Projects Grid -->
        <div *ngIf="!isLoading && proyectos.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            *ngFor="let proyecto of proyectos"
            (click)="openProjectBoard(proyecto.id)"
            class="bg-white border-2 border-gray-200 hover:border-cyan-400 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg">
            
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-800">
                {{ proyecto.nombre }}
              </h3>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </div>
            
            <p class="text-gray-600 text-sm mb-4 line-clamp-2">
              {{ proyecto.descripcion || 'Sin descripción' }}
            </p>
            
            <div class="flex items-center gap-4 text-xs text-gray-500">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Actualizado {{ getRelativeDate(proyecto.updated_at) }}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class WorkspaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private proyectoService = inject(ProyectoService);
  private dialog = inject(MatDialog);
  
  workspace: Espacio | null = null;
  workspaceId: number = 0;
  proyectos: Proyecto[] = [];
  isLoading = true;

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.workspaceId = +params['id'];
      this.loadWorkspace();
      this.loadProjects();
    });
  }

  loadWorkspace() {
    this.workspaceService.getWorkspaceById(this.workspaceId).subscribe({
      next: (workspace) => {
        this.workspace = workspace;
      },
      error: (error) => {
        console.error('Error al cargar espacio:', error);
        this.router.navigate(['/workspace']);
      }
    });
  }

  loadProjects() {
    this.isLoading = true;
    this.proyectoService.getProyectosByWorkspace(this.workspaceId).subscribe({
      next: (proyectos) => {
        this.proyectos = proyectos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.proyectos = [];
        this.isLoading = false;
      }
    });
  }

  createProject(): void {
    const currentUserId = this.workspaceService.getCurrentUserId();
    
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        workspaceId: this.workspaceId,
        workspaceName: this.workspace?.nombre,
        currentUserId: currentUserId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadProjects();
      }
    });
  }

  openProjectBoard(projectId: number | undefined): void {
    if (!projectId) return;
    this.router.navigate(['/workspace', this.workspaceId, 'projects', projectId, 'board']);
  }

  goBack(): void {
    this.router.navigate(['/workspace']);
  }

  getRelativeDate(date?: Date): string {
    if (!date) return 'nunca';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'fecha inválida';
      
      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return 'hoy';
      if (days === 1) return 'ayer';
      if (days < 7) return `hace ${days} días`;
      if (days < 30) return `hace ${Math.floor(days / 7)} semanas`;
      
      return dateObj.toLocaleDateString('es-ES');
    } catch {
      return 'nunca';
    }
  }
}