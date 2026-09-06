import { Environment } from './environment.model';

/**
 * Production environment, swapped in for `environment.ts` at build time by the
 * `fileReplacements` entry on the production configuration in angular.json.
 *
 * <p>The API lives on its own subdomain, so calls are cross-origin and this host
 * must appear in the backend's `app.cors.allowed-origins` - see
 * `application-prod.properties`. If the two are ever put behind one reverse proxy,
 * set `apiBaseUrl` back to `''` and CORS stops mattering entirely.</p>
 */
export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://taskpluse-api.sokhin.site'
};
