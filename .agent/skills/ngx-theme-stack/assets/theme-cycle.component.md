# Theme Cycle Component

A button component to cycle through all available themes.

```typescript
import { inject, Component } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-cycle',
  template: `
    @if (theme.isHydrated()) {
      <button (click)="theme.cycle()">
        🔄 Cycle Theme
      </button>
    } @else {
      <div class="theme-cycle-skeleton"></div>
    }
  `,
})
export class ThemeCycle {
  protected readonly theme = inject(ThemeCycleService);
}
```
