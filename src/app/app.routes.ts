import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'candidates',
    loadComponent: () => import('./features/candidates/candidates.component').then((m) => m.CandidatesComponent)
  },
  {
    path: 'candidates/:id',
    loadComponent: () => import('./features/candidates/detail/candidate-detail.component').then((m) => m.CandidateDetailComponent)
  },
  {
    path: 'mapping/:candidateId',
    loadComponent: () => import('./features/mapping/mapping-review.component').then((m) => m.MappingReviewComponent)
  },
  {
    path: 'catalog',
    loadComponent: () => import('./features/catalog/catalog.component').then((m) => m.CatalogComponent)
  },
  {
    path: 'catalog/:code',
    loadComponent: () => import('./features/catalog/detail/catalog-detail.component').then((m) => m.CatalogDetailComponent)
  },
  {
    path: 'llm-suggestions',
    loadComponent: () => import('./features/llm-suggestions/llm-suggestions.component').then((m) => m.LlmSuggestionsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent)
  },
  {
    path: 'audit',
    loadComponent: () => import('./features/audit/audit.component').then((m) => m.AuditComponent)
  }
];
