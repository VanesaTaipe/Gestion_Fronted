import { CommonModule } from '@angular/common';
import { HttpClient} from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { UserService } from '../../../../profile/services/user.service';
import { User } from '../../../../profile/models/user.interface';


interface ProjectMember {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: string;
  es_creador?: boolean;
}

@Component({
  selector: 'app-board-settings',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="max-w-5xl mx-auto">
      <h2 class="text-2xl font-bold text-gray-900 mb-6">Configuración del Proyecto</h2>
      
      <!-- Información del Proyecto -->
      <div class="bg-white rounded-xl shadow p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Información del Proyecto</h3>
          <button 
            (click)="editingProject = !editingProject"
            class="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg">
            {{ editingProject ? 'Cancelar' : 'Editar' }}
          </button>
        </div>

        <form [formGroup]="projectForm" *ngIf="editingProject; else projectInfo" (ngSubmit)="updateProject()">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Título del proyecto</label>
              <input 
                type="text"
                formControlName="nombre"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Nombre del proyecto">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea 
                formControlName="descripcion"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="Descripción del proyecto"></textarea>
            </div>

            <div class="flex justify-end gap-3">
              <button 
                type="button"
                (click)="cancelEditProject()"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
                Cancelar
              </button>
              <button 
                type="submit"
                [disabled]="projectForm.invalid || updatingProject"
                class="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg disabled:opacity-50">
                {{ updatingProject ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>
        </form>

        <ng-template #projectInfo>
          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-600">Nombre</p>
              <p class="text-base font-medium text-gray-900">{{ projectName }}</p>
            </div>
            <div *ngIf="projectDescription">
              <p class="text-sm text-gray-600">Descripción</p>
              <p class="text-base text-gray-900 descripcion-proyecto">{{ projectDescription }}</p>
            </div>
          </div>
        </ng-template>
      </div>

      <!-- Gestión de Miembros -->
      <div class="bg-white rounded-xl shadow p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Gestión de miembros</h3>
          <button 
            (click)="openInviteDialog()"
            class="px-4 py-2 text-sm bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            Invitar nuevo miembro
          </button>
        </div>

        <!-- Buscador de usuarios existentes (reutilizado de create-project) -->
        <div class="mb-6">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">Buscar y agregar usuario existente</h4>
          
          <div class="autocomplete-wrapper">
            <input 
              type="text"
              class="custom-input"
              formControlName="searchUser"
              placeholder="Buscar por email o nombre de usuario"
              [matAutocomplete]="auto">
            <mat-icon class="search-icon">search</mat-icon>
          </div>
          
          <mat-autocomplete 
            #auto="matAutocomplete"
            (optionSelected)="addMemberFromSearch($event.option.value)"
            [displayWith]="displayUser">
            <mat-option 
              *ngFor="let user of filteredUsers$ | async" 
              [value]="user">
              <div class="user-option">
                <div class="user-avatar">
                  {{ getUserInitials(user) }}
                </div>
                <div class="user-info">
                  <div class="user-name">{{ user.username }}</div>
                  <div class="user-email">{{ user.email }}</div>
                </div>
              </div>
            </mat-option>
            
            <!-- Cargando -->
            <mat-option *ngIf="isSearchingUsers" disabled>
              <div class="no-results">
                <svg class="animate-spin h-5 w-5 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Buscando usuarios...
              </div>
            </mat-option>
            
            <!-- Sin resultados después de buscar/cargar -->
            <mat-option *ngIf="(filteredUsers$ | async)?.length === 0 && !isSearchingUsers" disabled>
              <div class="no-results">
                No hay más usuarios disponibles para agregar
              </div>
            </mat-option>
          </mat-autocomplete>
        </div>

        <!-- Lista de miembros actuales -->
        <div class="space-y-3">
          <h4 class="text-sm font-semibold text-gray-700 mb-3">Miembros actuales ({{ projectMembers.length }})</h4>
          
          <div *ngFor="let member of projectMembers" 
               class="member-chip"
               [class.admin-chip]="getRolId(member.rol) === 1">
            <div class="chip-avatar">
              {{ member.nombre.charAt(0).toUpperCase() }}
            </div>
            
            <div class="chip-info">
              <span class="chip-name">{{ member.nombre }}</span>
              <span class="chip-email">{{ member.email }}</span>
            </div>

            <span class="role-badge">
              {{ getRolId(member.rol) === 1 ? 'Líder' : 'Miembro' }}
            </span>

            <!-- TEMPORALMENTE DESHABILITADOS - Backend no soporta estas operaciones aún
            <button 
              *ngIf="!member.es_creador"
              mat-icon-button
              (click)="toggleMemberRole(member)"
              class="role-toggle"
              title="Cambiar rol">
              <mat-icon>swap_horiz</mat-icon>
            </button>

            <button 
              *ngIf="!member.es_creador"
              mat-icon-button
              (click)="removeMember(member)"
              class="remove-btn"
              title="Eliminar miembro">
              <mat-icon>close</mat-icon>
            </button>
            -->

            <span *ngIf="member.es_creador" class="creator-badge">
              Creador
            </span>
          </div>

          <p *ngIf="projectMembers.length === 0" class="text-center text-gray-500 py-8">
            No hay miembros en este proyecto
          </p>
        </div>
      </div>

      <!-- Zona de Peligro -->
      <div class="bg-white rounded-xl shadow border-2 border-red-200 p-6">
        <h3 class="text-lg font-semibold text-red-600 mb-4">Zona de peligro</h3>
        <p class="text-sm text-gray-600 mb-4">
          Una vez que elimines el proyecto, no hay vuelta atrás. Por favor, ten cuidado.
        </p>
        <button 
          (click)="deleteProject()"
          class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
          Eliminar proyecto
        </button>
      </div>
    </div>
  `,
  styles: [`
    .autocomplete-wrapper {
      position: relative;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .custom-input {
      width: 100%;
      padding: 0.75rem 2.5rem 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      color: #1a1a1a;
      background: white;
      transition: border-color 0.2s;
      font-family: inherit;
    }

    .custom-input::placeholder {
      color: #9ca3af;
    }

    .custom-input:focus {
      outline: none;
      border-color: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }

    .search-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      pointer-events: none;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    ::ng-deep .mat-mdc-autocomplete-panel {
      border-radius: 8px !important;
      margin-top: 4px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      max-height: 300px !important;
    }

    ::ng-deep .mat-mdc-option {
      min-height: 56px !important;
      padding: 8px 16px !important;
    }

    .user-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0;
      width: 100%;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      font-weight: 500;
      color: #1f2937;
      font-size: 0.9rem;
    }

    .user-email {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 2px;
    }

    .no-results {
      padding: 1rem;
      text-align: center;
      color: #6b7280;
      font-style: italic;
      font-size: 0.875rem;
    }

    .member-chip {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
    }

    .member-chip:hover {
      background: #f3f4f6;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .admin-chip {
      background: #fef3c7;
      border-color: #fbbf24;
    }

    .admin-chip:hover {
      background: #fde68a;
    }

    .chip-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .admin-chip .chip-avatar {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .chip-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .chip-name {
      font-weight: 600;
      font-size: 0.9rem;
      color: #1f2937;
    }

    .chip-email {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .role-badge {
      font-size: 0.7rem;
      padding: 0.375rem 0.75rem;
      background: #e5e7eb;
      border-radius: 12px;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .admin-chip .role-badge {
      background: #f59e0b;
      color: white;
    }

    .creator-badge {
      font-size: 0.7rem;
      padding: 0.375rem 0.75rem;
      background: #06b6d4;
      color: white;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .role-toggle,
    .remove-btn {
      width: 36px;
      height: 36px;
      padding: 6px;
      flex-shrink: 0;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .role-toggle {
      color: #06b6d4;
    }

    .role-toggle:hover {
      background: #cffafe;
      color: #0891b2;
    }

    .remove-btn {
      color: #6b7280;
    }

    .remove-btn:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .role-toggle mat-icon,
    .remove-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Estilos para miembros pendientes */
    .pending-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f0f9ff;
      border-radius: 8px;
      border: 2px dashed #0891b2;
      transition: all 0.2s;
    }

    .pending-chip:hover {
      background: #e0f2fe;
    }

    .pending-leader {
      background: #fef3c7;
      border-color: #f59e0b;
    }

    .pending-leader:hover {
      background: #fde68a;
    }

    .chip-avatar-pending {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .pending-leader .chip-avatar-pending {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    .chip-info-pending {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .chip-name-pending {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1f2937;
    }

    .chip-email-pending {
      font-size: 0.7rem;
      color: #6b7280;
    }

    .role-badge-pending {
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      background: #e5e7eb;
      border-radius: 12px;
      font-weight: 600;
      color: #4b5563;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .pending-leader .role-badge-pending {
      background: #f59e0b;
      color: white;
    }

    .toggle-btn-pending {
      width: 32px;
      height: 32px;
      padding: 4px;
      flex-shrink: 0;
      color: #06b6d4;
    }

    .toggle-btn-pending:hover {
      background: #cffafe;
    }

    .confirm-btn-pending {
      height: 32px;
      padding: 0 12px !important;
      font-size: 0.75rem !important;
      min-width: auto !important;
      background: #06b6d4 !important;
    }

    .confirm-btn-pending mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .cancel-btn-pending {
      width: 32px;
      height: 32px;
      padding: 4px;
      flex-shrink: 0;
      color: #6b7280;
    }

    .cancel-btn-pending:hover {
      background: #fee2e2;
      color: #dc2626;
    }

    .descripcion-proyecto { 
      white-space: normal;       
      word-wrap: break-word;     
      overflow-wrap: break-word;  
      line-height: 1.5;
      max-width: 100%;
      display: block;
    }

  `]
})
export class BoardSettingsComponent implements OnInit {
  @Input() proyectoId!: number;
  @Input() projectName: string = '';
  @Input() workspaceId?: number;
  @Output() projectDeleted = new EventEmitter<void>();

  projectMembers: ProjectMember[] = [];
  projectForm: FormGroup;
  editingProject = false;
  updatingProject = false;
  projectDescription = '';

  isSearchingUsers = false;
  filteredUsers$: Observable<User[]>;
  
  miembrosPendientes: any[] = [];

  private api = environment.apiBase;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private userService: UserService
  ) {
    this.projectForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      searchUser: [''] 
    });

    this.filteredUsers$ = this.projectForm.get('searchUser')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        if (typeof searchTerm !== 'string') {
          return of([]);
        }
        
        this.isSearchingUsers = true;
        return this.searchUsers(searchTerm).pipe(
          map(users => {
            this.isSearchingUsers = false;
            return users;
          }),
          catchError(error => {
            console.error('Error buscando usuarios:', error);
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

  private searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      console.log('Obteniendo todos los usuarios disponibles');
      return this.http.get<any>(`${this.api}/users`).pipe(
        map((response: any) => {
          // Manejar la estructura: {users: {data: [...]}}
          const users = response?.users?.data || response?.usuarios?.data || response?.data || response || [];
          console.log('Total usuarios obtenidos:', users.length);
          return this.filterAvailableUsers(users);
        }),
        catchError(error => {
          console.error('Error obteniendo usuarios:', error);
          return of([]);
        })
      );
    }
    
    console.log('Buscando usuarios con término:', searchTerm);
    return this.http.get<any>(`${this.api}/usuarios/buscar`, {
      params: { q: searchTerm.trim() }
    }).pipe(
      map((response: any) => {
        const users = response?.users?.data || response?.usuarios || response?.data || response || [];
        console.log('Usuarios encontrados en búsqueda:', users.length);
        return this.filterAvailableUsers(users);
      }),
      catchError(error => {
        console.error('Error en búsqueda de usuarios:', error);
        return of([]);
      })
    );
  }

  private filterAvailableUsers(users: User[]): User[] {
    return users.filter(user => {
      const isAlreadyMember = this.projectMembers.some(
        m => m.id_usuario === user.id_usuario
      );
      return !isAlreadyMember;
    });
  }

  displayUser(user: User | null): string {
    return '';
  }

  getUserInitials(user: User): string {
    if (user.username) {
      return user.username.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  }

  addMemberFromSearch(user: User): void {
    if (!user || !user.id_usuario) return;

      // Evita duplicados
    if (this.projectMembers.some(m => m.id_usuario === user.id_usuario)) {
      alert('Este usuario ya es miembro del proyecto');
      this.projectForm.get('searchUser')?.setValue('');
      return;
    }

    const nuevoMiembro = {
      id_usuario: user.id_usuario,
      id_rol: 2 // Asignar rol de 'miembro' por defecto
    };

    
    this.http.post(`${this.api}/proyectos/${this.proyectoId}/miembros`, nuevoMiembro).subscribe({
      next: () => {
        alert(`✓ ${user.username || user.email} agregado como miembro`);
        this.loadProjectMembers(); // refresca la lista
        this.projectForm.get('searchUser')?.setValue('');
      },
      error: (e) => {
        console.error('Error agregando miembro:', e);
        if (e.status === 409) {
          alert('Este usuario ya es miembro del proyecto');
        } else {
          alert('Error al agregar el miembro');
        }
        this.projectForm.get('searchUser')?.setValue('');
      }
    });
  }

  toggleRolPendiente(miembro: any): void {
    miembro.rol_temporal = miembro.rol_temporal === 1 ? 2 : 1;
    console.log('Rol temporal cambiado:', miembro.username, '→', miembro.rol_temporal === 1 ? 'Líder' : 'Miembro');
  }

  confirmarMiembro(miembro: any): void {
    const nuevoMiembro = {
      id_usuario: miembro.id_usuario,
      id_rol: miembro.rol_temporal
    };

    console.log('Confirmando miembro:', {
      usuario: miembro.username,
      rol: miembro.rol_temporal === 1 ? 'Líder (1)' : 'Miembro (2)',
      data: nuevoMiembro
    });


    this.http.post(`${this.api}/proyectos/${this.proyectoId}/miembros`, nuevoMiembro).subscribe({
      next: () => {
        const roleName = miembro.rol_temporal === 1 ? 'Líder' : 'Miembro';
        alert(`✓ ${miembro.username} agregado como ${roleName}`);
 
        this.miembrosPendientes = this.miembrosPendientes.filter(m => m.user.id_usuario !== miembro.user.id_usuario);
        

        this.loadProjectMembers();
        this.projectForm.get('searchUser')?.setValue('');
      },
      error: (e) => {
        console.error('Error agregando miembro:', e);
        if (e.status === 409) {
          alert('Este usuario ya es miembro del proyecto');
        } else {
          alert('Error al agregar el miembro');
        }
        this.projectForm.get('searchUser')?.setValue('');
      }
    });
  }

  cancelarMiembro(miembro: any): void {
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
        console.log('Miembros cargados:', this.projectMembers);
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

  toggleMemberRole(member: ProjectMember): void {
    const currentRoleId = this.getRolId(member.rol);
    const newRoleId = currentRoleId === 1 ? 2 : 1;
    const newRoleName = newRoleId === 1 ? 'Líder' : 'Miembro';

    if (!confirm(`¿Cambiar el rol de ${member.nombre} a ${newRoleName}?`)) {
      return;
    }

    this.http.put(`${this.api}/proyectos/${this.proyectoId}/miembros/${member.id_usuario}/rol`, {
      id_rol: newRoleId
    }).subscribe({
      next: () => {
        member.rol = newRoleName;
        alert(`Rol actualizado a ${newRoleName}`);
        this.loadProjectMembers(); // Recargar para actualizar la UI
      },
      error: (e) => {
        console.error('Error cambiando rol:', e);
        alert('Error al cambiar el rol');
      }
    });
  }

  removeMember(member: ProjectMember) {
    if (!confirm(`¿Eliminar a ${member.nombre} del proyecto?`)) return;

    this.http.delete(`${this.api}/proyectos/${this.proyectoId}/miembros/${member.id_usuario}`).subscribe({
      next: () => {
        this.projectMembers = this.projectMembers.filter(m => m.id_usuario !== member.id_usuario);
        alert('Miembro eliminado del proyecto');
      },
      error: (e) => {
        console.error('Error eliminando miembro:', e);
        alert('Error al eliminar el miembro');
      }
    });
  }

  openInviteDialog() {
    const dialogRef = this.dialog.open(InviteMemberDialogComponent, {
      width: '550px',
      data: {
        projectId: this.proyectoId,
        projectName: this.projectName
      }
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
            if (e.status === 409) {
              alert('Este usuario ya es miembro del proyecto');
            } else {
              alert('Error al agregar el miembro');
            }
          }
        });
      }
    });
  }

  updateProject() {
    if (this.projectForm.invalid) return;

    this.updatingProject = true;
    const data = {
      nombre: this.projectForm.value.nombre,
      descripcion: this.projectForm.value.descripcion
    };

    this.http.put(`${this.api}/proyectos/${this.proyectoId}`, data).subscribe({
      next: () => {
        this.projectName = data.nombre;
        this.projectDescription = data.descripcion;
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
      `Se eliminará:\n` +
      `• Todas las columnas\n` +
      `• Todas las tarjetas\n` +
      `• Todos los comentarios\n\n` +
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
}