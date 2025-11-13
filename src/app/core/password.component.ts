import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { UserService as ProfileUserService } from '../features/profile/services/user.service';
import { passwordStrengthValidator, getPasswordStrength, PasswordStrength } from './auth/validator/password-streangt.validator';

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
    <div class="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center p-8 overflow-y-auto max-h-screen">
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

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                  DNI
              </label>
              <input
                formControlName="dni"
                placeholder="Ingresa tu DNI"
                maxlength="8"
                class="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-[#40E0D0] focus:outline-none"
                type="text" />
              <div 
                *ngIf="searchForm.get('dni')?.touched && searchForm.get('dni')?.invalid"
                class="text-red-500 text-sm mt-1 ml-4">
                Ingresa un DNI válido de 8 dígitos
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

            <!-- Campo NUEVA CONTRASEÑA - Siempre visible -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ isTemporalUser ? 'Crea tu contraseña *' : 'Nueva contraseña *' }}
              </label>
              <div class="relative">
                <input
                  formControlName="newPassword"
                  [type]="showPassword ? 'text' : 'password'"
                  placeholder="Debe cumplir con los requisitos"
                  class="w-full px-4 py-3 border-2 border-gray-300 rounded-full focus:border-[#40E0D0] focus:outline-none pr-12" />
                <button
                  type="button"
                  (click)="showPassword = !showPassword"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
              
              <!-- Indicador de fortaleza de contraseña -->
              <div *ngIf="updateForm.get('newPassword')?.value" class="mt-3 space-y-2">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all duration-300"
                      [style.width.%]="passwordStrength.strength"
                      [style.background-color]="getStrengthColor()">
                    </div>
                  </div>
                  <span 
                    class="text-xs font-medium"
                    [style.color]="getStrengthColor()">
                    {{ getStrengthText() }}
                  </span>
                </div>
                
                <div class="space-y-1 text-xs ml-4">
                  <div class="flex items-center gap-2" [class.text-green-600]="passwordStrength.hasExactLength" [class.text-gray-500]="!passwordStrength.hasExactLength">
                    <mat-icon class="text-base">{{ passwordStrength.hasExactLength ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>Exactamente 6 caracteres</span>
                  </div>
                  <div class="flex items-center gap-2" [class.text-green-600]="passwordStrength.hasUpperCase" [class.text-gray-500]="!passwordStrength.hasUpperCase">
                    <mat-icon class="text-base">{{ passwordStrength.hasUpperCase ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>Al menos una mayúscula</span>
                  </div>
                  <div class="flex items-center gap-2" [class.text-green-600]="passwordStrength.hasLowerCase" [class.text-gray-500]="!passwordStrength.hasLowerCase">
                    <mat-icon class="text-base">{{ passwordStrength.hasLowerCase ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>Al menos una minúscula</span>
                  </div>
                  <div class="flex items-center gap-2" [class.text-green-600]="passwordStrength.hasNumber" [class.text-gray-500]="!passwordStrength.hasNumber">
                    <mat-icon class="text-base">{{ passwordStrength.hasNumber ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>Al menos un número</span>
                  </div>
                  <div class="flex items-center gap-2" [class.text-green-600]="passwordStrength.hasSpecialChar" [class.text-gray-500]="!passwordStrength.hasSpecialChar">
                    <mat-icon class="text-base">{{ passwordStrength.hasSpecialChar ? 'check_circle' : 'cancel' }}</mat-icon>
                    <span>Al menos un carácter especial (!@#$%...)</span>
                  </div>
                </div>
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
                  <strong>Primer registro completo:</strong> Ingresa tu nombre completo, DNI y crea una contraseña segura. Tu DNI se guardará para futuras verificaciones de seguridad. Una vez completado, tendrás una cuenta normal permanente.
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
  requireDni = true; //Nuevooo Rodrigo SIEMPRE VA PEDIR DNI XD
  
  showPassword = false;
  showConfirmPassword = false;
  passwordStrength: PasswordStrength = {
    hasExactLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    strength: 0
  };

  constructor() {
    this.searchForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      dni: ['']
    });

    this.updateForm = this.fb.group({
      nombre: [''], 
      dni: ['', [Validators.pattern(/^\d{8}$/)]],
      newPassword: ['', [Validators.required, Validators.minLength(6), passwordStrengthValidator()]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.updateForm.get('newPassword')?.valueChanges.subscribe(password => {
      this.passwordStrength = getPasswordStrength(password);
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  getStrengthColor(): string {
    if (this.passwordStrength.strength < 40) return '#ef4444'; // Rojo
    if (this.passwordStrength.strength < 60) return '#f59e0b'; // Amarillo
    if (this.passwordStrength.strength < 80) return '#3b82f6'; // Azul
    return '#10b981'; // Verde
  }

  getStrengthText(): string {
    if (this.passwordStrength.strength === 0) return '';
    if (this.passwordStrength.strength < 40) return 'Débil';
    if (this.passwordStrength.strength < 60) return 'Media';
    if (this.passwordStrength.strength < 80) return 'Fuerte';
    return 'Muy fuerte';
  }

  searchUser(): void { //Nuevo Rodrigoooo
    if (this.searchForm.invalid) return;

    this.isSearching = true;
    this.errorMessage = '';

    const correo = this.searchForm.value.correo.trim();
    const dni = this.searchForm.value.dni.trim();

  
    if (!/^\d{8}$/.test(dni)) {
      this.errorMessage = 'Debes ingresar un DNI válido de 8 dígitos.';
      this.isSearching = false;
      return;
    }

     // NUEVO: validar correo + DNI juntos
    this.userService.validateDni(correo, dni).subscribe({ //Nuevooo Rodrigo 

      next: (res: any) => {
        const user = res.user ?? res;

        this.foundUserEmail = user.correo || correo ;
        this.foundUserName = user.nombre || 'Cuenta verificada';
        this.foundUserId = user.id;

        this.step = 'update';  // pasar a cambiar contraseña
        this.isSearching = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Correo o DNI incorrecto.';
        this.isSearching = false;
      }
    });
  }

  updateUserInfo(): void { //Nuevooo Actualizadooo Rodrigo
  if (this.updateForm.invalid) return;

  this.isUpdating = true;
  this.errorMessage = '';


  const payload = {
    user: {
      correo: this.foundUserEmail,
      password: this.updateForm.value.newPassword
    }
  };

  
  this.userService.updatePasswordByEmail(payload).subscribe({ //NuevoServicio :D Rodrigo
    next: () => {
      this.step = 'success';
      this.isUpdating = false;
      this.updateForm.reset();
      this.searchForm.reset();
    },
    error: (err) => {
      this.errorMessage = err.error?.error || 'Error al actualizar la contraseña.';
      this.isUpdating = false;
    }
  });
}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}