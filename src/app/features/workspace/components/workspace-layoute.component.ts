import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Espacio } from '../../workspace/models/espacio.interface';
import { WorkspaceService } from '../../workspace/services/workspace.service';



@Component({
  selector: 'app-workspace-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="flex h-screen bg-gray-50">
      <!-- Sidebar -->
      <aside class="w-64 bg-white border-r flex flex-col">
        <!-- Logo -->
        <div class="p-6 border-b">
          <img src="assets/kanban-logo.png" alt="Logo" class="w-16 h-16 mx-auto">
        </div>

        <!-- Workspaces List -->
        <div class="flex-1 overflow-y-auto p-4">
          <h2 class="text-sm font-semibold text-gray-500 uppercase mb-3">
            MIS ESPACIOS
          </h2>

          <div class="space-y-2">
            <div
              *ngFor="let espacio of espacios"
              [class.bg-gray-100]="selectedWorkspace?.id === espacio.id"
              class="group cursor-pointer rounded-lg p-3 hover:bg-gray-100 transition">
              
              <div class="flex items-center justify-between mb-2">
                <div 
                  class="flex items-center gap-2 flex-1"
                  (click)="selectWorkspace(espacio)">
                  <span class="font-medium text-gray-800">
                    {{ espacio.nombre }}
                  </span>
                  <button 
                    (click)="toggleWorkspace(espacio.id); $event.stopPropagation()"
                    class="text-gray-400">
                    <svg 
                      class="w-4 h-4 transition-transform"
                      [class.rotate-180]="expandedWorkspaces.has(espacio.id)"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Submenu -->
              <div 
                *ngIf="expandedWorkspaces.has(espacio.id)"
                class="ml-4 mt-2 space-y-1 text-sm">
                <div 
                  (click)="viewProjects(espacio.id)"
                  class="flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                  </svg>
                  Proyectos
                </div>

                <div (click)="openSettings($event)"
                class="flex items-center gap-2 p-2 rounded hover:bg-gray-200 cursor-pointer">
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

        <!-- Crear Espacio Button -->
        <div class="p-4 border-t">
          <button
            (click)="createWorkspace()"
            class="w-full bg-[#40E0D0] hover:bg-[#38c9b8] text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition">
            <span class="text-xl">+</span>
            Crear espacio
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .rotate-180 {
      transform: rotate(180deg);
    }
  `]
})
export class WorkspaceLayoutComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);

  espacios: Espacio[] = [];
  selectedWorkspace: Espacio | null = null;
  expandedWorkspaces = new Set<number>();

  ngOnInit() {
      this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.workspaceService.getWorkspaces().subscribe({
      next: (espacios) => {
        this.espacios = espacios;
      },
      error: (error) => console.error('Error:', error)
    });
  }

  selectWorkspace(espacio: Espacio) {
    this.selectedWorkspace = espacio;
    this.router.navigate(['/workspace', espacio.id]);
  }

  toggleWorkspace(id: number) {
    if (this.expandedWorkspaces.has(id)) {
      this.expandedWorkspaces.delete(id);
    } else {
      this.expandedWorkspaces.add(id);
    }
  }

  viewProjects(workspaceId: number) {
    this.router.navigate(['/workspace', workspaceId]);
  }

  createWorkspace() {
    this.router.navigate(['/workspace/create']);
  }
  openSettings(event: Event): void {
  event.stopPropagation();
  event.preventDefault();
  this.router.navigate(['/workspace-settings', 1]);
}
  
}