# Cosmoids API operations reference

Last updated: 2026-10-11. This records the setup confirmed during deployment.
Check the live VPS and provider dashboards when troubleshooting; this file is a
reference, not an automatically synchronized inventory. All secret values below
are placeholders.

## Find the right section

- [Current setup](#current-setup)
- [Where files and settings live](#where-files-and-settings-live)
- [Environment variables](#environment-variables)
- [Nginx and HTTPS](#nginx-and-https)
- [systemd service](#systemd-service)
- [Deploying API changes](#deploying-api-changes)
- [Authentication and database](#authentication-and-database)
- [Checks and troubleshooting](#checks-and-troubleshooting)
- [Local development](#local-development)
- [Work still to do](#work-still-to-do)

## Current setup

| Item                      | Current setup                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------ |
| VPS                       | DigitalOcean, Ubuntu 24.04 LTS, 1 CPU / 1 GB RAM                                     |
| Public IPv4               | `159.223.127.157`                                                                    |
| SSH / service user        | `deploy`                                                                             |
| Runtime                   | Node.js 24; pnpm workspace pinned to 10.22.0                                         |
| VPS Git checkout          | `/home/deploy/cosmoids_api`, branch `experimental`                                   |
| Public API                | `https://api.cosmoids-td.com`                                                        |
| Internal Fastify address  | `http://127.0.0.1:3001`                                                              |
| Postgres                  | Localhost port `5432`; database `cosmoids`; role `cosmoids_app`                      |
| Staging game              | `https://staging.cosmoids-td.com`, Vercel Preview / `experimental`                   |
| Original staging URL      | `https://cosmoids-pirate-web-rpg-git-experimental-sams-projects-022093db.vercel.app` |
| Current production game   | `https://cosmoids-pirate-web-rpg.vercel.app`                                         |
| Planned production domain | `https://cosmoids-td.com`; connection not yet confirmed                              |
| DNS manager               | Porkbun                                                                              |
| Process supervisor        | `cosmoids-api.service` (systemd)                                                     |
| HTTPS / reverse proxy     | Nginx; Let's Encrypt certificates obtained with Certbot snap                         |

The request path is:

```text
Browser -> DNS -> VPS:443 (Nginx / HTTPS)
                     -> 127.0.0.1:3001 (Fastify / Better Auth)
                     -> 127.0.0.1:5432 (Postgres)
```

Fastify listens on loopback. Nginx is the public HTTP/HTTPS entry point. Staging
currently uses this one API and database; it is not a separate backend
environment. The VPS uses `NODE_ENV=production` even while running code from the
`experimental` Git branch.

Account signup, login, session recognition, logout, domain HTTPS, certificate
renewal simulation, and staging CORS preflight have been checked on the VPS. The
frontend API variable is saved in Vercel, but the account UI has not been
implemented yet.

## Where files and settings live

Repository paths below are relative to the repository root. VPS paths are Linux
paths on the server, not files in your Windows checkout.

| Location                                             | Purpose / where to change it                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/api/src/server.ts`                             | Fastify startup, logging, proxy trust, health checks, shutdown, listen address |
| `apps/api/src/database.ts`                           | Postgres connection pool and required database environment variables           |
| `apps/api/src/auth-config.ts`                        | Reads and validates auth URLs, secret, and trusted origins                     |
| `apps/api/src/auth.ts`                               | Better Auth options: email/password, cookies, IP handling, rate limits         |
| `apps/api/src/auth-routes.ts`                        | Fastify-to-Better-Auth adapter, CORS, cookie forwarding, `/api/me`             |
| `apps/api/src/auth-migrate.ts`                       | Previews or applies Better Auth's database schema                              |
| `apps/api/tests/auth.test.mjs`                       | Authentication tests; SQLite by default, optional isolated Postgres tests      |
| `apps/api/tsconfig.json`                             | TypeScript compiler settings; `src` becomes `dist`                             |
| `apps/api/package.json`                              | API dependencies and scripts                                                   |
| `pnpm-lock.yaml`                                     | Exact workspace dependency resolution                                          |
| `/home/deploy/.config/cosmoids/api.env`              | Private VPS database and auth configuration                                    |
| `/etc/systemd/system/cosmoids-api.service`           | How the API starts and restarts                                                |
| `/etc/nginx/sites-available/cosmoids-api`            | API proxy, HTTP redirect, HTTPS certificate paths                              |
| `/etc/nginx/sites-enabled/cosmoids-api`              | Symlink enabling that Nginx site                                               |
| `/var/www/letsencrypt`                               | Webroot used for certificate ownership challenges                              |
| `/etc/letsencrypt/live/cosmoids-api-domain/`         | Current API certificate and private-key symlinks                               |
| `/etc/letsencrypt/renewal/cosmoids-api-domain.conf`  | Certbot's saved renewal configuration                                          |
| `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx` | Reloads Nginx after successful renewal                                         |
| Vercel project Settings -> Domains                   | Staging domain and its `experimental` branch assignment                        |
| Vercel project Settings -> Environment Variables     | Frontend API URL for Preview / `experimental`                                  |
| Porkbun Domain Management -> DNS                     | Domain and subdomain DNS records                                               |
| `apps/web/.env.local`                                | Ignored frontend environment file for local development                        |

`dist` contains generated JavaScript. Edit `src`, then build; do not hand-edit
`dist` to make a lasting change.

## Environment variables

### VPS API configuration

The private file is `/home/deploy/.config/cosmoids/api.env`. As `deploy`, edit
it with:

```bash
nano ~/.config/cosmoids/api.env
```

`~` means the current user's home directory. For `deploy` it is `/home/deploy`;
for `root` it is `/root`. The systemd service reads the explicit deploy path.

Example only; replace the secret placeholders on the VPS:

```dotenv
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=cosmoids
PGUSER=cosmoids_app
PGPASSWORD=<your-private-database-password>
BETTER_AUTH_SECRET=<your-existing-private-auth-secret>
BETTER_AUTH_URL=https://api.cosmoids-td.com
AUTH_TRUSTED_ORIGINS=https://staging.cosmoids-td.com,https://cosmoids-pirate-web-rpg-git-experimental-sams-projects-022093db.vercel.app
```

| Variable                             | Meaning                                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `PGHOST`, `PGPORT`                   | Where Postgres runs                                                                              |
| `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Database and credentials used by the API                                                         |
| `BETTER_AUTH_SECRET`                 | Secret used by Better Auth for signing/protecting auth data; minimum 32 characters in our config |
| `BETTER_AUTH_URL`                    | Public API origin used by Better Auth                                                            |
| `AUTH_TRUSTED_ORIGINS`               | Comma-separated exact browser origins permitted by CORS and Better Auth                          |
| `NODE_ENV`                           | Set to `production` in systemd, and explicitly for migration commands                            |

The API's own origin is trusted automatically. Additional origins must include
the scheme and hostname, with no paths, credentials, or wildcards. The example
above includes both staging addresses so the original Vercel URL can continue
making API requests. The custom staging origin was verified on the VPS; adding
the original staging origin is a follow-up env change and must be applied and
checked there separately.

When production accounts are ready, preserve both staging entries and append the
exact production origins that serve the game:

- `https://cosmoids-pirate-web-rpg.vercel.app` (existing production URL)
- `https://cosmoids-td.com` (after configuring the production custom domain)
- The `www` origin separately, if it actually serves the game.

Keep each origin explicit; do not allow all `vercel.app` deployments with a
wildcard. Adding an origin does not bypass the cookie restrictions described
below.

For a **new** installation, `openssl rand -base64 32` generates a secret. Keep
the existing secret stable during routine deployments. Never commit real env
files or share passwords, session cookies, tokens, or private keys.

The directory should belong to `deploy` with mode `700`, and the file should
belong to `deploy` with mode `600`. Check metadata without printing secrets:

```bash
stat -c '%U %G %a %n' /home/deploy/.config/cosmoids /home/deploy/.config/cosmoids/api.env
```

If you accidentally created these as root, repair ownership and permissions:

```bash
sudo chown deploy:deploy /home/deploy/.config/cosmoids /home/deploy/.config/cosmoids/api.env
sudo chmod 700 /home/deploy/.config/cosmoids
sudo chmod 600 /home/deploy/.config/cosmoids/api.env
```

After changing env values, restart the API:

```bash
sudo systemctl restart cosmoids-api
```

### Vercel frontend configuration

Saved in the Vercel project for **Preview**, scoped to `experimental`:

```dotenv
NEXT_PUBLIC_API_URL=https://api.cosmoids-td.com
```

`NEXT_PUBLIC_` values are visible in browser JavaScript. They are embedded at
build time, so changes require a new deployment. The URL is public; keep
database credentials and the auth secret in the API's private configuration.
This setting is prepared for the upcoming UI; current game code does not yet
consume it.

## Nginx and HTTPS

### DNS records

| Type  | Host in Porkbun | Value                                 | Purpose                         |
| ----- | --------------- | ------------------------------------- | ------------------------------- |
| A     | `api`           | `159.223.127.157`                     | Sends API traffic to the VPS    |
| CNAME | `staging`       | `98e4d792ab797b2b.vercel-dns-017.com` | Sends staging traffic to Vercel |

The staging CNAME was supplied by this Vercel project. If Vercel asks for a new
target later, use the dashboard's current value. An A record maps a name to an
IPv4 address; a CNAME maps a name to another hostname. A final dot in a DNS
target indicates a fully qualified name.

Vercel's domain assignment should be **Preview -> Git Branch `experimental`**.
The preview currently has Vercel login protection. A redirect to Vercel sign-in
is separate from the game's own account authentication.

Porkbun's parking records can resolve unconfigured names to `uixie.porkbun.com`.
Add an explicit record for the intended host. A CNAME specifically named
`staging` must be replaced if it points to parking; a wildcard parking record
can coexist with an explicit staging record. Keep DNS management at Porkbun when
adding the game domain; changing nameservers requires migrating all existing
records, including `api`.

### Nginx site configuration

This is the configuration established in the walkthrough. Compare the VPS file
before editing rather than overwriting later customizations blindly:

```nginx
server {
    listen 80;
    server_name 159.223.127.157 api.cosmoids-td.com;

    location ^~ /.well-known/acme-challenge/ {
        root /var/www/letsencrypt;
        default_type text/plain;
        try_files $uri =404;
    }

    location / {
        return 308 https://api.cosmoids-td.com$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name api.cosmoids-td.com;

    ssl_certificate /etc/letsencrypt/live/cosmoids-api-domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cosmoids-api-domain/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- `server_name` selects the site by the requested hostname.
- Port `80` serves certificate challenges and redirects other requests to HTTPS.
- Port `443` serves HTTPS with the certificate and private key.
- `proxy_pass` forwards decrypted requests to Fastify over loopback.
- Proxy headers preserve the requested host, client address, and original
  scheme.
- `fullchain.pem` contains the public certificate chain; `privkey.pem` is
  private.

Use the domain for API requests: the active certificate is for
`api.cosmoids-td.com`, not the raw IP address. Fastify trusts proxy headers only
from loopback. The auth adapter overwrites `x-cosmoids-client-ip` using
Fastify's resolved IP, so the client cannot choose its rate-limit bucket by
setting that header.

Edit, validate, and reload on the VPS:

```bash
sudo nano /etc/nginx/sites-available/cosmoids-api
sudo nginx -t && sudo systemctl reload nginx
```

`&&` reloads only if the configuration check succeeds. An Nginx reload applies
proxy changes; it does not rebuild or restart the API.

### Certificate renewal

Certbot is installed through snap at `/snap/bin/certbot`. The current
certificate name is `cosmoids-api-domain`. It was obtained with:

```bash
sudo /snap/bin/certbot certonly \
  --webroot \
  --webroot-path /var/www/letsencrypt \
  --domain api.cosmoids-td.com \
  --cert-name cosmoids-api-domain
```

This is a setup record, not a command to rerun every deployment. `certonly`
obtains the certificate without editing Nginx. The webroot challenge proves
domain control through a temporary file served over HTTP port 80.

The executable deploy hook at
`/etc/letsencrypt/renewal-hooks/deploy/reload-nginx` contains:

```sh
#!/bin/sh
/usr/sbin/nginx -t && /usr/bin/systemctl reload nginx
```

Its mode should be `755`. This reloads Nginx after successful renewal so Nginx
starts using the renewed certificate. The existing `snap.certbot.renew.timer`
schedules renewal checks for the managed certificates.

Inspect certificates and the timer:

```bash
sudo /snap/bin/certbot certificates
systemctl list-timers --all 'snap.certbot.*' --no-pager
```

Test renewal and the deploy hook without replacing the live certificate:

```bash
sudo /snap/bin/certbot renew \
  --cert-name cosmoids-api-domain \
  --dry-run \
  --run-deploy-hooks
```

Expected: `Congratulations, all simulated renewals succeeded`. Nginx prints its
successful configuration-check messages to stderr; Certbot may label them "error
output" even when the hook succeeds. Judge actual errors and exit status, not
that label alone.

The earlier raw-IP certificate has the name `cosmoids-api-ip`; it may still be
listed by Certbot. The active Nginx configuration above uses the domain
certificate. Inspect live references before any future certificate cleanup.

## systemd service

The service file is `/etc/systemd/system/cosmoids-api.service`:

```ini
[Unit]
Description=Cosmoids Fastify API
After=network.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/cosmoids_api/apps/api
ExecStart=/usr/bin/node /home/deploy/cosmoids_api/apps/api/dist/server.js
Environment=NODE_ENV=production
EnvironmentFile=/home/deploy/.config/cosmoids/api.env
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

systemd runs the compiled server independently of your SSH terminal and restarts
it after a failure. `EnvironmentFile` loads the private settings. The server
handles shutdown signals, stops accepting requests, and closes its database
pool.

Useful commands:

```bash
sudo systemctl status cosmoids-api --no-pager
sudo journalctl -u cosmoids-api -n 100 --no-pager
sudo journalctl -u cosmoids-api -f
sudo systemctl restart cosmoids-api
```

`journalctl -f` follows logs; Ctrl+C stops following logs without stopping the
service. If you change the **service file**, run these in order:

```bash
sudo systemctl daemon-reload
sudo systemctl restart cosmoids-api
```

An env-file-only change needs a restart, not `daemon-reload`. Check boot
enablement with `systemctl is-enabled cosmoids-api`; if disabled and boot
startup is desired, use `sudo systemctl enable cosmoids-api`.

## Deploying API changes

### On your computer

From the repository root, check the API changes before committing and pushing:

```bash
pnpm typecheck:api
pnpm build:api
pnpm test:api
```

Commit the intended files and push `experimental`. The Git pre-push hook also
runs the web test suite. Never stage real environment files.

### On the VPS as deploy

Reconnect with `ssh deploy@159.223.127.157`. If already logged in as root, use
`su - deploy`. Run each deployment step individually and stop if it fails:

```bash
cd ~/cosmoids_api
git branch --show-current
git pull --ff-only
HUSKY=0 pnpm --filter @cosmoids/api... install --frozen-lockfile
pnpm build:api
```

The branch should be `experimental` before pulling. `--ff-only` updates the
checkout only if Git can advance the branch without a merge commit. `HUSKY=0`
skips development Git-hook setup during installation. The filter includes the
API and its workspace dependencies. `--frozen-lockfile` installs the committed
dependency resolution without rewriting the lockfile.

The server uses a shallow, filtered sparse checkout including `apps/api`; it
does not need the game's art. Inspect it with:

```bash
git sparse-checkout list
```

For auth schema changes, preview the proposed SQL after building:

```bash
NODE_ENV=production node --env-file="$HOME/.config/cosmoids/api.env" apps/api/dist/auth-migrate.js
```

Previewing does not apply changes. Review the plan and arrange a database backup
before applying schema changes to valuable player data. To apply the plan:

```bash
NODE_ENV=production node --env-file="$HOME/.config/cosmoids/api.env" apps/api/dist/auth-migrate.js --apply
```

These commands explicitly load the env file because shell processes do not
automatically inherit systemd's `EnvironmentFile`. Starting the API never runs
migrations automatically. An unchanged schema should report that it is up to
date. The package scripts `auth:plan` and `auth:migrate` run the same built
script, but still need the environment supplied by their caller.

After successful installation, build, and any required migration:

```bash
sudo systemctl restart cosmoids-api
sudo systemctl status cosmoids-api --no-pager
curl https://api.cosmoids-td.com/health/db
curl -i https://api.cosmoids-td.com/api/me
```

Expected: active service, `{"ok":true}`, and 401 from `/api/me` without a
session. Never restart into a failed build or failed migration.

The current server normally stays running during the build, then restarts to
load the compiled code. A restart briefly interrupts service. This in-place
deployment is not an atomic release: future code that reads generated files or
dynamically imports modules during requests needs more care, such as separate
release directories and a coordinated switch. It is not a zero-downtime setup.

## Authentication and database

| Endpoint                       | Purpose                                                         |
| ------------------------------ | --------------------------------------------------------------- |
| `GET /health`                  | Confirms the API process responds                               |
| `GET /health/db`               | Executes `SELECT 1`; returns 503 if the database check fails    |
| `POST /api/auth/sign-up/email` | Creates a user from `{name, email, password}` and signs them in |
| `POST /api/auth/sign-in/email` | Checks `{email, password}` and creates a session                |
| `POST /api/auth/sign-out`      | Revokes the session identified by the request cookie            |
| `GET /api/auth/get-session`    | Better Auth's session endpoint                                  |
| `GET /api/me`                  | Returns the signed-in user's public identity, or 401            |

Passwords must contain 12-128 characters. Production session cookies are Secure
and HttpOnly; the browser manages them. Cross-origin browser requests to the API
must use `credentials: 'include'`. Do not put session tokens into localStorage.
Logout revokes the server-side session, so retaining an old cookie does not
preserve access. `/api/me` returns `id`, `name`, `email`, and `emailVerified`,
not the raw session token.

Both HTTPS staging and API addresses share the parent domain `cosmoids-td.com`,
which supports same-site cookie requests. They are still different origins, so
CORS and trusted-origin configuration are required. The original `vercel.app`
URLs are on a different site; allowing those origins alone does not solve
third-party-cookie restrictions. API cookies can remain scoped to the API host;
the UI does not need to read the cookie or share it with every subdomain.

### Keeping saves on the original game URLs

The game persists its state under the localStorage key `cosmoids-game-state`.
localStorage belongs to an exact origin. The original Vercel staging URL and
`staging.cosmoids-td.com` therefore have separate local saves even though they
serve the same code. Adding a trusted origin does not move or share those saves.
Keep the original URLs usable and avoid redirecting players away from them until
a save export/import or account-based migration is implemented. Apply the same
transition approach to the original production URL when its custom domain is
introduced.

Allowing the original Vercel URL enables CORS and Better Auth's origin checks,
but direct cookie authentication to `api.cosmoids-td.com` is cross-site. Our
current SameSite cookie settings and browser third-party-cookie protections
prevent treating this as a fully supported login setup. To support login while
players remain on the original URL, add a same-origin API proxy for that site
and have its UI call the proxied path. That proxy has not been implemented yet;
cookie forwarding, origin checks, real client IPs/rate limits, and browser
session persistence must be checked when it is added.

### Database tables

| Table          | Purpose                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| `user`         | Identity, unique email, verification flag, timestamps                          |
| `account`      | Login provider and password hash, linked to `user`                             |
| `session`      | Active session token, expiration, client metadata, linked to `user`            |
| `verification` | Temporary verification records; table existence does not enable email features |
| `rateLimit`    | Persisted request counters                                                     |

`session.userId` and `account.userId` reference `user.id`; deleting a user
cascades to those associated records. Indexes support lookups by user and
verification identifier. The pool allows up to five concurrent database
connections, with five-second connection and statement timeouts. That is a
connection limit, not a five-player limit.

Inspect identity and provider information on the VPS without printing hashes or
session tokens:

```bash
sudo -u postgres psql -d cosmoids -c 'SELECT id, name, email, "emailVerified" FROM "user";'
sudo -u postgres psql -d cosmoids -c 'SELECT "userId", "providerId", password IS NOT NULL AS has_password FROM "account";'
```

### Rate limits and logging

Signup and login each allow five requests per resolved client IP within the
configured 60-second window. Other auth endpoints use the default 100-request
rule or Better Auth's endpoint-specific rules. Login and signup have separate
counters; rejected credentials also consume attempts. A limit returns 429.
Counters are stored in Postgres and survive API restarts. People sharing one
public IP share its quota. `/api/me` uses the server-side session API and is not
covered by the auth handler's rate limiter.

Rate limits reduce abuse but do not validate game saves, shiny awards, or
trades. Those features need their own server rules. The logger redacts cookie,
Authorization, and Set-Cookie headers. Still inspect logs and command output
before sharing them; this does not promise that every possible secret is
automatically removed.

## Checks and troubleshooting

### Staging browser-access check

```bash
curl -i -X OPTIONS \
  https://api.cosmoids-td.com/api/auth/sign-in/email \
  -H 'Origin: https://staging.cosmoids-td.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type'
```

Expected: 204, `access-control-allow-origin: https://staging.cosmoids-td.com`,
and `access-control-allow-credentials: true`. This verifies a browser preflight;
it does not itself sign a player in or prove that a browser saved a session
cookie. The curl account-flow test on the VPS also does not replace testing the
future UI in a real browser.

### Which layer is failing?

| Symptom                                         | First checks                                                                                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| SSH `Permission denied (publickey)`             | Use `deploy`, the correct client SSH key, and the right VPS address. The GitHub deploy key is for cloning/pulling, not logging into the VPS. |
| Site shows Porkbun parking                      | Check the exact A/CNAME host and target in Porkbun; DNS caches may still have the old answer.                                                |
| Staging redirects to Vercel sign-in             | This is Vercel preview protection; sign in with an authorized Vercel account.                                                                |
| Wrong staging build                             | Check Vercel domain assignment: Preview / Git Branch `experimental`.                                                                         |
| HTTPS certificate mismatch                      | Use the API domain and check Nginx's domain certificate paths.                                                                               |
| HTTP does not redirect correctly                | Check the port-80 `location /` redirect, preserving the challenge location.                                                                  |
| 502 from Nginx                                  | Check API service logs and whether Fastify responds on loopback.                                                                             |
| `/health` succeeds but `/health/db` returns 503 | Check Postgres service, PG settings, and credentials; an API process alone does not prove database connectivity.                             |
| Auth says a table does not exist                | Preview/apply the migration against the intended database using the API's env file.                                                          |
| CORS or untrusted-origin error                  | Compare the browser's exact Origin with `AUTH_TRUSTED_ORIGINS`; restart after changing env values.                                           |
| Login succeeds but `/api/me` is 401             | Check browser cookies, `credentials: 'include'`, HTTPS, and use of the custom staging domain. A 401 without a cookie is expected.            |
| 429 during login/signup                         | Wait for the rate-limit window; repeated allowed attempts consume the per-IP quota.                                                          |
| API exits after an env change                   | Check missing/invalid variables, env-file ownership, and systemd logs.                                                                       |
| Frontend still uses an old API address          | Check the Preview/branch env variable and rebuild/redeploy; public Next.js env values are set at build time.                                 |
| Renewal dry-run fails                           | Check DNS, public port 80, challenge location, webroot, Certbot logs, and the reload hook.                                                   |

Useful VPS diagnostics:

```bash
curl http://127.0.0.1:3001/health
sudo systemctl status postgresql --no-pager
sudo journalctl -u cosmoids-api -n 100 --no-pager
sudo tail -n 50 /var/log/nginx/error.log
sudo tail -n 50 /var/log/letsencrypt/letsencrypt.log
sudo ss -ltnp
sudo ufw status
```

UFW was inactive when first checked during setup; check current state rather
than assuming it has changed. Preserve SSH access before changing firewall
rules. Nginx uses public ports 80/443; Fastify's 3001 remains loopback-only.

On your Windows computer, inspect DNS with PowerShell:

```powershell
Resolve-DnsName api.cosmoids-td.com -Type A
Resolve-DnsName staging.cosmoids-td.com -Type CNAME
```

Use the exact API and staging origins when testing. Never use curl's `-k` to
make a broken certificate check look successful.

## Local development

Keep local API values in ignored `apps/api/.env`, using a separate local
database and auth secret. Use `BETTER_AUTH_URL=http://localhost:3001` outside
production; `http://localhost:3000` is trusted by default when no explicit
trusted-origin list is supplied.

From the repository root:

```bash
pnpm --filter @cosmoids/api exec node --env-file=.env --import tsx src/server.ts
```

The API's `dev` script now uses Node's watch mode with `--env-file=.env` and
the `tsx` import hook. Run `pnpm dev:api` from the root to load the local API
environment automatically. Use `pnpm db:up` for the separate Docker Postgres
database on port 5433; see [the local setup guide](../../docs/development/GAME_ACCOUNTS.md#local-docker-setup).
Local development uses its own database and auth secret.

TypeScript uses `NodeNext` module and resolution settings with ESM
(`"type": "module"` in `package.json`), targets ES2022, and emits from `src`
into `dist`. Relative imports use `.js` extensions to match the compiled Node
files. `strict` enables stricter type checks, and `noEmitOnError` prevents
compilation output when type checking fails. Check `apps/api/tsconfig.json` for
the full settings.

API tests run through Node's test runner with `tsx` loading TypeScript. They
exercise Fastify and real Better Auth handlers without listening on a public
port. By default they use temporary in-memory SQLite databases. For the same
suite against Postgres, supply `AUTH_TEST_DATABASE_URL` pointing to a dedicated
test database; the test role needs permission to create schemas, and each test
uses and drops its own unique schema. Never print or commit that connection
string.

## Work still to do

- Deploy and verify the browser account UI on the custom staging domain; see
  [the game account guide](../../docs/development/GAME_ACCOUNTS.md) for its client
  configuration and the limits of the current local-save flow.
- Apply/check the original staging URL's trusted-origin entry and add a
  same-origin proxy before relying on cookie login from that URL.
- Add save export/import or an account-based transition for local saves on old
  URLs; preserve the old production URL during its eventual domain transition.
- Configure and confirm the production game domain and its trusted origin.
- Choose/configure an email sender and its DNS verification records.
- Add email verification and password recovery; currently `emailVerified` is
  false for newly created accounts.
- Implement cloud saves, creature ownership, shiny validation, and trading as
  game features separate from authentication.
- Establish database backups and a tested restore procedure before relying on
  the database for valuable player data.
- Introduce separate backend/database environments when staging needs isolation
  from production player data.

## Official references

- [API README](README.md)
- [Better Auth Fastify integration](https://better-auth.com/docs/integrations/fastify)
- [Better Auth database and migrations](https://better-auth.com/docs/concepts/database)
- [Better Auth cookies and browser sites](https://better-auth.com/docs/concepts/cookies)
- [Better Auth rate limits](https://better-auth.com/docs/concepts/rate-limit)
- [Nginx HTTPS configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Certbot usage and renewal](https://eff-certbot.readthedocs.io/en/stable/using.html)
- [Porkbun DNS records](https://kb.porkbun.com/article/231-how-to-add-dns-records-on-porkbun)
- [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Vercel domain-to-branch assignment](https://vercel.com/docs/domains/working-with-domains/assign-domain-to-a-git-branch)
- [Next.js environment variables](https://nextjs.org/docs/app/guides/environment-variables)
