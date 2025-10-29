import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';  
import { provideMarkdown } from 'ngx-markdown';
import { AuthInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),  
    provideHttpClient(withInterceptors([AuthInterceptor])), //NUEVO: Agrega el interceptor de autenticación
    provideMarkdown(),
  ]
};
       