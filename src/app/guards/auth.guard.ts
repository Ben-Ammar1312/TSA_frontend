import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private kc: KeycloakService) {}
  async canActivate(): Promise<boolean> {
    const ok = await this.kc.isLoggedIn();
    if (!ok) await this.kc.login();
    return ok;
  }
}
