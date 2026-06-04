import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-theme-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'md:col-span-3 block w-full',
  },
  template: `
    @if (isHydrated()) {
      <div
        class="rounded-2xl bg-card-bg backdrop-blur-xl border border-card-border px-6 py-4 flex flex-col sm:flex-row items-center justify-around gap-4"
      >
        <div class="flex items-center gap-2.5 text-text-muted/80">
          <span class="text-[10px] uppercase font-bold tracking-widest text-text-muted/40"
            >Selected Theme</span
          >
          <span
            class="text-xs font-black uppercase tracking-wider text-text-main bg-tag-bg px-2.5 py-1 rounded-lg border border-white/5"
          >
            {{ selected() }}
          </span>
        </div>
        <div class="flex items-center gap-2.5 text-text-muted/80">
          <span class="text-[10px] uppercase font-bold tracking-widest text-text-muted/40"
            >Resolved Theme</span
          >
          <span
            class="text-xs font-black uppercase tracking-wider text-text-main bg-tag-bg px-2.5 py-1 rounded-lg border border-white/5"
          >
            {{ resolved() }}
          </span>
        </div>
      </div>
    } @else {
      <div
        class="rounded-2xl bg-card-bg backdrop-blur-xl border border-card-border px-6 py-4 flex items-center justify-center animate-pulse"
      >
        <div class="h-6 w-48 bg-white/5 rounded-full"></div>
      </div>
    }
  `,
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
