import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import { User } from '../../../profile/models/user.interface';
import { UserService } from '../../../profile/services/user.service';
import { ProyectoService } from '../../services/proyecto.service';
import { InviteMemberDialogComponent } from '../invite-member-dialog/inivite-member-dialog.component';
import {  forkJoin } from 'rxjs';
interface DialogData {
  workspaceId: number;
  workspaceName: string;
  currentUserId: number; 
}

interface MemberWithRole {
  user: User;
  rol: 'lider' | 'miembro';
}

@Component({
  selector: 'app-create-project-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatChipsModule
  ],
  template: `
  <div class="dialog-container">
    <div class="dialog-header">
      <h2 mat-dialog-title>Crear Nuevo Proyecto</h2>
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content>
      <p class="dialog-subtitle">
        Completa los detalles para crear un nuevo proyecto en tu espacio de trabajo.
      </p>

      <form [formGroup]="projectForm" class="project-form">
        <!-- Título del proyecto -->
        <div class="form-group">
          <label class="field-label">Título del proyecto</label>
          <input 
            type="text"
            class="custom-input"
            formControlName="nombre"
            placeholder="Ingresa el nombre del proyecto"
            maxlength="60"
            required>
          <div class="error-message" *ngIf="projectForm.get('nombre')?.hasError('required') && projectForm.get('nombre')?.touched">
            El título es requerido
          </div>
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label class="field-label">Descripción</label>
          <textarea 
            class="custom-input custom-textarea"
            formControlName="descripcion"
            placeholder="Describe brevemente el proyecto"
            rows="3"
            maxlength="300">
          </textarea>
          <div class="hint-text">Opcional</div>
        </div>

        <!-- Añadir miembros -->
        <div class="members-section">
          <div class="section-header">
            <label class="section-label">Añadir miembros</label>
            <button 
              type="button"
              mat-button 
              color="primary"
              (click)="openInviteMemberDialog()"
              class="invite-temp-btn">
              <mat-icon>person_add</mat-icon>
              Invitar nuevo miembro
            </button>
          </div>
          
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
            (optionSelected)="addMember($event.option.value)"
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
            
            <mat-option *ngIf="(filteredUsers$ | async)?.length === 0 && !isSearchingUsers" disabled>
              <div class="no-results">No se encontraron usuarios</div>
            </mat-option>
            
            <mat-option *ngIf="isSearchingUsers" disabled>
              <div class="no-results">Buscando...</div>
            </mat-option>
          </mat-autocomplete>

          <!-- Información del creador -->
          <div class="creator-info" *ngIf="!selectedMembers.length">
            <mat-icon>info</mat-icon>
            <span>Serás el líder de este proyecto automáticamente</span>
          </div>

          <!-- Miembros seleccionados -->
          <div class="selected-members" *ngIf="selectedMembers.length > 0">
            <div class="members-list">
              <div 
                *ngFor="let memberData of selectedMembers"
                class="member-chip"
                [class.admin-chip]="memberData.rol === 'lider'">
                <div class="chip-avatar">{{ getUserInitials(memberData.user) }}</div>
                <div class="chip-info">
                  <span class="chip-name">{{ memberData.user.username || memberData.user.email }}</span>
                  <span class="chip-email" *ngIf="memberData.user.email && memberData.user.username">{{ memberData.user.email }}</span>
                </div>
                <span class="role-badge">{{ memberData.rol === 'lider' ? 'Lider' : 'Miembro' }}</span>
                <button 
                  mat-icon-button 
                  (click)="toggleRole(memberData)"
                  class="role-toggle"
                  title="Cambiar rol">
                  <mat-icon>swap_horiz</mat-icon>
                </button>
                <button 
                  mat-icon-button
                  (click)="removeMember(memberData)"
                  class="remove-btn"
                  title="Remover">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button mat-button mat-dialog-close class="cancel-btn">
        Cancelar
      </button>
      <button 
        mat-raised-button 
        color="primary"
        (click)="createProject()"
        [disabled]="projectForm.invalid || isCreating"
        class="create-btn">
        <mat-icon *ngIf="!isCreating">check</mat-icon>
        <mat-icon *ngIf="isCreating" class="spinning">refresh</mat-icon>
        {{ isCreating ? 'Creando...' : 'Crear Proyecto' }}
      </button>
    </mat-dialog-actions>
  </div>
`,
  styles: [`
    .dialog-container {
  width: 600px;
  max-width: 90vw;
  border-radius: 12px;
  overflow: hidden;
  background: white;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.close-btn {
  margin-right: -8px;
  color: #64748b;
}

mat-dialog-content {
  padding: 1rem 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-subtitle {
  margin: 0 0 1.5rem 0;
  color: #64748b;
  font-size: 0.9rem;
}

.project-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.custom-input {
  width: 100%;
  padding: 0.75rem 1rem;
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
  border-color: #3b82f6;
}

.custom-textarea {
  resize: vertical;
  min-height: 80px;
}

.error-message {
  color: #dc2626;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.hint-text {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

.members-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.section-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.invite-temp-btn {
  font-size: 0.85rem;
  padding: 0.375rem 0.75rem !important;
  min-width: auto !important;
}

.invite-temp-btn mat-icon {
  font-size: 16px !important;
  width: 16px !important;
  height: 16px !important;
  margin-right: 0.25rem;
}

.autocomplete-wrapper {
  position: relative;
  width: 100%;
  margin-bottom: 0.5rem;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
  font-size: 18px;
}
.mat-mdc-dialog-container,
.mat-mdc-dialog-surface {
  background-color: #ffffff !important;
  box-shadow: none !important;
}

.mat-mdc-dialog-surface {
  box-shadow: 0 4px 20px rgba(255, 255, 255, 0.15) !important;
  border-radius: 12px !important;
}

::ng-deep .mat-mdc-autocomplete-panel {
  border-radius: 8px !important;
  margin-top: 4px !important;
  box-shadow: 0 4px 6px -1px rgba(255, 255, 255, 0.1) !important;
}

::ng-deep .mat-mdc-option {
  min-height: 56px !important;
  padding: 8px 16px !important;
}

.creator-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  color: #0369a1;
  font-size: 0.85rem;
}

.creator-info mat-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.user-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0;
  width: 100%;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.8rem;
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
}

.no-results {
  padding: 1rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

.selected-members {
  margin-top: 0.75rem;
  max-height: 180px;
  overflow-y: auto;
  padding: 0.25rem;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.member-chip:hover {
  background: #f3f4f6;
}

.admin-chip {
  background: #fef3c7;
  border-color: #f59e0b;
}

.chip-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.chip-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.chip-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: #1f2937;
}

.chip-email {
  font-size: 0.7rem;
  color: #6b7280;
}

.role-badge {
  font-size: 0.7rem;
  padding: 0.25rem 0.5rem;
  background: #e5e7eb;
  border-radius: 12px;
  font-weight: 500;
}

.admin-chip .role-badge {
  background: #f59e0b;
  color: white;
}

.role-toggle,
.remove-btn {
  width: 32px;
  height: 32px;
  padding: 4px;
  flex-shrink: 0;
}

.role-toggle mat-icon,
.remove-btn mat-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

.remove-btn {
  color: #6b7280;
}

.remove-btn:hover {
  color: #dc2626;
}

mat-dialog-actions {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  padding: 0.5rem 1.5rem;
  color: #6b7280;
}

.create-btn {
  padding: 0.5rem 2rem;
  background: #3b82f6 !important;
}

.create-btn:disabled {
  background: #9ca3af !important;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.credentials-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.credentials-dialog {
  width: 480px;
  max-width: 90vw;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.credentials-header {
  text-align: center;
  padding: 1.5rem;
  background: #3b82f6;
  color: white;
}

.header-icon mat-icon {
  font-size: 40px;
  width: 40px;
  height: 40px;
  margin-bottom: 0.5rem;
}

.credentials-header h2 {
  margin: 0;
  color: white;
  font-size: 1.25rem;
}

.credentials-content {
  padding: 1.5rem;
}

.alert-info {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.alert-info mat-icon {
  color: #1d4ed8;
  font-size: 18px;
  width: 18px;
  height: 18px;
  margin-top: 1px;
}

.alert-info p {
  margin: 0;
  color: #1e40af;
  font-size: 0.85rem;
  line-height: 1.4;
}

.credentials-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.credential-item {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 1rem;
}

.password-item {
  border-color: #8493e0ff;
  background: #f0fdf4;
}

.credential-item label {
  display: block;
  font-weight: 600;
  font-size: 0.8rem;
  color: #374151;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.credential-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.credential-value code {
  flex: 1;
  padding: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #1f2937;
  word-break: break-all;
}

.password-item .credential-value code {
  background: white;
  border-color: #bebebeff;
  color: #a1aba5ff;
  font-weight: 600;
}

.credential-value button {
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.quick-copy {
  margin-top: 1rem;
  text-align: center;
}

.copy-both-btn {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #93fffbff;
  color: #95fceeff;
  background: white;
}

.credentials-actions {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: center;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.credentials-actions button {
  padding: 0.75rem 2rem;
  background: #6be0d6ff !important;
}

/* Scrollbars simples */
mat-dialog-content::-webkit-scrollbar {
  width: 6px;
}

mat-dialog-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

mat-dialog-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.selected-members::-webkit-scrollbar {
  width: 4px;
}

.selected-members::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.selected-members::-webkit-scrollbar-thumb {
  background: #cbd5e1;

}
  `]
})
export class CreateProjectDialogComponent implements OnInit {
  projectForm: FormGroup;
  isCreating = false;
  isSearchingUsers = false;
  selectedMembers: MemberWithRole[] = [];
  filteredUsers$: Observable<User[]>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private proyectoService: ProyectoService,
    private userService: UserService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.projectForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      descripcion: ['', Validators.maxLength(300)],
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

