import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-theme-branding',
  standalone: true,
  imports: [NgOptimizedImage],
  templateUrl: './theme-branding.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeBrandingComponent {}
