import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { Profile } from "../models/profile.model";
import { HttpClient } from "@angular/common/http";
import { User } from "src/app/core/auth/user.model";

@Injectable({ providedIn: "root" })
export class ProfileService {
  constructor(private readonly http: HttpClient) {}

  get(username: string): Observable<Profile> {
    return this.http.get<{ profile: Profile }>("/profiles/" + username).pipe(
      map((data: { profile: Profile }) => data.profile),
      shareReplay(1),
    );
  }

  follow(username: string): Observable<Profile> {
    return this.http
      .post<{ profile: Profile }>("/profiles/" + username + "/follow", {})
      .pipe(map((data: { profile: Profile }) => data.profile));
  }

  unfollow(username: string): Observable<Profile> {
    return this.http
      .delete<{ profile: Profile }>("/profiles/" + username + "/follow")
      .pipe(map((data: { profile: Profile }) => data.profile));
  }

  update(username: string, profile: Partial<User>): Observable<Profile> {
      return this.http
          .put<{ profile: Profile }>(`/profiles/${username}`, { user: profile })
          .pipe(map((data) => data.profile));
  }  
}
