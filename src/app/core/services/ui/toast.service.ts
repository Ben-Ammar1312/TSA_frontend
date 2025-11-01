import { Injectable, WritableSignal, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
  timeout?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toasts: WritableSignal<ToastMessage[]> = signal([]);

  readonly toastsSignal = this.toasts.asReadonly();

  push(toast: Omit<ToastMessage, 'id'>): void {
    const message: ToastMessage = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      timeout: 5000,
      ...toast
    };
    this.toasts.update((state) => [...state, message]);
    if (message.timeout) {
      setTimeout(() => this.dismiss(message.id), message.timeout);
    }
  }

  dismiss(id: string): void {
    this.toasts.update((state) => state.filter((toast) => toast.id !== id));
  }
}
