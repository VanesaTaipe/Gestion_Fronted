import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { InviteMemberDialogComponent } from '../../../../project/components/invite-member-dialog/inivite-member-dialog.component';
import { UserService as ProfileUserService } from '../../../../profile/services/user.service';
import { User } from '../../../../profile/models/user.interface';
import { ProjectPermissionService } from '../../../services/project-permission.service';
import { Router } from '@angular/router';

interface ProjectMember {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  id_rol?: number;
  es_creador?: boolean;
}

interface MiembroPendiente {
  user: User;
  username: string;
  email: string;
  rol_temporal: number;
  showRoleSelector?: boolean;
}

@Component({
  selector: 'app-board-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './board-settings.component.html',
  styleUrls: ['./board-settings.component.css']
})
export class BoardSettingsComponent implements OnInit {
  @Input() proyectoId!: number;
  @Input() projectName: string = '';
  @Input() workspaceId?: number;
  @Input() isLeader: boolean = false;
  @Input() currentUserId: number = 0;
  
  @Output() projectDeleted = new EventEmitter<void>();
  @Output() projectLeft = new EventEmitter<void>();
  @Output() roleChanged = new EventEmitter<number>(); 
  @Output() memberDeleted = new EventEmitter<number>(); 
  projectMembers: ProjectMember[] = [];
  projectForm: FormGroup;
  editingProject = false;
  updatingProject = false;
  projectDescription = '';

  isSearchingUsers = false;
  filteredUsers$: Observable<User[]>;
  showLeaveModal = false;
  showPromoteModal = false;
  requiresNewLeader = false;
  availableMembersForPromotion: ProjectMember[] = [];
  selectedNewLeader: number | null = null;
  miembrosPendientes: MiembroPendiente[] = [];

