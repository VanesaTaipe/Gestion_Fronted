// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { BoardComponent } from './features/board/components/board/board.component';
import { WorkspaceDashboardComponent } from './features/workspace/components/work-dashboard/works-dashboard.component';
import { WorkspaceDetailComponent } from './features/workspace/components/workspace-detail.component/workspace-detail.component';

export const routes: Routes = [
  // ====================
  // RUTA PRINCIPAL
  // ====================
  {
    path: '',
    redirectTo: 'user-select',
    pathMatch: 'full'
  },

  // ====================
  // SELECCIÓN DE USUARIO
  // ====================
  {
    path: 'user-select',
    loadComponent: () => import('./features/profile/components/user-selector.component')
      .then(m => m.UserSelectorComponent),
    title: 'Seleccionar Usuario'
  },

  // ====================
  // WORKSPACES (ESPACIOS)
  // ====================
  
  // Dashboard de workspaces - Lista todos los espacios
  {
    path: 'workspace',
    component: WorkspaceDashboardComponent,
    title: 'Espacios de Trabajo'
  },

  // Detalle de un workspace específico
  {
    path: 'workspace/:id',
    component: WorkspaceDetailComponent,
    title: 'Detalle del Espacio'
  },

  // ====================
  // PROYECTOS
  // ====================
  
  // Lista de proyectos (puede ser global o filtrada)
  {
    path: 'projects',
    loadComponent: () => import('./features/project/components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    title: 'Proyectos'
  },

  // Crear nuevo proyecto - CORREGIDO
  {
    path: 'projects/create',
    loadComponent: () => import('./features/project/components/create-project/create-project.component')
      .then(m => m.CreateProjectDialogComponent),
    title: 'Crear Proyecto'
  },

  // Proyecto específico con su tablero
  {
    path: 'projects/:projectId',
    loadComponent: () => import('./features/project/components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    title: 'Detalle del Proyecto'
  },

  // Board del proyecto
  {
    path: 'projects/:projectId/board',
    component: BoardComponent,
    title: 'Tablero del Proyecto'
  },

  // ====================
  // PROYECTOS DENTRO DE WORKSPACES
  // ====================
  
  // Lista de proyectos de un workspace específico
  {
    path: 'workspace/:workspaceId/projects',
    loadComponent: () => import('./features/project/components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    title: 'Proyectos del Espacio'
  },

  // Board de un proyecto dentro de un workspace
  {
    path: 'workspace/:workspaceId/projects/:projectId/board',
    component: BoardComponent,
    title: 'Tablero'
  },

  // ====================
  // BOARD (Acceso directo)
  // ====================
  
  // Board sin contexto específico
  {
    path: 'board',
    component: BoardComponent,
    title: 'Tablero Kanban'
  },

  // Board con ID específico
  {
    path: 'board/:id',
    component: BoardComponent,
    title: 'Tablero'
  },

  // ====================
  // WILDCARD (Siempre al final)
  // ====================
  {
    path: '**',
    redirectTo: 'workspace'
  }
];

// ====================
// FLUJO DE NAVEGACIÓN RECOMENDADO
// ====================
/*
Opción 1 - Con Workspace:
1. /user-select → Seleccionar usuario
2. /workspace → Ver todos los espacios
3. /workspace/123 → Detalle del espacio 123
4. /workspace/123/projects → Proyectos del espacio 123
5. /workspace/123/projects/456/board → Board del proyecto 456

Opción 2 - Sin Workspace (acceso directo):
1. /user-select → Seleccionar usuario
2. /projects → Ver todos los proyectos
3. /projects/456 → Detalle del proyecto 456
4. /projects/456/board → Board del proyecto 456

Opción 3 - Acceso directo al board:
1. /board → Tablero genérico
2. /board/789 → Tablero específico
*/