import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map, of, switchMap, tap } from 'rxjs';
import { DataStoreService } from '../../core/services/data-store.service';
import { ToastService } from '../../core/services/ui/toast.service';
import { ScoringService } from '../../core/services/scoring.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { VariantService } from '../../core/services/variant.service';
import {
  Candidate,
  ExtractedSubject,
  Mapping,
  TargetSubject,
  ThresholdSettings
} from '../../core/models';

interface MappingViewModel {
  candidate?: Candidate;
  subjects: ExtractedSubject[];
  mappings: Mapping[];
  targets: TargetSubject[];
  thresholds: ThresholdSettings;
  breakdownScore: number;
  breakdownEquivalency: number;
}

@Component({
  selector: 'app-mapping-review',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, NgClass, NgFor, NgIf, UiButtonComponent, UiBadgeComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Revue de mapping — {{ vm.candidate?.name }}</h2>
          <p class="text-xs text-[rgb(var(--color-text))]/60">Ajustez les correspondances et recalcul automatique du score.</p>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <ui-badge tone="success" size="sm">Score {{ vm.breakdownScore | number:'1.1-1' }}/20</ui-badge>
          <ui-badge tone="warning" size="sm">Équivalence {{ vm.breakdownEquivalency | number:'1.0-0' }}%</ui-badge>
          <ui-button variant="ghost" size="sm" (clicked)="batchAccept(vm.thresholds.fuzzyOk)">Accepter ≥ {{ vm.thresholds.fuzzyOk }}</ui-button>
          <ui-button variant="ghost" size="sm" (clicked)="batchReject(vm.thresholds.nearMissLow)">Rejeter < {{ vm.thresholds.nearMissLow }}</ui-button>
        </div>
      </header>

      <section [ngClass]="paneClasses()" class="relative mt-4 flex flex-1 overflow-hidden rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]">
        <div class="pane-left flex-1 overflow-auto p-4">
          <h3 class="text-sm font-semibold">Matières source (OCR / parse)</h3>
          <div class="mt-4 flex flex-col gap-3">
            <article *ngFor="let mapping of vm.mappings; let i = index" class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3">
              <div class="flex items-center justify-between text-xs text-[rgb(var(--color-text))]/60">
                <span>Confiance {{ mapping.confidence | number:'1.2-2' }}</span>
                <span>Méthode {{ mapping.method }}</span>
              </div>
              <h4 class="mt-1 text-sm font-semibold">{{ subjectLabel(mapping.extractedSubjectId, vm.subjects) }}</h4>
              <p class="text-xs text-[rgb(var(--color-text))]/60">Note normalisée {{ normalizedGrade(mapping.extractedSubjectId, vm.subjects) | number:'1.1-1' }}/20 · Coef {{ sourceCoef(mapping.extractedSubjectId, vm.subjects) }}</p>
              <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <ui-button size="sm" variant="ghost" (clicked)="accept(mapping)">Accepter</ui-button>
                <ui-button size="sm" variant="ghost" (clicked)="remove(mapping)">Retirer</ui-button>
                <label class="text-xs">Remplacer →</label>
                <select class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-2 py-1 text-xs" (change)="replace(mapping, $any($event.target).value)">
                  <option value="">Choisir</option>
                  <option *ngFor="let target of vm.targets" [value]="target.code" [selected]="mapping.targetSubjectCode === target.code">
                    {{ target.code }} — {{ target.titleFr }}
                  </option>
                </select>
              </div>
            </article>
          </div>
        </div>
        <div class="pane-divider" *ngIf="variant() === 3" (mousedown)="startDrag($event)"></div>
        <div class="pane-right border-l border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-4" [style.width.%]="variant() === 3 ? paneWidth() : 100">
          <h3 class="text-sm font-semibold">Cibles proposées</h3>
          <ul class="mt-4 flex flex-col gap-3">
            <li *ngFor="let mapping of vm.mappings" class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-3">
              <p class="text-sm font-semibold">{{ mapping.targetSubjectCode || 'Non assigné' }}</p>
              <p class="text-xs text-[rgb(var(--color-text))]/60">{{ targetLabel(mapping.targetSubjectCode, vm.targets) }}</p>
              <p class="text-xs text-[rgb(var(--color-text))]/60">Auto: {{ mapping.auto ? 'Oui' : 'Non' }} · Override: {{ mapping.overriddenByAdmin ? 'Oui' : 'Non' }}</p>
            </li>
          </ul>
        </div>
      </section>

      <footer class="mt-4 flex items-center justify-between text-xs text-[rgb(var(--color-text))]/60">
        <span>Mise à jour en direct de la formule.</span>
        <ui-button size="sm" (clicked)="backToCandidate(vm.candidate?.id)">Retour fiche candidat</ui-button>
      </footer>
    </ng-container>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .pane-divider {
        width: 8px;
        cursor: col-resize;
        background: rgba(59, 130, 246, 0.2);
      }
    `
  ]
})
export class MappingReviewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly toast = inject(ToastService);
  private readonly scoring = inject(ScoringService);
  private readonly router = inject(Router);
  private readonly variantService = inject(VariantService);

  protected readonly variant = computed(() => this.variantService.variantSignal());

  protected readonly paneWidth = signal(35);
  private isDragging = false;

  protected readonly vm$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = params.get('candidateId');
      if (!id) {
        const thresholds = this.store.snapshotThresholds();
        return of<MappingViewModel>({
          subjects: [],
          mappings: [],
          targets: [],
          thresholds,
          breakdownScore: 0,
          breakdownEquivalency: 0
        });
      }
      return combineLatest([
        this.store.getCandidateById(id),
        this.store.getExtractedSubjectsByCandidate(id),
        this.store.getMappingsForCandidate(id),
        this.store.getTargetSubjects(),
        this.store.getThresholds(),
        this.scoring.breakdownForCandidate(id)
      ]).pipe(
        tap(([, , , , , breakdown]) => {
          if (id) {
            this.store.updateCandidateScore(id, breakdown, 'admin');
          }
        }),
        map(([candidate, subjects, mappings, targets, thresholds, breakdown]) => ({
          candidate,
          subjects,
          mappings,
          targets,
          thresholds,
          breakdownScore: breakdown.overallScore,
          breakdownEquivalency: breakdown.equivalencyPercent
        }))
      );
    })
  );

  paneClasses = computed(() => ({
    'flex-col lg:flex-row': this.variant() !== 3,
    'flex-row': this.variant() === 3
  }));

  subjectLabel(id: string, subjects: ExtractedSubject[]): string {
    return subjects.find((subject) => subject.id === id)?.rawLabel ?? 'Inconnu';
  }

  targetLabel(code: string | undefined, targets: TargetSubject[]): string {
    if (!code) return 'Sélectionnez une cible';
    return targets.find((target) => target.code === code)?.titleFr ?? 'Non trouvé';
  }

  normalizedGrade(id: string, subjects: ExtractedSubject[]): number {
    const subject = subjects.find((item) => item.id === id);
    if (!subject) return 0;
    return this.scoring.normalizeGrade(subject.rawGrade, subject.scale);
  }

  sourceCoef(id: string, subjects: ExtractedSubject[]): number {
    return subjects.find((item) => item.id === id)?.sourceCoefficient ?? 1;
  }

  accept(mapping: Mapping): void {
    this.store.updateMapping(mapping.id, { overriddenByAdmin: true }, 'admin');
    this.toast.push({ title: 'Mapping accepté', description: `${mapping.id} marqué comme validé.`, tone: 'success' });
  }

  replace(mapping: Mapping, code: string): void {
    if (!code) return;
    this.store.updateMapping(mapping.id, { targetSubjectCode: code, overriddenByAdmin: true }, 'admin');
    this.toast.push({ title: 'Cible remplacée', description: `${mapping.id} → ${code}`, tone: 'info' });
  }

  remove(mapping: Mapping): void {
    this.store.updateMapping(mapping.id, { targetSubjectCode: undefined }, 'admin');
    this.toast.push({ title: 'Mapping retiré', description: `${mapping.id} mis de côté.`, tone: 'warning' });
  }

  batchAccept(threshold: number): void {
    this.store.acceptMappingsByThreshold(this.currentCandidateId(), threshold, 'admin');
    this.toast.push({ title: 'Lot accepté', description: `Mappings ≥ ${threshold} validés.`, tone: 'success' });
  }

  batchReject(threshold: number): void {
    this.store.rejectMappingsBelow(this.currentCandidateId(), threshold, 'admin');
    this.toast.push({ title: 'Lot rejeté', description: `Mappings < ${threshold} retirés.`, tone: 'warning' });
  }

  backToCandidate(id?: string): void {
    if (!id) return;
    this.router.navigate(['/candidates', id]);
  }

  private currentCandidateId(): string {
    const snapshot = this.route.snapshot.paramMap.get('candidateId');
    return snapshot ?? '';
  }

  startDrag(event: MouseEvent): void {
    this.isDragging = true;
    event.preventDefault();
  }

  @HostListener('window:mousemove', ['$event'])
  onDrag(event: MouseEvent): void {
    if (!this.isDragging || this.variant() !== 3) return;
    const percent = Math.min(60, Math.max(20, (event.clientX / window.innerWidth) * 100));
    this.paneWidth.set(percent);
  }

  @HostListener('window:mouseup')
  stopDrag(): void {
    this.isDragging = false;
  }
}
