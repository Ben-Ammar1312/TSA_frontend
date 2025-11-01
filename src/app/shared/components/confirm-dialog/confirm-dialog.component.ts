import { Component, computed, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { DialogService } from '../../../core/services/ui/dialog.service';
import { UiButtonComponent } from '../ui-button/ui-button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NgIf, UiButtonComponent],
  template: `
    <div *ngIf="dialog()" class="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4">
      <div class="w-full max-w-md rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-6 shadow-2xl">
        <h2 class="text-lg font-semibold">{{ dialog()?.title }}</h2>
        <p class="mt-2 text-sm text-[rgb(var(--color-text))]/70">{{ dialog()?.description }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <ui-button variant="ghost" size="sm" (clicked)="resolve(false)">
            {{ dialog()?.cancelLabel ?? 'Annuler' }}
          </ui-button>
          <ui-button
            [variant]="dialog()?.tone === 'danger' ? 'secondary' : 'primary'"
            size="sm"
            (clicked)="resolve(true)"
          >
            {{ dialog()?.confirmLabel ?? 'Confirmer' }}
          </ui-button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  private readonly dialogService = inject(DialogService);
  protected readonly dialog = computed(() => this.dialogService.dialogSignal());

  resolve(result: boolean): void {
    this.dialogService.resolve(result);
  }
}
