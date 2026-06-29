import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeBrandingComponent } from '../../components/theme-branding/theme-branding';
import { CLOUDS, STARS } from './theme-scene.data';

@Component({
  selector: 'app-theme-scene',
  imports: [RouterOutlet, ThemeBrandingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-scene.html',
})
export class ThemeSceneComponent {
  protected readonly stars = STARS;
  protected readonly clouds = CLOUDS;
}
