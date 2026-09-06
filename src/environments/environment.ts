import { Environment } from './environment.model';

/**
 * Development environment.
 *
 * <p>This is the file the build uses unless the production configuration replaces
 * it (see `fileReplacements` in angular.json), which also makes it the one the unit
 * tests compile against.</p>
 *
 * <p>{@link Environment.apiBaseUrl} is deliberately empty rather than
 * `http://localhost:8082`: requests then stay relative, `ng serve` forwards them
 * through `proxy.conf.json`, and the browser sees a single origin. That keeps local
 * development free of CORS and of a preflight round-trip on every call.</p>
 */
export const environment: Environment = {
  production: false,
  apiBaseUrl: ''
};
