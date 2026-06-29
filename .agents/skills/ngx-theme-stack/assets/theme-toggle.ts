import { inject, Component, ChangeDetectionStrategy } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.toggle()">
        {{ theme.isDark() ? '🌙' : '☀️' }}
      </button>
    } @else {
      <!-- Placeholder that matches button dimensions to prevent layout shift -->
      <div style="width: 40px; height: 40px; border-radius: 4px; background: #e2e8f0;"></div>
    }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeToggleService);
}
