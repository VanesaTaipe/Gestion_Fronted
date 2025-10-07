import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { title } from 'process';

@Component({
  selector: 'app-create-workspace-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header -->
      <div class="dialog-header">
        <h2 mat-dialog-title>Completa los detalles para crear un nuevo espacio.</h2>
      </div>
      <!-- Form content -->
      <mat-dialog-content class="dialog-content">
        <form [formGroup]="workspaceForm" class="workspace-form">
          
          <div class="form-group">
            <label class="form-label">Título del espacio</label>
            <div class="input-container">
              <input 
                class="custom-input"
                placeholder="Ingresa el nombre del espacio"
                formControlName="title"
                maxlength="100">
            </div>
            <div class="error-message" *ngIf="workspaceForm.get('title')?.hasError('required') && workspaceForm.get('title')?.touched">
              El título es requerido
            </div>
            <div class="error-message" *ngIf="workspaceForm.get('title')?.hasError('minlength') && workspaceForm.get('title')?.touched">
              El título debe tener al menos 3 caracteres
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción del espacio</label>
            <div class="input-container">
              <input 
                class="custom-input"
                placeholder="Ingresa el nombre del espacio"
                formControlName="description"
                maxlength="500">
            </div>
            <div class="error-message" *ngIf="workspaceForm.get('description')?.hasError('required') && workspaceForm.get('description')?.touched">
              La descripción es requerida
            </div>
            <div class="error-message" *ngIf="workspaceForm.get('description')?.hasError('minlength') && workspaceForm.get('description')?.touched">
              La descripción debe tener al menos 10 caracteres
            </div>
          </div>

        </form>
      </mat-dialog-content>

      <!-- Action buttons -->
      <mat-dialog-actions class="dialog-actions">
        <button 
          class="cancel-button"
          (click)="onCancel()">
          Cancelar
        </button>
        <button 
          class="create-button"
          (click)="onSubmit()"
          [disabled]="!workspaceForm.valid || isLoading">
          {{ isLoading ? 'Creando...' : 'Crear Espacio' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 2rem;
      background: white;
      border-radius: 16px;
    }

    .dialog-header {
      text-align: center;
      margin-bottom: 0.8rem;
      font-size: 0.9rem;
    }

    h2 {
      font-size: 0.18rem;
      font-weight: 400;
      color: #333;
      margin: 0;
      line-height: 1.4;
    }

    .dialog-content {
      padding: 0;
      margin-bottom: 3rem;
    }

    .workspace-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .form-label {
      font-size: 0.9rem;
      font-weight: 500;
      color: #333;
      margin: 0;
    }

    .input-container {
      position: relative;
    }

    .custom-input {
      width: 100%;
      padding: 1rem 1.2rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 25px;
      font-size: 0.9rem;
      outline: none;
      transition: all 0.3s ease;
      background: white;
      box-sizing: border-box;
    }

    .custom-input::placeholder {
      color: #aaa;
    }

    .custom-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .error-message {
      font-size: 0.8rem;
      color: #e53e3e;
      margin-top: 0.3rem;
    }

    .dialog-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      padding: 0;
      margin: 0;
    }

    .cancel-button {
      padding: 0.8rem 2rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 25px;
      background: white;
      color: #666;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 120px;
    }

    .cancel-button:hover {
      border-color: #bbb;
      background-color: #f8f8f8;
    }

    .create-button {
      padding: 0.8rem 2rem;
      border: none;
      border-radius: 25px;
      background: #4fd1c7;
      color: white;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 140px;
    }

    .create-button:hover:not([disabled]) {
      background: #45b7ae;
      transform: translateY(-1px);
    }

    .create-button[disabled] {
      background: #ccc;
      color: #666;
      cursor: not-allowed;
    }

 
    @media (max-width: 500px) {
      .dialog-container {
        padding: 1.5rem;
        margin: 1.5rem;
      }

      .dialog-actions {
        flex-direction: column;
        gap: 0.8rem;
      }

      .cancel-button,
      .create-button {
        width: 100%;
        min-width: unset;
      }

      h2 {
        font-size: 00.18rem;
      }
    }

    
    ::ng-deep .mat-mdc-dialog-container {
      padding: 0 !important;
      border-radius: 16px !important;
      overflow: visible !important;
    }

    ::ng-deep .mat-mdc-dialog-surface {
      border-radius: 16px !important;
      padding: 0 !important;
    }

    ::ng-deep .mat-mdc-dialog-content {
      padding: 0 !important;
      margin: 0 !important;
      max-height: unset !important;
    }

    ::ng-deep .mat-mdc-dialog-actions {
      padding: 0 !important;
      margin: 0 !important;
      min-height: unset !important;
    }

    ::ng-deep .mat-mdc-dialog-title {
      padding: 0 !important;
      margin: 0 !important;
    }
  `]
})
export class CreateWorkspaceDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CreateWorkspaceDialogComponent>);

  isLoading = false;

  workspaceForm: FormGroup = this.fb.group({
    title: ['', [
      Validators.required, 
      Validators.minLength(3),
      Validators.maxLength(100)
    ]],
    description: ['', [
      Validators.required, 
      Validators.minLength(10),
      Validators.maxLength(500)
    ]]
  });

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.workspaceForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      
      setTimeout(() => {
        const formData = this.workspaceForm.value;
        this.dialogRef.close({
          title: formData.title.trim(),
          description: formData.description.trim()
        });
        this.isLoading = false;
      }, 1000);
    } else {
      // Marcar todos los campos como touched para mostrar errores
      this.workspaceForm.markAllAsTouched();
    }
  }
}