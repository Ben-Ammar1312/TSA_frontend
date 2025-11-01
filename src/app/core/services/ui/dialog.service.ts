import { Injectable, WritableSignal, signal } from '@angular/core';

export interface ConfirmDialogConfig {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'info' | 'warning' | 'danger';
}

interface DialogState extends ConfirmDialogConfig {
  open: boolean;
  resolver?: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly state: WritableSignal<DialogState | null> = signal(null);

  readonly dialogSignal = this.state.asReadonly();

  confirm(config: ConfirmDialogConfig): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({ ...config, open: true, resolver: resolve });
    });
  }

  resolve(result: boolean): void {
    const snapshot = this.state();
    if (!snapshot) return;
    snapshot.resolver?.(result);
    this.state.set(null);
  }
}
