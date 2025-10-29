import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';

import { UserService } from '../../../../core/auth/services/use.service';
import { CreateProjectDialogComponent } from '../../../project/components/create-project/create-project.component';
import { Proyecto } from '../../../project/models/proyecto.interfacce';
import { ProyectoService } from '../../../project/services/proyecto.service';
import { Espacio } from '../../models/espacio.interface';
import { WorkspaceService } from '../../services/workspace.service';
import { CreateWorkspaceDialogComponent } from '../create-workspace-dialog.component/create-workspace-dialog.compent';
@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
  template: `
  <div class="flex h-screen bg-gray-50 overflow-hidden">
  <!-- Sidebar -->
  <aside class="w-64 bg-white border-r flex flex-col h-screen">

    <!-- Workspaces List -->
    <div class="flex-1 overflow-y-auto p-4">
      <img src="assets/kanban-logo.png" alt="Logo" class="w-16 h-16 mx-auto">
      <h2 class="text-2xl font-semibold text-gray-500 uppercase mb-3 tracking-wider">
        MIS ESPACIOS
      </h2>

      <div class="space-y-1">
        <div *ngFor="let espacio of allWorkspaces" class="group">
          <!-- Workspace Header -->
          <div 
            class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 cursor-pointer"
            [class.bg-gray-100]="workspaceId === espacio.id">
            <div 
              class="flex items-center gap-2 flex-1"
              (click)="selectWorkspace(espacio.id)">
              <span class="w-5 h-5 bg-black text-white rounded text-xs flex items-center justify-center font-bold">
                {{ espacio.nombre.charAt(0).toUpperCase() }}
              </span>
              <span class="font-medium text-sm">{{ espacio.nombre }}</span>
            </div>
            <button 
              (click)="toggleWorkspace(espacio.id); $event.stopPropagation()"
              class="text-gray-400">
              <svg 
                class="w-4 h-4 transition-transform"
                [class.rotate-180]="expandedWorkspaces.has(espacio.id)"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>

          <!-- Submenu: Proyectos del espacio -->
          <div *ngIf="expandedWorkspaces.has(espacio.id)" class="ml-8 mt-1 space-y-1">
            <!-- Opción Proyectos -->
            <div class="flex items-center gap-2 p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
              Proyectos
            </div>

            <!-- Lista de proyectos (si el espacio está seleccionado) -->
            <div *ngIf="workspaceId === espacio.id && workspaceProjects.length > 0" class="ml-6 space-y-1">
              <div 
                *ngFor="let proyecto of workspaceProjects"
                (click)="openProjectBoard(getProjectId(proyecto))"
                class="p-2 text-xs text-gray-600 hover:bg-gray-100 rounded cursor-pointer truncate">
                • {{ proyecto.nombre }}
              </div>
            </div>

            <!-- Configuración -->
            <div 
              (click)="openSettings($event,workspaceId)"
              class="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Configuración
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Button -->
    <div class="p-4 border-t flex-shrink-0 bg-[#40E0D0]">
    <button
      (click)="openCreateWorkspaceDialog()"
      class="w-full bg-[#40E0D0] hover:bg-[#38c9b8] text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-3 transition-colors">
      <div class="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
        <span class="text-white text-2xl font-bold leading-none">+</span>
      </div>
      <span class="text-base">Crear espacio</span>
    </button>
  </div>
  </aside>
    <!-- Alerta de límite de espacios -->
    <div 
    *ngIf="showLimitAlert"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fadeIn">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-scaleIn">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-red-600 to-red-500 p-6 rounded-t-2xl">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4
                      c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="text-xl font-bold text-white">Límite Alcanzado</h3>
          </div>
          <button 
            (click)="closeLimitAlert()"
            class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6">
        <p class="text-gray-700 leading-relaxed mb-4">
          Has alcanzado el límite máximo de 
          <strong class="text-red-600">{{ MAX_WORKSPACES }} espacios de trabajo</strong>.
        </p>
        <p class="text-gray-600 text-sm">
          Para crear un nuevo espacio, primero debes eliminar uno de los espacios existentes desde la configuración.
        </p>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
        <button
          (click)="closeLimitAlert()"
          class="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 
                hover:from-red-500 hover:to-red-400 text-white font-semibold 
                rounded-lg transition-all shadow-md hover:shadow-lg">
          Entendido
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col overflow-hidden">
    <!-- Header fijo -->
    <div class="bg-white border-b px-8 py-6 flex-shrink-0">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">
            {{ workspace?.nombre || 'Espacio de trabajo' }}
          </h1>
        </div>
        
        <div class="flex items-center gap-4 relative">
        <h2 class="text-xl font-semibold text-gray-800">
          {{ currentUserName }}
        </h2>

        <div class="relative">
          <!-- Botón del avatar -->
          <button 
            (click)="toggleUserMenu()"
            class="w-12 h-12 rounded-full bg-gradient-to-br from-[#40E0D0] to-[#38c9b8] flex items-center justify-center hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#40E0D0] focus:ring-offset-2">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
            </svg>
          </button>

          <!-- Menú Dropdown -->
          <div 
            *ngIf="showUserMenu"
            class="absolute right-0 mt-3 w-56 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 overflow-hidden"
            style="animation: slideDown 0.2s ease-out;">

            <!-- Opción de cerrar sesión -->
            <button
              (click)="logout()"
              class="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors duration-150">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
              <span class="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Overlay transparente para cerrar el menú -->
      <div 
        *ngIf="showUserMenu"
        (click)="closeUserMenu()"
        class="fixed inset-0 z-40">
      </div>
      </div>
    </div>

    <!-- Contenido con scroll -->
    <div class="flex-1 overflow-auto bg-gray-50">
      <div class="p-8">
        <!-- Texto descriptivo - SOLO cuando NO hay proyectos -->
        <p *ngIf="!isLoading && proyectos.length === 0" class="text-center text-gray-600 mb-8 max-w-4xl mx-auto">
          Estás a punto de transformar la manera en que gestionas tus proyectos.
        </p>

        <!-- Empty State -->
        <div *ngIf="!isLoading && proyectos.length === 0" class="max-w-6xl mx-auto">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Card cohete -->
            <div class="bg-[#E0F7F5] border-4 border-dashed border-[#40E0D0] rounded-3xl p-8 text-center">
              <div class="w-32 h-32 mx-auto mb-6">
                <svg viewBox="0 0 200 200" class="w-full h-full">
                  <circle cx="100" cy="100" r="80" fill="#B8E3DE"/>
                  <g transform="translate(100, 100)">
                    <ellipse cx="0" cy="20" rx="25" ry="35" fill="#5FBDAF"/>
                    <polygon points="-25,5 0,-40 25,5" fill="#5FBDAF"/>
                    <circle cx="0" cy="15" r="8" fill="white"/>
                    <polygon points="-25,40 -15,55 -25,50" fill="#FF6B6B"/>
                    <polygon points="25,40 15,55 25,50" fill="#FF6B6B"/>
                  </g>
                </svg>
              </div>
              
              <h2 class="text-2xl font-bold mb-4">¡Comienza tu primer proyecto!</h2>
              <p class="text-gray-700 mb-6 text-sm">
                Crea uno para comenzar a organizar tus tareas y colaborar con tu equipo de manera eficiente.
              </p>
              
              <button
                (click)="createProject()"
                class="bg-[#40E0D0] hover:bg-[#38c9b8] text-white font-semibold px-8 py-3 rounded-full inline-flex items-center gap-2">
                <span class="text-xl">+</span>
                Crear Mi Primer Proyecto
              </button>
            </div>

            <!-- Feature cards -->
            <div class="space-y-4">
              <div class="bg-[#E0F7F5] border-2 border-[#40E0D0] rounded-2xl p-6">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-bold text-lg mb-2">Organiza Tareas</h3>
                    <p class="text-sm text-gray-700">
                      Crea, asigna y da seguimiento a tareas con fechas límite y prioridades.
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-[#E0F7F5] border-2 border-[#40E0D0] rounded-2xl p-6">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-bold text-lg mb-2">Colabora en Equipo</h3>
                    <p class="text-sm text-gray-700">
                      Invita miembros, comparte archivos y mantén comunicación fluida.
                    </p>
                  </div>
                </div>
              </div>

              <div class="bg-[#E0F7F5] border-2 border-[#40E0D0] rounded-2xl p-6">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 class="font-bold text-lg mb-2">Mide el Progreso</h3>
                    <p class="text-sm text-gray-700">
                      Visualiza avances con reportes automáticos y métricas en tiempo real.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Projects Grid -->
        <div *ngIf="!isLoading && proyectos.length > 0" class="max-w-6xl mx-auto">
          <!-- Grid de proyectos -->
          <div class="grid md:grid-cols-3 gap-6 mb-8">
            <div
              *ngFor="let proyecto of proyectos"
              (click)="openProjectBoard(getProjectId(proyecto))"
              class="bg-[#E0F7F5] border-2 border-[#40E0D0] rounded-2xl p-6 cursor-pointer hover:shadow-lg transition">
              
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-lg break-words proyecto-nombre">{{ proyecto.nombre }}</h3>
                <button class="text-gray-400">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
                  </svg>
                </button>
              </div>

              <div class="flex -space-x-2">
                <div class="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                <div class="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                <div class="w-8 h-8 rounded-full bg-gray-500 border-2 border-white"></div>
                <div class="w-8 h-8 rounded-full bg-[#40E0D0] border-2 border-white flex items-center justify-center text-white text-sm font-bold">
                  +
                </div>
              </div>
            </div>
          </div>

          <!-- Botón Crear Proyecto centrado -->
          <div class="flex justify-center mt-6">
            <button
              (click)="createProject()"
              class="bg-[#40E0D0] hover:bg-[#38c9b8] text-white font-semibold px-8 py-3 rounded-full inline-flex items-center gap-2 shadow-md transition">
              <span class="text-xl">+</span>
              Crear Proyecto
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>
`,
  styles: [`
    .rotate-180 {
      transform: rotate(180deg);
    }
    /* Animación para el menú dropdown */
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }


  .proyecto-nombre {

    display: -webkit-box;              /* para usar line-clamp */
    -webkit-line-clamp: 2;             /*  máximo 2 líneas */
    -webkit-box-orient: vertical;      /* define la orientación */
    overflow: hidden;                  /* oculta el texto extra */
    text-overflow: ellipsis; 

    white-space: normal;         
    word-wrap: break-word;       
    overflow-wrap: break-word;   
    line-height: 1.3;
    max-width: 150px;
  }
  `]
})
export class WorkspaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private proyectoService = inject(ProyectoService);
  private dialog = inject(MatDialog);
  private authUserService = inject(UserService);
  workspace: Espacio | null = null;
  workspaceId: number = 0;
  proyectos: Proyecto[] = [];
  isLoading = true;
  workspaceProjects: Proyecto[] = [];
  allWorkspaces: Espacio[] = []; 
  expandedWorkspaces = new Set<number>();
  currentUserId: number = 0;
  currentUserName: string = '';
  showUserMenu: boolean = false;
   showLimitAlert: boolean = false;
  readonly MAX_WORKSPACES = 3;

  ngOnInit() {
  // Suscribirse al usuario actual
  this.authUserService.currentUser.subscribe(user => {
    if (user && user.id_usuario) {
      this.currentUserId = user.id_usuario;
      this.currentUserName = user.username || 'Usuario';

      // NUEVO: Cargar workspaces y proyectos después de obtener el usuario
      this.route.params.subscribe(params => {
        this.workspaceId = +params['id'];
        this.loadWorkspace();
        this.loadProjects();
        this.loadAllWorkspaces();
        this.expandedWorkspaces.add(this.workspaceId);
      });
     }else {
      console.warn('⚠️ Esperando restaurar sesión antes de cargar workspaces...');
    }
    });
  }
  isWorkspaceCreator(workspaceIdToCheck: number): boolean {
    const workspace = this.allWorkspaces.find(w => w.id === workspaceIdToCheck);
    return workspace ? workspace.id_usuario === this.currentUserId : false;
  }
  loadAllWorkspaces() {
    this.workspaceService.getWorkspaces().subscribe({
      next: (workspaces) => {
        this.allWorkspaces = workspaces; 
        console.log('Espacios cargados:', workspaces);
      },
      error: (error) => {
        console.error('Error al cargar espacios:', error);
        this.allWorkspaces = []; 
      }
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
  this.workspaceService.getProjectsByWorkspaceId(this.workspaceId).subscribe({
      next: (proyectos) => {
        console.log('Proyectos recibidos:', proyectos); 
        console.log('Primer proyecto:', proyectos[0]); 
        
        this.proyectos = proyectos;
        this.workspaceProjects = proyectos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar proyectos:', error);
        this.proyectos = [];
        this.workspaceProjects = [];
        this.isLoading = false;
      }
    });
  }
getProjectId(proyecto: Proyecto): number {
  return proyecto.id || proyecto.id_proyecto || 0;
}
  selectWorkspace(workspaceId: number) {
    this.router.navigate(['/workspace', workspaceId]);
  }

  toggleWorkspace(workspaceId: number) {
    if (this.expandedWorkspaces.has(workspaceId)) {
      this.expandedWorkspaces.delete(workspaceId);
    } else {
      this.expandedWorkspaces.add(workspaceId);
    }
  }
  openSettings(event: Event, workspaceId: number): void {
  event.stopPropagation();
  event.preventDefault();
  if (!this.isWorkspaceCreator(workspaceId)) {
      alert('Solo el creador del espacio puede acceder a la configuración');
      return;
    }
  this.router.navigate(['/workspace-settings', workspaceId]); 
}
  openCreateWorkspaceDialog(): void {
    if (this.allWorkspaces.length >= this.MAX_WORKSPACES) {
      console.log('Límite de espacios alcanzado');
      this.showLimitAlert = true;
      
      setTimeout(() => {
        this.showLimitAlert = false;
      }, 5000);
      
      return;
    }
    const dialogRef = this.dialog.open(CreateWorkspaceDialogComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.workspaceService.createWorkspace(result).subscribe({
          next: (newWorkspace) => {
            console.log('Espacio creado:', newWorkspace);
            this.loadAllWorkspaces();
            this.router.navigate(['/workspace', newWorkspace.id]);
          },
          error: (error) => {
            console.error('Error:', error);
          }
        });
      }
    });
  }

  createProject(): void {
  const currentUserId = this.authUserService.getCurrentUserId();
  
  if (!currentUserId) {
    alert('Error: Usuario no autenticado');
    return;
  }

  console.log('Abriendo diálogo crear proyecto');
  console.log('ID Usuario:', currentUserId);
  console.log('ID Workspace:', this.workspaceId);
  
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
      console.log('Proyecto creado:', result);
      this.loadProjects();
    }
  });
}

  openProjectBoard(projectId: number | undefined): void {
  console.log('Intentando abrir proyecto:', projectId); 
  
  if (!projectId || projectId <= 0) {
    console.error('ID de proyecto inválido:', projectId);
    return;
  }
  
  const targetRoute = ['/workspace', this.workspaceId, 'projects', projectId, 'board'];
  console.log('Navegando a:', targetRoute); 
  
  this.router.navigate(targetRoute);
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
   toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authUserService.logout(); 
      this.router.navigate(['/login']);
    }
  }
  closeLimitAlert(): void {
    this.showLimitAlert = false;
  }

  goToProfile(): void {
    this.closeUserMenu();
    this.router.navigate(['/profile']);
  }
  
}