  private api = environment.apiBase;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private profileUserService: ProfileUserService,
    private router: Router,
    private permissionService: ProjectPermissionService
  ) {
    this.projectForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      searchUser: [''] 
    });

    this.filteredUsers$ = this.projectForm.get('searchUser')!.valueChanges.pipe(
      startWith(''),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((query: string | User) => {
        if (typeof query !== 'string') return of([]);

        const searchTerm = query?.trim() || '';
        if (searchTerm.length < 3) {
          console.log('Búsqueda detenida: mínimo 3 caracteres');
          return of([]);
        }

        console.log('Buscando usuarios con:', searchTerm);
        this.isSearchingUsers = true;

        return this.profileUserService.searchUsers(searchTerm).pipe(
          map((users: User[]) => {
            console.log('Usuarios recibidos en componente:', users);
            
            const availableUsers = users.filter((user: User) =>
              !this.projectMembers.some(member => member.id_usuario === user.id_usuario)
            );

            console.log('Usuarios disponibles (no son miembros):', availableUsers.length);

    
            const sortedUsers = availableUsers.sort((a: User, b: User) => {
              const nameA = (a.username || '').toLowerCase();
              const nameB = (b.username || '').toLowerCase();
              return nameA.localeCompare(nameB);
            });

            this.isSearchingUsers = false;
            return sortedUsers;
          }),
          catchError(err => {
            console.error('Error en búsqueda:', err);
            this.isSearchingUsers = false;
            return of([]);
          })
        );
      })
    );
  }

  ngOnInit() {
    this.loadProjectMembers();
    this.loadProjectInfo();
  }

  displayUser(user: User | null): string { return ''; }

  getUserInitials(user: User): string {
    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  }

  addMemberFromSearch(user: User): void {
    if (this.projectMembers.length >= 30) {
    alert('Límite de 30 integrantes alcanzado');
    return;
  }
    const username = user.username || user.email || 'Usuario';
    const email = user.email || 'Sin email';

    if (this.projectMembers.some(m => m.id_usuario === user.id_usuario)) {
      alert(`${username} ya es miembro del proyecto`);
      return;
    }

    if (this.miembrosPendientes.some(m => m.user.id_usuario === user.id_usuario)) {
      alert(`${username} ya está en la lista pendiente`);
      return;
    }

    this.miembrosPendientes.push({
      user: user,
      username: username,
      email: email,
      rol_temporal: 2,
      showRoleSelector: true
    });

    this.projectForm.get('searchUser')?.setValue('');
  }

  confirmarMiembro(miembro: MiembroPendiente): void {
    if (this.projectMembers.length >= 30) {
    alert('Límite de 30 integrantes alcanzado');
    return;
  }
    const nuevoMiembro = {
      id_usuario: miembro.user.id_usuario,
      id_rol: miembro.rol_temporal
    };

    this.http.post(`${this.api}/proyectos/${this.proyectoId}/miembros`, nuevoMiembro).subscribe({
      next: () => {
        const roleName = miembro.rol_temporal === 2 ? 'Miembro' : 'Líder';
        alert(`✓ ${miembro.username} agregado como ${roleName}`);
        this.miembrosPendientes = this.miembrosPendientes.filter(m => m.user.id_usuario !== miembro.user.id_usuario);
        this.loadProjectMembers();
      },
      error: (e) => {
        console.error('Error agregando miembro:', e);
        alert(e.status === 409 ? 'Este usuario ya es miembro del proyecto' : 'Error al agregar el miembro');
      }
    });
  }

  cancelarMiembro(miembro: MiembroPendiente): void {
    this.miembrosPendientes = this.miembrosPendientes.filter(m => m.user.id_usuario !== miembro.user.id_usuario);
  }

  loadProjectInfo() {
    this.http.get(`${this.api}/proyectos/${this.proyectoId}`).subscribe({
      next: (res: any) => {
        const proyecto = res?.proyecto || res;
        this.projectForm.patchValue({
          nombre: proyecto.nombre || this.projectName,
          descripcion: proyecto.descripcion || ''
        });
        this.projectDescription = proyecto.descripcion || '';
      },
      error: (e) => console.error('Error cargando info del proyecto:', e)
    });
  }

  loadProjectMembers() {
    this.http.get(`${this.api}/proyectos/${this.proyectoId}/miembros`).subscribe({
      next: (res: any) => {
        this.projectMembers = res?.miembros || res?.data || [];
      },
      error: (e) => {
        console.error('Error cargando miembros:', e);
        this.projectMembers = [];
      }
    });
  }

  getRolId(rolName: string): number {
    const rolNormalizado = rolName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return (rolNormalizado === 'creador' || rolNormalizado === 'lider' || rolNormalizado === 'admin') ? 1 : 2;
  }

  hasMultipleLeaders(): boolean {
    const leaders = this.projectMembers.filter(m => this.getRolId(m.rol) === 1);
    return leaders.length > 1;
  }

  toggleMemberRole(member: ProjectMember): void {
  // 1. Validar que solo líderes pueden cambiar roles
  if (!this.isLeader) {
    alert('Solo los líderes pueden cambiar roles de miembros');
    return;
  }

  if (member.es_creador && !this.hasMultipleLeaders()) {
    alert('No puedes cambiar tu rol porque eres el único líder del proyecto');
    return;
  }

  const currentRoleId = this.getRolId(member.rol);
  const isCreador = this.projectMembers.find(m => m.es_creador)?.id_usuario === this.currentUserId;
  
  
  if (currentRoleId === 1 && !isCreador) {
    alert('Solo el líder creador puede cambiar el rol de otro líder');
    return;
  }

 
  if (member.es_creador && member.id_usuario !== this.currentUserId) {
    alert('No puedes cambiar el rol del líder creador del proyecto');
    return;
  }

  const newRoleId = currentRoleId === 1 ? 2 : 1;
  const newRoleName = newRoleId === 1 ? 'Líder' : 'Miembro';

  if (!confirm(`¿Cambiar el rol de ${member.nombre} a ${newRoleName}?`)) return;

  this.http.put(`${this.api}/proyectos/${this.proyectoId}/miembros/${member.id_usuario}/rol`, {
    id_rol: newRoleId
  }).subscribe({
    next: () => {
      member.rol = newRoleName;
      alert(`Rol actualizado a ${newRoleName}`);
      this.loadProjectMembers();
    },
    error: (e) => {
      console.error('Error cambiando rol:', e);
      alert('Error al cambiar el rol');
    }
  });
  
  if (member.id_usuario === this.currentUserId) {
    this.roleChanged.emit(newRoleId); 
  }
}

  removeMember(member: ProjectMember) {
    // Validar que solo líderes pueden eliminar miembros
    if (!this.isLeader) {
      alert('Solo los líderes pueden eliminar miembros del proyecto');
      return;
    }

    // Validar que no se puede eliminar al creador
    if (member.es_creador) {
      alert('No se puede eliminar al creador del proyecto');
      return;
    }

    if (!confirm(`¿Eliminar a ${member.nombre} del proyecto?`)) return;
    const usuarioId = member.id_usuario;
    this.http.delete(`${this.api}/proyectos/${this.proyectoId}/miembros/${member.id_usuario}`).subscribe({
      next: () => {
        this.projectMembers = this.projectMembers.filter(m => m.id_usuario !== member.id_usuario);
        alert('Miembro eliminado del proyecto');
        // 1. Actualizar lista de miembros
      this.projectMembers = this.projectMembers.filter(m => m.id_usuario !== usuarioId);
      
      // 2. Desasignar tareas del usuario eliminado
      this.desasignarTareasDelUsuario(usuarioId, member.nombre);
    
      },
      error: (e) => {
        console.error('Error eliminando miembro:', e);
        alert('Error al eliminar el miembro');
      }
    });
  }
  private desasignarTareasDelUsuario(usuarioId: number, nombreUsuario: string) {
  console.log(`Buscando tareas asignadas a ${nombreUsuario} (ID: ${usuarioId})`);
  
  // Obtener resumen de tareas del proyecto
  this.http.get(`${this.api}/proyectos/${this.proyectoId}/tareas/resumen`).subscribe({
    next: (resumen: any) => {
      const tareasAActualizar: number[] = [];
      
      // Buscar tareas asignadas al usuario eliminado
      resumen.forEach((columna: any) => {
        columna.tareas?.forEach((tarea: any) => {
          if (tarea.id_asignado === usuarioId) {
            tareasAActualizar.push(tarea.id_tarea);
          }
        });
      });
      
      console.log(`Encontradas ${tareasAActualizar.length} tarea(s) asignadas a ${nombreUsuario}`);
      
      if (tareasAActualizar.length === 0) {
        alert(`${nombreUsuario} eliminado del proyecto.`);
        return;
      }
      
      // Desasignar cada tarea una por una
      let tareasActualizadas = 0;
      tareasAActualizar.forEach(tareaId => {
        this.http.put(`${this.api}/tareas/${tareaId}`, { id_asignado: null }).subscribe({
          next: () => {
            tareasActualizadas++;
            console.log(`Tarea ${tareaId} desasignada (${tareasActualizadas}/${tareasAActualizar.length})`);
            
            // Cuando todas estén actualizadas, mostrar mensaje
            if (tareasActualizadas === tareasAActualizar.length) {
              alert(
                `${nombreUsuario} eliminado del proyecto.\n` +
                `${tareasActualizadas} tarea(s) marcada(s) como "Sin asignar".`
              );
            this.memberDeleted.emit(usuarioId);
            }
          },
          error: (e) => {
            console.error(`Error desasignando tarea ${tareaId}:`, e);
          }
        });
      });
    },
    error: (e) => {
      console.error(' Error obteniendo tareas:', e);
      alert(`${nombreUsuario} eliminado, pero hubo un error al actualizar las tareas.`);
    }
  });
}

  openInviteDialog() {
    if (this.projectMembers.length >= 30) {
    alert('Límite de 30 integrantes alcanzado');
    return;
  }
    const dialogRef = this.dialog.open(InviteMemberDialogComponent, {
      width: '550px',
      data: { projectId: this.proyectoId, projectName: this.projectName }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.user) {
        const nuevoMiembro = {
          id_usuario: result.user.id_usuario,
          id_rol: result.rol === 'lider' ? 1 : 2
        };

        this.http.post(`${this.api}/proyectos/${this.proyectoId}/miembros`, nuevoMiembro).subscribe({
          next: () => {
            alert('Miembro agregado exitosamente');
            this.loadProjectMembers();
          },
          error: (e) => {
            console.error('Error agregando miembro:', e);
            alert(e.status === 409 ? 'Este usuario ya es miembro del proyecto' : 'Error al agregar el miembro');
          }
        });
      }
    });
  }

  updateProject() {
    if (this.projectForm.invalid) return;

    this.updatingProject = true;
    const data = {
      proyecto: {
      nombre: this.projectForm.value.nombre,
      descripcion: this.projectForm.value.descripcion
    }
    };

    this.http.put(`${this.api}/proyectos/${this.proyectoId}`, data).subscribe({
      next: (response:any) => {
      const proyecto = response.proyecto?.data || response.proyecto;
      this.projectName = proyecto.nombre;
      this.projectDescription = proyecto.descripcion;
        this.editingProject = false;
        this.updatingProject = false;
        alert('Proyecto actualizado');
      },
      error: (e) => {
        console.error('Error actualizando proyecto:', e);
        alert('Error al actualizar el proyecto');
        this.updatingProject = false;
      }
    });
  }

  cancelEditProject() {
    this.editingProject = false;
    this.loadProjectInfo();
  }

  deleteProject() {
    const confirmation = confirm(
      `¿ELIMINAR "${this.projectName}"?\n\n` +
      `Se eliminará:\n• Todas las columnas\n• Todas las tarjetas\n• Todos los comentarios\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmation) return;

    const confirmText = prompt('Escribe "ELIMINAR" para confirmar:');
    if (confirmText !== 'ELIMINAR') {
      alert('Cancelado');
      return;
    }

    this.http.delete(`${this.api}/proyectos/${this.proyectoId}`).subscribe({
      next: () => {
        alert('Proyecto eliminado');
        this.projectDeleted.emit();
      },
      error: (e) => {
        console.error('Error:', e);
        alert('Error al eliminar el proyecto');
      }
    });
  }

  openLeaveModal() {
    if (this.isLeader) {
      this.permissionService.canLeaderLeave(this.proyectoId, this.currentUserId).subscribe({
        next: (result) => {
          if (!result.success) {
            if (result.requiresNewLeader && result.availableMembers) {
              this.requiresNewLeader = true;
              this.availableMembersForPromotion = result.availableMembers;
              this.showPromoteModal = true;
            } else {
              alert(result.message);
            }
          } else {
            this.requiresNewLeader = false;
            this.showLeaveModal = true;
          }
        },
        error: (err) => {
          console.error('[BoardSettings] Error validando salida:', err);
          alert('Error al validar la salida del proyecto');
        }
      });
    } else {
      this.requiresNewLeader = false;
      this.showLeaveModal = true;
    }
  }

  confirmLeaveProject() {
    if (!confirm('¿Estás seguro de que deseas salir de este proyecto?')) return;

    this.permissionService.leaveProject(this.proyectoId, this.currentUserId).subscribe({
      next: () => {
        alert('Has salido del proyecto exitosamente');
        this.showLeaveModal = false;
        this.projectLeft.emit();
        this.router.navigate(['/workspace', this.workspaceId]);
      },
      error: (err) => {
        console.error('[BoardSettings] Error saliendo del proyecto:', err);
        alert('Error al salir del proyecto: ' + (err?.error?.error || 'Error desconocido'));
      }
    });
  }

  promoteAndLeave() {
    if (!this.selectedNewLeader) {
      alert('Debes seleccionar un nuevo líder');
      return;
    }

    const newLeader = this.availableMembersForPromotion.find(m => m.id_usuario === this.selectedNewLeader);
    
    if (!confirm(`¿Asignar a ${newLeader?.nombre} como nuevo líder y salir del proyecto?`)) return;

    this.permissionService.promoteToLeader(this.proyectoId, this.selectedNewLeader).subscribe({
      next: () => {
        this.permissionService.leaveProject(this.proyectoId, this.currentUserId).subscribe({
          next: () => {
            alert(`${newLeader?.nombre} es ahora el líder. Has salido exitosamente.`);
            this.showPromoteModal = false;
            this.projectLeft.emit();
            this.router.navigate(['/workspace', this.workspaceId]);
          },
          error: (err) => {
            console.error('[BoardSettings] Error saliendo:', err);
            alert('El nuevo líder fue asignado, pero hubo un error al salir.');
          }
        });
      },
      error: (err) => {
        console.error('[BoardSettings] Error promoviendo:', err);
        alert('Error al asignar nuevo líder: ' + (err?.error?.error || 'Error desconocido'));
      }
    });
  }

  closeLeaveModal() { this.showLeaveModal = false; }
  closePromoteModal() { 
    this.showPromoteModal = false;
    this.selectedNewLeader = null;
  }
}