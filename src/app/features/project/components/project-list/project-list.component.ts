import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Proyecto } from '../../models/proyecto.interfacce';
import { ProyectoService } from '../../services/proyecto.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    EmptyStateComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="project-list-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">Mis Proyectos</h1>
            <p class="page-subtitle">Gestiona y organiza todos tus proyectos en un solo lugar</p>
          </div>
          <div class="header-actions">
            <button 
              mat-raised-button 
              color="primary" 
              (click)="createProject()"
              class="create-btn">
              <mat-icon>add</mat-icon>
              Nuevo Proyecto
            </button>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="page-content">
        <!-- Loading State -->
        <app-loading-spinner *ngIf="isLoading"></app-loading-spinner>

        <!-- Empty State -->
        <app-empty-state 
          *ngIf="!isLoading && proyectos.length === 0"
          icon="folder_open"
          title="No tienes proyectos aún"
          message="Crea tu primer proyecto para comenzar a organizar tu trabajo con tableros Kanban"
          actionText="Crear Primer Proyecto"
          actionIcon="add"
          (click)="createProject()">
        </app-empty-state>

        <!-- Projects Grid -->
        <div class="projects-grid" *ngIf="!isLoading && proyectos.length > 0">
          <mat-card 
            *ngFor="let proyecto of proyectos; trackBy: trackByProyectoId"
            class="project-card"
            (click)="openProject(proyecto.id)">
            
            <mat-card-header>
              <div class="card-header-content">
                <mat-card-title class="project-name">{{ proyecto.nombre }}</mat-card-title>
                <button 
                  mat-icon-button 
                  [matMenuTriggerFor]="projectMenu"
                  class="project-menu-btn"
                  (click)="$event.stopPropagation()">
                  <mat-icon>more_vert</mat-icon>
                </button>

                <mat-menu #projectMenu="matMenu">
                  <button mat-menu-item (click)="editProject(proyecto)">
                    <mat-icon>edit</mat-icon>
                    <span>Editar</span>
                  </button>
                  <button mat-menu-item (click)="duplicateProject(proyecto)">
                    <mat-icon>content_copy</mat-icon>
                    <span>Duplicar</span>
                  </button>
                  <button mat-menu-item (click)="deleteProject(proyecto)" class="delete-option">
                    <mat-icon>delete</mat-icon>
                    <span>Eliminar</span>
                  </button>
                </mat-menu>
              </div>
            </mat-card-header>

            <mat-card-content>
              <p class="project-description" *ngIf="proyecto.descripcion">
                {{ proyecto.descripcion }}
              </p>
              <p class="no-description" *ngIf="!proyecto.descripcion">
                Sin descripción
              </p>

              <div class="project-stats">
                <div class="stat-item">
                  <mat-icon>view_column</mat-icon>
                  <span>5 Columnas</span>
                </div>
                <div class="stat-item">
                  <mat-icon>task</mat-icon>
                  <span>23 Tareas</span>
                </div>
                <div class="stat-item">
                  <mat-icon>group</mat-icon>
                  <span>4 Miembros</span>
                </div>
              </div>
            </mat-card-content>

            <mat-card-actions class="card-actions">
            <div class="project-meta">
              <mat-chip-listbox>
                <mat-chip-option class="status-chip active">
                  Activo
                </mat-chip-option>
              </mat-chip-listbox>
              <span class="last-updated">
                Actualizado {{ proyecto.updated_at ? getRelativeDate(proyecto.updated_at) : 'nunca' }}
              </span>
            </div>
              
              <button 
                mat-button 
                color="primary"
                (click)="openProject(proyecto.id); $event.stopPropagation()">
                Abrir Tablero
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .project-list-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      background: white;
      border-bottom: 1px solid #e1e5e9;
      padding: 2rem;
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 2rem;
    }

    .header-text {
      flex: 1;
    }

    .page-title {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .page-subtitle {
      margin: 0;
      color: #6c757d;
      font-size: 1rem;
    }

    .create-btn {
      padding: 0.75rem 2rem;
      font-size: 1rem;
    }

    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .project-card {
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid #e1e5e9;
      border-radius: 12px;
      overflow: hidden;
    }

    .project-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      border-color: #007bff;
    }

    .card-header-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .project-name {
      flex: 1;
      font-size: 1.25rem !important;
      font-weight: 600 !important;
      color: #2c3e50 !important;
      margin: 0 !important;
      line-height: 1.4 !important;
    }

    .project-menu-btn {
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .project-card:hover .project-menu-btn {
      opacity: 1;
    }

    .project-description {
      margin: 1rem 0;
      color: #6c757d;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .no-description {
      margin: 1rem 0;
      color: #adb5bd;
      font-style: italic;
    }

    .project-stats {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: #6c757d;
    }

    .stat-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .card-actions {
      padding: 1rem !important;
      background: #f8f9fa;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
    }

    .project-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .status-chip {
      font-size: 0.75rem !important;
      height: 24px !important;
      background: #28a745 !important;
      color: white !important;
    }

    .last-updated {
      font-size: 0.75rem;
      color: #6c757d;
    }

    .delete-option {
      color: #dc3545;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .page-content {
        padding: 1rem;
      }

      .projects-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }

      .project-stats {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ProjectListComponent implements OnInit, OnDestroy {
  proyectos: Proyecto[] = [];
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private proyectoService: ProyectoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProyectos();
    this.proyectoService.proyectos$.subscribe(proyectos => {
    this.proyectos = proyectos;
  });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProyectos(): void {
    this.isLoading = true;
    this.proyectoService.getProyectos()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (proyectos) => {
          this.proyectos = proyectos;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading projects:', error);
          this.isLoading = false;
        }
      });
  }

  createProject(): void {
    this.router.navigate(['/projects/create']);
  }

   openProject(projectId: number | undefined): void {
    if (!projectId) {
      console.error('ID de proyecto no válido');
      return;
    }
    this.router.navigate(['/projects', projectId, 'board']);
  }

  editProject(proyecto: Proyecto): void {
    // TODO: Implementar edición de proyecto
    console.log('Editar proyecto:', proyecto.id);
  }

  duplicateProject(proyecto: Proyecto): void {
    // TODO: Implementar duplicación de proyecto
    console.log('Duplicar proyecto:', proyecto.id);
  }

    deleteProject(proyecto: Proyecto): void {
    if (!proyecto.id) {
      console.error('ID de proyecto no válido');
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro de eliminar el proyecto "${proyecto.nombre}"?`);
    if (confirmDelete) {
      this.proyectoService.deleteProyecto(proyecto.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('Proyecto eliminado exitosamente');
          },
          error: (error) => {
            console.error('Error deleting project:', error);
          }
        });
    }
  }
  getRelativeDate(date?: Date): string {
    if (!date) return 'nunca';
    
    const now = new Date();
    const updateDate = new Date(date);
    const diffTime = now.getTime() - updateDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffMinutes < 5) return 'hace unos minutos';
    if (diffMinutes < 60) return `hace ${diffMinutes} minutos`;
    if (diffHours < 24) return `hace ${diffHours} horas`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
    
    return updateDate.toLocaleDateString('es-ES');
  }

  
  trackByProyectoId(index: number, proyecto: Proyecto): number {
    return proyecto.id || index;  // Usar index como fallback
  }
}