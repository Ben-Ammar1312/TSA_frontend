import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private kc: KeycloakService) {}

  async init(): Promise<void> {
    await this.kc.init({
      config: {
        url: 'http://localhost:8080',
        realm: 'TAS',
        clientId: 'Angular',
      },
      initOptions: {
        pkceMethod: 'S256',
        onLoad: 'login-required',
        checkLoginIframe: false,
      },
    });
  }

  // Returns a fresh token or null if unavailable.
  async getToken(): Promise<string | null> {
    try {
      await this.kc.updateToken(30);         // refresh if <30s left
      return await this.kc.getToken();
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    await this.kc.logout(window.location.origin);
  }
}
