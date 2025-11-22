import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UserService } from './core/auth/services/use.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet
  ],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
    }
  `]
})
export class AppComponent {
  title = 'gestion-proyectos';

  constructor(private router: Router, private userService: UserService) {
    // Guardamos la última ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        localStorage.setItem('lastRoute', event.urlAfterRedirects);
      });

    // Esperar a que el usuario esté autenticado antes de restaurar la ruta
    this.userService.isAuthenticated.subscribe(isAuth => {
      if (isAuth) {
        const last = localStorage.getItem('lastRoute');
        if (last && last !== '/login' && last !== '/register') {
          this.router.navigateByUrl(last);
        }
      }
    });
  }
}