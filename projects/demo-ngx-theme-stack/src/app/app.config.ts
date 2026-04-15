import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideThemeStack } from 'ngx-theme-stack';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
      }),
    ),
    provideClientHydration(withEventReplay()),
    provideThemeStack({
      themes: ['system', 'light', 'dark', 'sunset'],
      defaultTheme: 'sunset',
      storageKey: 'ngx-theme-stack-theme',
      mode: 'class',
      strategy: 'blocking',
    }),
  ],
};
