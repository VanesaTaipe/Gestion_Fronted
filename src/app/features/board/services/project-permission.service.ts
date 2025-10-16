import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface ProjectMember {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  es_creador?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProjectPermissionService {
  private api = environment.apiBase;
  private currentUserRole: 'lider' | 'miembro' | null = null;

  constructor(private http: HttpClient) {}

  getUserRoleInProject(projectId: number, userId: number): Observable<'lider' | 'miembro' | null> {
  return this.http.get<any>(`${this.api}/proyectos/${projectId}/miembros`).pipe(
    map((res: any) => {
      console.log('📥 Respuesta miembros:', res);
      
      const miembros = res?.miembros || res?.data || [];
      const miembro = miembros.find((m: any) => m.id_usuario === userId);
      
      console.log('👤 Usuario actual encontrado:', miembro);
      
      if (!miembro) {
        console.warn('⚠️ Usuario no encontrado en el proyecto');
        return null;
      }
      
      // ✅ Normalizar el rol (quitar tildes y convertir a minúsculas)
      const rolBackend = (miembro.rol || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Elimina tildes
      
      console.log('🔍 Rol normalizado:', rolBackend);
      
      let rolAsignado: 'lider' | 'miembro' | null = null;
      
      // ✅ Verificar si es líder por rol o por ser creador
      if (rolBackend === 'creador' || 
          rolBackend === 'lider' ||   // Sin tilde
          rolBackend === 'admin' ||
          miembro.es_creador === true) {
        rolAsignado = 'lider';
      } else if (rolBackend === 'miembro' || rolBackend === 'member') {
        rolAsignado = 'miembro';
      } else {
        // Por defecto, si tiene algún rol en el proyecto, es miembro
        rolAsignado = 'miembro';
      }
      
      this.currentUserRole = rolAsignado;
      console.log('✅ Rol final asignado:', this.currentUserRole);
      
      return this.currentUserRole;
    }),
    catchError((error) => {
      console.error('❌ Error obteniendo rol:', error);
      return of(null);
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
}