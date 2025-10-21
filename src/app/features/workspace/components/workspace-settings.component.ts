import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Espacio } from '../models/espacio.interface';
import { WorkspaceService } from '../services/workspace.service';

@Component({
  selector: 'app-workspace-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule
  ],
  template: `
    <div class="settings-container">
      <!-- Header con botón de volver -->
      <div class="settings-header">
        <button 
          (click)="goBack()"
          class="back-button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
        
        <div class="header-content">
          <div class="header-title">
            <svg class="settings-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            </svg>
            <h1>Configuración del Espacio</h1>
          </div>
        </div>
      </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="loading-container">
          <div class="spinner"></div>
          <p>Cargando configuración...</p>
        </div>

        <!-- Form Section -->
        <div class="form-section" *ngIf="!isLoading && workspace && workspaceForm">
        <h2 class="section-title">Información del Espacio</h2>

        <form [formGroup]="workspaceForm" class="workspace-form">
          <div class="form-group">
            <label class="form-label">Título del espacio</label>
            <input 
              type="text"
              class="form-input"
              formControlName="nombre"
              placeholder="Ingresa el nombre del espacio">
            <div class="error-message" 
              *ngIf="workspaceForm.get('nombre')?.hasError('required') && workspaceForm.get('nombre')?.touched">
              El título es requerido
            </div>
            <div class="error-message" 
              *ngIf="workspaceForm.get('nombre')?.hasError('minlength') && workspaceForm.get('nombre')?.touched">
              El título debe tener al menos 3 caracteres
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <textarea 
              class="form-input form-textarea"
              formControlName="descripcion"
              placeholder="Ingresa la descripción del espacio"
              rows="4"></textarea>
            <div class="error-message" 
              *ngIf="workspaceForm.get('descripcion')?.hasError('required') && workspaceForm.get('descripcion')?.touched">
              La descripción es requerida
            </div>
          </div>

          <button 
            type="button"
            class="edit-button"
            (click)="updateWorkspace()"
            [disabled]="!workspaceForm.valid || isUpdating">
            <svg *ngIf="!isUpdating" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ isUpdating ? 'Actualizando...' : 'Guardar Cambios' }}
          </button>
        </form>
      </div>

      <!-- Danger Zone -->
      <div class="danger-zone" *ngIf="!isLoading">
        <h3 class="danger-title">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Zona de peligro
        </h3>
        <p class="danger-description">
          Eliminar este espacio es permanente. Se eliminarán todos los proyectos, columnas y tareas asociadas.
        </p>
        <button 
          class="delete-button"
          (click)="confirmDelete()"
          [disabled]="isDeleting">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          {{ isDeleting ? 'Eliminando...' : 'Eliminar espacio' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .settings-header {
      margin-bottom: 2rem;
    }

    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #6b7280;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 1.5rem;
    }

    .back-button:hover {
      background: #f9fafb;
      border-color: #d1d5db;
      color: #374151;
    }

    .header-content {
      text-align: center;
    }

    .header-title {
      display: inline-flex;
      align-items: center;
      gap: 0.8rem;
      padding: 1rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .settings-icon {
      width: 28px;
      height: 28px;
      color: #40E0D0;
    }

    .header-title h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #40E0D0;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-container p {
      font-size: 1rem;
      color: #6b7280;
    }

    .form-section {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f3f4f6;
    }

    .workspace-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #374151;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1.5px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
      font-family: inherit;
      background: white;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-input:focus {
      border-color: #40E0D0;
      box-shadow: 0 0 0 3px rgba(64, 224, 208, 0.1);
    }

    .error-message {
      font-size: 0.85rem;
      color: #ef4444;
      margin-top: 0.25rem;
    }

    .edit-button {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 2rem;
      background: #40E0D0;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 0.5rem;
    }

    .edit-button:hover:not([disabled]) {
      background: #38c9b8;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
    }

    .edit-button[disabled] {
      background: #9ca3af;
      cursor: not-allowed;
      opacity: 0.6;
    }

    .danger-zone {
      background: white;
      border: 2px solid #fecaca;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(239, 68, 68, 0.1);
    }

    .danger-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 0.75rem;
    }

    .danger-description {
      font-size: 0.9rem;
      color: #6b7280;
      margin-bottom: 1.25rem;
      line-height: 1.5;
    }

    .delete-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .delete-button:hover:not([disabled]) {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .delete-button[disabled] {
      background: #9ca3af;
      cursor: not-allowed;
      opacity: 0.6;
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: 1rem;
      }

      .header-title {
        padding: 0.75rem 1.5rem;
      }

      .header-title h1 {
        font-size: 1.25rem;
      }

      .form-section {
        padding: 1.5rem;
      }

      .edit-button,
      .delete-button {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class WorkspaceSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private workspaceService = inject(WorkspaceService);
  private dialog = inject(MatDialog);

  workspace: Espacio | null = null;
  workspaceId: number = 0;
  workspaceForm!: FormGroup;
  isUpdating = false;
  isDeleting = false;
  isLoading = true;

  ngOnInit(): void {
    this.initForm();
    
    this.route.params.subscribe(params => {
      this.workspaceId = +params['id'];
      console.log('Workspace ID desde URL:', this.workspaceId);
      
      if (this.workspaceId && this.workspaceId > 0) {
        this.loadWorkspace();
      } else {
        console.error('ID de workspace inválido');
        alert('Error: ID de workspace inválido');
        this.goBack();
      }
    });
  }

  initForm(): void {
    this.workspaceForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  loadWorkspace(): void {
    console.log('Cargando información del espacio ID:', this.workspaceId);
    this.isLoading = true;
    
    this.workspaceService.getWorkspaceById(this.workspaceId).subscribe({
      next: (workspace) => {
        console.log('Datos del espacio recibidos:', workspace);
        
        this.workspace = workspace;
        
        this.workspaceForm.patchValue({
          nombre: workspace.nombre || '',
          descripcion: workspace.descripcion || ''
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar el espacio:', error);
        this.isLoading = false;
        alert('Error al cargar la configuración del espacio');
        this.goBack();
      }
    });
  }

  

  confirmDelete(): void {
    const workspaceName = this.workspace?.nombre || 'este espacio';
    
    const confirmDialog = confirm(
      `¿Estás seguro de que deseas eliminar "${workspaceName}"?\n\n` +
      'Esta acción eliminará:\n' +
      '• Todos los proyectos\n' +
      '• Todas las columnas\n' +
      '• Todas las tareas\n' +
      '• Todos los datos asociados\n\n' +
      'Esta acción NO se puede deshacer.'
    );

    if (confirmDialog) {
      this.deleteWorkspace();
    }
  }
updateWorkspace(): void {
  if (this.workspaceForm.invalid) {
    console.log('Formulario inválido');
    return;
  }

  this.isUpdating = true;
  const formValue = this.workspaceForm.value;

  console.log('ID del workspace:', this.workspaceId);
  console.log('Valores del formulario:', formValue);

  this.workspaceService.editWorkspace(
    this.workspaceId, 
    formValue.nombre, 
    formValue.descripcion
  ).subscribe({
    next: (response) => {
      console.log('Respuesta exitosa:', response);
      const updatedWorkspace = response.espacio || response.data || response;
      this.workspace = updatedWorkspace;
      this.isUpdating = false;
      alert('Espacio actualizado exitosamente');
    },
    error: (error) => {
      console.error('Error completo del backend:', error);
      console.error('Status code:', error.status);
      console.error('Error message:', error.error);
      console.error('URL intentada:', error.url);
      this.isUpdating = false;
      const errorMsg = error.error?.message || error.message || 'Error desconocido';
      alert(`Error al actualizar: ${errorMsg}`);
    }
  });
}
  deleteWorkspace(): void {
    this.isDeleting = true;
    
    this.workspaceService.deleteWorkspace(this.workspaceId).subscribe({
      next: () => {
        console.log('Espacio eliminado exitosamente');
        alert('Espacio eliminado exitosamente');
        this.router.navigate(['/workspace']);
      },
      error: (error) => {
        console.error('Error al eliminar el espacio:', error);
        this.isDeleting = false;
        alert('Error al eliminar el espacio. Por favor, intenta nuevamente.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/workspace', this.workspaceId]);
  }
}