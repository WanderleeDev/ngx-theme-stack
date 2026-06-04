import { Component, inject } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ServiceHeaderComponent } from '../../components/service-header/service-header';
import { ThemeStatusComponent } from '../../components/theme-status/theme-status';

@Component({
  selector: 'app-toggle-view',
  standalone: true,
  imports: [ThemeSwitcherComponent, ServiceHeaderComponent, ThemeStatusComponent],
  host: {
    class: 'w-full flex flex-col gap-6 items-center justify-center px-4 md:px-6',
  },
  template: `
    <app-theme-switcher ngProjectAs="top-nav" />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-4xl">
      <app-service-header
        title="Toggle"
        description="Binary switching between light and dark themes with a single action."
        [tags]="tags"
      />

      <div
        class="group/card relative overflow-hidden rounded-3xl bg-card-bg backdrop-blur-xl border border-card-border p-6 flex flex-col items-center justify-center min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-fade-in-up animate-duration-300"
      >
        <div
          class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
          style="background: var(--primary, oklch(0.7 0.2 250))"
        ></div>
        <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
          @if (themeService.isHydrated()) {
            <button
              (click)="toggleTheme()"
              [attr.aria-label]="'Toggle theme to ' + (themeService.isDark() ? 'light' : 'dark')"
              class="group relative flex items-center justify-center w-20 h-20 bg-btn-bg text-btn-text rounded-full transition-all duration-200 active:scale-95 shadow-btn cursor-pointer"
            >
              <span
                class="material-symbols-outlined text-4xl transition-transform duration-200 group-hover:rotate-45"
              >
                {{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}
              </span>
            </button>
            <span class="text-[10px] uppercase font-bold tracking-widest text-text-muted/50 mt-4">
              Tap to switch
            </span>
          } @else {
            <div class="w-20 h-20 bg-btn-bg/50 rounded-full animate-pulse shadow-btn"></div>
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
export default class ToggleView {
  protected readonly themeService = inject(ThemeToggleService);
  private readonly soundService = inject(ThemeSoundService);

  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly selectedTheme = this.themeService.selectedTheme;
  protected readonly tags = ['Light / Dark', 'One Action', 'Binary Switch', 'Theme Toggle'];

  public toggleTheme() {
    this.themeService.toggle();
    this.soundService.play(this.themeService.isDark());
  }
}
