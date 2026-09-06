# TaskpulseWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.27.

## Environments

Which backend the app talks to is decided at build time by the files in
`src/environments/`, swapped by the `fileReplacements` entry on the production
configuration in `angular.json`.

| Build | Environment file | `apiBaseUrl` | Requests go to |
| --- | --- | --- | --- |
| `ng serve`, `ng build --configuration development` | `environment.ts` | `''` | Same origin, forwarded to `localhost:8082` by `proxy.conf.json` |
| `ng build` (production is the default) | `environment.prod.ts` | `https://taskpluse-api.sokhin.site` | The deployed API, cross-origin |

The services ask for relative paths such as `/api/tasks`. `apiBaseUrlInterceptor`
(`src/app/core/api-base-url.interceptor.ts`) prefixes them with `apiBaseUrl`, so the host
is named in exactly one place and a service added later inherits it without having to
remember to. An empty `apiBaseUrl` leaves the URL untouched, which is what keeps local
development same-origin and therefore free of CORS.

To point a build at a different API, edit `environment.prod.ts` — and add the web origin
to `app.cors.allowed-origins` on that API, or the browser will block every call.

### Local

```bash
npm install
npm start
```

Serves on `http://localhost:4200` and proxies `/api` and `/v3/api-docs` to the API on
port 8082, so the backend must be running (`./mvnw spring-boot:run` in `taskpluse_api`).

### Production

```bash
npm run build
```

Writes `dist/taskpulse_web/browser/`, to be served as static files from
`https://taskpluse-web.sokhin.site`. The host must fall back to `index.html` for unknown
paths, otherwise reloading a route such as `/tasks` returns a 404 instead of the app.

`npm run start:prod` serves the production configuration locally, which is the way to
check against the real API before deploying.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
