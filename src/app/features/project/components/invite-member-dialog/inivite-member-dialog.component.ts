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

interface DialogData {
  projectId: number;
  projectName: string;
}

interface InviteResult {
  user: User;
  rol: 'lider' | 'miembro';
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
      <div class="dialog-header">
        <h2 mat-dialog-title>Invitar miembro al proyecto</h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="info-banner">
          <mat-icon>info</mat-icon>
          <div class="banner-text">
            <strong>Usuario temporal:</strong> Se creará un usuario con contraseña temporal que deberá cambiar en su primer acceso.
          </div>
        </div>

        <form [formGroup]="inviteForm" class="invite-form">
          <!-- Correo -->
          <div class="form-group">
            <label class="field-label">Correo electrónico *</label>
            <input 
              type="email"
              class="custom-input"
              formControlName="correo"
              placeholder="ejemplo@email.com"
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
            <label class="field-label">Rol en el proyecto *</label>
            <mat-radio-group formControlName="rol" class="role-group">
              <div class="role-option" [class.selected]="inviteForm.get('rol')?.value === 'lider'">
                <mat-radio-button value="lider" class="role-radio">
                  <div class="role-content">
                    <span class="role-name">Líder</span>
                    <span class="role-description">Puede gestionar el proyecto y sus miembros</span>
                  </div>
                </mat-radio-button>
              </div>
              
              <div class="role-option" [class.selected]="inviteForm.get('rol')?.value === 'miembro'">
                <mat-radio-button value="miembro" class="role-radio">
                  <div class="role-content">
                    <span class="role-name">Miembro</span>
                    <span class="role-description">Puede colaborar en tareas del proyecto</span>
                  </div>
                </mat-radio-button>
              </div>
            </mat-radio-group>
          </div>

          <!-- Información de contraseña temporal -->
          <div class="password-info" *ngIf="tempPasswordGenerated">
            <div class="password-header">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <strong>¡Usuario temporal creado!</strong>
            </div>
            <div class="info-content">
              <div class="credential-row">
                <strong>Correo:</strong>
                <code>{{ inviteForm.get('correo')?.value }}</code>
              </div>
              <div class="credential-row">
                <strong>Contraseña temporal:</strong>
                <div class="password-display">
                  <code>{{ tempPasswordGenerated }}</code>
                  <button 
                    type="button"
                    mat-icon-button 
                    (click)="copyPassword()"
                    matTooltip="Copiar contraseña">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
              </div>
              <div class="warning-text">
                <mat-icon>warning</mat-icon>
                <small>Guarda esta contraseña. El usuario deberá cambiarla en su primer acceso.</small>
              </div>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions>
        <button 
          mat-button
          mat-dialog-close
          class="cancel-btn"
          *ngIf="!tempPasswordGenerated">
          Cancelar
        </button>
        <button 
          mat-raised-button
          class="invite-btn"
          (click)="inviteMember()"
          [disabled]="inviteForm.invalid || isInviting"
          *ngIf="!tempPasswordGenerated">
          <mat-icon *ngIf="!isInviting">person_add</mat-icon>
          <mat-icon *ngIf="isInviting" class="spinning">refresh</mat-icon>
          {{ isInviting ? 'Creando...' : 'Crear Usuario Temporal' }}
        </button>
        

      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      width: 550px;
      max-width: 90vw;
      border-radius: 10px;
      overflow: hidden;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background:  #6878DB;
    }

    h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
      color: white;
    }

    .close-btn {
      color: white;
      margin-right: -12px;
    }

    mat-dialog-content {
      padding: 1.25rem 1.5rem;
      max-height: 70vh;
      overflow-y: auto;
      background: #f8f9fa;
    }

    .info-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #e3f2fd;
      border: 1px solid #90caf9;
      border-radius: 12px;
      margin-bottom: 1.25rem;
    }

    .info-banner mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .banner-text {
      flex: 1;
      font-size: 0.8rem;
      color: #0d47a1;
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
      font-weight: 600;
      color: #1a1a1a;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .custom-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e1e5e9;
      border-radius: 12px;
      font-size: 0.95rem;
      color: #1a1a1a;
      background: white;
      transition: all 0.2s;
      font-family: inherit;
    }

    .custom-input::placeholder {
      color: #cbd5e0;
      font-weight: 400;
    }

    .custom-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
      border: 2px solid #e1e5e9;
      border-radius: 12px;
      background: white;
      transition: all 0.2s;
      cursor: pointer;
    }

    .role-option:hover {
      border-color: #cbd5e0;
      background: #f8f9fa;
    }

    .role-option.selected {
      border-color: #667eea;
      background: #f0f4ff;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .role-radio {
      width: 100%;
    }

    .role-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-left: 0.5rem;
    }

    .role-name {
      font-weight: 600;
      font-size: 1rem;
      color: #1a1a1a;
    }

    .role-description {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .password-info {
      padding: 1.25rem;
      background: #93d2ffff;
      border: 2px solid #93d2ffff;
      border-radius: 12px;
    }

    .password-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1rem;
      color: #184d9dff;
    }

    .success-icon {
      color: #294cccff;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.875rem;
      color: #aaaaaaff;
    }

    .credential-row {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .credential-row strong {
      color: #21569cff;
      font-size: 0.85rem;
    }

    .credential-row code {
      display: inline-block;
      padding: 0.5rem;
      background: white;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #aaaaaaff;
      font-family: 'Courier New', monospace;
    }

    .password-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .password-display code {
      flex: 1;
      font-size: 1.1rem;
      font-weight: 700;
      color: #cdcdcdff;
      padding: 0.75rem;
      letter-spacing: 0.5px;
    }

    .password-display button {
      background: white;
      border: 1px solid #386fc3ff;
    }

    .warning-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 6px;
      margin-top: 0.5rem;
    }

    .warning-text mat-icon {
      color: #f59e0b;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .warning-text small {
      color: #92400e;
      font-size: 0.8rem;
    }

    mat-dialog-actions {
      padding: 1.5rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      background: #f8f9fa;
      border-top: 1px solid #e1e5e9;
    }

    .cancel-btn {
      padding: 0.5rem 1.5rem;
    }

    .invite-btn {
      padding: 0.5rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      background: linear-gradient(135deg, #00d4aa 0%, #00c4cc 100%) !important;
      color: white !important;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
      transition: all 0.2s;
    }

    .invite-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 212, 170, 0.4);
    }

    .invite-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
