import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

/**
 * Unit tests for authInterceptor.
 *
 * <p>The exclusion of the sign-in endpoints is the part worth pinning down. Treating a
 * 401 from /api/auth/login as an expired session would clear the session the user is
 * trying to create and bounce them off the form mid-typing — a bug that only shows up
 * when someone mistypes their password.</p>
 */
describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let auth: jasmine.SpyObj<AuthService>;

  function setUp(token: string | null): void {
    auth = jasmine.createSpyObj<AuthService>('AuthService', ['getToken', 'logout']);
    auth.getToken.and.returnValue(token);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth }
      ]
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  }

  afterEach(() => TestBed.resetTestingModule());

  it('attaches the bearer token to an API call', () => {
    setUp('a.b.c');

    http.get('/api/tasks').subscribe();
    const request = controller.expectOne('/api/tasks');

    expect(request.request.headers.get('Authorization')).toBe('Bearer a.b.c');
    request.flush({});
  });

  it('sends no Authorization header when there is no token', () => {
    setUp(null);

    http.get('/api/tasks').subscribe();
    const request = controller.expectOne('/api/tasks');

    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });

  it('does not attach a token to the sign-in endpoints', () => {
    setUp('a.b.c');

    http.post('/api/auth/login', {}).subscribe();
    const login = controller.expectOne('/api/auth/login');
    expect(login.request.headers.has('Authorization')).toBeFalse();
    login.flush({});

    http.post('/api/auth/register', {}).subscribe();
    const register = controller.expectOne('/api/auth/register');
    expect(register.request.headers.has('Authorization')).toBeFalse();
    register.flush({});
  });

  it('ends the session when a protected call answers 401', () => {
    setUp('a.b.c');

    http.get('/api/tasks').subscribe({ error: () => undefined });
    controller.expectOne('/api/tasks').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).toHaveBeenCalledWith(true);
  });

  it('leaves the session alone when a login answers 401', () => {
    setUp(null);

    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    controller
      .expectOne('/api/auth/login')
      .flush({ message: 'Incorrect email or password' }, { status: 401, statusText: 'Unauthorized' });

    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('leaves the session alone for failures that are not 401', () => {
    setUp('a.b.c');

    http.get('/api/tasks').subscribe({ error: () => undefined });
    controller.expectOne('/api/tasks').flush(null, { status: 500, statusText: 'Server Error' });

    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('still surfaces the error to the caller after signing out', () => {
    setUp('a.b.c');

    let status: number | undefined;
    http.get('/api/tasks').subscribe({
      error: (error: { status?: number }) => (status = error.status)
    });
    controller.expectOne('/api/tasks').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(status).toBe(401);
  });
});
