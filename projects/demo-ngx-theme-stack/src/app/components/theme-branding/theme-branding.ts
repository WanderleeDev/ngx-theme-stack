import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { VERSION } from 'ngx-theme-stack';

@Component({
  selector: 'app-theme-branding',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './theme-branding.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeBrandingComponent {
  protected readonly version = VERSION;
}
