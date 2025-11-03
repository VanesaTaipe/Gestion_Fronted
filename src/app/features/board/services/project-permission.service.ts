import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ProjectMember {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  id_rol?: number;
  es_creador?: boolean;
}

interface LeaveProjectResult {
  success: boolean;
  message: string;
  requiresNewLeader?: boolean;
  availableMembers?: ProjectMember[];
}


@Injectable({ providedIn: 'root' })
export class ProjectPermissionService {
  private api = environment.apiBase;
  private currentUserRole: 'lider' | 'miembro' | null = null;
  private normalizeRole(rol: string): 'lider' | 'miembro' {
  if (!rol) return 'miembro';
  
  const rolLower = rol.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Roles que se consideran "líder"
  if (rolLower === 'creador' || rolLower === 'lider') {
    return 'lider';
  }
  
  // Todo lo demás es "miembro"
  return 'miembro';
}
  constructor(private http: HttpClient) {}

  getUserRoleInProject(projectId: number, userId: number): Observable<'lider' | 'miembro' | null> {
  return this.http.get<any>(`${this.api}/proyectos/${projectId}/miembros`).pipe(
    map((res: any) => {
      console.log('[ProjectPermission] Respuesta miembros:', res);
      
      const miembros = res?.miembros || res?.data || [];
      const usuario = miembros.find((m: any) => m.id_usuario === userId);
      
      console.log('[ProjectPermission] Usuario actual encontrado:', usuario);
      
      if (!usuario) {
        this.currentUserRole = null;  // ✅ CORREGIDO
        return null;
      }
      
      const rolNormalizado = this.normalizeRole(usuario.rol);
      console.log('[ProjectPermission] Rol normalizado:', rolNormalizado);
      
      this.currentUserRole = rolNormalizado;  // ✅ CORREGIDO
      console.log('[ProjectPermission] Rol final asignado:', this.currentUserRole);  // ✅ CORREGIDO
      
      return this.currentUserRole;  // ✅ CORREGIDO
    })
  );
}

  isLeader(): boolean {
    return this.currentUserRole === 'lider';
  }

  isMember(): boolean {
    return this.currentUserRole === 'miembro';
  }

  canManageColumns(): boolean {
    return this.isLeader();
  }

  getCurrentRole(): 'lider' | 'miembro' | null {
    return this.currentUserRole;
  }

  clearRole(): void {
    this.currentUserRole = null;
  }

  // ========================================
  // ✅ NUEVAS FUNCIONALIDADES AGREGADAS
  // ========================================

