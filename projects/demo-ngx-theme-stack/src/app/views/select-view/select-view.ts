import { Component } from '@angular/core';
import { ThemeSelectCardComponent } from '../../components/theme-select-card/theme-select-card';

@Component({
  selector: 'app-select-view',
  imports: [ThemeSelectCardComponent],
  template: `<app-theme-select-card />`,
})
export default class SelectViewComponent {}
