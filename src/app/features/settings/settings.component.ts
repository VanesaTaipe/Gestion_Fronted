// src/app/features/settings/settings.component.ts

import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { ProfileService } from '../../features/profile/services/profile.service';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { User } from "../../core/auth/user.model";
import { UserService } from "../../core/auth/services/user.service";
import { ListErrorsComponent } from "../../shared/components/list-errors.component";
import { Errors } from "../../core/models/errors.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

// 1. Añadir las nuevas propiedades a la interfaz
interface SettingsForm {
  image: FormControl<string>;
  username: FormControl<string>;
  bio: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
  twitter_url: FormControl<string>;
  linkedin_url: FormControl<string>;
}

@Component({
  selector: "app-settings-page",
  templateUrl: "./settings.component.html",
  standalone: true, // Importante: Este componente es Standalone
  imports: [ListErrorsComponent, ReactiveFormsModule],
})
export default class SettingsComponent implements OnInit {
  user!: User;
  // 2. Añadir los nuevos FormControl al grupo
  settingsForm = new FormGroup<SettingsForm>({
    image: new FormControl("", { nonNullable: true }),
    username: new FormControl("", { nonNullable: true }),
    bio: new FormControl("", { nonNullable: true }),
    email: new FormControl("", { nonNullable: true }),
    password: new FormControl("", {
      validators: [Validators.required],
      nonNullable: true,
    }),
    twitter_url: new FormControl("", { nonNullable: true }),
    linkedin_url: new FormControl("", { nonNullable: true }),
  });
  errors: Errors | null = null;
  isSubmitting = false;
  destroyRef = inject(DestroyRef);

  constructor(
    private readonly router: Router,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
  ) {}

  ngOnInit(): void {
    this.userService.getCurrentUser()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ user }) => {
        this.user = user;

        // patchValue con los datos del usuario
        this.settingsForm.patchValue(user);
      });
  }

  logout(): void {
    this.userService.logout();
    void this.router.navigate(["/"]);
  }

  submitForm() {
    this.isSubmitting = true;

    // Obtenemos todos los valores del formulario
    const userData = this.settingsForm.value;

    this.profileService.update(this.user.username, userData).subscribe({
      next: (updatedProfile) => {
        console.log("Perfil actualizado con éxito", updatedProfile);
        // Redirigir al perfil del usuario para ver los cambios
        this.router.navigate(["/profile", this.user.username]);
      },
      error: (err) => {
        console.error(err);
        this.isSubmitting = false;
      }
    });
  }
}