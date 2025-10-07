import { Injectable } from "@angular/core";
import { Observable, BehaviorSubject } from "rxjs";
import { JwtService } from "./jwt.service";
import { map, distinctUntilChanged, tap, shareReplay } from "rxjs/operators";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { User } from "../../../features/profile/models/user.interface";
import { environment } from "../../../../environments/environment";

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
  ) {}

  login(credentials: {
    email: string;
    password: string;
  }): Observable<{ user: User }> {
    // ✅ CORRECTO: POST /users/login
    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/users/login`, { user: credentials })
      .pipe(tap(({ user }) => this.setAuth(user)));
  }

  register(credentials: {
    username: string;
    email: string;
    password: string;
  }): Observable<{ user: User }> {
    // ✅ CORRECTO: POST /users (NO /users/register)
    return this.http
      .post<{ user: User }>(`${environment.apiUrl}/users`, { user: credentials })
      .pipe(tap(({ user }) => this.setAuth(user)));
  }

  logout(): void {
    this.purgeAuth();
    void this.router.navigate(["/login"]);
  }

  getCurrentUser(): Observable<{ user: User }> {
    // ✅ CORRECTO: GET /user
    return this.http.get<{ user: User }>(`${environment.apiUrl}/user`).pipe(
      tap({
        next: ({ user }) => this.currentUserSubject.next(user),
        error: () => this.purgeAuth(),
      }),
      shareReplay(1),
    );
  }

  update(user: Partial<User>): Observable<{ user: User }> {
    // ✅ CORRECTO: PUT /user
    return this.http.put<{ user: User }>(`${environment.apiUrl}/user`, { user }).pipe(
      tap(({ user }) => {
        this.currentUserSubject.next(user);
      }),
    );
  }

  setAuth(user: User): void {
    if (user.token) {
      this.jwtService.saveToken(user.token);
    }
    this.currentUserSubject.next(user);
  }

  purgeAuth(): void {
    this.jwtService.destroyToken();
    this.currentUserSubject.next(null);
  }
}