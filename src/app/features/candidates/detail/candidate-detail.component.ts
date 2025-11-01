import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe, DecimalPipe, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, UpperCasePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { DataStoreService } from '../../../core/services/data-store.service';
import { UiBadgeComponent } from '../../../shared/components/ui-badge/ui-badge.component';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { ScoringService } from '../../../core/services/scoring.service';

@Component({
  selector: 'app-candidate-detail',
  standalone: true,
  imports: [AsyncPipe, DatePipe, DecimalPipe, NgFor, NgIf, NgSwitch, NgSwitchCase, NgSwitchDefault, UpperCasePipe, UiBadgeComponent, UiButtonComponent],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <section class="flex flex-col gap-6">
        <header class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">{{ vm.candidate?.name }}</h2>
            <p class="text-xs text-[rgb(var(--color-text))]/60">{{ vm.candidate?.email }} · {{ vm.candidate?.school }} / {{ vm.candidate?.track }}</p>
          </div>
          <div class="flex items-center gap-3">
            <ui-badge tone="success" size="sm">Score {{ vm.breakdown?.overallScore | number:'1.1-1' }}/20</ui-badge>
            <ui-button size="sm" (clicked)="openMapping(vm.candidate!.id)">Revue mapping</ui-button>
          </div>
        </header>

        <section class="grid gap-4 md:grid-cols-2">
          <article class="card">
            <h3 class="text-sm font-semibold">Profil</h3>
            <dl class="mt-3 grid grid-cols-2 gap-2 text-xs text-[rgb(var(--color-text))]/70">
              <dt>Pays</dt><dd>{{ vm.candidate?.country }}</dd>
              <dt>Statut</dt><dd>{{ vm.candidate?.status }}</dd>
              <dt>Date upload</dt><dd>{{ vm.candidate?.createdAt | date:'medium' }}</dd>
              <dt>Score global</dt><dd>{{ vm.candidate?.overallScore }}/20</dd>
              <dt>Taux équivalence</dt><dd>{{ vm.candidate?.equivalencyPercent }}%</dd>
            </dl>
          </article>
          <article class="card">
            <h3 class="text-sm font-semibold">Formule actuelle</h3>
            <p class="mt-2 text-xs text-[rgb(var(--color-text))]/60">Somme(normalisée × coefficient) / total coefficients.</p>
            <ul class="mt-3 flex flex-col gap-1 text-xs">
              <li>Total coefficients: {{ vm.breakdown?.totalCoefficient | number:'1.0-0' }}</li>
              <li>Somme pondérée: {{ vm.breakdown?.weightedSum | number:'1.1-1' }}</li>
              <li>Score recalculé: {{ vm.breakdown?.overallScore | number:'1.1-1' }}/20</li>
            </ul>
          </article>
        </section>

        <section class="card">
          <h3 class="text-sm font-semibold">Documents fournis</h3>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <article *ngFor="let doc of vm.documents" class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-4">
              <h4 class="text-sm font-semibold">{{ doc.filename }}</h4>
              <p class="text-xs text-[rgb(var(--color-text))]/60">{{ doc.type | uppercase }} · {{ doc.uploadedAt | date:'short' }}</p>
              <ng-container [ngSwitch]="doc.type">
                <object *ngSwitchCase="'pdf'" [data]="doc.previewUrl" type="application/pdf" class="mt-2 h-40 w-full rounded-lg border border-[rgb(var(--color-border))]">
                  Aperçu indisponible.
                </object>
                <img *ngSwitchDefault class="mt-2 h-40 w-full rounded-lg object-cover" [src]="doc.previewUrl" alt="Prévisualisation document" />
              </ng-container>
            </article>
          </div>
        </section>

        <section class="card">
          <h3 class="text-sm font-semibold">Matières extraites</h3>
          <div class="mt-3 overflow-auto">
            <table class="min-w-full text-xs">
              <thead>
                <tr class="text-left">
                  <th class="py-2">Libellé source</th>
                  <th>Note brute</th>
                  <th>Normalisée (/20)</th>
                  <th>Coef source</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let subject of vm.subjects" class="border-t border-[rgb(var(--color-border))]/70">
                  <td class="py-2">{{ subject.rawLabel }}</td>
                  <td>{{ subject.rawGrade }}/{{ subject.scale }}</td>
                  <td>{{ subject.normalized | number:'1.1-1' }}</td>
                  <td>{{ subject.sourceCoefficient }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </ng-container>
  `
})
export class CandidateDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(DataStoreService);
  private readonly scoring = inject(ScoringService);

  protected readonly vm$ = this.route.paramMap.pipe(
    switchMap((params) => {
      const id = params.get('id');
      if (!id) {
        return of({ candidate: undefined, documents: [], subjects: [], breakdown: undefined });
      }
      return combineLatest([
        this.store.getCandidateById(id),
        this.store.getDocumentsForCandidate(id),
        this.store.getExtractedSubjectsByCandidate(id),
        this.store.getMappingsForCandidate(id),
        this.store.getTargetSubjects(),
        this.scoring.breakdownForCandidate(id)
      ]).pipe(
        map(([candidate, documents, subjects, mappings, targets, breakdown]) => ({
          candidate,
          documents,
          subjects: subjects.map((subject) => ({
            ...subject,
            normalized: this.scoring.normalizeGrade(subject.rawGrade, subject.scale)
          })),
          mappings,
          breakdown
        }))
      );
    })
  );

  openMapping(id: string): void {
    window.open(`/mapping/${id}`, '_blank');
  }
}
