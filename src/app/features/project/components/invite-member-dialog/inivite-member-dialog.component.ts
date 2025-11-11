import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { User } from '../../../profile/models/user.interface';
import { UserService } from '../../../profile/services/user.service';
import {  PasswordStrength } from '../../../../core/auth/validator/password-streangt.validator';
interface DialogData {
  projectId: number;
  projectName: string;
}

interface InviteResult {
  user: User;
  rol: number;
  tempPassword?: string;
}

@Component({
  selector: 'app-invite-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <!-- Header inicial -->
      <div class="dialog-header" *ngIf="!tempPasswordGenerated">
        <h2 mat-dialog-title>Invitar miembro al proyecto</h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <!-- Header después de crear usuario -->
      <div class="dialog-header success-header" *ngIf="tempPasswordGenerated">
        <h2 mat-dialog-title>¡Usuario Temporal Creado!</h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <!-- Banner informativo inicial -->
        <div class="info-banner" *ngIf="!tempPasswordGenerated">
          <mat-icon>info</mat-icon>
          <div class="banner-text">
            Usuario temporal: Se creará un usuario con contraseña temporal que deberá cambiar en su primer acceso.
          </div>
        </div>

        <!-- Banner informativo después de crear -->
        <div class="info-banner success-banner" *ngIf="tempPasswordGenerated">
          <mat-icon>info</mat-icon>
          <div class="banner-text">
            Comparte estas credenciales con el usuario de forma segura. Deberá cambiar su contraseña en el primer acceso.
          </div>
        </div>

        <form [formGroup]="inviteForm" class="invite-form">
          <!-- Formulario inicial -->
    
          <div *ngIf="!tempPasswordGenerated">
            <!-- Correo -->
            <div class="form-group">
              <label class="field-label">Correo electrónico*</label>
              <input 
                type="email"
                class="custom-input"
                formControlName="correo"
                placeholder="ejemplo@gmail.com"
                required>
              <div class="error-message" *ngIf="inviteForm.get('correo')?.hasError('required') && inviteForm.get('correo')?.touched">
                El correo es requerido
              </div>
              <div class="error-message" *ngIf="inviteForm.get('correo')?.hasError('email') && inviteForm.get('correo')?.touched">
                Ingresa un correo válido
              </div>
            </div>

            <!-- Elegir rol -->
            <div class="form-group">
              <label class="field-label">Rol en el proyecto*</label>
              <mat-radio-group formControlName="rol" class="role-group">
                <div class="role-option" [class.selected]="inviteForm.get('rol')?.value === 1">
                  <mat-radio-button value="lider">
                    <div class="role-content">
                      <span class="role-name">Líder</span>
                      <span class="role-description">Puede gestionar el proyecto y sus miembros</span>
                    </div>
                  </mat-radio-button>
                </div>
                
                <div class="role-option" [class.selected]="inviteForm.get('rol')?.value ===2">
                  <mat-radio-button value="miembro">
                    <div class="role-content">
                      <span class="role-name">Miembro</span>
                      <span class="role-description">Puede colaborar en tareas del proyecto</span>
                    </div>
                  </mat-radio-button>
                </div>
              </mat-radio-group>
            </div>
          </div>

          <!-- Información de credenciales después de crear -->
          <div class="credentials-section" *ngIf="tempPasswordGenerated">
            <div class="credential-box">
              <label class="credential-label">Correo electrónico</label>
              <div class="credential-display">
                <code>{{ inviteForm.get('correo')?.value }}</code>
                <button 
                  type="button"
                  mat-icon-button 
                  (click)="copyToClipboard(inviteForm.get('correo')?.value, 'Correo copiado')"
                  class="copy-btn">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
            </div>

            <div class="credential-box password-box">
              <label class="credential-label">Contraseña Temporal</label>
              <div class="credential-display">
                <code class="password-code">{{ tempPasswordGenerated }}</code>
                <button 
                  type="button"
                  mat-icon-button 
                  (click)="copyToClipboard(tempPasswordGenerated, 'Contraseña copiada')"
                  class="copy-btn">
                  <mat-icon>content_copy</mat-icon>
                </button>
              </div>
            </div>

            <button 
              type="button"
              mat-stroked-button
              (click)="copyBothCredentials()"
              class="copy-both-btn">
              <mat-icon>content_copy</mat-icon>
              Copiar ambas credenciales
            </button>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions>
        <!-- Botones iniciales -->
        <div class="actions-container" *ngIf="!tempPasswordGenerated">
          <button 
            mat-button
            mat-dialog-close
            class="cancel-btn">
            Cancelar
          </button>
          <button 
            mat-raised-button
            class="invite-btn"
            (click)="inviteMember()"
            [disabled]="inviteForm.invalid || isInviting">
            <mat-icon *ngIf="!isInviting">person_add</mat-icon>
            <mat-icon *ngIf="isInviting" class="spinning">refresh</mat-icon>
            {{ isInviting ? 'Creando...' : 'Crear Usuario Temporal' }}
          </button>
        </div>

        <!-- Botón después de crear -->
        <div class="actions-container centered" *ngIf="tempPasswordGenerated">
          <button 
            mat-raised-button
            (click)="closeWithData()"
            class="confirm-btn">
            <mat-icon>check</mat-icon>
            Entendido
          </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 540px;
      max-width: 90vw;
      border-radius: 16px;
      overflow: hidden;
      background: white;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #40E0D0 0%, #00CED1 100%);
    }

    .success-header {
      background: linear-gradient(135deg, #40E0D0 0%, #00CED1 100%);
      text-align: center;
    }

    h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 500;
      color: white;
    }

    .close-btn {
      color: white;
      margin-right: -8px;
    }

    mat-dialog-content {
      padding: 1.5rem 2rem;
      max-height: 70vh;
      overflow-y: auto;
      background: white;
    }

    .info-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #E0F7F5;
      border: 1px solid #40E0D0;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .info-banner mat-icon {
      color: #5adacdff;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .success-banner {
      background: #E0F7F5;
      border-color: #40E0D0;
    }

    .success-banner mat-icon {
      color: #70cbc2ff;
    }

    .banner-text {
      flex: 1;
      font-size: 0.875rem;
      color: #2c3e50;
      line-height: 1.5;
    }

    .invite-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .field-label {
      font-weight: 500;
      color: #2c3e50;
      font-size: 0.95rem;
    }

    .custom-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1.5px solid #d1d5db;
      border-radius: 12px;
      font-size: 0.95rem;
      color: #1a1a1a;
      background: white;
      transition: all 0.2s;
      font-family: inherit;
    }

    .custom-input::placeholder {
      color: #9ca3af;
      font-weight: 400;
    }

    .custom-input:focus {
      outline: none;
      border-color: #40E0D0;
      box-shadow: 0 0 0 3px rgba(64, 224, 208, 0.1);
    }

    .error-message {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .role-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .role-option {
      padding: 1rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      transition: all 0.2s;
      cursor: pointer;
    }

    .role-option:hover {
      border-color: #40E0D0;
      background: #f0fdf4;
    }

    .role-option.selected {
      border-color: #40E0D0;
      background: #E0F7F5;
      box-shadow: 0 0 0 3px rgba(64, 224, 208, 0.1);
    }

    ::ng-deep .mat-mdc-radio-button.mat-accent {
      --mdc-radio-selected-icon-color: #40E0D0;
      --mdc-radio-selected-hover-icon-color: #00CED1;
      --mdc-radio-selected-pressed-icon-color: #00CED1;
    }

    .role-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-left: 0.5rem;
    }

    .role-name {
      font-weight: 600;
      font-size: 0.95rem;
      color: #1a1a1a;
    }

    .role-description {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .credentials-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .credential-box {
      background: #f8f9fa;
      border: 1.5px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
    }

    .password-box {
      background: #E0F7F5;
      border-color: #40E0D0;
    }

    .credential-label {
      display: block;
      font-weight: 500;
      font-size: 0.85rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .credential-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .credential-display code {
      flex: 1;
      padding: 0.75rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 0.9rem;
      color: #1f2937;
      word-break: break-all;
    }

    .password-code {
      font-weight: 600 !important;
      font-size: 1rem !important;
      color: #00A896 !important;
      letter-spacing: 1px;
    }

    .copy-btn {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      color: #6b7280;
      flex-shrink: 0;
    }

    .copy-btn:hover {
      background: #f9fafb;
      border-color: #40E0D0;
      color: #40E0D0;
    }

    .copy-both-btn {
      width: 100%;
      padding: 0.875rem;
      border: 1.5px solid #40E0D0;
      color: #40E0D0;
      background: white;
      border-radius: 12px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .copy-both-btn:hover {
      background: #E0F7F5;
    }

    mat-dialog-actions {
      padding: 1.5rem 2rem;
      display: flex;
      background: #f8f9fa;
      border-top: 1px solid #e5e7eb;
    }

    .actions-container {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      width: 100%;
    }

    .actions-container.centered {
      justify-content: center;
    }

    .cancel-btn {
      padding: 0.5rem 1.5rem;
      color: #6b7280;
      font-weight: 500;
    }

    .invite-btn {
      padding: 0.625rem 2rem;
      font-size: 0.95rem;
      font-weight: 500;
      background: linear-gradient(135deg, #40E0D0 0%, #00CED1 100%) !important;
      color: white !important;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
      transition: all 0.2s;
    }

    .invite-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(64, 224, 208, 0.4);
    }

    .invite-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .confirm-btn {
      padding: 0.625rem 3rem;
      font-size: 0.95rem;
      font-weight: 500;
      background: linear-gradient(135deg, #40E0D0 0%, #00CED1 100%) !important;
      color: white !important;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(64, 224, 208, 0.3);
    }

    .confirm-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(64, 224, 208, 0.4);
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

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

    mat-dialog-content::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class InviteMemberDialogComponent implements OnInit {
  inviteForm: FormGroup;
  isInviting = false;
  tempPasswordGenerated: string = '';
  createdUserData: InviteResult | null = null;
  passwordStrengthInfo: PasswordStrength = {
    hasExactLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    strength: 0
  };
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InviteMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.inviteForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      rol: ['null', [Validators.required]]
    });
  }

  ngOnInit(): void {
    console.log('Invitando miembro al proyecto:', this.data.projectName);
  }

  copyToClipboard(text: string, message: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open(message, 'OK', {
        duration: 2000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
        panelClass: ['success-snackbar']
      });
    }).catch(err => {
      console.error('Error al copiar:', err);
    });
  }
  copyBothCredentials(): void {
    const credentials = `Correo: ${this.inviteForm.get('correo')?.value}\nContraseña temporal: ${this.tempPasswordGenerated}`;
    this.copyToClipboard(credentials, '✓ Credenciales copiadas');
  }

  inviteMember(): void {
  if (this.inviteForm.invalid) {
    console.warn('Formulario inválido');
    return;
  }

  this.isInviting = true;
  const formData = this.inviteForm.value;
  


  const tempUserData = { 
    correo: formData.correo
  };

  console.log('Creando usuario temporal con:', tempUserData);

  this.userService.createTemporalUser(tempUserData).subscribe({
    next: (response) => {
      console.log('Respuesta del servidor:', response);
      
      let userData: User;
      if (response.user) {
          userData = {
            id_usuario: response.user.id_usuario!,
            email: response.user.correo || response.user.email!,
            username: response.user.username || response.user.nombre || response.user.correo?.split('@')[0],
            es_temporal: response.user.es_temporal !== false
          };
        } else {
          userData = {
            id_usuario: response.id_usuario!,
            email: response.email || response.correo!,
            username: response.username || response.email?.split('@')[0] || response.correo?.split('@')[0],
            es_temporal: response.es_temporal !== false
          };
        }


      this.tempPasswordGenerated =  response.user?.password || response.password || '';;
      
      this.createdUserData = {
        user: userData,
        rol: formData.rol,
        tempPassword: this.tempPasswordGenerated
      };
      
      console.log('Usuario creado:', userData);
      console.log('Contraseña temporal:', this.tempPasswordGenerated);
      console.log('Datos guardados:', this.createdUserData);
      this.isInviting = false;
    
      this.snackBar.open(
        '✓ Usuario temporal creado exitosamente', 
        'OK', 
        { 
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          panelClass: ['success-snackbar']
        }
      );
    },
    error: (error) => {
      console.error('Error creando usuario temporal:', error);
      this.isInviting = false;
      
      let errorMessage = 'Error al invitar el miembro. Por favor, intenta nuevamente.';
      
      if (error.status === 409) {
        errorMessage = 'Este correo ya está registrado. Búscalo en la lista de usuarios existentes.';
      } else if (error.status === 400) {
        errorMessage = 'Correo inválido. Verifica el formato del correo electrónico.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      }
      
      this.snackBar.open(errorMessage, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
    }
  });
}

closeWithData(): void {
  console.log('Cerrando diálogo con datos:', this.createdUserData);
  
  if (this.createdUserData) {
    this.dialogRef.close(this.createdUserData);
  } else {
    console.warn('No hay datos de usuario creado');
    this.dialogRef.close();
  }
}
}