import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span [ngClass]="classes">
      <ng-content />
    </span>
  `
})
export class UiBadgeComponent {
  @Input() tone: 'neutral' | 'success' | 'warning' | 'danger' = 'neutral';
  @Input() size: 'sm' | 'md' = 'md';

  get classes(): Record<string, boolean> {
    return {
      chip: true,
      'badge-success': this.tone === 'success',
      'badge-warning': this.tone === 'warning',
      'badge-danger': this.tone === 'danger',
      'text-xs px-2 py-0.5': this.size === 'sm'
    };
  }
}
