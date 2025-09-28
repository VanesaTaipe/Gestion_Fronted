import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class JwtService {
  getToken(): string {
    return window.localStorage["jwtToken"];
  }

  saveToken(token: string): void {
    console.log("entro a saveToken");
    window.localStorage["jwtToken"] = token;
  }

  destroyToken(): void {
    console.log("entro a destroyToken");
    window.localStorage.removeItem("jwtToken");
  }
}
