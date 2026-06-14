import { inject, Component } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycle',
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.cycle()">🔄 Cycle Theme</button>
    } @else {
      <!-- Implement a custom skeleton/placeholder that matches the hydrated button's exact dimensions to prevent layout shift -->
    }
  `,
})
export class ThemeCycle {
  protected readonly theme = inject(ThemeCycleService);
}
