import { Component, inject } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiInputComponent } from '../../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent } from '../../../shared/components/ui-select/ui-select.component';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/ui/toast.service';
import { nanoid } from '../../../core/services/nanoid';

@Component({
  selector: 'app-catalog-detail',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, NgFor, NgIf, UiButtonComponent, UiBadgeComponent, UiInputComponent, UiSelectComponent, ReactiveFormsModule],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <section class="flex flex-col gap-6">
        <header class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold">{{ vm.subject?.titleFr }}</h2>
            <p class="text-xs text-[rgb(var(--color-text))]/60">Code {{ vm.subject?.code }} · Catégorie {{ vm.subject?.category }}</p>
          </div>
          <ui-badge tone="success" size="sm">Coef {{ vm.subject?.coefficient }}</ui-badge>
        </header>

        <section class="card">
          <h3 class="text-sm font-semibold">Aliases existants</h3>
          <ul class="mt-3 flex flex-col gap-3">
            <li *ngFor="let alias of vm.aliases" class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3">
              <p class="text-sm font-semibold">{{ alias.label }}</p>
              <p class="text-xs text-[rgb(var(--color-text))]/60">Normalisé: {{ alias.normalizedLabel }} · Langue {{ alias.language }}</p>
            </li>
            <li *ngIf="!vm.aliases.length" class="rounded-xl border border-dashed border-[rgb(var(--color-border))] p-4 text-center text-xs text-[rgb(var(--color-text))]/60">
              Aucun alias pour l’instant.
            </li>
          </ul>
        </section>

        <section class="card">
          <h3 class="text-sm font-semibold">Ajouter un alias manuel</h3>
          <form [formGroup]="aliasForm" class="mt-3 grid gap-3 md:grid-cols-2" (ngSubmit)="createAlias(vm.subject?.code)">
            <ui-input formControlName="label" label="Libellé FR" placeholder="Libellé source" />
            <ui-input formControlName="normalized" label="Normalisé" placeholder="normalized_label" />
            <ui-select formControlName="language" label="Langue" [options]="languageOptions" class="md:col-span-2" />
            <ui-button type="submit" size="sm" [disabled]="aliasForm.invalid">Créer</ui-button>
          </form>
        </section>

        <section class="card">
          <h3 class="text-sm font-semibold">Dernières suggestions liées</h3>
          <ul class="mt-3 flex flex-col gap-3">
            <li *ngFor="let suggestion of vm.suggestions" class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-3">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold">{{ suggestion.rawLabel }}</p>
                  <p class="text-xs text-[rgb(var(--color-text))]/60">Confiance {{ suggestion.confidence | number:'1.2-2' }} · {{ suggestion.language }}</p>
                </div>
                <ui-button size="sm" variant="ghost" (clicked)="approveSuggestion(suggestion.id)">Approuver</ui-button>
              </div>
            </li>
            <li *ngIf="!vm.suggestions.length" class="rounded-xl border border-dashed border-[rgb(var(--color-border))] p-4 text-center text-xs text-[rgb(var(--color-text))]/60">
              Rien à traiter pour cette matière.
            </li>
          </ul>
        </section>
      </section>
    </ng-container>
  `
})
export class CatalogDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly languageOptions = [
    { label: 'FR', value: 'fr' },
    { label: 'EN', value: 'en' }
  ];

  protected readonly aliasForm = this.fb.group({
    label: [''],
    normalized: [''],
    language: ['fr']
  });

  protected readonly vm$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const code = params.get('code');
      if (!code) {
        return of({ subject: undefined, aliases: [], suggestions: [] });
      }
      return combineLatest([
        this.store.getTargetSubjects(),
        this.store.getAliasesForTarget(code),
        this.store.getAliasSuggestions()
      ]).pipe(
        map(([targets, aliases, suggestions]) => ({
          subject: targets.find((target) => target.code === code),
          aliases,
          suggestions: suggestions.filter((suggestion) => suggestion.targetSubjectCode === code && suggestion.status === 'pending')
        }))
      );
    })
  );

  createAlias(code?: string | null): void {
    if (!code || this.aliasForm.invalid) {
      return;
    }
    const value = this.aliasForm.value;
    this.store.addAlias(
      {
        id: nanoid(),
        targetSubjectCode: code,
        label: value.label ?? '',
        normalizedLabel: value.normalized ?? '',
        language: (value.language as 'fr' | 'en') ?? 'fr'
      },
      'admin'
    );
    this.toast.push({ title: 'Alias ajouté', description: `${value.label}`, tone: 'success' });
    this.aliasForm.reset({ language: 'fr' });
  }

  approveSuggestion(id: string): void {
    this.store.approveSuggestion(id, 'admin');
    this.toast.push({ title: 'Alias approuvé', description: `Suggestion ${id} validée`, tone: 'success' });
  }
}
