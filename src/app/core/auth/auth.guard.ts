//NUEVO ARCHIVO AUTH.GUARD.TS
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtService } from './services/jwt.service'; 

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService, private router: Router) {}

  canActivate(): boolean {
    const token = this.jwtService.getToken();

    if (token) {
      return true; 
    }

    console.warn('🔒 Intento de acceso sin token, redirigiendo al login...');
    this.router.navigate(['/login']);
    return false;
  }
}
