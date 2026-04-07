import { Component, inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ThemeCardWrapperComponent } from '../../components/theme-card-wrapper/theme-card-wrapper';
import { ThemeStatusComponent } from '../../components/theme-status/theme-status';

@Component({
  selector: 'app-cycle-view',
  imports: [ThemeCardWrapperComponent, ThemeStatusComponent],
  templateUrl: './cycle-view.html',
})
export default class CycleView {
  protected readonly themeService = inject(ThemeCycleService);
  private readonly soundService = inject(ThemeSoundService);

  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly selectedTheme = this.themeService.selectedTheme;

  public nextTheme() {
    this.themeService.cycle();
    this.soundService.play(this.themeService.isDark());
  }
}
