import { Component } from '@angular/core';
import { ThemeCardComponent } from '../../components/theme-card/theme-card';

@Component({
  selector: 'app-toggle-view',
  imports: [ThemeCardComponent],
  template: `<app-theme-card />`,
})
export default class ToggleViewComponent {}
