import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { UserService as ProfileUserService } from '../features/profile/services/user.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule
  ],
  template: `
  <div class="min-h-screen flex">
    <!-- Lado izquierdo - Imagen -->
    <div class="hidden lg:flex lg:w-1/2 bg-cover bg-center" 
         style="background-image: url('assets/im-re-lo.png');"></div>

    <!-- Lado derecho - Formulario -->
    <div class="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-8">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="flex justify-center mb-8">
          <img src="assets/kanban-logo.png" alt="kanban logo" class="w-24 h-24">
        </div>

        <!-- ============================================ -->
        <!-- PASO 1: BUSCAR CORREO -->
        <!-- ============================================ -->
        <div *ngIf="step === 'search'">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
              ¿Olvidaste la contraseña?
            </h1>
            <p class="text-gray-600">
              Ingresa tu correo para buscar tu cuenta
            </p>
          </div>

          <form [formGroup]="searchForm" (ngSubmit)="searchUser()" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Correo electrónico
              </label>
              <input
                formControlName="correo"
                placeholder="ejemplo@correo.com"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-[#40E0D0] focus:outline-none"
                type="email" />
              <div 
                *ngIf="searchForm.get('correo')?.touched && searchForm.get('correo')?.invalid"
                class="text-red-500 text-sm mt-1 ml-4">
                Ingresa un correo válido
              </div>
            </div>

            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {{ errorMessage }}
            </div>

            <button
              type="submit"
              [disabled]="!searchForm.valid || isSearching"
              class="w-full bg-[#40E0D0] hover:bg-[#38c9b8] text-black font-semibold py-3 px-6 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {{ isSearching ? 'Buscando...' : 'Buscar cuenta' }}
            </button>

            <div class="text-center">
              <a routerLink="/login" class="text-[#40E0D0] hover:text-[#38c9b8] font-medium">
                ← Volver al inicio de sesión
              </a>
            </div>
          </form>
        </div>

        <!-- ============================================ -->
        <!-- PASO 2: ACTUALIZAR INFORMACIÓN -->
        <!-- ============================================ -->
        <div *ngIf="step === 'update'">
          <!-- Header dinámico -->
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">
              {{ isTemporalUser ? '¡Bienvenido!' : 'Cambiar contraseña' }}
            </h1>
            <p class="text-gray-600">
              {{ isTemporalUser ? 'Completa tu perfil para comenzar' : 'Actualiza tu contraseña' }}
            </p>
          </div>

          <!-- Banner con info del usuario -->
          <div class="bg-[#E0F7F5] border border-[#40E0D0] rounded-lg p-4 mb-6">
            <div class="flex items-center gap-2">
              <mat-icon class="text-[#40E0D0]">check_circle</mat-icon>
              <div class="flex-1">
                <p class="font-medium">
                  {{ isTemporalUser ? 'Usuario temporal' : foundUserName }}
                </p>
                <p class="text-sm text-gray-600">{{ foundUserEmail }}</p>
              </div>
            </div>
          </div>

          <!-- Formulario de actualización -->
          <form [formGroup]="updateForm" (ngSubmit)="updateUserInfo()" class="space-y-6">
            
            <!-- Campo NOMBRE - Solo si es usuario temporal -->
            <div *ngIf="isTemporalUser">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Ingresa tu nombre *
              </label>
              <input
                formControlName="nombre"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-[#40E0D0] focus:outline-none"
                type="text" />
              <div 
                *ngIf="updateForm.get('nombre')?.touched && updateForm.get('nombre')?.invalid"
                class="text-red-500 text-sm mt-1 ml-4">
                El nombre debe tener al menos 3 caracteres
              </div>
              <p class="text-xs text-gray-500 mt-1 ml-4">
              </p>
            </div>

            <!-- Campo NUEVA CONTRASEÑA - Siempre visible -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ isTemporalUser ? 'Crea tu contraseña *' : 'Nueva contraseña *' }}
              </label>
              <div class="relative">
                <input
                  formControlName="newPassword"
                  [type]="showPassword ? 'text' : 'password'"
                  placeholder="Mínimo 6 caracteres"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-[#40E0D0] focus:outline-none pr-12" />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              <div 
                *ngIf="updateForm.get('newPassword')?.touched && updateForm.get('newPassword')?.invalid"
                class="text-red-500 text-sm mt-1 ml-4">
                La contraseña debe tener al menos 6 caracteres
              </div>
            </div>

            <!-- Campo CONFIRMAR CONTRASEÑA - Siempre visible -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Confirmar contraseña *
              </label>
              <div class="relative">
                <input
                  formControlName="confirmPassword"
                  [type]="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Repite tu contraseña"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-[#40E0D0] focus:outline-none pr-12" />
                <button
                  type="button"
                  (click)="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition">
                  <mat-icon>{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              <div 
                *ngIf="updateForm.hasError('passwordMismatch') && updateForm.get('confirmPassword')?.touched"
                class="text-red-500 text-sm mt-1 ml-4">
                Las contraseñas no coinciden
              </div>
            </div>

            <!-- Mensaje de error -->
            <div *ngIf="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <mat-icon class="text-red-500 mt-0.5">error</mat-icon>
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Botón de envío -->
            <button
              type="submit"
              [disabled]="!updateForm.valid || isUpdating"
              class="w-full bg-[#40E0D0] hover:bg-[#38c9b8] text-black font-semibold py-3 px-6 rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
              {{ isUpdating ? 'Guardando...' : (isTemporalUser ? 'Completar perfil' : 'Cambiar contraseña') }}
            </button>

            <!-- Banner informativo para usuarios temporales -->
            <div *ngIf="isTemporalUser" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="flex items-start gap-2">
                <mat-icon class="text-blue-500 text-xl">info</mat-icon>
                <p class="text-sm text-gray-700">
                  <strong>Primera vez aquí:</strong> Completa tu nombre y crea una contraseña segura. Podrás iniciar sesión con estos datos.
                </p>
              </div>
            </div>
          </form>
        </div>

        <!-- ============================================ -->
        <!-- PASO 3: ÉXITO -->
        <!-- ============================================ -->
        <div *ngIf="step === 'success'" class="text-center space-y-6">
          <!-- Ícono de éxito -->
          <div class="w-20 h-20 bg-[#E0F7F5] rounded-full flex items-center justify-center mx-auto">
            <mat-icon class="text-[#40E0D0] text-5xl">check_circle</mat-icon>
          </div>
          
          <!-- Mensaje de éxito -->
          <div>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">
              {{ isTemporalUser ? '¡Perfil completado!' : '¡Contraseña actualizada!' }}
            </h2>
            <p class="text-gray-600">
              {{ isTemporalUser 
                ? 'Tu perfil se ha configurado correctamente. Ya puedes iniciar sesión con tus nuevas credenciales.' 
                : 'Tu contraseña se ha actualizado correctamente. Ya puedes iniciar sesión con tu nueva contraseña.' }}
            </p>
          </div>

          <!-- Botón para ir al login -->
          <button
            (click)="goToLogin()"
            class="w-full bg-[#40E0D0] hover:bg-[#38c9b8] text-black font-semibold py-3 px-6 rounded-full transition-colors">
            Ir a iniciar sesión
          </button>
        </div>

      </div>
    </div>
  </div>
`,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private userService = inject(ProfileUserService);

  step: 'search' | 'update' | 'success' = 'search';
  
  searchForm: FormGroup;
  updateForm: FormGroup;
  
  isSearching = false;
  isUpdating = false;
  errorMessage = '';
  
  foundUserId: number | null = null;
  foundUserEmail = '';
  foundUserName = '';
  isTemporalUser = false;
  
  showPassword = false;
  showConfirmPassword = false;

  constructor() {
    this.searchForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]]
    });

    this.updateForm = this.fb.group({
      nombre: [''], 
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  searchUser(): void {
  if (this.searchForm.invalid) return;

  this.isSearching = true;
  this.errorMessage = '';
  const correo = this.searchForm.value.correo.trim();

  console.log('Buscando usuario:', correo);

  this.userService.searchUsers(correo).subscribe({
    next: (users) => {
      console.log('Usuarios encontrados:', users);
      
      const user = users.find(u => u.email.toLowerCase() === correo.toLowerCase());
      
      if (user && user.id_usuario) {
        console.log('Usuario encontrado:', user);
        this.foundUserId = user.id_usuario;
        this.foundUserEmail = user.email;
        this.foundUserName = user.username ||  '';
        console.log('Nombre encontrado:', this.foundUserName);
        console.log('Nombre trimmed:', this.foundUserName.trim());
        console.log('¿Es "Temporal"?:', this.foundUserName.trim() === 'Temporal');
        
        // Detectar si es usuario temporal
        this.isTemporalUser = this.foundUserName.trim() === 'Temporal';
        
        console.log('isTemporalUser =', this.isTemporalUser);
       
        
        // Configurar validaciones dinámicas
        const nombreControl = this.updateForm.get('nombre');
        
        if (this.isTemporalUser) {
          console.log('Usuario temporal - campo nombre REQUERIDO');
          nombreControl?.setValidators([Validators.required, Validators.minLength(3)]);
          nombreControl?.setValue('');
        } else {
          console.log('Usuario con nombre - campo nombre NO requerido');
          nombreControl?.clearValidators();
          nombreControl?.setValue(this.foundUserName);
        }
        
        nombreControl?.updateValueAndValidity();
        
        this.step = 'update';
      } else {
        this.errorMessage = 'No se encontró una cuenta con ese correo';
      }
      
      this.isSearching = false;
    },
    error: (error) => {
      console.error('Error buscando usuario:', error);
      this.errorMessage = 'No se encontró una cuenta con ese correo';
      this.isSearching = false;
    }
  });
}

  updateUserInfo(): void {
    if (this.updateForm.invalid || !this.foundUserId) {
      console.warn('Formulario inválido');
      return;
    }

    this.isUpdating = true;
    this.errorMessage = '';
    
    const password = this.updateForm.value.newPassword;
    const nombre = this.updateForm.value.nombre?.trim();

    console.log('Actualizando usuario ID:', this.foundUserId);
    console.log('Nueva contraseña:', password.length, 'caracteres');
    
    const updateData: { nombre?: string; password: string } = {
      password: password
    };
    
    if (this.isTemporalUser && nombre) {
      updateData.nombre = nombre;
      console.log(' Nuevo nombre:', nombre);
    } else {
      console.log('Solo actualizando contraseña (usuario ya tiene nombre)');
    }

    this.userService.updateUser(this.foundUserId, updateData).subscribe({
      next: (response) => {
        console.log('Información actualizada:', response);
        this.step = 'success';
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Error completo:', error);
        
        let mensaje = 'Error al guardar los cambios.';
        
        if (error.status === 404) {
          mensaje = 'Usuario no encontrado.';
        } else if (error.status === 422) {
          mensaje = 'Datos inválidos. Verifica la información ingresada.';
        } else if (error.error?.error) {
          mensaje = error.error.error;
        }
        
        this.errorMessage = mensaje;
        this.isUpdating = false;
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}