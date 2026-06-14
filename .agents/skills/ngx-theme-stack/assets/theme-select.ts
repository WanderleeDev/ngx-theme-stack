import { inject, Component } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-select',
  template: `
    @if (theme.isHydrated()) {
      <select name="select-theme" (change)="onThemeChange($event)">
        @for (t of theme.availableThemes; track t) {
          <option [value]="t" [selected]="theme.selectedTheme() === t">
            {{ t }}
          </option>
        }
      </select>
    } @else {
      <!-- Implement a custom skeleton/placeholder that matches the hydrated select's exact dimensions to prevent layout shift -->
    }
  `,
})
export class ThemeSelect {
  protected readonly theme = inject(ThemeSelectService);

  onThemeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.theme.select(value);
  }
}
