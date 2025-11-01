import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { CsvExportService } from '../../core/services/ui/csv-export.service';
import { DataStoreService } from '../../core/services/data-store.service';
import { Candidate, CandidateStatus } from '../../core/models';
import { UiTableComponent } from '../../shared/components/ui-table/ui-table.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { VariantService } from '../../core/services/variant.service';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, UiTableComponent, UiButtonComponent, UiSelectComponent, UiInputComponent, UiBadgeComponent],
  template: `
    <section class="flex flex-col gap-4">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Candidats</h2>
          <p class="text-xs text-[rgb(var(--color-text))]/60">Filtrer par statut, programme, pays et date.</p>
        </div>
        <ui-button size="sm" variant="ghost" (clicked)="exportCsv()">Export CSV</ui-button>
      </header>

      <form [formGroup]="filters" class="grid gap-3 md:grid-cols-5">
        <ui-input formControlName="search" label="Recherche" placeholder="Nom ou email" class="md:col-span-2" />
        <ui-select formControlName="status" label="Statut" [options]="statusOptions" placeholder="Tous" />
        <ui-select formControlName="track" label="Programme" [options]="trackOptions" placeholder="Tous" />
        <ui-select formControlName="country" label="Pays" [options]="countryOptions" placeholder="Tous" />
      </form>

      <section *ngIf="variant() !== 4; else boardView" class="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 shadow-sm">
        <ui-table [columns]="columns" [rows]="filteredCandidates()" />
        <div class="mt-4 flex items-center justify-between text-xs text-[rgb(var(--color-text))]/60">
          <span>Total: {{ filteredCandidates().length }} candidats</span>
          <div class="flex items-center gap-2">
            <ui-button variant="ghost" size="sm" (clicked)="prevPage()" [disabled]="page() === 1">Précédent</ui-button>
            <span>Page {{ page() }}</span>
            <ui-button variant="ghost" size="sm" (clicked)="nextPage()" [disabled]="page() >= totalPages()">Suivant</ui-button>
          </div>
        </div>
      </section>

      <ng-template #boardView>
        <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article *ngFor="let column of boardColumns" class="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-4 shadow-inner">
            <header class="flex items-center justify-between">
              <h3 class="text-sm font-semibold">{{ column.title }}</h3>
              <ui-badge size="sm">{{ column.items(filteredCandidates()).length }}</ui-badge>
            </header>
            <ul class="mt-4 flex flex-col gap-3">
              <li *ngFor="let candidate of column.items(filteredCandidates())" class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-3">
                <h4 class="text-sm font-semibold">{{ candidate.name }}</h4>
                <p class="text-xs text-[rgb(var(--color-text))]/60">Score {{ candidate.overallScore }}/20</p>
                <div class="mt-2 flex gap-2 text-[0.65rem] text-[rgb(var(--color-text))]/60">
                  <button class="underline" (click)="openCandidate(candidate.id)">Ouvrir</button>
                  <button class="underline" (click)="openMapping(candidate.id)">Revue mapping</button>
                </div>
              </li>
            </ul>
          </article>
        </section>
      </ng-template>
    </section>
  `
})
export class CandidatesComponent {
  private readonly store = inject(DataStoreService);
  private readonly csv = inject(CsvExportService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly variantService = inject(VariantService);

  protected readonly variant = computed(() => this.variantService.variantSignal());

  protected readonly filters = this.fb.group({
    search: [''],
    status: [''],
    track: [''],
    country: ['']
  });

  private readonly pageSize = 6;
  protected readonly page = signal(1);

  protected readonly filteredCandidates = computed(() => {
    const snapshot = this.filteredSlice();
    return snapshot.slice((this.page() - 1) * this.pageSize, this.page() * this.pageSize);
  });

  private readonly filteredSlice = computed(() => {
    const filters = this.filters.value;
    const term = (filters.search ?? '').toLowerCase();
    const status = filters.status as CandidateStatus | '';
    const track = filters.track ?? '';
    const country = filters.country ?? '';
    const items = this.store.snapshotCandidates();
    const filtered = items.filter((candidate) => {
      const matchesSearch = !term || candidate.name.toLowerCase().includes(term) || candidate.email.toLowerCase().includes(term);
      const matchesStatus = !status || candidate.status === status;
      const matchesTrack = !track || candidate.track === track;
      const matchesCountry = !country || candidate.country === country;
      return matchesSearch && matchesStatus && matchesTrack && matchesCountry;
    });
    return filtered;
  });

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredSlice().length / this.pageSize)));

  protected readonly statusOptions = [
    { label: 'En attente', value: 'en_attente' },
    { label: 'Auto-évalué', value: 'auto_evalue' },
    { label: 'Validé', value: 'valide' },
    { label: 'Rejeté', value: 'rejete' }
  ];

  protected readonly trackOptions = Array.from(new Set(this.store.snapshotCandidates().map((candidate) => candidate.track))).map((track) => ({
    label: track,
    value: track
  }));

  protected readonly countryOptions = Array.from(new Set(this.store.snapshotCandidates().map((candidate) => candidate.country))).map((country) => ({
    label: country,
    value: country
  }));

  readonly columns = [
    {
      key: 'identite',
      header: 'Nom & email',
      cell: (candidate: Candidate) => `${candidate.name}\n${candidate.email}`
    },
    {
      key: 'origine',
      header: 'École / filière',
      cell: (candidate: Candidate) => `${candidate.school} — ${candidate.track}`
    },
    {
      key: 'date',
      header: 'Date upload',
      cell: (candidate: Candidate) => new Date(candidate.createdAt).toLocaleDateString('fr-FR')
    },
    {
      key: 'statut',
      header: 'Statut',
      cell: (candidate: Candidate) => candidate.status
    },
    {
      key: 'score',
      header: 'Score / taux',
      cell: (candidate: Candidate) => `${candidate.overallScore}/20 — ${candidate.equivalencyPercent}%`
    }
  ];

  readonly boardColumns = [
    {
      key: 'en_attente',
      title: 'En attente',
      items: (items: Candidate[]) => items.filter((candidate) => candidate.status === 'en_attente')
    },
    {
      key: 'auto_evalue',
      title: 'Auto-évalué',
      items: (items: Candidate[]) => items.filter((candidate) => candidate.status === 'auto_evalue')
    },
    {
      key: 'valide',
      title: 'Validé',
      items: (items: Candidate[]) => items.filter((candidate) => candidate.status === 'valide')
    },
    {
      key: 'rejete',
      title: 'Rejeté',
      items: (items: Candidate[]) => items.filter((candidate) => candidate.status === 'rejete')
    }
  ];

  constructor() {
    this.filters.valueChanges.pipe(startWith(this.filters.value)).subscribe(() => {
      this.page.set(1);
    });
  }

  prevPage(): void {
    this.page.update((current) => Math.max(1, current - 1));
  }

  nextPage(): void {
    this.page.update((current) => Math.min(this.totalPages(), current + 1));
  }

  openCandidate(id: string): void {
    this.router.navigate(['/candidates', id]);
  }

  openMapping(id: string): void {
    this.router.navigate(['/mapping', id]);
  }

  exportCsv(): void {
    const rows = this.filteredSlice().map((candidate) => ({
      nom: candidate.name,
      email: candidate.email,
      ecole: candidate.school,
      filiere: candidate.track,
      pays: candidate.country,
      statut: candidate.status,
      score: candidate.overallScore,
      taux: candidate.equivalencyPercent
    }));
    this.csv.export('candidats', rows);
  }
}
