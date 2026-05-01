# MPVTL Short Course Registration

Frontend-only Next.js App Router project for the MPVTL short course registration experience.

## Local Development

```bash
npm install
npm run dev
```

Open:

```bash
http://localhost:3000/register
```

## Production Deployment With PM2

On the VPS:

```bash
npm install
npm run build
pm2 delete mpvtl-form || true
pm2 start npm --name "mpvtl-form" -- start
pm2 save
curl http://localhost:3000/register
```

Recommended PM2 config:

```bash
npm install
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
