import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher';

@Component({
  selector: 'app-top-nav',
  imports: [ThemeSwitcherComponent],
  templateUrl: './top-nav.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopNav {}
