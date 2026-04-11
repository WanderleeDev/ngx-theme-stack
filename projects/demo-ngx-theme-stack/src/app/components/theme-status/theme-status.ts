import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-theme-status',
  templateUrl: './theme-status.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeStatusComponent {
  /**
   * Whether the service has completed client-side initialization.
   */
  readonly isHydrated = input.required<boolean>();

  /**
   * The actual theme applied to the document (e.g., 'dark', 'light')
   */
  public readonly resolved = input.required<string>();

  /**
   * The user preference (e.g., 'system', 'dark', 'light')
   */
  public readonly selected = input.required<string>();
}
