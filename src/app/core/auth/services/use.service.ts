import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { distinctUntilChanged, map, shareReplay, tap, catchError } from "rxjs/operators";
import { environment } from "../../../../environments/environment";
import { User } from "../../../features/profile/models/user.interface";
import { JwtService } from "./jwt.service";

@Injectable({ providedIn: "root" })
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  public isAuthenticated = this.currentUser.pipe(map((user) => !!user));

  constructor(
    private readonly http: HttpClient,
    private readonly jwtService: JwtService,
    private readonly router: Router,
  ) {
    console.log('UserService inicializado');
    console.log('API URL:', environment.apiUrl);
    
    // Intentar cargar usuario desde token guardado
    this.loadUserFromToken();
  }

  /**
   * Cargar usuario desde token guardado en localStorage
   */
  private loadUserFromToken(): void {
    const token = this.jwtService.getToken();
    if (token) {
      console.log('Token encontrado, cargando usuario...');
      this.getCurrentUser().subscribe({
        error: (err) => console.error('Error al cargar usuario desde token:', err)
      });
    }
  }

  /**
   * LOGIN
   * Backend: POST /api/users/login
   */
  login(credentials: {
    correo: string;
    password: string;
  }): Observable<{ user: User }> {
    const loginData = {
      user: {
        correo: credentials.correo,
        password: credentials.password
      }
    };

    console.log('Iniciando sesión...');
    console.log('URL:', `${environment.apiUrl}/users/login`);
    console.log('Datos de login:', { correo: credentials.correo });

    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/users/login`, loginData)
      .pipe(
        tap(({ user }) => {
          console.log('Login exitoso:', user);
          console.log('ID Usuario:', user.id_usuario);
          console.log('Token recibido:', user.token ? 'Sí' : 'No');
          this.setAuth(user);
        }),
        
        catchError((error) => {
          console.error('Error en login:', error);
          console.error('Status:', error.status);
          console.error('Mensaje:', error.error);
          return throwError(() => error);
        })
      );
    
  }

  /**
   * REGISTRO
   * Backend: POST /api/users
   */
  register(credentials: {
    nombre: string;
    correo: string;
    password: string;
  }): Observable<{ user: User }> {
    const registerData = {
      user: {
        nombre: credentials.nombre,
        correo: credentials.correo,
        password: credentials.password
      }
    };

    console.log('Registrando usuario...');
    console.log('URL:', `${environment.apiUrl}/users`);
    console.log('Datos de registro:', {
      nombre: registerData.user.nombre,
      correo: registerData.user.correo,
      passwordLength: registerData.user.password.length
    });

    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/users`, registerData)
      .pipe(
        tap(({ user }) => {
          console.log('Registro exitoso:', user);
          console.log('ID Usuario:', user.id_usuario);
          console.log('Token recibido:', user.token ? 'Sí' : 'No');
          this.setAuth(user);
        }),
        catchError((error) => {
          console.error('Error en registro:', error);
          console.error('Status:', error.status);
          console.error('Mensaje completo:', error.error);
          
          // Log más detallado para debugging
          if (error.error) {
            console.error('Detalles del error:', JSON.stringify(error.error, null, 2));
          }
          
          return throwError(() => error);
        })
      );
  }

  /**
   * LOGOUT
   */
  logout(): void {
    console.log('Cerrando sesión...');
    this.purgeAuth();
    void this.router.navigate(["/login"]);
  }

  /**
   * OBTENER USUARIO ACTUAL
   * Backend: GET /api/user 
   */
  getCurrentUser(): Observable<{ user: User }> {
    return this.http.get<{ user: User }>(`${environment.apiUrl}/user`).pipe(
      tap({
        next: ({ user }) => {
          console.log('Usuario actual cargado:', user);
          this.currentUserSubject.next(user);
        },
        error: (err) => {
          console.error('Error cargando usuario:', err);
          this.purgeAuth();
        }
      }),
      shareReplay(1),
    );
  }

  /**
   * ACTUALIZAR USUARIO
   */
  update(user: Partial<User>): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${environment.apiUrl}/user`, { user }).pipe(
      tap(({ user }) => {
        console.log('Usuario actualizado:', user);
        this.currentUserSubject.next(user);
      }),
    );
  }

  /**
   * GUARDAR AUTENTICACIÓN
   */
  setAuth(user: User): void {
    console.log('Guardando autenticación...');
    console.log('Usuario:', user);
    console.log('Token:', user.token ? 'Presente' : 'Ausente');
    console.log('ID Usuario:', user.id_usuario);
    
    if (user.token) {
      this.jwtService.saveToken(user.token);
      console.log('Token guardado en localStorage');
    } else {
      console.warn('No se recibió token del backend');
    }
    
    this.currentUserSubject.next(user);
    console.log('Autenticación completada');
  }

  /**
   * LIMPIAR AUTENTICACIÓN
   */
  purgeAuth(): void {
    console.log('🧹 Limpiando autenticación...');
    this.jwtService.destroyToken();
    this.currentUserSubject.next(null);
  }

  /**
   * OBTENER ID DEL USUARIO ACTUAL (helper)
   */
  getCurrentUserId(): number | null {
    const user = this.currentUserSubject.value;
    return user?.id_usuario || null;
  }
}