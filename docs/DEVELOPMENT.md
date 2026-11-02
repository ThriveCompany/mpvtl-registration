# WO-03 development baseline

Base revision: `710e7136d7c2f9686c527fdcfb155a7a72df0409`.
Use Node **24.14.1**, npm **11.x**, and a clean checkout of the development branch.
The Node version is a development/CI choice, not a claim about production.
Dependencies are resolved by `package-lock.json`; use `npm ci`, not `npm install`.

## Checks without a database

```sh
npm ci --ignore-scripts
npm run prisma:generate:dev
npm run lint
npm run typecheck
npm test
```

Generating Prisma client does not connect to a database. Typecheck generates
Next route types before running TypeScript, so it also works in fresh checkouts.
It does not build or start the application. Unit tests inject synthetic catalogue
fixtures and in-memory database doubles. Their setup refuses Prisma construction,
outbound sockets and HTTP. No database service, staff account, SMTP setting,
Paystack key or production secret is required.

ESLint uses the existing Next 15 core-web-vitals conventions through FlatCompat
and the standalone ESLint CLI. It does not silently disable lint rules.

## Optional isolated interactive environment

Requires a running Docker engine with Linux containers. These commands do not
start Docker Desktop or change its configuration:

```sh
npm run dev:db
npm run dev:prepare
npm run dev:verify
npm run dev:isolated
```

Visit `http://127.0.0.1:3001/register` or `/admin/login`.
The synthetic account is `admin@example.invalid`, password `Synthetic-Local-2026`.
This is a deliberately public local fixture, never a production credential.

The helper rejects checkout-root/prisma dotenv files (except `.env.example`),
does not inherit application environment variables, fixes the database to
`127.0.0.1:55432/mpvtl_wo03_synthetic`, disables outbound email/integration settings,
and binds HTTP to loopback. Do not replace these values with production values.
The database also binds only to loopback and uses its own Compose project and volume.
`dev:prepare` uses `prisma db push` only against this fixed disposable database;
it does not run migration history or the existing staff seed.

Fixtures populate all six catalogue sections, one synthetic admin and one
synthetic applicant; no production records are copied. Existing centre labels
are identifiers used by the unchanged UI. SMTP fallback still logs messages, so
enter synthetic information only, including when testing email verification.
The form's existing authentication/verification rules remain unchanged.

Stop the development server with Ctrl+C and the database with:

```sh
npm run dev:db:stop
```

The synthetic volume is retained. Reset/delete only that explicitly named local
volume after inspecting Docker's resolved project metadata. No automatic reset
or deletion command is provided.

PostgreSQL uses the maintained `16-alpine` tag. Its patch image is mutable:
record `docker image inspect postgres:16-alpine --format '{{index .RepoDigests 0}}'`
with interactive test evidence; pin the reviewed digest if byte-identical DB
images are required. Package installation also needs registry access on first use.

CI runs the database-free checks with `contents: read`, no persisted checkout
credentials, no repository secrets and no deployment step. A separate job uses
an ephemeral PostgreSQL service on the fixed synthetic port/database to execute
the guarded setup twice and verify fixture counts and synthetic identities.
It does not use production migrations, the staff seed or any external service.
Do not substitute `pull_request_target` for `pull_request`.

## Boundaries

Do not use legacy `npm run seed`, migrations or the generic `npm run dev` for
this isolated workflow. Those existing commands are retained for compatibility
but have none of the new isolation guarantees. The development helper is a guard
against accidental connections, not a sandbox for hostile code or an occupied
local port. Never place a production tunnel/proxy on port 55432.

See [risk assessment](SECURITY_AND_DEPLOYMENT_RISKS.md),
[catalogue analysis](CATALOGUE_BOOTSTRAP.md) and
[read-only VPS checklist](VPS_READ_ONLY_CHECKS.md).
