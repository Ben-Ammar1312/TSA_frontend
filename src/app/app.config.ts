import { ApplicationConfig, APP_INITIALIZER, importProvidersFrom, provideZoneChangeDetection, provideBrowserGlobalErrorListeners } from '@angular/core'; 
import { provideRouter } from '@angular/router'; 
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { routes } from './app.routes'; import { authInterceptor } from './auth/auth.interceptor'; 
import { AuthService } from './auth/auth.service'; import { KeycloakAngularModule } from 'keycloak-angular'; 

function initAuth(auth: AuthService) { return () => auth.init(); // wait for Keycloak before bootstrapping 
                                     } 
export const appConfig: ApplicationConfig = { 
  providers: [ provideBrowserGlobalErrorListeners(), 
              provideZoneChangeDetection({ eventCoalescing: true }), 
              provideRouter(routes), 
              provideHttpClient(withInterceptors([authInterceptor])), 
              importProvidersFrom(KeycloakAngularModule), { 
                provide: APP_INITIALIZER, 
                useFactory: initAuth, 
                deps: [AuthService], 
                multi: true },
             ],
};
