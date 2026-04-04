import { NgOptimizedImage } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-theme-card-wrapper',
  imports: [NgOptimizedImage],
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
