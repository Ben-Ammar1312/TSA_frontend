import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const THEME_KEY = 'tsa-admin-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isDark = signal(this.loadInitial());

  readonly darkMode = this.isDark.asReadonly();

  constructor() {
    this.apply(this.isDark());
  }

  toggle(): void {
    this.set(!this.isDark());
  }

  set(value: boolean): void {
    this.isDark.set(value);
    this.apply(value);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_KEY, value ? 'dark' : 'light');
    }
  }

  private loadInitial(): boolean {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private apply(dark: boolean): void {
    const body = this.document?.body;
    if (!body) return;
    body.classList.toggle('dark-mode', dark);
    if (dark) {
      body.style.backgroundColor = 'rgb(15, 23, 42)';
      body.style.color = 'rgb(226, 232, 240)';
    } else {
      body.style.backgroundColor = '';
      body.style.color = '';
    }
  }
}
