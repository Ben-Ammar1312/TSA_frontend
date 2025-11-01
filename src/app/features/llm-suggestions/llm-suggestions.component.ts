import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { DataStoreService } from '../../core/services/data-store.service';
import { AliasSuggestion, HotCacheSettings } from '../../core/models';
import { UiButtonComponent } from '../../shared/components/ui-button/ui-button.component';
import { UiBadgeComponent } from '../../shared/components/ui-badge/ui-badge.component';
import { ToastService } from '../../core/services/ui/toast.service';

@Component({
  selector: 'app-llm-suggestions',
  standalone: true,
  imports: [DatePipe, DecimalPipe, NgClass, NgFor, NgIf, UiButtonComponent, UiBadgeComponent],
  template: `
    <section class="flex flex-col gap-5">
      <header class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">Suggestions LLM</h2>
          <p class="text-xs text-[rgb(var(--color-text))]/60">Approuvez, rejetez ou reportez. Raccourcis A/R.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3 text-xs">
          <ui-button size="sm" variant="ghost" (clicked)="batchApprove()">Approuver ≥0.90</ui-button>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="h-4 w-4" [checked]="hotCache().enabled" (change)="toggleHotCache($any($event.target).checked)" />
            Hot Cache immédiate
          </label>
          <div class="flex items-center gap-1">
            <span>TTL</span>
            <input
              type="number"
              class="w-16 rounded border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-2 py-1 text-xs"
              [value]="hotCache().ttlMinutes"
              (change)="updateTtl($any($event.target).value)"
            />
            <span>min</span>
          </div>
        </div>
      </header>

      <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article
          *ngFor="let suggestion of suggestions(); let i = index"
          class="rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 transition"
          [ngClass]="{ 'ring-2 ring-[rgb(var(--color-primary))]': i === selectedIndex() }"
          (click)="select(i)"
        >
          <header class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">{{ suggestion.rawLabel }}</h3>
            <ui-badge [tone]="suggestion.confidence >= 0.9 ? 'success' : 'warning'" size="sm">{{ suggestion.confidence | number:'1.2-2' }}</ui-badge>
          </header>
          <p class="mt-1 text-xs text-[rgb(var(--color-text))]/60">Normalisé: {{ suggestion.normalizedLabel }}</p>
          <p class="text-xs text-[rgb(var(--color-text))]/60">Langue {{ suggestion.language }} · Cible {{ suggestion.targetSubjectCode }}</p>
          <p class="text-[0.65rem] text-[rgb(var(--color-text))]/50">Occurrences {{ suggestion.occurrences }} · {{ suggestion.createdAt | date:'short' }}</p>
          <div class="mt-3 flex items-center gap-2 text-xs">
            <ui-button size="sm" (clicked)="approve(suggestion); $event.stopPropagation()">Approuver</ui-button>
            <ui-button size="sm" variant="ghost" (clicked)="reject(suggestion); $event.stopPropagation()">Rejeter</ui-button>
            <ui-button size="sm" variant="ghost" (clicked)="snooze(suggestion); $event.stopPropagation()">Reporter</ui-button>
          </div>
        </article>
        <article *ngIf="!suggestions().length" class="rounded-2xl border border-dashed border-[rgb(var(--color-border))] p-6 text-center text-xs text-[rgb(var(--color-text))]/60">
          File d’attente vide 🎉
        </article>
      </section>
    </section>
  `
})
export class LlmSuggestionsComponent {
  private readonly store = inject(DataStoreService);
  private readonly toast = inject(ToastService);

  private readonly suggestionsSignal = toSignal(this.store.getAliasSuggestions(), { initialValue: [] as AliasSuggestion[] });
  protected readonly suggestions = computed(() =>
    this.suggestionsSignal().filter((suggestion) => suggestion.status === 'pending')
  );

  protected readonly selectedIndex = signal(0);
  protected readonly hotCache = signal<HotCacheSettings>(this.store.getHotCache());

  constructor() {
    effect(() => {
      const list = this.suggestions();
      if (this.selectedIndex() >= list.length && list.length) {
        this.selectedIndex.set(Math.max(0, list.length - 1));
      }
      if (!list.length) {
        this.selectedIndex.set(0);
      }
    });
  }

  select(index: number): void {
    this.selectedIndex.set(index);
  }

  approve(suggestion: AliasSuggestion): void {
    this.store.approveSuggestion(suggestion.id, 'admin');
    this.toast.push({ title: 'Alias approuvé', description: suggestion.rawLabel, tone: 'success' });
  }

  reject(suggestion: AliasSuggestion): void {
    this.store.updateAliasSuggestionStatus(suggestion.id, 'rejected', 'admin');
    this.toast.push({ title: 'Suggestion rejetée', description: suggestion.rawLabel, tone: 'danger' });
  }

  snooze(suggestion: AliasSuggestion): void {
    this.store.updateAliasSuggestionStatus(suggestion.id, 'snoozed', 'admin');
    this.toast.push({ title: 'Suggestion reportée', description: suggestion.rawLabel, tone: 'warning' });
  }

  batchApprove(): void {
    const highConfidence = this.suggestions().filter((suggestion) => suggestion.confidence >= 0.9);
    highConfidence.forEach((suggestion) => this.store.approveSuggestion(suggestion.id, 'admin'));
    if (highConfidence.length) {
      this.toast.push({ title: 'Lot approuvé', description: `${highConfidence.length} alias`, tone: 'success' });
    }
  }

  toggleHotCache(enabled: boolean): void {
    const settings = { ...this.hotCache(), enabled };
    this.store.updateHotCache(settings, 'admin');
    this.hotCache.set(settings);
  }

  updateTtl(value: number): void {
    const ttl = Math.max(5, Number(value) || this.hotCache().ttlMinutes);
    const settings = { ...this.hotCache(), ttlMinutes: ttl };
    this.store.updateHotCache(settings, 'admin');
    this.hotCache.set(settings);
  }

  @HostListener('window:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    const list = this.suggestions();
    if (!list.length) return;
    const suggestion = list[this.selectedIndex()];
    if (!suggestion) return;
    if (event.key.toLowerCase() === 'a') {
      this.approve(suggestion);
    } else if (event.key.toLowerCase() === 'r') {
      this.reject(suggestion);
    }
  }
}