  ngOnInit(): void {
    console.log('Datos del diálogo:', this.data);
    console.log('Usuario actual (creador):', this.data.currentUserId);
  }

  private searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return this.userService.getUsers().pipe(
        map(users => this.filterUsers(users)),
        catchError(() => of([]))
      );
    }
    
    return this.userService.searchUsers(searchTerm).pipe(
      map(users => this.filterUsers(users)),
      catchError(() => of([]))
    );
  }

  private filterUsers(users: User[]): User[] {
    return users.filter(user => {
      const isCurrentUser = user.id_usuario === this.data.currentUserId;
      const isAlreadySelected = this.selectedMembers.some(
        m => m.user.id_usuario === user.id_usuario
      );
      return !isCurrentUser && !isAlreadySelected;
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

  addMember(user: User): void {
  if (user.id_usuario === this.data.currentUserId) {
    console.warn('No puedes agregarte a ti mismo como miembro');
    return;
  }

  if (!this.selectedMembers.some(m => m.user.id_usuario === user.id_usuario)) {
    this.selectedMembers.push({
      user: user,
      rol: 'miembro'  
    });
    console.log('Miembro agregado:', user.username, 'con rol: miembro');
  }
  
  this.projectForm.get('searchUser')?.setValue('');
}

  removeMember(memberData: MemberWithRole): void {
    const index = this.selectedMembers.findIndex(
      m => m.user.id_usuario === memberData.user.id_usuario
    );
    if (index >= 0) {
      this.selectedMembers.splice(index, 1);
      console.log('Miembro removido:', memberData.user.username);
    }
  }

  toggleRole(memberData: MemberWithRole): void {
    memberData.rol = memberData.rol === 'lider' ? 'miembro' : 'lider';
    console.log('Rol cambiado:', memberData.user.username, '→', memberData.rol);
  }

  openInviteMemberDialog(): void {
  console.log('Abriendo diálogo de invitación para nuevo miembro');
  
  const inviteDialogRef = this.dialog.open(InviteMemberDialogComponent, {
    width: '550px',
    data: {
      projectId: 0,
      projectName: this.projectForm.get('nombre')?.value || 'Nuevo Proyecto'
    },
    disableClose: false
  });

  inviteDialogRef.afterClosed().subscribe(result => {
    if (result && result.user) {
      console.log('Usuario temporal creado:', result);
      
      if (result.user.id_usuario === this.data.currentUserId) {
        console.warn('No puedes agregarte a ti mismo');
        return;
      }

      const user = {
        ...result.user,
        username: result.user.username || result.user.email?.split('@')[0] || 'Usuario',
        email: result.user.email
      };

      const newMember: MemberWithRole = {
        user: user,
        rol: result.rol === 'lider' ? 'lider' : 'miembro'  
      };
      
      if (!this.selectedMembers.some(m => m.user.id_usuario === newMember.user.id_usuario)) {
        this.selectedMembers.push(newMember);
        console.log('Miembro agregado:', newMember.user.username, 'rol:', newMember.rol);
      } else {
        console.warn('El usuario ya está en la lista');
      }
    }
  });
}

  createProject(): void {
    if (this.projectForm.invalid) {
      console.warn('Formulario inválido');
      return;
    }
    const projectName = this.projectForm.get('nombre')?.value.trim();
  const workspaceName = this.data.workspaceName.trim();

  if (projectName.toLowerCase() === workspaceName.toLowerCase()) {
    alert(`El nombre del proyecto no puede ser igual al nombre del espacio ("${workspaceName}").`);
    return;
  }
    
    this.isCreating = true;
    
    const requestData: any = {
      proyecto: {
        nombre: this.projectForm.get('nombre')?.value,
        descripcion: this.projectForm.get('descripcion')?.value || '',
        id_espacio: this.data.workspaceId,
        id_usuario_creador: this.data.currentUserId
      }
    };


    console.log('Creando proyecto con datos:', requestData);
    console.log('Creador (líder automático):', this.data.currentUserId);

    this.proyectoService.createProyecto(requestData).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        
        const proyectoData = response.proyecto || response;
        const projectId = proyectoData.id_proyecto || proyectoData.id;
        
        if (!projectId) {
          console.error('No se pudo obtener el ID del proyecto');
          this.isCreating = false;
          alert('Error: No se pudo obtener el ID del proyecto');
          return;
        }

        console.log('Proyecto creado con ID:', projectId);
        this.registrarLiderYMiembros(projectId, proyectoData);
      },
      error: (error) => {
        console.error('Error al crear proyecto:', error);
        this.isCreating = false;
        
        let errorMessage = 'Error al crear el proyecto. Por favor, intenta nuevamente.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        alert(errorMessage);
      }
    });
  }

  private registrarLiderYMiembros(projectId: number, proyectoData: any): void {
  console.log('Registrando roles para el proyecto:', projectId);

  const todosLosMiembros = [
    {
      id_usuario: this.data.currentUserId,
      id_rol: 1  
    },
    ...this.selectedMembers.map(memberData => ({
      id_usuario: memberData.user.id_usuario,
      id_rol: memberData.rol === 'lider' ? 1 : 2 
    }))
  ];

  console.log('Total de miembros a registrar:', todosLosMiembros.length);
  console.log('Detalles de miembros:', todosLosMiembros);

  const registrosFallidos: any[] = [];
  const registrosObservables = todosLosMiembros.map(miembro => 
    this.proyectoService.agregarMiembro(projectId, miembro).pipe(
      catchError(error => {
        console.error(`Error registrando usuario ${miembro.id_usuario}:`, error);
        registrosFallidos.push({ miembro, error });
        return of(null);
      })
    )
  );

  forkJoin(registrosObservables).subscribe({
    next: (resultados) => {
      const exitosos = resultados.filter(r => r !== null).length;
      console.log(`${exitosos}/${todosLosMiembros.length} miembros registrados`);

      if (registrosFallidos.length > 0) {
        console.warn('Algunos registros fallaron:', registrosFallidos);
      }

      this.finalizarCreacionProyecto(projectId, proyectoData);
    },
    error: (error) => {
      console.error('Error general:', error);
      this.finalizarCreacionProyecto(projectId, proyectoData);
    }
  });
}
private finalizarCreacionProyecto(projectId: number, proyectoData: any): void {
  this.isCreating = false;
  
  const nombreProyecto = proyectoData?.nombre || proyectoData?.name || `Proyecto ${projectId}`;
  
  console.log('Nombre a pasar en navegación:', nombreProyecto);
  console.log('Datos completos del proyecto:', proyectoData);
  
  this.dialogRef.close(proyectoData);
  
  this.router.navigate([
    '/workspace', 
    this.data.workspaceId, 
    'projects', 
    projectId, 
    'board'
  ], {
    queryParams: {
      projectName: nombreProyecto 
    }
  }).then(success => {
    console.log('Navegación exitosa:', success);
  }).catch(error => {
    console.error('Error en navegación:', error);
  });
}

}