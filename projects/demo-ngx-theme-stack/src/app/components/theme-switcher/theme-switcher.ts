import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-theme-switcher',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './theme-switcher.html',
})
export class ThemeSwitcherComponent {
  protected readonly modes = [
    { id: 'toggle', path: '/toggle', label: 'Simple Toggle', icon: 'toggle_on' },
    { id: 'cycle', path: '/cycle', label: 'Multi Cycle', icon: 'sync' },
    { id: 'select', path: '/select', label: 'Direct Select', icon: 'checklist' },
  ];
}
