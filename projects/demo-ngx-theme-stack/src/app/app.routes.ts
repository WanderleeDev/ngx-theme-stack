import { Routes } from '@angular/router';
import { ThemeSceneComponent } from './layouts/theme-scene/theme-scene';

export const routes: Routes = [
  {
    path: 'ngx-theme-stack',
    component: ThemeSceneComponent,
    children: [
      {
        path: 'toggle',
        title: 'NgxThemeStack - Toggle Demo',
        loadComponent: () => import('./views/toggle-view/toggle-view'),
      },
      {
        path: 'cycle',
        title: 'NgxThemeStack - Cycle Demo',
        loadComponent: () => import('./views/cycle-view/cycle-view'),
      },
      {
        path: 'select',
        title: 'NgxThemeStack - Select Demo',
        loadComponent: () => import('./views/select-view/select-view'),
      },
      { path: '', redirectTo: 'toggle', pathMatch: 'full' },
      { path: '**', redirectTo: 'toggle' },
    ],
  },
  { path: '', redirectTo: 'ngx-theme-stack', pathMatch: 'full' },
  { path: '**', redirectTo: 'ngx-theme-stack' },
];
