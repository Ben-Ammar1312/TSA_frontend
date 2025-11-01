import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataStoreService } from '../../core/services/data-store.service';
import { ThemeService } from '../../core/services/theme.service';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiInputComponent } from '../../shared/components/ui-input/ui-input.component';
import { ToastService } from '../../core/services/ui/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, UiButtonComponent, UiInputComponent],
  template: `
    <section class="flex flex-col gap-6">
      <header>
        <h2 class="text-lg font-semibold">Paramètres</h2>
        <p class="text-xs text-[rgb(var(--color-text))]/60">Seuils, coefficients, pipeline et thème.</p>
      </header>

      <form [formGroup]="thresholdForm" class="card flex flex-col gap-3" (ngSubmit)="saveThresholds()">
        <h3 class="text-sm font-semibold">Seuils de confiance</h3>
        <div class="grid gap-3 md:grid-cols-3 text-xs">
          <ui-input formControlName="globalAcceptance" label="Seuil global (/20)" type="number" />
          <ui-input formControlName="exactMin" label="Exact min" type="number" />
          <ui-input formControlName="fuzzyOk" label="Fuzzy OK" type="number" />
          <ui-input formControlName="fuzzyMaybe" label="Fuzzy maybe" type="number" />
          <ui-input formControlName="llmMin" label="LLM min" type="number" />
          <ui-input formControlName="nearMissLow" label="Faible" type="number" />
        </div>
        <ui-button type="submit" size="sm">Enregistrer les seuils</ui-button>
      </form>

      <form [formGroup]="weightForm" class="card flex flex-col gap-3" (ngSubmit)="saveWeights()">
        <h3 class="text-sm font-semibold">Poids par défaut</h3>
        <div class="grid gap-3 md:grid-cols-3 text-xs">
          <ui-input formControlName="defaultCoefficient" label="Coef par défaut" type="number" />
          <ui-input formControlName="llmBonus" label="Bonus LLM" type="number" />
          <ui-input formControlName="penaltyLowConfidence" label="Pénalité faible confiance" type="number" />
        </div>
        <ui-button type="submit" size="sm">Enregistrer les poids</ui-button>
      </form>

      <section class="card flex flex-col gap-3 text-xs">
        <h3 class="text-sm font-semibold">Pipelines (lecture seule)</h3>
        <div class="grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3">
            <p class="font-semibold">OCR</p>
            <p>Status: actif</p>
          </div>
          <div class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3">
            <p class="font-semibold">ML matching</p>
            <p>Status: actif</p>
          </div>
          <div class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3">
            <p class="font-semibold">LLM alias</p>
            <p>Status: expérimental</p>
          </div>
        </div>
      </section>

      <section class="card flex items-center justify-between text-xs">
        <div>
          <h3 class="text-sm font-semibold">Thème</h3>
          <p class="text-[rgb(var(--color-text))]/60">Basculer clair / sombre (persisté).</p>
        </div>
        <ui-button size="sm" variant="ghost" (clicked)="toggleTheme()">
          Mode {{ theme.darkMode() ? 'sombre' : 'clair' }}
        </ui-button>
      </section>

      <section class="card flex flex-col gap-3 text-xs">
        <h3 class="text-sm font-semibold">Rétention des données</h3>
        <p>Actuellement: {{ retentionMonths() }} mois.</p>
        <div class="flex items-center gap-2">
          <input type="range" min="3" max="36" [value]="retentionMonths()" (input)="updateRetention($any($event.target).value)" />
          <span>{{ retentionMonths() }} mois</span>
        </div>
      </section>
    </section>
  `
})
export class SettingsComponent {
  private readonly store = inject(DataStoreService);
  protected readonly theme = inject(ThemeService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(ToastService);

  private readonly thresholdsSignal = toSignal(this.store.getThresholds(), { initialValue: this.store.snapshotThresholds() });
  private readonly weightsSignal = toSignal(this.store.getWeights(), {
    initialValue: this.store.snapshotWeights()
  });

  protected readonly thresholdForm = this.fb.group({
    globalAcceptance: [this.thresholdsSignal().globalAcceptance],
    exactMin: [this.thresholdsSignal().exactMin],
    fuzzyOk: [this.thresholdsSignal().fuzzyOk],
    fuzzyMaybe: [this.thresholdsSignal().fuzzyMaybe],
    llmMin: [this.thresholdsSignal().llmMin],
    nearMissLow: [this.thresholdsSignal().nearMissLow]
  });

  protected readonly weightForm = this.fb.group({
    defaultCoefficient: [this.weightsSignal().defaultCoefficient],
    llmBonus: [this.weightsSignal().llmBonus],
    penaltyLowConfidence: [this.weightsSignal().penaltyLowConfidence]
  });

  protected readonly retentionMonths = signal(18);

  saveThresholds(): void {
    const value = this.thresholdForm.value;
    this.store.updateThresholds(value as any, 'admin');
    this.toast.push({ title: 'Seuils mis à jour', description: 'Nouveaux seuils appliqués.', tone: 'success' });
  }

  saveWeights(): void {
    const value = this.weightForm.value;
    this.store.updateWeights(value as any, 'admin');
    this.toast.push({ title: 'Poids mis à jour', description: 'Scores recalculés avec pondération.', tone: 'success' });
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  updateRetention(value: number): void {
    this.retentionMonths.set(Number(value));
    this.toast.push({ title: 'Rétention ajustée', description: `${value} mois`, tone: 'info' });
  }
}
