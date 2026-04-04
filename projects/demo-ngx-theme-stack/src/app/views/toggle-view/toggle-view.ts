import { Component, inject } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ThemeCardWrapperComponent } from '../../components/theme-card-wrapper/theme-card-wrapper';

@Component({
  selector: 'app-toggle-view',
  imports: [ThemeCardWrapperComponent],
  templateUrl: './toggle-view.html',
})
export default class ToggleView {
  protected readonly themeService = inject(ThemeToggleService);
  private readonly soundService = inject(ThemeSoundService);

  public toggleTheme() {
    this.themeService.toggle();
    this.soundService.play(this.themeService.isDark());
  }
}
