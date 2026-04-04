import { Component, inject } from '@angular/core';
import { ThemeCycleService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';
import { ThemeCardWrapperComponent } from '../theme-card-wrapper/theme-card-wrapper';

@Component({
  selector: 'app-theme-cycle-card',
  imports: [ThemeCardWrapperComponent],
  templateUrl: './theme-cycle-card.html',
})
export class ThemeCycleCardComponent {
  protected themeService = inject(ThemeCycleService);
  private soundService = inject(ThemeSoundService);
  protected readonly tags = ['DYNAMIC CYCLE', 'MULTI-THEME', 'ROTATING STATES'];

  public nextTheme() {
    this.themeService.cycle();
    this.soundService.play(this.themeService.isDark());
  }
}
