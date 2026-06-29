import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.cycle()">🔄 Cycle Theme</button>
    } @else {
      <!-- Placeholder that matches button dimensions to prevent layout shift -->
      <div style="width: 112px; height: 40px; border-radius: 4px; background: #e2e8f0;"></div>
    }
  `,
})
export class ThemeCycle {
  protected readonly theme = inject(ThemeCycleService);
}
