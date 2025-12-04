import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../profile/models/user.interface';
import { UserService } from '../../profile/services/user.service';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
})
export class EditProfileModalComponent implements OnInit {
  @Input() user!: User;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<User>();

  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  form!: FormGroup;
  isLoading = false;
  message = '';
  isErrorMessage = false;

  ngOnInit() {
    this.form = this.fb.group({
      username: [
        this.user?.username || '', 
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(25),
          Validators.pattern(/^\S+$/)
        ]
      ],
      email: [
        this.user?.email || this.user?.correo || '', 
        [
          Validators.required, 
          Validators.email
        ]
      ],
    });
  }

  get usernameControl() {
    return this.form.get('username');
  }

  get emailControl() {
    return this.form.get('email');
  }

  getUsernameError(): string | null {
    const control = this.usernameControl;
    
    if (!control?.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'El nombre es requerido';
    }
    if (control.errors['minLength']) {
      return 'El nombre debe tener al menos 1 carácter';
    }
    if (control.errors['maxLength']) {
      return 'El nombre no puede exceder 25 caracteres';
    }
    if (control.errors['pattern']) {
      return 'El nombre no debe contener espacios';
    }

    return null;
  }

  getEmailError(): string | null {
    const control = this.emailControl;
    
    if (!control?.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) {
      return 'El correo es requerido';
    }
    if (control.errors['email']) {
      return 'Ingresa un correo válido';
    }

    return null;
  }

  onSave() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.message = '';
    this.isErrorMessage = false;
    this.isLoading = true;

    const payload = {
      nombre: this.form.value.username.trim(),
      correo: this.form.value.email.trim(),
    };

    this.userService.updateProfile(this.user.id_usuario, payload).subscribe({
      next: (res: any) => {
        this.message = res.message || 'Perfil actualizado correctamente.';
        this.isErrorMessage = false;
        this.isLoading = false;
        this.updated.emit(res.user);
        
        setTimeout(() => {
          this.close.emit();
        }, 1500);
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.isLoading = false;
        this.isErrorMessage = true;
        this.message = this.extractErrorMessage(err);
      },
    });
  }

  private extractErrorMessage(err: any): string {
    if (err.status === 422) {
      const nombreErrors = err.error?.errors?.nombre;
      const correoErrors = err.error?.errors?.correo;
      
      if (Array.isArray(nombreErrors) && nombreErrors.length > 0) {
        return nombreErrors[0];
      }
      
      if (Array.isArray(correoErrors) && correoErrors.length > 0) {
        return correoErrors[0];
      }
    }

    if (err.status === 403) {
      return err.error?.error || 'No tienes permiso para editar este perfil';
    }

    if (err.status === 404) {
      return 'Usuario no encontrado';
    }

    if (err.status === 401) {
      return 'No autorizado. Por favor, inicia sesión nuevamente';
    }

    return err.error?.error || err.error?.message || 'Error al actualizar el perfil';
  }

  onClose() {
    this.close.emit();
  }
}