import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { Observable, of } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { ProyectoService } from '../../services/proyecto.service';
import { UserService } from '../../../profile/services/user.service';
import { User } from '../../../profile/models/user.interface';
import { Router } from '@angular/router'; 

interface DialogData {
  workspaceId: number;
  workspaceName: string;
  currentUserId: number; 
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
              maxlength="100"
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
              maxlength="500">
            </textarea>
            <div class="hint-text">Opcional</div>
          </div>

          <!-- Añadir miembros -->
          <div class="members-section">
            <label class="section-label">Añadir miembros</label>
            
            <div class="autocomplete-wrapper">
              <input 
                type="text"
                class="custom-input"
                formControlName="searchUser"
                placeholder="Ver lista de usuarios"
                [matAutocomplete]="auto">
              <mat-icon class="dropdown-icon">expand_more</mat-icon>
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
                    <div class="user-name">{{ user.nombre }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
              </mat-option>
              
              <mat-option *ngIf="(filteredUsers$ | async)?.length === 0" disabled>
                <div class="no-results">No se encontraron usuarios</div>
              </mat-option>
            </mat-autocomplete>

            <!-- Miembros seleccionados -->
            <div class="selected-members" *ngIf="selectedMembers.length > 0">
              <mat-chip-listbox class="members-list">
                <mat-chip-option 
                  *ngFor="let member of selectedMembers"
                  (removed)="removeMember(member)"
                  class="member-chip">
                  <div class="chip-avatar">{{ getUserInitials(member) }}</div>
                  <span>{{ member.nombre }}</span>
                  <button matChipRemove>
                    <mat-icon>cancel</mat-icon>
                  </button>
                </mat-chip-option>
              </mat-chip-listbox>
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
      margin-right: -12px;
    }

    mat-dialog-content {
      padding: 1rem 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
    }

    .dialog-subtitle {
      margin: 0 0 1.5rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .project-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .full-width {
      width: 100%;
    }

    /* Custom Form Styles */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-weight: 500;
      color: #1a1a1a;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .custom-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      font-size: 0.95rem;
      color: #1a1a1a;
      background: white;
      transition: all 0.2s;
      font-family: inherit;
    }

    .custom-input::placeholder {
      color: #9ca3af;
    }

    .custom-input:focus {
      outline: none;
      border-color: #20C9AC;
      box-shadow: 0 0 0 3px rgba(32, 201, 172, 0.1);
    }

    .custom-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .hint-text {
      color: #6b7280;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .autocomplete-wrapper {
      position: relative;
      width: 100%;
    }

    .dropdown-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #6b7280;
      pointer-events: none;
    }

    .members-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .section-label {
      font-weight: 500;
      color: #495057;
      font-size: 0.9rem;
    }

    .user-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-info {
      flex: 1;
    }

    .user-name {
      font-weight: 500;
      color: #2c3e50;
    }

    .user-email {
      font-size: 0.8rem;
      color: #6c757d;
    }

    .no-results {
      padding: 1rem;
      text-align: center;
      color: #6c757d;
      font-style: italic;
    }

    .selected-members {
      margin-top: 0.5rem;
    }

    .members-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .member-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
    }

    .chip-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.7rem;
    }

    mat-dialog-actions {
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      border-top: 1px solid #e1e5e9;
    }

    .cancel-btn {
      padding: 0.5rem 1.5rem;
    }

    .create-btn {
      padding: 0.5rem 2rem;
      background: #20C9AC !important;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Scrollbar personalizado */
    mat-dialog-content::-webkit-scrollbar {
      width: 6px;
    }

    mat-dialog-content::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    mat-dialog-content::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }

    mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }
  `]
})
export class CreateProjectDialogComponent implements OnInit {
  projectForm: FormGroup;
  isCreating = false;
  selectedMembers: User[] = [];
  filteredUsers$: Observable<User[]>;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private proyectoService: ProyectoService,
    private userService: UserService,
    private router: Router,
  ) {
    this.projectForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', Validators.maxLength(500)],
      searchUser: ['']
    });

    // Configurar búsqueda de usuarios
    this.filteredUsers$ = this.projectForm.get('searchUser')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        if (typeof searchTerm !== 'string') {
          return of([]);
        }
        return this.searchUsers(searchTerm);
      })
    );
  }

  ngOnInit(): void {}

  private searchUsers(searchTerm: string): Observable<User[]> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return this.userService.getUsers(); // Obtener todos los usuarios
    }
    
    // Buscar usuarios por nombre o apellido desde la API
    return this.userService.searchUsers(searchTerm).pipe(
      map(users => users.filter(user => 
        !this.selectedMembers.some(member => member.id === user.id)
      ))
    );
  }

  displayUser(user: User | null): string {
    return ''; // No mostrar nada en el input después de seleccionar
  }

  getUserInitials(user: User): string {
    const firstInitial = user.nombre?.charAt(0).toUpperCase() || '';
    return `${firstInitial}`;
  }

  addMember(user: User): void {
    if (!this.selectedMembers.some(m => m.id === user.id)) {
      this.selectedMembers.push(user);
    }
    this.projectForm.get('searchUser')?.setValue('');
  }

  removeMember(user: User): void {
    const index = this.selectedMembers.findIndex(m => m.id === user.id);
    if (index >= 0) {
      this.selectedMembers.splice(index, 1);
    }
  }

  createProject(): void {
    if (this.projectForm.invalid) {
      return;
    }
    
    this.isCreating = true;

    const requestData = {
      proyecto: {
        nombre: this.projectForm.get('nombre')?.value,
        descripcion: this.projectForm.get('descripcion')?.value || '',
        id_espacio: this.data.workspaceId,
        id_usuario_creador: this.data.currentUserId
      }
    };

    if (this.selectedMembers.length > 0) {
      Object.assign(requestData, {
        miembros: this.selectedMembers.map(member => ({
          id_usuario: member.id,
          rol: 'miembro'
        }))
      });
    }

    console.log('📤 Creando proyecto:', requestData);

    this.proyectoService.createProyecto(requestData).subscribe({
      next: (response) => {
        console.log('📦 Respuesta del servidor:', response);
        
        // CORRECCIÓN: Extraer correctamente el proyecto
        const proyectoData = response.proyecto || response;
        console.log('✅ Proyecto extraído:', proyectoData);
        
        // CORRECCIÓN: Obtener el ID correcto
        const projectId = proyectoData.id_proyecto || proyectoData.id;
        console.log('🔑 ID del proyecto:', projectId);
        
        // Validar que el ID exista
        if (!projectId) {
          console.error('❌ No se pudo obtener el ID del proyecto');
          this.isCreating = false;
          alert('Error: No se pudo obtener el ID del proyecto');
          return;
        }
        
        this.isCreating = false;
        this.dialogRef.close(proyectoData);
        
        // Navegar al tablero
        this.router.navigate([
          '/workspace', 
          this.data.workspaceId, 
          'projects', 
          projectId, 
          'board'
        ], {
          queryParams: {
            projectName: proyectoData.nombre
          }
        }).then(success => {
          console.log('✅ Navegación exitosa:', success);
        }).catch(error => {
          console.error('❌ Error en navegación:', error);
        });
      },
      error: (error) => {
        console.error('❌ Error al crear proyecto:', error);
        this.isCreating = false;
        alert('Error al crear el proyecto. Por favor, intenta nuevamente.');
      }
    });
  }
}