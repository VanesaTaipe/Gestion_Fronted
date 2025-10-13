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
      <!-- Header -->
      <div class="settings-header">
        <div class="header-content">
          <div class="logo-container">
            <img src="assets/kanban-logo.png" alt="Logo" class="logo">
          </div>
          <div class="header-title">
            <svg class="settings-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <h1>Configuración</h1>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-container">
        <p>Cargando configuración...</p>
      </div>

      <!-- Form Section -->
      <div class="form-section" *ngIf="!isLoading && workspace && workspaceForm">
        <h2 class="section-title">Espacio</h2>

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
              rows="3"></textarea>
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
            {{ isUpdating ? 'Actualizando...' : 'Editar ✓' }}
          </button>
        </form>
      </div>

      <!-- Danger Zone -->
      <div class="danger-zone" *ngIf="!isLoading">
        <h3 class="danger-title">Zona del peligro</h3>
        <button 
          class="delete-button"
          (click)="confirmDelete()"
          [disabled]="isDeleting">
          {{ isDeleting ? 'Eliminando...' : 'Eliminar espacio' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: 100vh;
      background: white;
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
      font-size: 1.1rem;
      color: #666;
    }

    .settings-header {
      margin-bottom: 3rem;
      text-align: center;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .logo-container {
      display: flex;
      justify-content: center;
    }

    .logo {
      width: 80px;
      height: 80px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      justify-content: center;
    }

    .settings-icon {
      width: 28px;
      height: 28px;
      color: #333;
    }

    .header-title h1 {
      font-size: 1.8rem;
      font-weight: 600;
      color: #333;
      margin: 0;
    }

    .form-section {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 3rem;
      border: 1px solid #e0e0e0;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 2rem;
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
      font-size: 0.95rem;
      font-weight: 500;
      color: #333;
    }

    .form-input {
      width: 100%;
      padding: 0.8rem 1rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .form-input:focus {
      border-color: #40E0D0;
      box-shadow: 0 0 0 3px rgba(64, 224, 208, 0.1);
    }

    .error-message {
      font-size: 0.85rem;
      color: #e53e3e;
      margin-top: 0.25rem;
    }

    .edit-button {
      align-self: flex-start;
      padding: 0.8rem 2.5rem;
      background: #40E0D0;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 1rem;
    }

    .edit-button:hover:not([disabled]) {
      background: #38c9b8;
      transform: translateY(-1px);
    }

    .edit-button[disabled] {
      background: #ccc;
      cursor: not-allowed;
    }

    .danger-zone {
      background: white;
      border: 2px solid #fee;
      border-radius: 12px;
      padding: 2rem;
      margin-top: 3rem;
    }

    .danger-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #e53e3e;
      margin-bottom: 1rem;
    }

    .delete-button {
      background: #e53e3e;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.8rem 2rem;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .delete-button:hover:not([disabled]) {
      background: #c53030;
      transform: translateY(-1px);
    }

    .delete-button[disabled] {
      background: #ccc;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: 1rem;
      }

      .header-title h1 {
        font-size: 1.5rem;
      }

      .form-section {
        padding: 1.5rem;
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
    
    // Obtener el ID del workspace desde la URL
    this.route.params.subscribe(params => {
      this.workspaceId = +params['id'];
      console.log('🆔 Workspace ID desde URL:', this.workspaceId);
      
      if (this.workspaceId && this.workspaceId > 0) {
        this.loadWorkspace();
      } else {
        console.error('❌ ID de workspace inválido');
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
    console.log('📡 Cargando información del espacio ID:', this.workspaceId);
    this.isLoading = true;
    
    this.workspaceService.getWorkspaceById(this.workspaceId).subscribe({
      next: (workspace) => {
        console.log('✅ Datos del espacio recibidos:', workspace);
        
        this.workspace = workspace;
        
        // Cargar datos en el formulario
        this.workspaceForm.patchValue({
          nombre: workspace.nombre || '',
          descripcion: workspace.descripcion || ''
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar el espacio:', error);
        this.isLoading = false;
        alert('Error al cargar la configuración del espacio');
        this.goBack();
      }
    });
  }

  updateWorkspace(): void {
    if (this.workspaceForm.valid && !this.isUpdating) {
      this.isUpdating = true;
      
      const updateData = {
        title: this.workspaceForm.value.nombre.trim(),
        description: this.workspaceForm.value.descripcion.trim()
      };

      this.workspaceService.updateWorkspace(this.workspaceId, updateData).subscribe({
        next: (updatedWorkspace) => {
          console.log('✅ Espacio actualizado exitosamente:', updatedWorkspace);
          this.workspace = updatedWorkspace;
          this.isUpdating = false;
          alert('✅ Espacio actualizado exitosamente');
        },
        error: (error) => {
          console.error('❌ Error al actualizar el espacio:', error);
          this.isUpdating = false;
          alert('❌ Error al actualizar el espacio. Por favor, intenta nuevamente.');
        }
      });
    } else {
      this.workspaceForm.markAllAsTouched();
    }
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

  deleteWorkspace(): void {
    this.isDeleting = true;
    
    this.workspaceService.deleteWorkspace(this.workspaceId).subscribe({
      next: () => {
        console.log('✅ Espacio eliminado exitosamente');
        alert('✅ Espacio eliminado exitosamente');
        this.router.navigate(['/workspace']);
      },
      error: (error) => {
        console.error('❌ Error al eliminar el espacio:', error);
        this.isDeleting = false;
        alert('❌ Error al eliminar el espacio. Por favor, intenta nuevamente.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/workspace', this.workspaceId]);
  }
}