import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher';
import { ThemeBrandingComponent } from '../../components/theme-branding/theme-branding';
import { CLOUDS, STARS } from './theme-scene.data';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-theme-scene',
  imports: [RouterOutlet, ThemeSwitcherComponent, ThemeBrandingComponent],
  templateUrl: './theme-scene.html',
})
export class ThemeSceneComponent {
  private router = inject(Router);
  private url = toSignal(this.router.events);
  protected isHome = computed(() => this.router.url === '/' || this.router.url === '/?');
  
  protected readonly stars = STARS;
  protected readonly clouds = CLOUDS;
}
