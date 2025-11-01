import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [attr.type]="buttonType"
      [disabled]="disabled"
      [ngClass]="classes"
      (click)="clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
  host: {
    class: 'inline-flex'
  }
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() buttonType: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<Event>();

  get classes(): Record<string, boolean> {
    return {
      btn: this.variant === 'primary',
      'btn-secondary': this.variant === 'secondary',
      'px-2 py-1 text-sm': this.size === 'sm',
      'px-4 py-2 text-sm': this.size === 'md',
      'px-5 py-3 text-base': this.size === 'lg',
      'opacity-60 pointer-events-none': this.disabled,
      'bg-transparent border border-[rgb(var(--color-border))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-surface-muted))]':
        this.variant === 'ghost'
    };
  }
}
