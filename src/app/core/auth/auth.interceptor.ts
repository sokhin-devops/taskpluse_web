import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/** Endpoints that must not be retried or redirected on a 401: a 401 is their answer. */
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/register'];

/**
 * Attaches the bearer token to API calls, and signs the user out when the server says
 * the token is no longer good.
 *
 * <p>A 401 from a task or tag endpoint means the token expired or was revoked while the
 * app was open. Without this, the user would sit in a signed-in shell watching every
 * panel fail to load; instead the session ends and the login screen explains why.</p>
 *
 * <p>The sign-in endpoints are excluded: a 401 there is the expected answer to wrong
 * credentials, and treating it as an expiry would clear the session the user is trying
 * to create and bounce them mid-typing.</p>
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const isPublic = PUBLIC_PATHS.some((path) => request.url.includes(path));

  const authorized =
    token && !isPublic
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isPublic) {
        auth.logout(true);
      }
      return throwError(() => error);
    })
  );
};