export class InviteMemberDialogComponent implements OnInit {
  inviteForm: FormGroup;
  isInviting = false;
  tempPasswordGenerated: string = '';

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InviteMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.inviteForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      rol: ['miembro', [Validators.required]]
    });
  }

  ngOnInit(): void {
    console.log('Invitando miembro al proyecto:', this.data.projectName);
  }

  copyPassword(): void {
    if (this.tempPasswordGenerated) {
      navigator.clipboard.writeText(this.tempPasswordGenerated).then(() => {
        this.snackBar.open('Contraseña copiada al portapapeles', 'OK', {
          duration: 2000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      });
    }
  }

  inviteMember(): void {
    if (this.inviteForm.invalid) {
      console.warn('Formulario inválido');
      return;
    }

    this.isInviting = true;
    const formData = this.inviteForm.value;

    // Crear usuario temporal con solo el correo
    const tempUserData = { 
      correo: formData.correo 
    };

    console.log('Creando usuario temporal con:', tempUserData);

    this.userService.createTemporalUser(tempUserData).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        
        // Extraer los datos del usuario y la contraseña
        let userData: User;
        let passwordTemp: string = '';
        
        if (response.user) {
          // La contraseña está dentro de response.user.password
          passwordTemp = response.user.password || response.user.contrasena_temporal || '';
          
          // Crear el objeto User sin incluir password (ya que User interface no lo tiene)
          userData = {
            id_usuario: response.user.id_usuario!,
            email: response.user.correo || response.user.email!,
            username: response.user.username || response.user.nombre || response.user.correo?.split('@')[0],
            es_temporal: response.user.es_temporal !== false
          };
        } else {
          // Caso directo (menos probable)
          passwordTemp = response.password || response.contrasena_temporal || '';
          
          userData = {
            id_usuario: response.id_usuario!,
            email: response.email || response.correo!,
            username: response.username || response.email?.split('@')[0] || response.correo?.split('@')[0],
            es_temporal: response.es_temporal !== false
          };
        }

        // Guardar la contraseña temporal para mostrarla
        this.tempPasswordGenerated = passwordTemp;
        
        console.log('Usuario creado:', userData);
        console.log('Contraseña temporal extraída:', this.tempPasswordGenerated);
        console.log('Email del usuario:', userData.email);
        
        // Mostrar notificación de éxito con la contraseña
        const message = this.tempPasswordGenerated 
          ? `Usuario creado: ${userData.email}\nContraseña: ${this.tempPasswordGenerated}`
          : `Usuario temporal creado: ${userData.email}`;
        
        this.snackBar.open(
          message, 
          'OK', 
          { 
            duration: 8000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          }
        );

        // Preparar resultado con el formato correcto
        const result: InviteResult = {
          user: userData,
          rol: formData.rol,
          tempPassword: this.tempPasswordGenerated
        };

        // Esperar un momento para que el usuario vea la contraseña
        setTimeout(() => {
          this.isInviting = false;
          this.dialogRef.close(result);
        }, 500);
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
          verticalPosition: 'top'
        });
      }
    });
  }
}