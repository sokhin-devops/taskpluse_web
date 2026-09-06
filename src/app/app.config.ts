import { registerLocaleData } from '@angular/common';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import localeKm from '@angular/common/locales/km';
import { providePrimeNG } from 'primeng/config';

import { AmbientPreset } from './ambient/ambient.preset';
import { routes } from './app.routes';
import { apiBaseUrlInterceptor } from './core/api-base-url.interceptor';
import { authInterceptor } from './core/auth/auth.interceptor';

/**
 * Khmer date, day, month and number formats.
 *
 * <p>Angular ships only the locale the application was built for; every other
 * one has to be registered by hand, and asking a pipe for an unregistered
 * locale throws at render time rather than falling back. This is what makes
 * {@code | date: 'MMM d, y' : undefined : 'km'} work, and it is also where
 * {@code primeng-translations.ts} reads the datepicker's month and day names
 * from — which is why they are not typed out a second time anywhere.</p>
 *
 * <p>At module scope rather than inside an initialiser: it has to have run
 * before the first template renders, and there is nothing to wait for.</p>
 */
registerLocaleData(localeKm);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // No withInMemoryScrolling: it drives ViewportScroller, which scrolls the window,
    // and the window does not scroll in this layout. AppComponent resets the content
    // area on NavigationEnd instead.
    provideRouter(routes),
    // Order matters: apiBaseUrlInterceptor turns `/api/...` into the absolute
    // backend URL for the current environment, and authInterceptor then attaches
    // the bearer token to the request that is actually going to be sent.
    provideHttpClient(withFetch(), withInterceptors([apiBaseUrlInterceptor, authInterceptor])),
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
