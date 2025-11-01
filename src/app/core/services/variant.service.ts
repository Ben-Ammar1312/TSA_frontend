import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppVariant } from '../models';

const VARIANT_KEY = 'tsa-admin-variant';

@Injectable({ providedIn: 'root' })
export class VariantService {
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly variant = signal<AppVariant>(this.loadInitialVariant());

  readonly variantSignal = this.variant.asReadonly();

  constructor() {
    this.applyVariantAttribute(this.variant());

    effect(() => {
      this.persistVariant(this.variant());
      this.applyVariantAttribute(this.variant());
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const params = new URLSearchParams(event.urlAfterRedirects.split('?')[1] ?? '');
        const variant = this.normalizeVariant(params.get('variant'));
        if (variant && variant !== this.variant()) {
          this.variant.set(variant);
        }
      });
  }

  setVariant(value: AppVariant): void {
    if (value !== this.variant()) {
      this.variant.set(value);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', String(value));
        window.history.replaceState({}, '', url.toString());
      }
    }
  }

  private loadInitialVariant(): AppVariant {
    if (typeof window === 'undefined') {
      return 1;
    }
    const stored = localStorage.getItem(VARIANT_KEY);
    const param = new URLSearchParams(window.location.search).get('variant');
    return (
      this.normalizeVariant(param) ||
      this.normalizeVariant(stored) ||
      1
    );
  }

  private persistVariant(value: AppVariant): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(VARIANT_KEY, String(value));
    }
  }

  private applyVariantAttribute(value: AppVariant): void {
    this.document?.documentElement?.setAttribute('data-variant', String(value));
  }

  private normalizeVariant(value: string | null | undefined): AppVariant | undefined {
    if (!value) return undefined;
    const numeric = Number(value);
    if ([1, 2, 3, 4].includes(numeric)) {
      return numeric as AppVariant;
    }
    return undefined;
  }
}
