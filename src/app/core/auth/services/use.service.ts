import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";
import { distinctUntilChanged, map, shareReplay, tap } from "rxjs/operators";
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
    this.loadUserFromToken();;
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
      this.getCurrentUser().subscribe();
    }
  }

  /**
   * LOGIN
   * Backend: POST /api/users/login
   */
  login(credentials: {
    email: string;
    password: string;
  }): Observable<{ user: User }> {
    const loginData = {
      user: {
        correo: credentials.email,
        password: credentials.password
      }
    };

    console.log('Iniciando sesión...');
    console.log('URL:', `${environment.apiUrl}/users/login`);

    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/users/login`, loginData)
      .pipe(
        tap(({ user }) => {
          console.log('Login exitoso:', user);
          console.log('ID Usuario:', user.id_usuario);
          this.setAuth(user);
        })
      );
  }

  /**
   * REGISTRO
   * Backend: POST /api/users
   */
  register(credentials: {
    username: string;
    email: string;
    password: string;
  }): Observable<{ user: User }> {
    const registerData = {
      user: {
        nombre: credentials.username,
        correo: credentials.email,
        password: credentials.password
      }
    };

    console.log('Registrando usuario...');
    console.log('Datos:', registerData);

    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/users`, registerData)
      .pipe(
        tap(({ user }) => {
          console.log('Registro exitoso:', user);
          this.setAuth(user);
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
    }
    
    this.currentUserSubject.next(user);
    console.log('Autenticación guardada');
  }

  /**
   * LIMPIAR AUTENTICACIÓN
   */
  purgeAuth(): void {
    console.log('Limpiando autenticación...');
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