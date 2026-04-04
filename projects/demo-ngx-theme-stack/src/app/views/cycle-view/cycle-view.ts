import { Component, inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ThemeCardWrapperComponent } from '../../components/theme-card-wrapper/theme-card-wrapper';

@Component({
  selector: 'app-cycle-view',
  imports: [ThemeCardWrapperComponent],
  templateUrl: './cycle-view.html',
})
export default class CycleView {
  protected readonly themeService = inject(ThemeCycleService);
  private readonly soundService = inject(ThemeSoundService);

  public nextTheme() {
    this.themeService.cycle();
    this.soundService.play(this.themeService.isDark());
  }
}
