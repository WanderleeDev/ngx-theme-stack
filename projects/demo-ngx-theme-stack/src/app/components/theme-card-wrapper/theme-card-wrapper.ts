import { Component } from '@angular/core';

@Component({
  selector: 'app-theme-card-wrapper',
  templateUrl: './theme-card-wrapper.html',
})
export class ThemeCardWrapperComponent {
  protected readonly libraryTags = [
    'Angular 19',
    'SSR Ready',
    'Signals Core',
    'Hydration Safe',
    'Zero Dep',
  ];
}
