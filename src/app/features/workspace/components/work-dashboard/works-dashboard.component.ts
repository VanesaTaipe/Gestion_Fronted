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
      <!-- Header Section -->
      <div class="welcome-section">
        <div class="welcome-content">
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
              <div class="feature-item">
                <mat-icon>check_circle</mat-icon>
                <span>Tableros Kanban colaborativos en tiempo real</span>
              </div>
              <div class="feature-item">
                <mat-icon>check_circle</mat-icon>
                <span>Reportes automáticos con métricas clave</span>
              </div>
              <div class="feature-item">
                <mat-icon>check_circle</mat-icon>
                <span>Gestión de equipos y asignación de tareas</span>
              </div>
              <div class="feature-item">
                <mat-icon>check_circle</mat-icon>
                <span>Notificaciones y recordatorios inteligentes</span>
              </div>
              <div class="feature-item">
                <mat-icon>check_circle</mat-icon>
                <span>Control de acceso y roles de usuario</span>
              </div>
            </div>
          </div>
          
          <div class="illustration-section">
            <div class="user-greeting">
              <!-- Avatar del usuario -->
              <div class="user-avatar">
          <img 
        src="assetsk/kanban.png" 
        alt="Avatar del usuario"
        class="avatar-image" />
              </div>
              <h2>¡Hola, {{ getCurrentUserName() }}!</h2>
              <p class="user-info">Usuario ID: {{ getCurrentUserId() }}</p>
              <button 
                mat-raised-button 
                color="primary" 
                class="create-workspace-btn"
                (click)="openCreateWorkspaceDialog()">
                Crear espacio
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <!-- Workspaces Section -->
      <div class="workspaces-section" *ngIf="workspaces.length > 0">
        <h2>Mis Espacios de Trabajo</h2>
        <div class="workspaces-grid">
          <mat-card 
            *ngFor="let espacio of workspaces" 
            class="workspace-card"
            (click)="selectWorkspace(espacio)">
            <mat-card-header>
              <mat-card-title>{{ espacio.nombre }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <p>{{ espacio.descripcion }}</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary">Abrir</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workspace-container {
      padding: 2rem;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 900px;
      max-width: 1440px;
    }

    .welcome-section {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      margin-bottom: 2rem;
      box-shadow: 0 8px 32px rgba(165, 119, 119, 0.1);
    }

    .welcome-content {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 3rem;
      align-items: center;
    }

    .welcome-title {
      font-style:poppins
      font-weight:704;
      size: 40;
      color: #000000ff
    }

    .quote-section {
      background: #ffffffff;
      border-left: 4px solid #ffffffff;
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      border-radius: 0 8px 8px 0;
    }

    .quote {
      font-style:Italic;
      color: #000000ff;
      size:20;
    }

    .author {
      font-style:Italic;
      color: #000000ff;
      size:20;
    }

    .description {
      color: #7f8c8d;
      font-size: 1.1rem;
      size:18
            min-height: 156px;
      max-width: 477px;
    }
    .features-list {
      background:rgba(64, 224, 208, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      min-height: 156px;
      max-width: 477px;
    }
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 0.8rem;
      color: #000000ff;
    }
    

    .feature-item:last-child {
      margin-bottom: 0;
    }

    .feature-item mat-icon {
      color: #000000ff;
      font-size: 1.2rem;
    }

    .illustration-section {
      align-items: center; 
    }
    .user-avatar {
  width: 80px;
  height: 80px;
}

.avatar-image {
  width: 100%;
  
}    
    .user-greeting {
      text-align: center;
      margin-bottom: 2rem;
    }


    .user-greeting h2 {
      color: #2c3e50;
      font-size: 1.8rem;
      margin-bottom: 0.5rem;
    }

    .user-info {
      color: #7f8c8d;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .create-workspace-btn {
      background: #40E0D0 !important;
      color: #000000ff !important;
      padding: 12px 32px !important;
      border-radius: 25px !important;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 16px rgba(0, 188, 212, 0.3) !important;
      transition: all 0.3s ease !important;
    }

    .create-workspace-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(0, 188, 212, 0.4) !important;
    }

    .workspace-illustration {
      position: relative;
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .large-icon {
      font-size: 80px !important;
      color: #40E0D0;
      opacity: 0.8;
    }

    .floating-icon {
      position: absolute;
      font-size: 24px !important;
      color: #ff6b6b;
      animation: float 3s ease-in-out infinite;
    }

    .workspaces-section h2 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      font-size: 1.8rem;
    }

    .workspaces-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .workspace-card {
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 12px;
    }

    .workspace-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    }

    @media (max-width: 768px) {
      .welcome-content {
        grid-template-columns: 1fr;
        text-align: center;
      }
      
      .welcome-title {
        font-size: 2rem;
      }
      
      .workspace-container {
        padding: 1rem;
      }
      
      .welcome-section {
        padding: 2rem;
      }
    }
  `]
})
export class WorkspaceDashboardComponent implements OnInit {
  private dialog = inject(MatDialog);
  private workspaceService = inject(WorkspaceService);
  private route=inject(Router)
  
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
        console.log('Workspaces cargados:', workspaces);
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
        console.log('Workspace creado exitosamente:', newWorkspace);
        this.route.navigate(['/workspace', newWorkspace.id])
      },
      error: (error) => {
        console.error('Error al crear workspace:', error);
        this.isLoading = false;
      }
    });
  }
  

  selectWorkspace(workspace: Espacio): void {
    console.log('Workspace seleccionado:', workspace);
     console.log('Workspace seleccionado:', workspace);
    // Navegar al detalle del workspace
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
        console.log('✅ Proyecto creado:', result);
        // Navegar al tablero del proyecto
        this.route.navigate(['/workspace', workspaceId, 'project', result.id, 'board']);
      }
    });
  }


}
