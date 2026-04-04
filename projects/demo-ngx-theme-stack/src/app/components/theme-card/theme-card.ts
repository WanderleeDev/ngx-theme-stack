import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';
import { ThemeSoundService } from '../../services/theme-sound.service';

@Component({
  selector: 'app-theme-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-card.html',
})
export class ThemeCardComponent {
  protected themeService = inject(ThemeToggleService);
  private soundService = inject(ThemeSoundService);
  protected readonly tags = ['SSR HYDRATED', 'SIGNAL STATE', 'SMOOTH MOTION'];

  public toggleTheme() {
    this.themeService.toggle();
    this.soundService.play(this.themeService.isDark());
  }
}
