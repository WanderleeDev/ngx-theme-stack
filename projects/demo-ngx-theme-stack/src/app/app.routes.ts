import { Routes } from '@angular/router';
import { ThemeSceneComponent } from './layouts/theme-scene/theme-scene';

export const routes: Routes = [
  {
    path: '',
    component: ThemeSceneComponent,
    children: [
      {
        path: '',
        title: 'NgxThemeStack - The Core of Your Themes',
        loadComponent: () => import('./views/home-view/home-view'),
      },
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
    ],
  },
  { path: '**', redirectTo: '' },
];
