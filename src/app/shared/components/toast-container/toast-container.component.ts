import { Component, computed, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { ToastService } from '../../../core/services/ui/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <section class="fixed bottom-4 right-4 flex w-80 flex-col gap-3 z-[9999]">
      <article
        *ngFor="let toast of toasts()"
        class="rounded-xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-4 shadow-xl"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold">{{ toast.title }}</h3>
            <p *ngIf="toast.description" class="mt-1 text-xs text-[rgb(var(--color-text))]/70">
              {{ toast.description }}
            </p>
          </div>
          <button
            class="text-xs text-[rgb(var(--color-text))]/60 hover:text-[rgb(var(--color-text))]"
            (click)="dismiss(toast.id)"
          >
            ✕
          </button>
        </div>
      </article>
    </section>
  `
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  protected readonly toasts = computed(() => this.toastService.toastsSignal());

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
