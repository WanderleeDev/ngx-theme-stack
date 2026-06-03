import { Component, inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ServiceHeaderComponent } from '../../components/service-header/service-header';
import { ThemeStatusComponent } from '../../components/theme-status/theme-status';

@Component({
  selector: 'app-cycle-view',
  standalone: true,
  imports: [ThemeSwitcherComponent, ServiceHeaderComponent, ThemeStatusComponent],
  host: {
    class: 'w-full flex flex-col gap-6 items-center justify-center px-4 md:px-6',
  },
  template: `
    <app-theme-switcher ngProjectAs="top-nav" />

    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-4xl">
      <app-service-header
        title="Sequence"
        description="Step through your full theme list sequentially in a predetermined order."
        [tags]="tags"
      />

      <div
        class="group/card relative overflow-hidden rounded-3xl bg-card-bg backdrop-blur-xl border border-card-border p-6 flex flex-col items-center justify-center min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)] animate-fade-in-up animate-duration-300"
      >
        <div
          class="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 pointer-events-none"
          style="background: var(--accent, oklch(0.6 0.25 320))"
        ></div>
        <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
          <button
            (click)="nextTheme()"
            aria-label="Cycle to next theme"
            class="group relative flex items-center justify-center w-20 h-20 bg-btn-bg text-btn-text rounded-full transition-all duration-200 active:scale-95 shadow-btn cursor-pointer"
          >
            <span
              class="material-symbols-outlined text-4xl transition-transform duration-500 group-hover:rotate-180"
            >
              sync
            </span>
          </button>
          <span class="text-[10px] uppercase font-bold tracking-widest text-text-muted/50 mt-4">
            Tap to cycle
          </span>
        </div>
      </div>

      <div
        class="md:col-span-3 rounded-2xl bg-card-bg backdrop-blur-xl border border-card-border p-6 flex flex-col md:flex-row items-center justify-around gap-6"
      >
        <div class="flex flex-col items-center select-none w-24">
          <span class="text-[10px] uppercase font-bold tracking-widest mb-1 text-text-muted/50"
            >Previous</span
          >
          @if (isHydrated()) {
            <span class="text-base font-black capitalize text-text-main tracking-tight">{{
              precedingTheme()
            }}</span>
          } @else {
            <div class="h-4 w-12 bg-text-main/10 rounded-full animate-pulse my-1"></div>
          }
          <div class="w-full h-0.5 bg-text-main/20 rounded-full mt-1"></div>
        </div>

        <div class="flex flex-col items-center select-none w-24">
          <span
            class="text-[10px] uppercase font-bold tracking-widest mb-1 text-[var(--accent)] font-extrabold"
            >Current</span
          >
          @if (isHydrated()) {
            <span class="text-lg font-black capitalize text-text-main tracking-tight">{{
              selectedTheme()
            }}</span>
          } @else {
            <div class="h-5 w-16 bg-text-main/10 rounded-full animate-pulse my-1"></div>
          }
          <div class="w-full h-0.5 bg-[var(--accent)] rounded-full mt-1"></div>
        </div>

        <div class="flex flex-col items-center select-none w-24">
          <span class="text-[10px] uppercase font-bold tracking-widest mb-1 text-text-muted/50"
            >Next</span
          >
          @if (isHydrated()) {
            <span class="text-base font-black capitalize text-text-main tracking-tight">{{
              upcomingTheme()
            }}</span>
          } @else {
            <div class="h-4 w-12 bg-text-main/10 rounded-full animate-pulse my-1"></div>
          }
          <div class="w-full h-0.5 bg-text-main/20 rounded-full mt-1"></div>
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
export default class CycleView {
  protected readonly themeService = inject(ThemeCycleService);
  private readonly soundService = inject(ThemeSoundService);

  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly selectedTheme = this.themeService.selectedTheme;
  protected readonly upcomingTheme = this.themeService.upcoming;
  protected readonly precedingTheme = this.themeService.preceding;
  protected readonly isHydrated = this.themeService.isHydrated;
  protected readonly tags = ['Sequential', 'Looping', 'Multi-Theme', 'SSR Ready'];

  public nextTheme() {
    this.themeService.cycle();
    this.soundService.play(this.themeService.isDark());
  }
}
