import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-theme-status',
  standalone: true,
  templateUrl: './theme-status.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeStatusComponent {
  /**
   * The actual theme applied to the document (e.g., 'dark', 'light')
   */
  public readonly resolved = input.required<string>();

  /**
   * The user preference (e.g., 'system', 'dark', 'light')
   */
  public readonly selected = input.required<string>();
}
