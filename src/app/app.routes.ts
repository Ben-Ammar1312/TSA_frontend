import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent, canActivate: [AuthGuard] },
  {
    path: 'dashboard',
    loadComponent: () => import('../app/pages/home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '' },
];
