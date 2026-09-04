import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthResponse, User, initialsOf } from './auth.model';
import { AuthService } from './auth.service';

const TOKEN_KEY = 'taskpulse.token';
const USER_KEY = 'taskpulse.user';

const SAM: User = {
  id: 1,
  email: 'sam@example.com',
  displayName: 'Sam Rivera',
  createdAt: '2026-09-04T09:15:00'
};

const SESSION: AuthResponse = {
  token: 'a.b.c',
  tokenType: 'Bearer',
  expiresIn: 43200,
  user: SAM
};

/**
 * Unit tests for AuthService.
 *
 * <p>The interesting behaviour is around the restored session: a token in storage is a
 * hint, not proof, and treating it as proof is what leaves a user staring at a signed-in
 * shell where every request fails.</p>
 */
describe('AuthService', () => {
  let router: jasmine.SpyObj<Router>;

  function setUp(): { service: AuthService; http: HttpTestingController } {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    return {
      service: TestBed.inject(AuthService),
      http: TestBed.inject(HttpTestingController)
    };
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  describe('starting a session', () => {
    it('is signed out with nothing in storage', () => {
      const { service } = setUp();

      expect(service.isAuthenticated()).toBeFalse();
      expect(service.user()).toBeNull();
      expect(service.getToken()).toBeNull();
    });

    it('stores the token and account on login', () => {
      const { service, http } = setUp();

      service.login({ email: 'sam@example.com', password: 'correct-horse-battery' }).subscribe();
      http.expectOne('/api/auth/login').flush(SESSION);

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.getToken()).toBe('a.b.c');
      expect(service.user()?.displayName).toBe('Sam Rivera');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('a.b.c');
    });

    it('stores the token and account on register', () => {
      const { service, http } = setUp();

      service
        .register({ email: 'sam@example.com', displayName: 'Sam Rivera', password: 'password12' })
        .subscribe();
      http.expectOne('/api/auth/register').flush(SESSION);

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('leaves the session alone when login fails', () => {
      const { service, http } = setUp();

      service.login({ email: 'sam@example.com', password: 'wrong' }).subscribe({
        error: () => undefined
      });
      http.expectOne('/api/auth/login').flush(
        { message: 'Incorrect email or password' },
        { status: 401, statusText: 'Unauthorized' }
      );

      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });
  });

  describe('restoring a session', () => {
    it('reads a cached session synchronously, so the first render is not a guess', () => {
      localStorage.setItem(TOKEN_KEY, 'a.b.c');
      localStorage.setItem(USER_KEY, JSON.stringify(SAM));

      const { service } = setUp();

      expect(service.isAuthenticated()).toBeTrue();
      expect(service.user()?.email).toBe('sam@example.com');
    });

    it('discards a corrupted cache instead of failing to start', () => {
      localStorage.setItem(TOKEN_KEY, 'a.b.c');
      localStorage.setItem(USER_KEY, 'not json');

      const { service } = setUp();

      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('confirms a restored token against the server', () => {
      localStorage.setItem(TOKEN_KEY, 'a.b.c');
      localStorage.setItem(USER_KEY, JSON.stringify(SAM));
      const { service, http } = setUp();

      let valid: boolean | undefined;
      service.restore().subscribe((result) => (valid = result));
      http.expectOne('/api/auth/me').flush(SAM);

      expect(valid).toBeTrue();
      expect(service.isAuthenticated()).toBeTrue();
    });

    it('clears the session when the server rejects the restored token', () => {
      localStorage.setItem(TOKEN_KEY, 'stale');
      localStorage.setItem(USER_KEY, JSON.stringify(SAM));
      const { service, http } = setUp();

      let valid: boolean | undefined;
      service.restore().subscribe((result) => (valid = result));
      http.expectOne('/api/auth/me').flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(valid).toBeFalse();
      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    });

    it('does not call the server when there is no token to check', () => {
      const { service, http } = setUp();

      let valid: boolean | undefined;
      service.restore().subscribe((result) => (valid = result));

      expect(valid).toBeFalse();
      http.expectNone('/api/auth/me');
    });
  });

  describe('logout', () => {
    it('clears the session and returns to the login screen', () => {
      const { service, http } = setUp();
      service.login({ email: 'sam@example.com', password: 'x' }).subscribe();
      http.expectOne('/api/auth/login').flush(SESSION);

      service.logout();

      expect(service.isAuthenticated()).toBeFalse();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: {} });
    });

    it('says so when the session expired, rather than signing out silently', () => {
      const { service } = setUp();

      service.logout(true);

      expect(router.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { expired: 'true' }
      });
    });
  });
});

describe('initialsOf', () => {
  it('takes the first and last initial of a full name', () => {
    expect(initialsOf(SAM)).toBe('SR');
  });

  it('takes one initial from a single name', () => {
    expect(initialsOf({ ...SAM, displayName: 'Sam' })).toBe('S');
  });

  it('ignores middle names', () => {
    expect(initialsOf({ ...SAM, displayName: 'Sam Q. Rivera' })).toBe('SR');
  });

  it('falls back to the email when the name is blank', () => {
    expect(initialsOf({ ...SAM, displayName: '   ' })).toBe('S');
  });

  it('has something to render with no user at all', () => {
    expect(initialsOf(null)).toBe('?');
  });
});
