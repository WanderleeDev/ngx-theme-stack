import { Component } from '@angular/core';
import { ThemeCycleCardComponent } from '../../components/theme-cycle-card/theme-cycle-card';

@Component({
  selector: 'app-cycle-view',
  imports: [ThemeCycleCardComponent],
  template: `<app-theme-cycle-card />`,
})
export default class CycleViewComponent {}
