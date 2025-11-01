import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutShellComponent } from './shared/components/layout-shell/layout-shell.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutShellComponent, ToastContainerComponent, ConfirmDialogComponent],
  template: `
    <app-layout-shell>
      <router-outlet />
    </app-layout-shell>
    <app-toast-container />
    <app-confirm-dialog />
  `
})
export class App {}
