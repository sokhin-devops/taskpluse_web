import { Environment } from './environment.model';

/**
 * Production environment, swapped in for `environment.ts` at build time by the
 * `fileReplacements` entry on the production configuration in angular.json.
 *
 * <p>{@link Environment.apiBaseUrl} is empty, so requests stay relative: the
 * browser calls `/api/...` on whatever host served the page, and the Kubernetes
 * Ingress sends `/api` to the API and everything else to this app. One image then
 * works for staging and production alike - nothing environment-specific is baked
 * in at build time - and since page and API share one origin, CORS never applies.</p>
 */
export const environment: Environment = {
  production: true,
  apiBaseUrl: ''
};
