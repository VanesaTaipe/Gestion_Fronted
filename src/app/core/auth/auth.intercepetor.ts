import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtService } from './services/jwt.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);
  const token = jwtService.getToken();


  if (token) {
    console.log('Agregando Authorization header');
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Token ${token}`
      }
    });
    return next(cloned);
  }

  console.log(' No hay token, request sin Authorization');
  return next(req);
};