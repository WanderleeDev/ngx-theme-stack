import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher';
import { CLOUDS, STARS } from './theme-scene.data';

@Component({
  selector: 'app-theme-scene',
  imports: [RouterOutlet, ThemeSwitcherComponent],
  templateUrl: './theme-scene.html',
})
export class ThemeSceneComponent {
  protected readonly stars = STARS;
  protected readonly clouds = CLOUDS;
}
