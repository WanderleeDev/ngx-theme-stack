import { Component, inject } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ThemeCardWrapperComponent } from '../../components/theme-card-wrapper/theme-card-wrapper';
import { ThemeStatusComponent } from '../../components/theme-status/theme-status';

@Component({
  selector: 'app-select-view',
  imports: [ThemeCardWrapperComponent, ThemeStatusComponent],
  templateUrl: './select-view.html',
})
export default class SelectView {
  protected readonly themeService = inject(ThemeSelectService);
  private readonly soundService = inject(ThemeSoundService);

  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly selectedTheme = this.themeService.selectedTheme;

  public selectTheme(theme: string) {
    this.themeService.select(theme);
    this.soundService.play(this.themeService.isDark());
  }
}
