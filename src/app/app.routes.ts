import { Routes } from '@angular/router';
import { BoardComponent } from './features/board/components/board/board.component';
import { WorkspaceDashboardComponent } from './features/workspace/components/work-dashboard/works-dashboard.component';
import { WorkspaceDetailComponent } from './features/workspace/components/workspace-detail.component/workspace-detail.component';


export const routes: Routes = [
  // ====================
  // RUTA PRINCIPAL
  // ====================
 /* {
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
  },*/
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

