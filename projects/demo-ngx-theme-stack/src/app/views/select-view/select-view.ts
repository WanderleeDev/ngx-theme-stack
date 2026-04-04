import { Component, inject } from '@angular/core';
import { ThemeSelectService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ThemeCardWrapperComponent } from '../../components/theme-card-wrapper/theme-card-wrapper';

@Component({
  selector: 'app-select-view',
  imports: [ThemeCardWrapperComponent],
  templateUrl: './select-view.html',
})
export default class SelectView {
  protected readonly themeService = inject(ThemeSelectService);
  private readonly soundService = inject(ThemeSoundService);

  public selectTheme(theme: string) {
    this.themeService.select(theme);
    this.soundService.play(this.themeService.isDark());
  }
}
