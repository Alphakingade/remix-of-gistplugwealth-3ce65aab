# Hosting GistPlugWealth on QServers (or any cPanel / shared host)

The site can now be published as **plain files** — no Node.js, no terminal, no
persistent server. Everything (articles, admin, newsletter, contact) runs in the
visitor's browser and talks straight to the backend.

## Option A — automatic deploys with GitHub Actions (recommended)

`.github/workflows/deploy-static.yml` builds the site on GitHub and uploads the
finished files to your hosting over FTP every time you push to `main`.

Add these repository secrets (GitHub → Settings → Secrets and variables →
Actions):

| Secret | Value |
| --- | --- |
| `SITE_URL` | `https://your-domain.com` (used for the sitemap) |
| `VITE_SUPABASE_URL` | from the project `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | from the project `.env` |
| `VITE_SUPABASE_PROJECT_ID` | from the project `.env` |
| `FTP_SERVER` | e.g. `ftp.your-domain.com` |
| `FTP_USERNAME` / `FTP_PASSWORD` | the cPanel FTP account |
| `FTP_SERVER_DIR` | usually `/public_html/` |

Then push, or run the workflow manually from the Actions tab.

## Option B — build once and upload by hand

```bash
npm install
SITE_URL=https://your-domain.com npm run build:static
```

Upload **everything inside `dist-static/`** (including the hidden `.htaccess`)
into `public_html`. That folder contains `index.html`, the assets, `.htaccess`,
`robots.txt` and a generated `sitemap.xml`.

The `.htaccess` is what makes `/blog`, `/article/...` and `/admin` work on a
refresh — without it those URLs return 404.

Re-run the command and re-upload whenever the code changes. Publishing new
articles does **not** need a re-upload; only the `sitemap.xml` becomes slightly
stale, so refresh it occasionally.

## Admin access

The admin dashboard is always at `https://your-domain.com/admin`.

1. Go to `https://your-domain.com/auth` and create your account.
2. Ask an existing administrator to add you under **Admin → Admin team**.
   (For the very first administrator, the account has to be granted access once
   from the Lovable chat.)

## Article images

Images you upload in the editor are served from the backend's storage. For them
to show on your own domain, public file storage must be allowed in your Lovable
workspace (Settings → Privacy & Security → allow public buckets). Until then,
articles fall back to the built-in section images.

## Trade-off to know about

Because pages are rendered in the browser, search engines and social previews
see the shared site title and description rather than per-article ones. If
per-article link previews matter more than shared hosting, publish through
Lovable (or any Node host) and point the domain there instead.
