import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthResponse, LoginRequest, RegisterRequest, User } from './auth.model';

/** Keys used in localStorage. Namespaced so they cannot collide on a shared origin. */
const TOKEN_KEY = 'taskpulse.token';
const USER_KEY = 'taskpulse.user';

/**
 * Holds the signed-in session.
 *
 * <p>The token and a cached copy of the account live in {@code localStorage} so a page
 * reload does not sign the user out. The cached account is treated as a hint only:
 * {@link restore} re-validates it against {@code /api/auth/me} on start-up, because a
 * token can expire or be revoked while the tab is closed and a stale cache would render
 * a signed-in shell over an API that rejects every call.</p>
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly currentUser = signal<User | null>(null);
  private readonly token = signal<string | null>(null);

  /** The signed-in account, or null. */
  readonly user = this.currentUser.asReadonly();

  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  constructor() {
    // Read the cached session synchronously so the first render already knows whether
    // to show the app or the login screen, avoiding a flash of the wrong one.
    this.token.set(readStorage(TOKEN_KEY));
    const cached = readStorage(USER_KEY);
    if (cached && this.token()) {
      try {
        this.currentUser.set(JSON.parse(cached) as User);
      } catch {
        // A corrupted cache is not worth recovering: drop it and let restore() refill.
        this.clearSession();
      }
    }
  }

  /** @returns the raw bearer token, for the HTTP interceptor */
  getToken(): string | null {
    return this.token();
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/register', request)
      .pipe(tap((response) => this.startSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/login', request)
      .pipe(tap((response) => this.startSession(response)));
  }

  /**
   * Confirms a token restored from storage is still accepted.
   *
   * @returns true when the session is usable; false when there was no token or the
   *          server rejected it, in which case the session has been cleared
   */
  restore(): Observable<boolean> {
    if (!this.token()) {
      return of(false);
    }
    return this.http.get<User>('/api/auth/me').pipe(
      tap((user) => {
        this.currentUser.set(user);
        writeStorage(USER_KEY, JSON.stringify(user));
      }),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      })
    );
  }

  /**
   * Ends the session and returns to the login screen.
   *
   * @param expired when true, the login screen explains that the session timed out
   *                rather than looking like an unexplained sign-out
   */
  logout(expired = false): void {
    this.clearSession();
    void this.router.navigate(['/login'], {
      queryParams: expired ? { expired: 'true' } : {}
    });
  }

  private startSession(response: AuthResponse): void {
    this.token.set(response.token);
    this.currentUser.set(response.user);
    writeStorage(TOKEN_KEY, response.token);
    writeStorage(USER_KEY, JSON.stringify(response.user));
  }

  private clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    removeStorage(TOKEN_KEY);
    removeStorage(USER_KEY);
  }
}

/*
 * localStorage access is wrapped because it throws outright — not merely returns null —
 * in a browser configured to block site data, and in that case the app should still run
 * with an in-memory session rather than fail to start.
 */

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Session stays in memory only; the user is signed out on reload.
  }
}

function removeStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do: the in-memory signals have already been cleared.
  }
}
