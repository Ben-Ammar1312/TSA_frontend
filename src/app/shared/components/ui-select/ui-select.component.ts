import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface UiSelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
}

@Component({
  selector: 'ui-select',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  template: `
    <label class="flex flex-col gap-1 text-sm">
      <span *ngIf="label" class="font-medium">{{ label }}</span>
      <select
        class="rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
        [ngModel]="value"
        (ngModelChange)="valueChange.emit($event)"
      >
        <option *ngIf="placeholder" [ngValue]="undefined">{{ placeholder }}</option>
        <option *ngFor="let option of options" [ngValue]="option.value">
          {{ option.label }}
        </option>
      </select>
      <span *ngIf="hint" class="text-xs text-[rgb(var(--color-text))]/70">{{ hint }}</span>
    </label>
  `,
  host: {
    class: 'block w-full'
  }
})
export class UiSelectComponent<T = string> {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() hint?: string;
  @Input() options: UiSelectOption<T>[] = [];
  @Input() value?: T;
  @Output() valueChange = new EventEmitter<T | undefined>();
}
