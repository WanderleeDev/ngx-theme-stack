import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ServiceHeaderComponent } from '../../components/service-header/service-header';
import { ThemeStatusComponent } from '../../components/theme-status/theme-status';

@Component({
  selector: 'app-select-view',
  standalone: true,
  imports: [ThemeSwitcherComponent, ServiceHeaderComponent, ThemeStatusComponent],
  host: {
    class: 'w-full flex flex-col gap-6 items-center justify-center px-4 md:px-6',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-theme-switcher ngProjectAs="top-nav" />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-4xl">
      <app-service-header
        title="Select"
        description="Directly choose any theme from the list of available options in your application."
        [tags]="tags"
      />

      <div
        class="rounded-3xl bg-card-bg backdrop-blur-xl border border-card-border p-6 flex flex-col items-center justify-center min-h-[220px]"
      >
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 select-none"
        >
          <span class="material-symbols-outlined text-3xl text-[var(--info,oklch(0.7_0.15_180))]">
            palette
          </span>
        </div>
        <span
          class="text-[10px] uppercase font-bold tracking-widest text-text-muted/50 mt-4 text-center"
        >
          Theme Palette
        </span>
      </div>

      <div
        class="group/card relative overflow-hidden md:col-span-3 rounded-2xl bg-card-bg backdrop-blur-xl border border-card-border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-fade-in-up animate-duration-300"
      >
        <div
          class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
          style="background: var(--info, oklch(0.7 0.15 180))"
        ></div>
        <div class="relative z-10 w-full h-full">
          @if (themeService.isHydrated()) {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
              @for (theme of themeService.availableThemes; track theme) {
                <button
                  (click)="selectTheme(theme)"
                  [attr.aria-label]="'Select theme ' + theme"
                  class="group/btn flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 active:scale-95 border-2 cursor-pointer"
                  [class.bg-nav-active]="theme === themeService.selectedTheme()"
                  [class.border-[var(--info,oklch(0.7_0.15_180))]]="
                    theme === themeService.selectedTheme()
                  "
                  [class.border-transparent]="theme !== themeService.selectedTheme()"
                  [class.bg-tag-bg]="theme !== themeService.selectedTheme()"
                >
                  <span
                    class="material-symbols-outlined text-xl mb-1 opacity-60 transition-transform duration-300 group-hover/btn:scale-110"
                  >
                    palette
                  </span>
                  <span class="text-[10px] font-black uppercase tracking-widest text-text-main">
                    {{ theme }}
                  </span>
                </button>
              }
            </div>
          } @else {
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full animate-pulse">
              @for (i of [1, 2, 3, 4]; track i) {
                <button
                  class="flex flex-col items-center justify-center p-4 rounded-2xl border border-transparent bg-tag-bg cursor-wait"
                >
                  <span class="material-symbols-outlined text-xl mb-1 opacity-20"> palette </span>
                  <span
                    class="text-[10px] font-black uppercase tracking-widest bg-divider text-transparent rounded"
                  >
                    loading
                  </span>
                </button>
              }
            </div>
          }
        </div>
      </div>

      <app-theme-status
        [resolved]="resolvedTheme()"
        [selected]="selectedTheme()"
        [isHydrated]="themeService.isHydrated()"
      />
    </div>
  `,
})
export default class SelectView {
  protected readonly themeService = inject(ThemeSelectService);
  private readonly soundService = inject(ThemeSoundService);

  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly selectedTheme = this.themeService.selectedTheme;
  protected readonly tags = ['Direct Select', 'Custom Palette', 'Multi-Theme', 'Explicit Choice'];

  public selectTheme(theme: string) {
    this.themeService.select(theme);
    this.soundService.play(this.themeService.isDark());
  }
}
