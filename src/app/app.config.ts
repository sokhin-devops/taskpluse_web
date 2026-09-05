import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';

import { AmbientPreset } from './ambient/ambient.preset';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // No withInMemoryScrolling: it drives ViewportScroller, which scrolls the window,
    // and the window does not scroll in this layout. AppComponent resets the content
    // area on NavigationEnd instead.
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      // The Ambient theme. Every value in it points at an `--amb-*` custom
      // property declared in `src/styles/ambient/_ambient-tokens.scss`, so the
      // design tokens remain the single source of truth for PrimeNG's
      // appearance as well as the application's own. See ambient.preset.ts for
      // why this cannot be done from a stylesheet.
      theme: {
        preset: AmbientPreset,
        options: {
          // The class `AmbientThemeService` writes onto <html>, and the same one
          // `_ambient-tokens.scss` redefines its scheme-dependent tokens under.
          //
          // Not 'system': the service resolves the OS preference itself and
          // always writes an explicit class, because a user who has chosen light
          // on a machine set to dark must get light. It still *follows* the OS
          // for anyone who has chosen "system" — it watches the media query
          // rather than sampling it once.
          darkModeSelector: '.amb-dark',

          // Wrap everything PrimeNG generates in `@layer primeng`.
          //
          // PrimeNG appends its <style> elements to the end of <head>, after
          // styles.css, so without this an ambient rule at the same specificity
          // as a PrimeNG one loses the cascade — silently, and in dozens of
          // places. Layered CSS always loses to unlayered CSS whatever its
          // specificity, so this makes the Ambient layer authoritative without
          // a single `!important` or an arms race of `.p-thing.p-thing`.
          //
          // The order must match the declaration in `_ambient-base.scss`:
          // the reset sits below PrimeNG, the Ambient layer above it.
          cssLayer: {
            name: 'primeng',
            order: 'amb-reset, primeng'
          }
        }
      }
    })
  ]
};
