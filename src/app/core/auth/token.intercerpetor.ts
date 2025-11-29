import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";
import { JwtService } from "../auth/services/jwt.service";

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);
  const token = jwtService.getToken(); 
  const scheme = "Token";

  // Si hay token, clona la request y añade el header
  if (token) {
    const request = req.clone({
      setHeaders: {
        Authorization: `${scheme} ${token}`
      }
    });
    return next(request);
  }
  
  // Si no hay token, continúa sin modificar
  return next(req);
};