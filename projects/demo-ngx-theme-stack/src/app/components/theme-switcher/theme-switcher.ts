import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-theme-switcher',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theme-switcher.html',
})
export class ThemeSwitcherComponent {
  protected readonly modes = [
    { id: 'home', path: '/', label: 'Home', icon: 'home' },
    { id: 'toggle', path: '/toggle', label: 'Simple Toggle', icon: 'toggle_on' },
    { id: 'cycle', path: '/cycle', label: 'Multi Cycle', icon: 'sync' },
    { id: 'select', path: '/select', label: 'Direct Select', icon: 'checklist' },
  ];
}
