import { Component, computed, inject } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { DataStoreService } from '../../core/services/data-store.service';
import { Candidate, CandidateStatus, JobStat, TaskItem } from '../../core/models';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { CsvExportService } from '../../core/services/ui/csv-export.service';
import { VariantService } from '../../core/services/variant.service';

interface DashboardKpi {
  label: string;
  value: number | string;
  description: string;
  tone?: 'success' | 'warning' | 'danger';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, NgFor, NgIf, UiBadgeComponent, UiButtonComponent],
  template: `
    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article *ngFor="let kpi of kpis()" class="card flex flex-col gap-2">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--color-text))]/60">{{ kpi.label }}</h3>
        <p class="text-2xl font-semibold">{{ kpi.value }}</p>
        <p class="text-xs text-[rgb(var(--color-text))]/60">{{ kpi.description }}</p>
      </article>
    </section>

    <section class="mt-6 grid gap-4 lg:grid-cols-3">
      <article class="card lg:col-span-2">
        <header class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">Fil d’activité / Audit</h2>
            <p class="text-xs text-[rgb(var(--color-text))]/60">Dernières interventions opérateur.</p>
          </div>
          <ui-button size="sm" variant="ghost" (clicked)="exportAudit()">Exporter CSV</ui-button>
        </header>
        <ul class="mt-4 flex flex-col gap-3">
          <li *ngFor="let log of activity$ | async" class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium">{{ log.actor }} → {{ log.action }}</p>
                <p class="text-xs text-[rgb(var(--color-text))]/60">{{ log.entity }} #{{ log.entityId }}</p>
              </div>
              <span class="text-xs text-[rgb(var(--color-text))]/60">{{ log.at | date:'short' }}</span>
            </div>
          </li>
          <li *ngIf="!(activity$ | async)?.length" class="rounded-xl border border-dashed border-[rgb(var(--color-border))] p-6 text-center text-xs text-[rgb(var(--color-text))]/60">
            Aucun log pour l’instant, effectuez une action pour alimenter l’audit.
          </li>
        </ul>
      </article>
      <article class="card flex flex-col gap-4">
        <div>
          <h2 class="text-lg font-semibold">Tâches ouvertes</h2>
          <p class="text-xs text-[rgb(var(--color-text))]/60">Mappings faible confiance & suggestions à valider.</p>
        </div>
        <ul class="flex flex-col gap-3">
          <li *ngFor="let task of tasks$ | async" class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium">{{ task.label }}</p>
              <ui-badge [tone]="toneFromSeverity(task.severity)" size="sm">{{ task.severity }}</ui-badge>
            </div>
            <p class="mt-1 text-xs text-[rgb(var(--color-text))]/60">{{ task.description }}</p>
          </li>
        </ul>
      </article>
    </section>

    <section class="mt-6 grid gap-4 lg:grid-cols-2">
      <article class="card">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">Jobs des dernières 24h</h2>
            <p class="text-xs text-[rgb(var(--color-text))]/60">Suivi OCR, ML et API.</p>
          </div>
        </div>
        <ul class="mt-4 flex flex-col gap-3">
          <li *ngFor="let job of jobStats$ | async" class="rounded-lg border border-[rgb(var(--color-border))] p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-semibold">{{ job.label }}</p>
                <p class="text-xs text-[rgb(var(--color-text))]/60">Durée {{ job.durationMs / 1000 | number:'1.0-1' }}s</p>
              </div>
              <ui-badge [tone]="jobTone(job)" size="sm">{{ job.status }}</ui-badge>
            </div>
            <p class="text-[0.65rem] text-[rgb(var(--color-text))]/50">Dernier passage {{ job.ranAt | date:'short' }}</p>
          </li>
        </ul>
      </article>
      <article class="card">
        <h2 class="text-lg font-semibold">Répartition des statuts</h2>
        <p class="text-xs text-[rgb(var(--color-text))]/60">Vue synthétique.</p>
        <div class="mt-4 flex flex-col gap-3">
          <div *ngFor="let item of statusBreakdown()" class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3">
            <div class="flex items-center justify-between text-sm">
              <span>{{ item.label }}</span>
              <span class="font-semibold">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>
  `
})
export class DashboardComponent {
  private readonly store = inject(DataStoreService);
  private readonly csv = inject(CsvExportService);
  private readonly variantService = inject(VariantService);

  protected readonly activity$ = this.store.getAuditLogs();
  protected readonly tasks$ = this.store.getTasks();
  protected readonly jobStats$ = this.store.getJobStats();
  protected readonly candidates$ = this.store.getCandidates();
  protected readonly variant = computed(() => this.variantService.variantSignal());

  protected readonly kpis = computed<DashboardKpi[]>(() => {
    const candidates = this.store.snapshotCandidates();
    const statuses = this.statusBreakdown();
    const avgScore = (
      candidates.reduce((acc, candidate) => acc + candidate.overallScore, 0) / candidates.length
    ).toFixed(1);
    return [
      { label: 'Candidats en attente', value: statuses.find((s) => s.key === 'en_attente')?.value ?? 0, description: 'À traiter manuellement.' },
      { label: 'Temps moyen', value: '4h12', description: 'Temps moyen de traitement 24h.' },
      { label: 'Seuil global', value: '≥12/20', description: 'Personnalisable dans Paramètres.' },
      { label: 'Score moyen', value: avgScore, description: 'Moyenne des scores recalculés.' }
    ];
  });

  protected readonly statusBreakdown = computed(() => {
    const candidates = this.store.snapshotCandidates();
    const statuses: Record<CandidateStatus, number> = {
      en_attente: 0,
      auto_evalue: 0,
      valide: 0,
      rejete: 0
    };
    candidates.forEach((candidate) => {
      statuses[candidate.status] = (statuses[candidate.status] ?? 0) + 1;
    });
    return (
      [
        { key: 'en_attente', label: 'En attente', value: statuses.en_attente },
        { key: 'auto_evalue', label: 'Auto-évalué', value: statuses.auto_evalue },
        { key: 'valide', label: 'Validé', value: statuses.valide },
        { key: 'rejete', label: 'Rejeté', value: statuses.rejete }
      ] as const
    ).map((item) => ({ ...item, key: item.key as CandidateStatus }));
  });

  exportAudit(): void {
    this.activity$.subscribe((logs) => {
      this.csv.export('audit', logs.map((log) => ({
        acteur: log.actor,
        action: log.action,
        entite: log.entity,
        identifiant: log.entityId,
        date: log.at
      })));
    }).unsubscribe();
  }

  toneFromSeverity(severity: TaskItem['severity']) {
    switch (severity) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      default:
        return 'neutral';
    }
  }

  jobTone(job: JobStat) {
    switch (job.status) {
      case 'failed':
        return 'danger';
      case 'warning':
        return 'warning';
      default:
        return 'success';
    }
  }
}