  /**
   * Obtener todos los miembros del proyecto
   */
  getProjectMembers(projectId: number): Observable<ProjectMember[]> {
    return this.http.get<any>(`${this.api}/proyectos/${projectId}/miembros`).pipe(
      map(res => {
        const members = res?.miembros || res?.data || [];
        console.log('[ProjectPermission] Miembros obtenidos:', members.length);
        return members;
      }),
      catchError(err => {
        console.error('[ProjectPermission] Error obteniendo miembros:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Verificar si hay otros líderes en el proyecto
   */
  hasOtherLeaders(projectId: number, currentUserId: number): Observable<boolean> {
    return this.getProjectMembers(projectId).pipe(
      map(members => {
        const otherLeaders = members.filter(m => {
          if (m.id_usuario === currentUserId) return false;
          
          const rolNormalizado = (m.rol || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          return (
            rolNormalizado === 'creador' ||
            rolNormalizado === 'lider' ||
            rolNormalizado === 'admin' ||
            m.es_creador === true ||
            m.id_rol === 1
          );
        });
        
        console.log('[ProjectPermission] Otros líderes encontrados:', otherLeaders.length);
        return otherLeaders.length > 0;
      })
    );
  }

  /**
   * Obtener miembros disponibles para ser promovidos a líder
   */
  getAvailableMembersForPromotion(projectId: number, currentUserId: number): Observable<ProjectMember[]> {
    return this.getProjectMembers(projectId).pipe(
      map(members => {
        const available = members.filter(m => {
          if (m.id_usuario === currentUserId) return false;
          
          const rolNormalizado = (m.rol || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          return (
            rolNormalizado === 'miembro' ||
            rolNormalizado === 'member' ||
            m.id_rol === 2
          );
        });
        
        console.log('[ProjectPermission] Miembros disponibles para promoción:', available.length);
        return available;
      })
    );
  }

  /**
   * Validar si un líder puede salir del proyecto
   */
  canLeaderLeave(projectId: number, currentUserId: number): Observable<LeaveProjectResult> {
    return this.getProjectMembers(projectId).pipe(
      map(members => {
        // Verificar si hay otros líderes
        const otherLeaders = members.filter(m => {
          if (m.id_usuario === currentUserId) return false;
          
          const rolNormalizado = (m.rol || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          return (
            rolNormalizado === 'creador' ||
            rolNormalizado === 'lider' ||
            rolNormalizado === 'admin' ||
            m.es_creador === true ||
            m.id_rol === 1
          );
        });

        if (otherLeaders.length > 0) {
          // Hay otros líderes, puede salir directamente
          console.log('[ProjectPermission] ✅ Puede salir - hay otros líderes');
          return {
            success: true,
            message: 'Puede salir del proyecto. Hay otros líderes.',
            requiresNewLeader: false
          };
        }

        // No hay otros líderes, verificar si hay miembros disponibles
        const availableMembers = members.filter(m => {
          if (m.id_usuario === currentUserId) return false;
          
          const rolNormalizado = (m.rol || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          
          return (
            rolNormalizado === 'miembro' ||
            rolNormalizado === 'member' ||
            m.id_rol === 2
          );
        });

        if (availableMembers.length === 0) {
          // Es el único miembro, no puede salir
          console.log('[ProjectPermission] ❌ No puede salir - es el único miembro');
          return {
            success: false,
            message: 'No puedes salir del proyecto porque eres el único miembro. Debes eliminar el proyecto o agregar otros miembros primero.',
            requiresNewLeader: false
          };
        }

        // Hay miembros disponibles, debe asignar un nuevo líder
        console.log('[ProjectPermission] ⚠️ Debe asignar nuevo líder');
        return {
          success: false,
          message: 'Debes asignar un nuevo líder antes de salir del proyecto.',
          requiresNewLeader: true,
          availableMembers: availableMembers
        };
      }),
      catchError(err => {
        console.error('[ProjectPermission] Error validando salida de líder:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Promover miembro a líder
   */
  promoteToLeader(projectId: number, userId: number): Observable<any> {
    const body = {
      id_usuario: userId,
      id_rol: 1 // 1 = Líder
    };

    console.log('[ProjectPermission] 📤 Promoviendo a líder:', body);

    return this.http.put(
      `${this.api}/proyectos/${projectId}/miembros/${userId}/rol`,
      body,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    ).pipe(
      tap(() => {
        console.log('[ProjectPermission] ✅ Usuario promovido a líder');
      }),
      catchError(err => {
        console.error('[ProjectPermission] ❌ Error promoviendo a líder:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Salir del proyecto
   */
  leaveProject(projectId: number, userId: number): Observable<any> {
    console.log('[ProjectPermission] 📤 Saliendo del proyecto:', { projectId, userId });

    return this.http.delete(
      `${this.api}/proyectos/${projectId}/miembros/${userId}`,
      {
        headers: { 'Accept': 'application/json' }
      }
    ).pipe(
      tap(() => {
        console.log('[ProjectPermission] ✅ Usuario salió del proyecto');
        this.clearRole(); // Limpiar rol al salir
      }),
      catchError(err => {
        console.error('[ProjectPermission] ❌ Error saliendo del proyecto:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Actualizar información del proyecto (solo líder)
   */
  updateProjectInfo(projectId: number, data: { nombre?: string; descripcion?: string }): Observable<any> {
    const body: any = {};
    
    if (data.nombre !== undefined) {
      body.nombre = data.nombre;
    }
    if (data.descripcion !== undefined) {
      body.descripcion = data.descripcion;
    }

    console.log('[ProjectPermission] 📤 Actualizando proyecto:', body);

    return this.http.put(
      `${this.api}/proyectos/${projectId}`,
      body,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    ).pipe(
      tap(() => {
        console.log('[ProjectPermission] ✅ Proyecto actualizado');
      }),
      catchError(err => {
        console.error('[ProjectPermission] ❌ Error actualizando proyecto:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Remover miembro del proyecto (solo líder)
   */
  removeMember(projectId: number, userId: number): Observable<any> {
    console.log('[ProjectPermission] 📤 Removiendo miembro:', userId);

    return this.http.delete(
      `${this.api}/proyectos/${projectId}/miembros/${userId}`,
      {
        headers: { 'Accept': 'application/json' }
      }
    ).pipe(
      tap(() => {
        console.log('[ProjectPermission] ✅ Miembro removido');
      }),
      catchError(err => {
        console.error('[ProjectPermission] ❌ Error removiendo miembro:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * Cambiar rol de un miembro (solo líder)
   */
  changeMemberRole(projectId: number, userId: number, newRoleId: number): Observable<any> {
    const body = {
      id_usuario: userId,
      id_rol: newRoleId // 1 = Líder, 2 = Miembro
    };

    console.log('[ProjectPermission] 📤 Cambiando rol:', body);

    return this.http.put(
      `${this.api}/proyectos/${projectId}/miembros/${userId}/rol`,
      body,
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    ).pipe(
      tap(() => {
        console.log('[ProjectPermission] ✅ Rol cambiado');
      }),
      catchError(err => {
        console.error('[ProjectPermission] ❌ Error cambiando rol:', err);
        return throwError(() => err);
      })
    );
  }
}