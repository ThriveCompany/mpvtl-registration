# MPVTL Short Course Registration

Next.js App Router project for the MPVTL short course registration experience and a simple PostgreSQL-backed registration management system.

## Local Development

```bash
npm install
npm run prisma:generate
npm run dev
```

Open:

```bash
http://localhost:3000/register
```

Admin:

```bash
http://localhost:3000/admin/login
```

## Environment

Create `.env.local` locally or set these variables on the VPS:

```bash
DATABASE_URL=
JWT_SECRET=
NEXT_PUBLIC_APP_URL=https://register.mpvtl.cloud
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=info@moaetscandg.org.ng
SMTP_PASS=
SMTP_FROM="MPVTL Registrations <info@moaetscandg.org.ng>"
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

SMTP is optional. If SMTP is not configured, registration and approval email content is logged instead of crashing.

## Database Setup

For a new VPS/database:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

The seed command creates or updates the MPVTL admin users:

- `DIRECTOR`
- `ADMISSION_OFFICIAL`
- `CENTER_MANAGER`

The existing `SUPER_ADMIN` password is not changed. A `SUPER_ADMIN` is created only when:

```bash
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

are set.

Seeded admin accounts must use `@moaetscandg.org.ng` email addresses.

Seeded staff accounts are marked for password change after login. Existing `SUPER_ADMIN` accounts are not forced unless their password is reset.

## Admin Password Management

Admin onboarding and password management routes:

- `/admin/change-password`
- `POST /api/admin/change-password`
- `PATCH /api/admin/users/[id]`

When a `SUPER_ADMIN` creates or resets a user account, the system generates or stores a bcrypt-hashed temporary password, emails the user, and sets `forcePasswordChange = true`. Existing passwords and password hashes are never shown in the admin UI.

Sensitive user actions require SUPER_ADMIN password confirmation:

- reset password
- generate temporary password
- disable or activate account
- change role or centre assignment

Audit logs are stored in `AdminAuditLog` for account creation, password resets, role changes, account activation/disable actions, and password changes.

## Production Deployment With PM2

On the VPS:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run build
pm2 delete mpvtl-form || true
pm2 start ecosystem.config.js
pm2 save
curl http://localhost:3000/register
curl http://localhost:3000/admin/login
```

The production start script binds Next.js to all network interfaces on port 3000:

```bash
npm run start
```

This runs:

```bash
next start -H 0.0.0.0 -p 3000
```

`npm run build` cleans the generated `.next` folder first so PM2 does not reuse stale server chunks from an older deployment.

## Upload Storage

Registration evidence files are stored on the server under:

```bash
uploads/registrations/{registrationId}/
```

The `uploads/` folder is intentionally git-ignored. Admins access files only through protected routes.
