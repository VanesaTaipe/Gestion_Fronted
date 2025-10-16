import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { UserService as AuthUservice } from '../../../../core/auth/services/use.service';
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
                <mat-icon>add</mat-icon>
                Crear tu primer espacio
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
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.5rem !important;
    }

    .create-workspace-btn mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
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
  private authUserService = inject(AuthUservice);
  private destroyRef = inject(DestroyRef);

  workspaces: Espacio[] = [];
  isLoading = false;
  currentUserId = 0;
  currentUserName = '';

  ngOnInit(): void {
    console.log('WorkspaceDashboard inicializado');
    
    this.authUserService.currentUser
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(user => {
        if (!user) {
          console.log('No hay usuario autenticado, redirigiendo al login');
          this.route.navigate(['/login']);
          return;
        }
        
        console.log('Usuario autenticado:', user);
        console.log('Username:', user.username);
        console.log('ID Usuario:', user.id_usuario);
        
        this.currentUserName = user.username || 'Usuario';
        this.currentUserId = user.id_usuario;

        if (this.currentUserId > 0) {
          this.checkUserWorkspaces();
        } else {
          console.error('ID de usuario inválido:', this.currentUserId);
        }
      });
  }

  /**
   * Verificar espacios del usuario y redirigir si tiene alguno
   */
  checkUserWorkspaces(): void {
    console.log(' Verificando espacios del usuario ID:', this.currentUserId);
    this.isLoading = true;
    
    this.workspaceService.getWorkspaces()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (workspaces) => {
          console.log('Total espacios accesibles:', workspaces.length);
          
          this.workspaces = workspaces;
          this.isLoading = false;

          if (workspaces.length > 0) {
            // Tiene workspaces, redirigir al primero
            const firstWorkspace = workspaces[0];
            console.log(`Redirigiendo a: "${firstWorkspace.nombre}"`);
            
            this.route.navigate(['/workspace', firstWorkspace.id]);
          } else {
            // No tiene workspaces, mostrar pantalla de bienvenida
            console.log('Usuario nuevo - Mostrando pantalla de bienvenida');
          }
        },
        error: (error) => {
          console.error('Error al verificar workspaces:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Abrir diálogo para crear nuevo workspace
   */
  openCreateWorkspaceDialog(): void {
    console.log('Abriendo diálogo para crear workspace');
    
    const dialogRef = this.dialog.open(CreateWorkspaceDialogComponent, {
      width: '500px',
      disableClose: true,
      panelClass: 'custom-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Datos del nuevo workspace recibidos:', result);
        this.createWorkspace(result);
      } else {
        console.log('Diálogo cancelado - No se creó workspace');
      }
    });
  }

  /**
   * Crear nuevo workspace
   */
  createWorkspace(workspaceData: { title: string; description: string }): void {
    console.log('Creando workspace:', {
      titulo: workspaceData.title,
      descripcion: workspaceData.description,
      usuario: this.currentUserId
    });
    
    this.isLoading = true;
    
    this.workspaceService.createWorkspace(workspaceData).subscribe({
      next: (newWorkspace) => {
        console.log(' Workspace creado exitosamente:', newWorkspace);
        console.log(' ID del nuevo workspace:', newWorkspace.id);
        console.log('Nombre:', newWorkspace.nombre);
        
        this.workspaces.push(newWorkspace);
        this.isLoading = false;
        
        // Navegar al nuevo workspace creado
        console.log('Navegando al nuevo workspace...');
        this.route.navigate(['/workspace', newWorkspace.id]).then(success => {
          if (success) {
            console.log('Navegación exitosa al nuevo workspace');
          } else {
            console.error('Error en la navegación');
          }
        });
      },
      error: (error) => {
        console.error('Error al crear workspace:', error);
        console.error(' Detalles completos del error:', error);
        this.isLoading = false;
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al crear el espacio de trabajo.';
        
        if (error.status === 401) {
          errorMessage = 'No estás autenticado. Por favor, inicia sesión nuevamente.';
        } else if (error.status === 403) {
          errorMessage = 'No tienes permisos para crear espacios de trabajo.';
        } else if (error.status === 422) {
          errorMessage = 'Datos inválidos. Verifica el título y descripción.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        alert(errorMessage + ' Por favor, intenta nuevamente.');
      }
    });
  }

  /**
   * Obtener nombre del usuario actual
   */
  getCurrentUserName(): string {
    return this.currentUserName;
  }
  
}