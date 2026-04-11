import { Component, inject } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';
import { ThemeCardWrapperComponent } from '../../components/theme-card-wrapper/theme-card-wrapper';
import { ThemeStatusComponent } from '../../components/theme-status/theme-status';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher';
import { ThemeSoundService } from '../../services/theme-sound.service';

@Component({
  selector: 'app-toggle-view',
  imports: [ThemeCardWrapperComponent, ThemeStatusComponent, ThemeSwitcherComponent],
  templateUrl: './toggle-view.html',
  host: {
    class: 'w-full flex flex-col gap-8 justify-center items-center',
  },
})
export default class ToggleView {
  protected readonly themeService = inject(ThemeToggleService);
  private readonly soundService = inject(ThemeSoundService);

  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly selectedTheme = this.themeService.selectedTheme;

  public toggleTheme() {
    this.themeService.toggle();
    this.soundService.play(this.themeService.isDark());
  }
}
