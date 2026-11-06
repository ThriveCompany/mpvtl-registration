# Required read-only VPS evidence (not executed)

Target-specific authenticated VPS permission and the intended service account
must be confirmed before using this checklist. Do not restart PM2/nginx, reload
config, install packages, seed, migrate, run a build or copy a live database.
Record timestamp and operator; keep evidence private and sanitized.

## Source revision

After the working directory is established, inspect only:

```sh
git -C APPROVED_APP_DIRECTORY rev-parse --show-toplevel
git -C APPROVED_APP_DIRECTORY branch --show-current
git -C APPROVED_APP_DIRECTORY rev-parse HEAD
git --no-optional-locks -C APPROVED_APP_DIRECTORY status --porcelain=v1
```

Parse remote configuration privately and report a credential-free owner/repo
URL only. Do not print remote URLs blindly; they can contain embedded credentials.
Compare HEAD with `710e7136d7c2f9686c527fdcfb155a7a72df0409` and the candidate PR
revision. Review tracked modifications without displaying secret/PII-bearing
files. A matching HEAD is insufficient if PM2 runs another path or an older build.

## PM2 and listening process

Use the correct existing PM2 user/daemon. An invocation under the wrong user can
start another PM2 daemon, so confirm its socket/process exists first.
Do not print `pm2 env`, raw `pm2 jlist`, `pm2 describe` or process environments:
those may expose credentials. Use a reviewed parser that emits only process name,
PID, status, exec cwd, script path, arguments and start time; redact sensitive
arguments. Resolve the selected PID's cwd and listening port using approved OS
metadata commands. Identify which `.next` build is in that cwd, its build ID and
timestamps. A build ID alone does not prove which Git revision produced it.

## nginx routing

Privately inspect only the two approved server blocks and their includes.
Do not paste `nginx -T`: unrelated virtual hosts, headers or credentials may appear.
Record server_name, TLS termination, upstream address/port, root/fastcgi routing,
upload limits and timeout metadata. Establish:

`register.mpvtl.cloud -> nginx location -> upstream port -> PID -> PM2 cwd -> source/build`

Independently identify the WordPress root/PHP service and database separation.
Do not infer repository or database sharing from a common IP address.

## Database migration state

Use an existing, approved read-only database role. Do not print DATABASE_URL or
credentials. Record PostgreSQL version, database identity internally, and inspect
only migration metadata columns `migration_name`, `checksum`, `started_at`,
`finished_at`, `rolled_back_at`, `applied_steps_count` from `_prisma_migrations`.
Do not read its `logs` column, applicant tables, staff tables or uploads.
Compare names/checksums to checked-in migration.sql files. Report pending,
failed, divergent or missing migration history. No `migrate deploy`, `db push`,
`migrate resolve`, `seed` or production SQL writes. If status tooling is used,
confirm its version and read-only semantics first; metadata SQL is preferable.

## Other necessary metadata

Record installed Node/npm/PM2 versions; backup schedule and storage/retention
metadata; last independently verified restore; log access and retention;
SMTP configured/not-configured without values; upload ownership/access metadata;
firewall restriction on port 3000; and dev/staging/production separation.
Never fetch the public registration-config GET for verification until its write
behaviour has been removed or separately approved.
