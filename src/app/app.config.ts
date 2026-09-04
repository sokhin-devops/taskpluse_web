import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';

/**
 * Aura with its primary ramp replaced by indigo, so one accent colour drives every
 * primary button, focus ring, active state and link in the app.
 *
 * <p>This has to be done by extending the preset rather than by redeclaring
 * {@code --p-primary-*} in a stylesheet. PrimeNG generates its theme at runtime and
 * injects it into the document head after the application's own styles, so a `:root`
 * override in `styles.scss` loses the cascade and the app silently keeps Aura's default
 * emerald — which is exactly what used to happen here.</p>
 */
const TaskPulseTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b'
    }
  }
});

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
      theme: {
        preset: TaskPulseTheme,
        options: {
          // Pin the app to light mode: never auto-switch on the OS preference.
          darkModeSelector: false
        }
      }
    })
  ]
};
