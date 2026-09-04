import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Keeps the application routes behind a valid session.
 *
 * <p>On the first navigation of a page load there may be a token in storage that has not
 * yet been checked, so the guard waits for {@link AuthService.restore} rather than
 * trusting the cache. That one round trip is what stops a reload from either bouncing a
 * signed-in user to the login screen or dropping an expired one into a shell where
 * everything fails.</p>
 *
 * <p>The attempted URL is carried along as {@code redirectTo}, so signing in lands the
 * user where they were going instead of always on the dashboard.</p>
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  if (!auth.getToken()) {
    return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
  }

  return auth.restore().pipe(
    map((valid) =>
      valid
        ? true
        : router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } })
    )
  );
};

/**
 * Keeps an already-signed-in user off the login screen.
 *
 * <p>Landing on a sign-in form while holding a working session is a dead end: the form
 * cannot tell you that you are already signed in, so the guard sends you to the
 * dashboard instead.</p>
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/dashboard']);
};
