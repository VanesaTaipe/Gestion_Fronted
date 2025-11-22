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
      username: [this.user?.username || '', [Validators.required, Validators.minLength(3)]],
      email: [this.user?.email || this.user?.correo || '', [Validators.required, Validators.email]],
    });
  }

  onSave() {
    if (this.form.invalid) return;
    this.message = '';
    this.isErrorMessage = false;

    this.isLoading = true;
    const payload = {
      nombre: this.form.value.username,
      correo: this.form.value.email,
    };

    this.userService.updateProfile(this.user.id_usuario, payload).subscribe({
      next: (res: any) => {
        this.message = res.message || 'Perfil actualizado correctamente.';
         this.isErrorMessage = false;
        this.isLoading = false;
        this.updated.emit(res.user);
        this.close.emit();
      },
      error: (err) => {
        console.error('❌ Error al actualizar perfil:', err);
        this.message = 'Error al actualizar el perfil.';
        this.isLoading = false;
        this.isErrorMessage = true;
        const correoErrors = err.error?.errors?.correo;
        if (err.status === 422 && Array.isArray(correoErrors) && correoErrors.length > 0) {
          this.message = correoErrors[0];
        } else {
          this.message = 'Error al actualizar el perfil. Inténtalo de nuevo.';
        }
      },
    });
  }

  onClose() {
    this.close.emit();
  }
}