import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';

import { provideClientHydration } from '@angular/platform-browser';
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
    provideClientHydration(),
    provideThemeStack({
      themes: ['sunset'],
    }),
  ],
};
