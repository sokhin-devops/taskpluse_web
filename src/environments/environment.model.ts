/**
 * Shape of a build-time environment.
 *
 * <p>It lives in its own file because `fileReplacements` swaps `environment.ts` for
 * `environment.prod.ts` at build time: an import of `./environment` from inside the
 * production file would be redirected back to that same file. Only a module that is
 * never replaced can be shared by both.</p>
 */
export interface Environment {
  readonly production: boolean;

  /**
   * Prefix applied to relative `/api` URLs by `apiBaseUrlInterceptor`.
   * Empty means same-origin. No trailing slash.
   */
  readonly apiBaseUrl: string;
}
