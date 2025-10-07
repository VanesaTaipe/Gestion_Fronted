import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import {
  Validators,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
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
          validators: [Validators.required],
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
    }
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

    let observable =
      this.authType === "login"
        ? this.userService.login(
            this.authForm.value as { email: string; password: string },
          )
        : this.userService.register(
            this.authForm.value as {
              email: string;
              password: string;
              username: string;
            },
          );

    observable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => void this.router.navigate(["/workspace"]),
      error: (err) => {
        this.errors = err;
        this.isSubmitting = false;
      },
    });
  }
}