import { Component } from '@angular/core';
import { ThemeCardComponent } from './components/theme-card/theme-card';
import { ThemeSceneComponent } from './layouts/theme-scene/theme-scene';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ThemeSceneComponent, ThemeCardComponent],
  template: `
    <app-theme-scene>
      <app-theme-card />
    </app-theme-scene>
  `,
})
export class App {}
