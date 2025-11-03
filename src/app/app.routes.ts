import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { map } from 'rxjs/operators';
import { UserService } from './core/auth/services/use.service';
import { BoardComponent } from './features/board/components/board/board.component';
import { WorkspaceDashboardComponent } from './features/workspace/components/work-dashboard/works-dashboard.component';
import { WorkspaceDetailComponent } from './features/workspace/components/workspace-detail.component/workspace-detail.component';
import { WorkspaceSettingsComponent } from '../app/features/workspace/components/workspace-settings.component';
import { workspaceSettingsGuard } from './features/workspace/components/workspace-settings.guard';
import { AuthGuard } from './core/auth/auth.guard'; 


export const routes: Routes = [
  // ====================
  // RUTA PRINCIPAL
  // ====================
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: "login",
    loadComponent: () => import("./core/auth/auth.component"),
    canActivate: [
      () => inject(UserService).isAuthenticated.pipe(map(isAuth => !isAuth))
    ],
  },
  {
    path: "register",
    loadComponent: () => import("./core/auth/auth.component"),
    canActivate: [
      () => inject(UserService).isAuthenticated.pipe(map(isAuth => !isAuth))
    ],
  },
  {
  path: 'forgot-password',
  loadComponent: () => import('./core/password.component')
    .then(m => m.ForgotPasswordComponent)
}
,

  // ====================
  // WORKSPACES (ESPACIOS)
  // ====================
  
  // Dashboard de workspaces - Lista todos los espacios
  {
    path: 'workspace',
    component: WorkspaceDashboardComponent,
    title: 'Espacios de Trabajo',
    canActivate: [AuthGuard] //NUEVO: Protegida con AuthGuard

  },
    {
    path: 'workspace-settings/:id',
    component: WorkspaceSettingsComponent,
     canActivate: [AuthGuard,workspaceSettingsGuard]
  },

  // Detalle de un workspace específico
  {
    path: 'workspace/:id',
    component: WorkspaceDetailComponent,
    title: 'Detalle del Espacio',
    canActivate: [AuthGuard]
  },

  // ====================
  // PROYECTOS
  // ====================
  
  // Lista de proyectos (puede ser global o filtrada)
  {
    path: 'projects',
    loadComponent: () => import('./features/project/components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    title: 'Proyectos',
    canActivate: [AuthGuard]
  },

  // Crear nuevo proyecto - CORREGIDO
  {
    path: 'projects/create',
    loadComponent: () => import('./features/project/components/create-project/create-project.component')
      .then(m => m.CreateProjectDialogComponent),
    title: 'Crear Proyecto',
    canActivate: [AuthGuard]
  },

  // Proyecto específico con su tablero
  {
    path: 'projects/:projectId',
    loadComponent: () => import('./features/project/components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    title: 'Detalle del Proyecto',
    canActivate: [AuthGuard]
  },

  // Board del proyecto
  {
    path: 'projects/:projectId/board',
    component: BoardComponent,
    title: 'Tablero del Proyecto',
    canActivate: [AuthGuard]
  },

  // ====================
  // PROYECTOS DENTRO DE WORKSPACES
  // ====================
  
  // Lista de proyectos de un workspace específico
  {
    path: 'workspace/:workspaceId/projects',
    loadComponent: () => import('./features/project/components/project-list/project-list.component')
      .then(m => m.ProjectListComponent),
    title: 'Proyectos del Espacio',
    canActivate: [AuthGuard]
  },

  // Board de un proyecto dentro de un workspace
  {
    path: 'workspace/:workspaceId/projects/:projectId/board',
    component: BoardComponent,
    title: 'Tablero',
    canActivate: [AuthGuard]
  },

  // ====================
  // BOARD (Acceso directo)
  // ====================
  
  // Board sin contexto específico
  {
    path: 'board',
    component: BoardComponent,
    title: 'Tablero Kanban',
    canActivate: [AuthGuard]
  },

  // Board con ID específico
  {
    path: 'board/:id',
    component: BoardComponent,
    title: 'Tablero',
    canActivate: [AuthGuard]
  },

  // ====================
  // WILDCARD (Siempre al final)
  // ====================
  {
    path: '**',
    redirectTo: 'workspace'
  }
];