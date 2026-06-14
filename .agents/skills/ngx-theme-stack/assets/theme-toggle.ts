import { inject, Component } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.toggle()">
        {{ theme.isDark() ? '🌙' : '☀️' }}
      </button>
    } @else {
      <!-- Implement a custom skeleton/placeholder that matches the hydrated button's exact dimensions to prevent layout shift -->
    }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeToggleService);
}
