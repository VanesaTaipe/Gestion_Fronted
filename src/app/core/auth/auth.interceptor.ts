//NUEVO ARCHIVO AUTH.INTERCEPTOR.TS
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { JwtService } from './services/jwt.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);
  const token = jwtService.getToken();

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Token ${token}` 
      }
    });
    return next(cloned);
  }

  return next(req);
};
