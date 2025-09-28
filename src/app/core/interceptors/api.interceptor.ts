import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment"; // <-- 1. Importar el entorno

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // 2. Usar la variable apiUrl del archivo de entorno
  const apiReq = req.clone({ url: `${environment.apiUrl}${req.url}` });
  return next(apiReq);
};