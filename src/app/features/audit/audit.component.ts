import { Component, inject, signal } from '@angular/core';
import { DatePipe, NgFor } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataStoreService } from '../../core/services/data-store.service';
import { AuditLog } from '../../core/models';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { CsvExportService } from '../../core/services/ui/csv-export.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [DatePipe, NgFor, UiButtonComponent],
  template: `
    <section class="flex flex-col gap-4">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Audit & Logs</h2>
          <p class="text-xs text-[rgb(var(--color-text))]/60">Traçabilité des actions (export CSV).</p>
        </div>
        <ui-button size="sm" variant="ghost" (clicked)="export()">Export CSV</ui-button>
      </header>

      <div class="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4">
        <header class="mb-4 flex flex-wrap items-center gap-3 text-xs">
          <label class="flex items-center gap-2">
            <span>Recherche</span>
            <input
              class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 py-1"
              placeholder="entité, acteur"
              (input)="search($any($event.target).value)"
            />
          </label>
        </header>
        <div class="max-h-[60vh] overflow-auto">
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-[rgb(var(--color-surface))]">
              <tr class="text-left">
                <th class="py-2">Date</th>
                <th>Acteur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of filteredLogs()" class="border-b border-[rgb(var(--color-border))]/50">
                <td class="py-2">{{ log.at | date:'short' }}</td>
                <td>{{ log.actor }}</td>
                <td>{{ log.action }}</td>
                <td>{{ log.entity }} #{{ log.entityId }}</td>
                <td>{{ detail(log) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `
})
export class AuditComponent {
  private readonly store = inject(DataStoreService);
  private readonly csv = inject(CsvExportService);

  private readonly logsSignal = toSignal(this.store.getAuditLogs(), { initialValue: [] as AuditLog[] });
  protected readonly query = signal('');

  protected readonly filteredLogs = signal(this.logsSignal());

  constructor() {
    this.update();
  }

  private update(): void {
    const lower = this.query().toLowerCase();
    const filtered = this.logsSignal().filter((log) =>
      !lower ||
      log.actor.toLowerCase().includes(lower) ||
      log.entity.toLowerCase().includes(lower) ||
      log.action.toLowerCase().includes(lower)
    );
    this.filteredLogs.set(filtered);
  }

  search(value: string): void {
    this.query.set(value ?? '');
    this.update();
  }

  detail(log: AuditLog): string {
    if (!log.after) return '-';
    return JSON.stringify(log.after);
  }

  export(): void {
    const rows = this.filteredLogs().map((log) => ({
      date: log.at,
      acteur: log.actor,
      action: log.action,
      entite: log.entity,
      identifiant: log.entityId,
      apres: JSON.stringify(log.after ?? {})
    }));
    this.csv.export('audit', rows);
  }
}
