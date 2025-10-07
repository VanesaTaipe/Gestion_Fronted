import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { CreateProjectDialogComponent } from '../../../project/components/create-project/create-project.component';
import { CreateWorkspaceDialogComponent } from '../../../workspace/components/create-workspace-dialog.component/create-workspace-dialog.compent';
import { Espacio } from '../../models/espacio.interface';
import { WorkspaceService } from '../../services/workspace.service';

@Component({
  selector: 'app-workspace-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="workspace-container">
      <div class="welcome-section">
        <div class="welcome-content">
          <!-- Contenido izquierdo -->
          <div class="text-content">
            <h1 class="welcome-title">¡Bienvenido a tu nueva forma de gestionar proyectos!</h1>
            
            <div class="quote-section">
              <p class="quote">"La clave de la gestión del tiempo es ver el valor de cada momento!"</p>
              <p class="author">Menachem Mendel Schneerson</p>
            </div>

            <p class="description">
              Ayuda a organizar tu trabajo de manera ágil con tableros Kanban intuitivos y 
              reportes inteligentes que impulsan la productividad de tu equipo.
            </p>

            <div class="features-list">
              <div class="feature-item">• Tableros Kanban colaborativos en tiempo real</div>
              <div class="feature-item">• Reportes automáticos con métricas clave</div>
              <div class="feature-item">• Gestión de equipos y asignación de tareas</div>
              <div class="feature-item">• Notificaciones y recordatorios inteligentes</div>
              <div class="feature-item">• Control de acceso y roles de usuario</div>
            </div>
          </div>
          
          <!-- Contenido derecho -->
          <div class="illustration-section">
            <div class="illustration-image">
              <img src="assets/bien.png" alt="Ilustración gestión del tiempo" />
            </div>
            
            <div class="user-greeting">
              <h2>¡Hola, {{ getCurrentUserName() }}!</h2>
              <button 
                mat-raised-button 
                class="create-workspace-btn"
                (click)="openCreateWorkspaceDialog()">
                Crear espacio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace-container {
      min-height: 100vh;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .welcome-section {
      max-width: 1200px;
      width: 100%;
    }

    .welcome-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .text-content {
      padding-right: 2rem;
    }

    .welcome-title {
      font-family: 'Poppins', sans-serif;
      font-weight: 700;
      font-size: 2.5rem;
      color: #000000;
      margin-bottom: 1.5rem;
      line-height: 1.2;
    }

    .quote-section {
      background: transparent;
      padding: 1rem 0;
      margin: 1.5rem 0;
    }

    .quote {
      font-style: italic;
      color: #000000;
      font-size: 1rem;
      margin: 0 0 0.3rem 0;
      line-height: 1.5;
    }

    .author {
      font-style: italic;
      color: #666666;
      font-size: 0.9rem;
      margin: 0;
    }

    .description {
      color: #000000;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .features-list {
      background: rgba(64, 224, 208, 0.2);
      border-radius: 12px;
      padding: 1.5rem 2rem;
      margin: 1.5rem 0;
    }

    .feature-item {
      color: #000000;
      margin-bottom: 0.8rem;
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .feature-item:last-child {
      margin-bottom: 0;
    }

    .illustration-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .illustration-image {
      width: 100%;
      max-width: 400px;
      display: flex;
      justify-content: center;
    }

    .illustration-image img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }

    .user-greeting {
      text-align: center;
      width: 100%;
    }

    .user-greeting h2 {
      color: #000000;
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .create-workspace-btn {
      background: #40E0D0 !important;
      color: #000000 !important;
      padding: 14px 48px !important;
      border-radius: 50px !important;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 16px rgba(64, 224, 208, 0.3) !important;
      transition: all 0.3s ease !important;
      border: none !important;
    }

    .create-workspace-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(64, 224, 208, 0.4) !important;
      background: #38c9b8 !important;
    }

    /* Responsive */
    @media (max-width: 968px) {
      .welcome-content {
        grid-template-columns: 1fr;
        gap: 3rem;
      }

      .text-content {
        padding-right: 0;
        text-align: center;
      }

      .welcome-title {
        font-size: 2rem;
      }

      .features-list {
        text-align: left;
      }

      .workspace-container {
        padding: 1rem;
      }
    }

    @media (max-width: 600px) {
      .welcome-title {
        font-size: 1.6rem;
      }

      .illustration-image {
        max-width: 280px;
      }

      .create-workspace-btn {
        padding: 12px 36px !important;
        font-size: 1rem !important;
      }
    }
  `]
})
export class WorkspaceDashboardComponent implements OnInit {
  private dialog = inject(MatDialog);
  private workspaceService = inject(WorkspaceService);
  private route = inject(Router);
  
  workspaces: Espacio[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadWorkspaces();
  }

  loadWorkspaces(): void {
    this.isLoading = true;
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.workspaces = workspaces;
        this.isLoading = false;
        // Si ya tiene espacios, redirigir automáticamente
        if (workspaces.length > 0) {
          this.route.navigate(['/workspace', workspaces[0].id]);
        }
      },
      error: (error) => {
        console.error('Error al cargar workspaces:', error);
        this.isLoading = false;
        this.workspaces = [];
      }
    });
  }

  openCreateWorkspaceDialog(): void {
    const dialogRef = this.dialog.open(CreateWorkspaceDialogComponent, {
      width: '500px',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createWorkspace(result);
      }
    });
  }

  createWorkspace(workspaceData: { title: string; description: string }): void {
    this.isLoading = true;
    this.workspaceService.createWorkspace(workspaceData).subscribe({
      next: (newWorkspace) => {
        this.workspaces.push(newWorkspace);
        this.isLoading = false;
        this.route.navigate(['/workspace', newWorkspace.id]);
      },
      error: (error) => {
        console.error('Error al crear workspace:', error);
        this.isLoading = false;
      }
    });
  }

  selectWorkspace(workspace: Espacio): void {
    this.route.navigate(['/workspace', workspace.id]);
  }

  getCurrentUserId(): number {
    return this.workspaceService.getCurrentUserId();
  }

  getCurrentUserName(): string {
    const storedName = localStorage.getItem('tempUserName');
    return storedName || 'Usuario';
  }

  createProject(workspaceId: number, workspaceName: string): void {
    const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        workspaceId: workspaceId,
        workspaceName: workspaceName
      },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.route.navigate(['/workspace', workspaceId, 'project', result.id, 'board']);
      }
    });
  }
}