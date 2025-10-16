
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { WorkspaceService } from '../services/workspace.service';
import { UserService } from '../../../core/auth/services/use.service';

export const workspaceSettingsGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const workspaceService = inject(WorkspaceService);
  const userService = inject(UserService);
  const router = inject(Router);
  
  const workspaceId = +route.params['id'];
  
  if (!workspaceId || workspaceId <= 0) {
    console.error('ID de workspace inválido');
    router.navigate(['/workspace']);
    return false;
  }

  return userService.currentUser.pipe(
    map(user => {
      if (!user || !user.id_usuario) {
        console.error('Usuario no autenticado');
        router.navigate(['/login']);
        return false;
      }

      workspaceService.getWorkspaceById(workspaceId).subscribe({
        next: (workspace) => {
          if (workspace.id_usuario !== user.id_usuario) {
            console.warn('Usuario no es creador del espacio');
            alert('Solo el creador del espacio puede acceder a la configuración');
            router.navigate(['/workspace', workspaceId]);
          }
        },
        error: (error) => {
          console.error('Error al validar permisos:', error);
          router.navigate(['/workspace']);
        }
      });

      return true;
    }),
    catchError(() => {
      console.error('Error en autenticación');
      router.navigate(['/login']);
      return of(false);
    })
  );
};
