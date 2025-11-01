import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  export<T extends Record<string, unknown>>(filename: string, rows: T[]): void {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => headers.map((header) => this.escape(row[header])).join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private escape(value: unknown): string {
    if (value == null) return '';
    const str = String(value).replace(/"/g, '""');
    if (str.includes(';') || str.includes('\n')) {
      return `"${str}"`;
    }
    return str;
  }
}
