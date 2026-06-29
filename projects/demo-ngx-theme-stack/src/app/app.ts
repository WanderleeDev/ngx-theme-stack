import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <router-outlet /> `,
})
export class App {
  private meta = inject(Meta);

  constructor() {
    this.meta.addTag({ 
      name: 'description', 
      content: 'Official demo for ngx-theme-stack. Advanced theme management for Angular with SSR support, procedural sounds and beautiful transitions.' 
    });
  }
}
