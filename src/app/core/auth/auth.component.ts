import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import {
  Validators,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { ListErrorsComponent } from "./model/list-errors.component";
import { Errors } from "./model/error.interface";
import { UserService } from "./services/use.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";

interface AuthForm {
  email: FormControl<string>;
  password: FormControl<string>;
  username?: FormControl<string>;
  confirmPassword?: FormControl<string>;
}

@Component({
  selector: "app-auth-page",
  templateUrl: "./auth.component.html",
  imports: [CommonModule, ListErrorsComponent, ReactiveFormsModule],
  standalone: true
})
export default class AuthComponent implements OnInit {
  authType = "";
  title = "";
  errors: Errors = { errors: {} };
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  authForm: FormGroup<AuthForm>;
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {
    this.authForm = new FormGroup<AuthForm>({
      email: new FormControl("", {
        validators: [Validators.required, Validators.email],
        nonNullable: true,
      }),
      password: new FormControl("", {
        validators: [Validators.required, Validators.minLength(6)],
        nonNullable: true,
      }),
    });
  }

  ngOnInit(): void {
    this.authType = this.route.snapshot.url.at(-1)!.path;
    this.title = this.authType === "login" ? "Iniciar Sesión" : "Regístrate";
    
    if (this.authType === "register") {
      this.authForm.addControl(
        "username",
        new FormControl("", {
          validators: [Validators.required, Validators.minLength(3)],
          nonNullable: true,
        }),
      );
      this.authForm.addControl(
        "confirmPassword",
        new FormControl("", {
          validators: [Validators.required, Validators.minLength(6)],
          nonNullable: true,
        }),
      );
      
      // Agregar validador de coincidencia de contraseñas
      this.authForm.addValidators(this.passwordMatchValidator());
    }
  }

  // Validador personalizado para verificar que las contraseñas coincidan
  passwordMatchValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;
      
      if (password && confirmPassword && password !== confirmPassword) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  switchToLogin(): void {
    this.router.navigate(['/login']);
  }

  switchToRegister(): void {
    this.router.navigate(['/register']);
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitForm(): void {
    this.isSubmitting = true;
    this.errors = { errors: {} };

    // Validar que las contraseñas coincidan antes de enviar
    if (this.authType === "register") {
      if (this.authForm.errors?.['passwordMismatch']) {
        this.errors = { 
          errors: { 
            'Contraseñas': 'Las contraseñas no coinciden' 
          } 
        };
        this.isSubmitting = false;
        return;
      }

      // Validar campos requeridos
      const username = this.authForm.value.username?.trim();
      const email = this.authForm.value.email?.trim();
      const password = this.authForm.value.password;

      if (!username || !email || !password) {
        this.errors = { 
          errors: { 
            'Campos': 'Todos los campos son obligatorios' 
          } 
        };
        this.isSubmitting = false;
        return;
      }

      // Log para debugging - eliminar en producción
      console.log('Datos de registro:', { username, email, passwordLength: password.length });
    }

    let observable =
      this.authType === "login"
        ? this.userService.login({
            email: this.authForm.value.email!.trim(),
            password: this.authForm.value.password!,
          })
        : this.userService.register({
            username: this.authForm.value.username!.trim(),
            email: this.authForm.value.email!.trim(),
            password: this.authForm.value.password!,
          });

    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        console.log('Autenticación exitosa');
        void this.router.navigate(["/workspace"]);
      },
      error: (err) => {
        console.error('Error de autenticación:', err);
        
        // Procesar errores 
        if (err.error && err.error.errors) {
          this.errors = err.error;
        } else if (err.error && err.error.message) {
          this.errors = { 
            errors: { 
              'Error': err.error.message 
            } 
          };
        } else {
          this.errors = { 
            errors: { 
              'Error': 'Ocurrió un error. Por favor intenta nuevamente.' 
            } 
          };
        }
        
        this.isSubmitting = false;
      },
    });
  }
}