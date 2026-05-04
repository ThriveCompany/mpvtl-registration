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
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

SMTP is optional. If SMTP is not configured, approval email content is logged instead of crashing.

## Database Setup

For a new VPS/database:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

The seed command creates one `SUPER_ADMIN` user only when:

```bash
SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

are set.

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
