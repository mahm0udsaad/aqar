# Deploying Aqar to the cPanel host

Aqar runs as a Node.js app (cPanel "Setup Node.js App", Passenger, Node 22) at
**https://www.alakkareya.com/aqar**. The main website in `public_html` is a separate PHP site: never touch it.

| What | Where on the host |
| --- | --- |
| App (standalone Next.js build) | `/home/alakkareya/aqar-app` (`server.js` is the startup file) |
| Passenger routing for `/aqar` | `/home/alakkareya/public_html/aqar/.htaccess` (managed by cPanel) |
| Uploaded images and videos | `/home/alakkareya/aqar-uploads/<bucket>/...` (`UPLOADS_DIR`), served at `/aqar/uploads/...` |
| Database | PostgreSQL 10, database `alakkareya_aqar`, user `alakkareya_app`, on `127.0.0.1:5432` |
| Production settings | `/home/alakkareya/aqar-app/.env` (not in git) |

Access: SFTP and SSH port forwarding with a deploy key (shell access is disabled on this account).

```bash
# Database tunnel for psql / pg_dump from your machine
ssh -i ~/.ssh/alakkareya_deploy -N -L 54321:127.0.0.1:5432 alakkareya@195.250.23.30
```

## Production `.env`

```
PGHOST=127.0.0.1
PGPORT=5432
PGUSER=alakkareya_app
PGPASSWORD=...
PGDATABASE=alakkareya_aqar
NODE_ENV=production
AUTH_SECRET=...                       # openssl rand -base64 32
AUTH_URL=https://www.alakkareya.com/aqar/api/auth
AUTH_GOOGLE_ID=...                    # Google Cloud OAuth client
AUTH_GOOGLE_SECRET=...
ADMIN_EMAILS=                         # optional: emails that become admins on sign-in
CANONICAL_HOST=www.alakkareya.com
UPLOADS_DIR=/home/alakkareya/aqar-uploads
NEXT_PUBLIC_SITE_URL=https://www.alakkareya.com/aqar
NEXT_PUBLIC_BASE_PATH=/aqar
NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX=/aqar/uploads
```

Google OAuth client: authorized redirect URI `https://www.alakkareya.com/aqar/api/auth/callback/google`,
JavaScript origin `https://www.alakkareya.com`.

## Release steps

1. Commit and push the code first (the August 2026 build was lost because its source was never committed).
2. Back up the database: `pg_dump -Fc` through the tunnel.
3. Apply new files in `db/migrations/` in order (they are idempotent): `psql -v ON_ERROR_STOP=1 -f db/migrations/NNN_*.sql`.
   Never run anything from `db/seed/` on production: that is local test data.
4. Build: `deploy/build-bundle.sh <out-dir> <dir with linux sharp packages>`.
   The Linux `sharp` binaries (`sharp-linux-x64`, `sharp-libvips-linux-x64`) are copied from the host's
   `aqar-app/node_modules/@img/` once and reused.
5. Copy the current production `.env` into `<out-dir>/.env`.
6. Upload to `/home/alakkareya/aqar-app.next` with `sftp put -r`.
7. Swap with SFTP renames: `aqar-app` -> `aqar-app.prev-<date>`, `aqar-app.next` -> `aqar-app`.
8. Restart: upload an empty `aqar-app/tmp/restart.txt` (or press Restart in cPanel > Setup Node.js App).
9. Check `/aqar/ar`, a property page, `/aqar/ar/admin` (redirects to login), and an image under `/aqar/uploads/`.

Rollback: rename `aqar-app.prev-<date>` back to `aqar-app` and restart.
