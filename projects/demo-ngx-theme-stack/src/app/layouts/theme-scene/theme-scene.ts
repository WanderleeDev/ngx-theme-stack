import { Component, inject } from '@angular/core';
import { ThemeToggleService } from 'ngx-theme-stack';
@Component({
  selector: 'app-theme-scene',
  standalone: true,
  imports: [],
  templateUrl: './theme-scene.html',
})
export class ThemeSceneComponent {
  protected themeService = inject(ThemeToggleService);
}
