import { Component, inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';
import { ThemeCardWrapperComponent } from '../../components/theme-card-wrapper/theme-card-wrapper';
import { ThemeStatusComponent } from '../../components/theme-status/theme-status';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher';
import { ThemeSoundService } from '../../services/theme-sound.service';

@Component({
  selector: 'app-cycle-view',
  imports: [ThemeCardWrapperComponent, ThemeStatusComponent, ThemeSwitcherComponent],
  templateUrl: './cycle-view.html',
  host: {
    class: 'w-full flex flex-col gap-8 justify-center items-center',
  },
})
export default class CycleView {
  protected readonly themeService = inject(ThemeCycleService);
  private readonly soundService = inject(ThemeSoundService);

  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly selectedTheme = this.themeService.selectedTheme;
  protected readonly upcomingTheme = this.themeService.upcoming;
  protected readonly precedingTheme = this.themeService.preceding;
  protected readonly isHydrated = this.themeService.isHydrated;

  public nextTheme() {
    this.themeService.cycle();
    this.soundService.play(this.themeService.isDark());
  }
}
