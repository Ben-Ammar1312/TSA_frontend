import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';

export interface UiTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => string | number | null | undefined;
}

@Component({
  selector: 'ui-table',
  standalone: true,
  imports: [NgFor, NgIf],
  template: `
    <div class="overflow-auto max-h-[70vh] scrollbar-thin">
      <table class="data-table">
        <thead>
          <tr>
            <th *ngFor="let column of columns" class="px-3">{{ column.header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows" class="bg-[rgb(var(--color-surface))] hover:bg-[rgb(var(--color-surface-muted))] transition">
            <td *ngFor="let column of columns" class="px-3">
              <ng-container>{{ column.cell(row) }}</ng-container>
            </td>
          </tr>
          <tr *ngIf="!rows?.length">
            <td [attr.colspan]="columns.length" class="px-3 py-6 text-center text-sm text-[rgb(var(--color-text))]/70">
              Aucun résultat pour le filtre courant.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class UiTableComponent<T> {
  @Input() columns: UiTableColumn<T>[] = [];
  @Input() rows: T[] = [];
}
