import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `<h2>Home (public)</h2>
             <a routerLink="/dashboard">Go to dashboard</a>`,
})
export class HomeComponent {}
