import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../environments/environment';

/**
 * Points relative `/api` calls at the configured backend.
 *
 * <p>The services ask for `/api/tasks`, not for a host. In development that URL is
 * already correct — `ng serve` proxies it — and in production this rewrites it to
 * `https://taskpluse-api.sokhin.site/api/tasks`. Doing it here rather than in each
 * service means the base URL is named once, and a service written tomorrow gets it
 * without having to remember to.</p>
 *
 * <p>Only same-origin `/api` paths are touched: an absolute URL is left alone so a
 * call to a third party is never silently redirected at our own backend.</p>
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  const base = environment.apiBaseUrl;

  if (!base || !request.url.startsWith('/api')) {
    return next(request);
  }

  return next(request.clone({ url: `${base}${request.url}` }));
};
