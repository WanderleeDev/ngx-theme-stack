import { Component, input } from '@angular/core';

@Component({
  selector: 'app-theme-card-wrapper',
  imports: [],
  templateUrl: './theme-card-wrapper.html',
  styles: ``,
})
export class ThemeCardWrapperComponent {
  title = input.required<string>();
  subtitle = input<string>();
  tags = input<string[]>([]);
  isDark = input(false);
  footerLabel = input('ngx-theme-stack');
}
