import { Component, computed, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { CsvExportService } from '../../core/services/ui/csv-export.service';
import { DataStoreService } from '../../core/services/data-store.service';
import { TargetSubject } from '../../core/models';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { UiSelectComponent } from '../../shared/components/ui-select/ui-select.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { ToastService } from '../../core/services/ui/toast.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [NgFor, NgIf, ReactiveFormsModule, UiButtonComponent, UiInputComponent, UiSelectComponent, UiBadgeComponent],
  template: `
    <section class="flex flex-col gap-4">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Catalogue des matières cibles</h2>
          <p class="text-xs text-[rgb(var(--color-text))]/60">CRUD simplifié + import/export CSV.</p>
        </div>
        <div class="flex items-center gap-2">
          <ui-button size="sm" variant="ghost" (clicked)="exportCsv()">Export CSV</ui-button>
          <ui-button size="sm" variant="ghost" (clicked)="mockImport()">Import CSV (mock)</ui-button>
          <ui-button size="sm" (clicked)="addSubject()">Ajouter</ui-button>
        </div>
      </header>

      <form [formGroup]="filters" class="grid gap-3 md:grid-cols-4">
        <ui-input formControlName="search" label="Recherche" placeholder="Libellé ou code" class="md:col-span-2" />
        <ui-select formControlName="category" label="Catégorie" [options]="categoryOptions" placeholder="Toutes" />
        <ui-select formControlName="active" label="Statut" [options]="statusOptions" placeholder="Tous" />
      </form>

      <section class="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4">
        <table class="w-full text-xs">
          <thead class="border-b border-[rgb(var(--color-border))]/70 text-left">
            <tr>
              <th class="py-2">Code</th>
              <th>Libellé FR</th>
              <th>Catégorie</th>
              <th>Coef</th>
              <th>Actif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let subject of filteredSubjects()" class="border-b border-[rgb(var(--color-border))]/40">
              <td class="py-2 font-mono text-[0.75rem]">{{ subject.code }}</td>
              <td>{{ subject.titleFr }}</td>
              <td>{{ subject.category }}</td>
              <td>{{ subject.coefficient }}</td>
              <td>
                <ui-badge [tone]="subject.active ? 'success' : 'warning'" size="sm">{{ subject.active ? 'Actif' : 'Inactif' }}</ui-badge>
              </td>
              <td class="text-right">
                <ui-button size="sm" variant="ghost" (clicked)="toggleActive(subject)">
                  {{ subject.active ? 'Désactiver' : 'Réactiver' }}
                </ui-button>
              </td>
            </tr>
            <tr *ngIf="!filteredSubjects().length">
              <td colspan="6" class="py-6 text-center text-xs text-[rgb(var(--color-text))]/60">Aucun sujet pour ce filtre.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `
})
export class CatalogComponent {
  private readonly store = inject(DataStoreService);
  private readonly csv = inject(CsvExportService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  protected readonly filters = this.fb.group({
    search: [''],
    category: [''],
    active: ['']
  });

  protected readonly filteredSubjects = computed(() => {
    const items = this.store.snapshotTargetSubjects();
    const { search, category, active } = this.filters.value;
    return items.filter((subject) => {
      const matchesSearch = !search || subject.titleFr.toLowerCase().includes(search.toLowerCase()) || subject.code.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || subject.category === category;
      const matchesActive = !active || (active === 'actif' ? subject.active : !subject.active);
      return matchesSearch && matchesCategory && matchesActive;
    });
  });

  protected readonly categoryOptions = Array.from(new Set(this.store.snapshotTargetSubjects().map((subject) => subject.category))).map((category) => ({
    label: category,
    value: category
  }));

  protected readonly statusOptions = [
    { label: 'Actif', value: 'actif' },
    { label: 'Inactif', value: 'inactif' }
  ];

  constructor() {
    this.filters.valueChanges.pipe(startWith(this.filters.value)).subscribe();
  }

  toggleActive(subject: TargetSubject): void {
    this.store.updateTargetSubject(subject.code, { active: !subject.active }, 'admin');
    this.toast.push({ title: 'Catalogue', description: `${subject.code} → ${!subject.active ? 'actif' : 'inactif'}`, tone: 'info' });
  }

  addSubject(): void {
    const next = this.store.snapshotTargetSubjects().length + 1;
    const code = `NEW-${next}`;
    this.store.addTargetSubject(
      {
        id: `target-${code}`,
        code,
        titleFr: `Nouvelle matière ${next}`,
        titleEn: `New subject ${next}`,
        category: 'Divers',
        coefficient: 2,
        active: true
      },
      'admin'
    );
    this.toast.push({ title: 'Nouveau sujet', description: `${code} ajouté.`, tone: 'success' });
  }

  exportCsv(): void {
    const rows = this.filteredSubjects().map((subject) => ({
      code: subject.code,
      titre: subject.titleFr,
      categorie: subject.category,
      coefficient: subject.coefficient,
      actif: subject.active
    }));
    this.csv.export('catalogue', rows);
  }

  mockImport(): void {
    this.toast.push({ title: 'Import fictif', description: 'Importer un CSV ajoutera bientôt des alias.', tone: 'warning' });
  }
}
