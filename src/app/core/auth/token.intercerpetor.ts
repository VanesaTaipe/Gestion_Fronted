import { inject } from "@angular/core";
import { HttpInterceptorFn } from "@angular/common/http";
import { JwtService } from "../auth/services/jwt.service";


export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const jwtService = inject(JwtService);
  let token: string | null = null;
  let scheme: string = "Token"; // Por defecto, el prefijo de PHP/RealWorld


  // 2. Clona la petición y añade la cabecera correcta
  const request = req.clone({
    setHeaders: {
      ...(token ? { Authorization: `${scheme} ${token}` } : {}),
    },
  });
  
  return next(request);
};