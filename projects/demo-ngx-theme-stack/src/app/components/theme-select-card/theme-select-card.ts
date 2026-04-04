import { Component, inject } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ThemeCardWrapperComponent } from '../theme-card-wrapper/theme-card-wrapper';

@Component({
  selector: 'app-theme-select-card',
  imports: [ThemeCardWrapperComponent],
  templateUrl: './theme-select-card.html',
})
export class ThemeSelectCardComponent {
  protected themeService = inject(ThemeSelectService);
  private soundService = inject(ThemeSoundService);
  protected readonly tags = ['EXPLICIT SELECT', 'GRID LAYOUT', 'ACCESSIBLE UI'];

  public selectTheme(theme: string) {
    this.themeService.select(theme);
    this.soundService.play(this.themeService.isDark());
  }

  protected getIcon(theme: string): string {
    switch (theme) {
      case 'light': return 'light_mode';
      case 'dark': return 'dark_mode';
      default: return 'settings_brightness';
    }
  }
}
