import { Component, computed, inject } from '@angular/core';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { VariantService } from '../../../core/services/variant.service';
import { AppVariant } from '../../../core/models';
import { UiBadgeComponent } from '../ui-badge/ui-badge.component';

@Component({
  selector: 'app-layout-shell',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, RouterLink, RouterLinkActive, UiBadgeComponent],
  template: `
    <div class="min-h-screen" [ngClass]="rootClasses()">
      <aside *ngIf="variant() === 2" class="hidden lg:flex w-64 flex-col gap-6 border-r border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6">
        <div>
          <h1 class="text-lg font-semibold">Admissions Équivalences</h1>
          <p class="text-xs text-[rgb(var(--color-text))]/70">Console dense pour opérateurs aguerris.</p>
        </div>
        <nav class="flex flex-col gap-2 text-sm">
          <a
            *ngFor="let item of navLinks"
            [routerLink]="item.path"
            routerLinkActive="bg-[rgb(var(--color-surface-muted))]"
            class="rounded-lg px-3 py-2 transition hover:bg-[rgb(var(--color-surface-muted))]"
          >
            <div class="flex items-center justify-between gap-2">
              <span>{{ item.label }}</span>
              <ui-badge *ngIf="item.hint" size="sm">{{ item.hint }}</ui-badge>
            </div>
            <p class="text-[0.6rem] text-[rgb(var(--color-text))]/50">{{ item.description }}</p>
          </a>
        </nav>
      </aside>
      <main class="flex min-h-screen flex-1 flex-col">
        <header class="flex flex-col gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-6 py-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 class="text-xl font-semibold">Admin Admissions Équivalences</h1>
              <p class="text-xs text-[rgb(var(--color-text))]/70">Pilotage des mappings et validations (FR / EN hints).</p>
            </div>
            <div class="flex items-center gap-3">
              <label class="text-xs">Variante:</label>
              <select
                class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] px-3 py-2 text-xs"
                [value]="variant()"
                (change)="onVariantChange($any($event.target).value)"
              >
                <option *ngFor="let option of variantOptions" [value]="option.value">
                  {{ option.label }}
                </option>
              </select>
              <ui-badge tone="success" size="sm">Bêta</ui-badge>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--color-text))]/60">
            <span>⬅️ Raccourcis: A = approuver, R = rejeter (alias LLM).</span>
            <span>Variant {{ variant() }} appliqué (persisté localement).</span>
          </div>
        </header>
        <section class="flex flex-1 flex-col" [ngClass]="contentClasses()">
          <ng-content />
        </section>
      </main>
      <aside *ngIf="variant() === 2" class="hidden xl:flex w-72 flex-col gap-4 border-l border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-4 text-xs text-[rgb(var(--color-text))]/70">
        <h2 class="text-sm font-semibold text-[rgb(var(--color-text))]">Inspecteur Contexte</h2>
        <p>Survolez un candidat pour voir l’historique rapide. Ce panneau simule la densité data analyst.</p>
        <p class="text-[0.7rem]">Raccourcis clavier actifs, double-cliquez pour ouvrir la fiche détaillée.</p>
      </aside>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `
  ]
})
export class LayoutShellComponent {
  private readonly variantService = inject(VariantService);
  private readonly router = inject(Router);

  protected readonly variant = computed(() => this.variantService.variantSignal());

  readonly variantOptions = [
    { value: 1 as AppVariant, label: 'Var 1 — Minimal' },
    { value: 2 as AppVariant, label: 'Var 2 — Data-dense' },
    { value: 3 as AppVariant, label: 'Var 3 — Split-pane' },
    { value: 4 as AppVariant, label: 'Var 4 — Board' }
  ];

  readonly navLinks = [
    { path: '/dashboard', label: 'Tableau de bord', description: 'Vue synthèse', hint: 'Top' },
    { path: '/candidates', label: 'Candidats', description: 'Liste & filtres' },
    { path: '/llm-suggestions', label: 'Suggestions LLM', description: 'File d’attente' },
    { path: '/catalog', label: 'Catalogue', description: 'Matières cibles' },
    { path: '/audit', label: 'Audit & logs', description: 'Traçabilité' }
  ];

  rootClasses = computed(() => ({
    'lg:grid lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_280px]': this.variant() === 2
  }));

  contentClasses = computed(() => ({
    'p-6 gap-6 flex flex-col': this.variant() !== 2,
    'p-4 gap-4 flex flex-col': this.variant() === 2
  }));

  onVariantChange(value: string): void {
    const variant = Number(value) as AppVariant;
    this.variantService.setVariant(variant);
  }

  navigate(path: string): void {
    this.router.navigateByUrl(path);
  }
}
