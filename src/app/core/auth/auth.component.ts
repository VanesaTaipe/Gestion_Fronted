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
import { MatIconModule } from '@angular/material/icon';
import { passwordStrengthValidator, getPasswordStrength, PasswordStrength } from './validator/password-streangt.validator';

interface AuthForm {
  correo: FormControl<string>;
  password: FormControl<string>;
  nombre?: FormControl<string>;
  confirmPassword?: FormControl<string>;
  dni?: FormControl<string>;
}

@Component({
  selector: "app-auth-page",
  templateUrl: "./auth.component.html",
  imports: [CommonModule, ListErrorsComponent, ReactiveFormsModule, MatIconModule],
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
  passwordStrength: PasswordStrength = {
    hasExactLength: false, 
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    strength: 0
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly userService: UserService,
  ) {
    this.authForm = new FormGroup<AuthForm>({
      correo: new FormControl("", {
        validators: [Validators.required, Validators.email],
        nonNullable: true,
      }),
      password: new FormControl("", {
        validators: [Validators.required],
        nonNullable: true,
      }),
    });
  }

  ngOnInit(): void {
    this.authType = this.route.snapshot.url.at(-1)!.path;
    this.title = this.authType === "login" ? "Iniciar Sesión" : "Regístrate";
    
    if (this.authType === "register") {
      this.authForm.addControl(
        "nombre",
        new FormControl("", {
          validators: [Validators.required, Validators.minLength(3)],
          nonNullable: true,
        }),
      );

      this.authForm.addControl(
        "dni",
        new FormControl("", {
          validators: [Validators.required, Validators.pattern(/^\d{8,}$/)],
          nonNullable: true,
        }),
      );

      this.authForm.addControl(
        "confirmPassword",
        new FormControl("", {
          validators: [Validators.required],
          nonNullable: true,
        }),
      );
            this.authForm.get('password')?.setValidators([
        Validators.required,
        passwordStrengthValidator()
      ]);
      this.authForm.get('password')?.updateValueAndValidity();
      this.authForm.get('password')?.valueChanges.subscribe(password => {
        this.passwordStrength = getPasswordStrength(password);
      });

      this.authForm.addValidators(this.passwordMatchValidator());
    }
  }
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

  submitForm(): void {
  this.isSubmitting = true;
  this.errors = { errors: {} };
  
  if (this.authType === 'completar') { 

  const correoUsuario = this.userService.getCurrentUserEmail();

  if (!correoUsuario) {
    console.error("No se pudo obtener el correo del usuario actual."); 
    this.isSubmitting = false;
    return;
  }



  if (this.authForm.value.password !== this.authForm.value.confirmPassword) { 
    this.errors = { errors: { 'Contraseña': 'Las contraseñas no coinciden' } };
    this.isSubmitting = false;
    return;
  }


  if (!/^\d{8}$/.test(this.authForm.value.dni || '')) {
    this.errors = { errors: { 'DNI': 'El DNI debe tener exactamente 8 dígitos.' } }; 
    this.isSubmitting = false;
  return;
  }


  this.authForm.get('password')?.setValidators([ 
        passwordStrengthValidator()
    ]);
    this.authForm.get('password')?.updateValueAndValidity();

    this.authForm.get('password')?.valueChanges.subscribe(password => {
        this.passwordStrength = getPasswordStrength(password);
    });



  const payload = {
    user: {
      correo: correoUsuario,
      nombre: this.authForm.value.nombre,
      dni: this.authForm.value.dni,
      password: this.authForm.value.password
    }
  };

  console.log("Enviando actualización de usuario temporal:", payload);

  this.userService.updateTemporalUser(payload).subscribe({
    next: (res) => {

      const user = res?.user;

      if (user?.token){ // Nuevooo
        this.userService.setAuth(user); //Guardamos el token
        console.log('token guardado')
      } else {
        console.warn('no llego token')
      }

      console.log("Usuario temporal actualizado correctamente.");
      this.isSubmitting = false;
      this.router.navigate(['/workspace']);    
    },
    error: (err) => {
      console.error("Error actualizando usuario temporal:", err);

      if (err.error && err.error.errors) {
        this.errors = err.error;
      } else {
        this.errors = { errors: { Error: 'No se pudo actualizar el usuario temporal.' } };
      }

      this.isSubmitting = false;
    }
  });

  return; 
}


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

    const nombre = this.authForm.value.nombre?.trim();
    const correo = this.authForm.value.correo?.trim();
    const password = this.authForm.value.password;

    if (!nombre || !correo || !password) {
      this.errors = { 
        errors: { 
          'Campos': 'Todos los campos son obligatorios' 
        } 
      };
      this.isSubmitting = false;
      return;
    }

    console.log('Datos de registro:', { nombre, correo, passwordLength: password.length });
  }

  const correoRaw = this.authForm.get('correo')?.value || '';
  const passwordRaw = this.authForm.get('password')?.value || '';
  
  const correo = correoRaw.trim();
  const password = passwordRaw; 


  if (!correo || !password) {
    console.error('Validación falló: correo o password vacío');
    this.errors = { 
      errors: { 
        'Error': 'Correo y contraseña son obligatorios' 
      } 
    };
    this.isSubmitting = false;
    return;
  }

  let observable;
  
  if (this.authType === "login") {
    const loginData = {
      correo: correo,
      password: password
    };
    console.log('Enviando LOGIN:', { 
      correo: loginData.correo, 
      passwordLength: loginData.password.length 
    });
    observable = this.userService.login(loginData);
  } else {
    const nombreRaw = this.authForm.get('nombre')?.value || '';
    const dniRaw = this.authForm.get('dni')?.value || '';
    
    const registerData = {
      nombre: nombreRaw.trim(),
      correo: correo,
      password: password,
      dni: dniRaw.trim()
    };
    console.log('Enviando REGISTER:', { 
      nombre: registerData.nombre,
      correo: registerData.correo, 
      passwordLength: registerData.password.length,
      dni: registerData.dni
    });
    observable = this.userService.register(registerData);
  }

  observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: (res) => {

      const user: any = res?.user; 
      if (this.authType === 'login' && user) {
        const esTemporal = user.esTemporal === true;

        if (esTemporal) {
          console.log('Usuario temporal detectado desde login');

          // Guardas al usuario actual como ya haces normalmente
          this.userService.setAuth(user);

          // Cambias el tipo de formulario xd
          this.authType = 'completar';
          this.title = 'Completa tu perfil';
          this.isSubmitting = false;

          this.authForm.get('password')?.setValue('');

          if (!this.authForm.get('nombre')) {
            this.authForm.addControl(
              'nombre',
              new FormControl('', {
                validators: [Validators.required, Validators.minLength(1), Validators.maxLength(25)],
                nonNullable: true,
              }),
            );
          }

          if (!this.authForm.get('dni')) {
            this.authForm.addControl(
              'dni',
              new FormControl('', {
                validators: [Validators.required, Validators.pattern(/^\d{8}$/)],
                nonNullable: true,
              }),
            );
          }

          if (!this.authForm.get('confirmPassword')) {
            this.authForm.addControl(
              'confirmPassword',
              new FormControl('', {
                validators: [Validators.required],
                nonNullable: true,
              }),
            );
          }

          // Ajustar validadores de password 
          this.authForm.get('password')?.setValidators([
            Validators.required,
            Validators.minLength(6),
          ]);
          this.authForm.get('password')?.updateValueAndValidity();
          this.authForm.get('password')?.valueChanges.subscribe(password => {
            this.passwordStrength = getPasswordStrength(password);
          });
          //  cambiamos el formulario
          return;

        }
      }

      console.log('Autenticación exitosa');
      void this.router.navigate(["/workspace"]);
    },
    error: (err) => {
      console.error(' Error de autenticación:', err);
      console.error(' Status:', err.status);
      console.error(' Error body:', err.error);
      
      if (err.error && err.error.errors) {
        this.errors = err.error;
      } else if (err.error && err.error.message) {
        this.errors = { 
          errors: { 
            'Error': err.error.message 
          } 
        };
      } else if (err.error && err.error.error) {
        this.errors = { 
          errors: { 
            'Error': err.error.error 
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

  goToForgotPassword(): void {
    console.log('Navegando a forgot-password');
    this.router.navigate(['/forgot-password']);
  }
}