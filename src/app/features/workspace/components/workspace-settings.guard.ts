import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { map, catchError, of, switchMap } from 'rxjs';
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
    return of(false); // ← ahora devuelve un observable (correcto para un guard)
  }

  // NUEVO: usar switchMap para encadenar observables
  return userService.currentUser.pipe(
    switchMap(user => {
      if (!user || !user.id_usuario) {
        console.error('Usuario no autenticado');
        router.navigate(['/login']);
        return of(false);
      }

      // En lugar de subscribe, devolvemos el observable para que Angular espere la respuesta
      return workspaceService.getWorkspaceById(workspaceId).pipe(
        map(workspace => {
          if (workspace.id_usuario !== user.id_usuario) {
            console.warn('Usuario no es creador del espacio');
            alert('Solo el creador del espacio puede acceder a la configuración');
            router.navigate(['/workspace', workspaceId]);
            return false;
          }

          
          return true;
        }),
        catchError(error => {
          console.error('Error al validar permisos:', error);
          router.navigate(['/workspace']);
          return of(false);
        })
      );
    }),
    catchError(() => {
      console.error('Error en autenticación');
      router.navigate(['/login']);
      return of(false);
    })
  );
};
