# GistPlugWealth

**Inform. Inspire. Increase.**

GistPlugWealth is a Nigerian digital finance, personal finance and money-making
publication. It publishes practical, locally relevant guidance on saving,
earning, budgeting, digital tools, online income and business opportunities for
a Nigerian audience.

## What the site includes

- **Home** — featured, trending and popular stories with clear section entry points
- **Blog** — full article archive with search
- **Sections** — category pages (saving, earning online, business, apps, students, dollars and more)
- **Articles** — readable long-form pages with reading progress, related stories and sharing
- **Static pages** — about, contact, privacy policy, terms of use and disclaimer
- **Newsletter and contact** — submissions are stored in the database
- **WhatsApp community call-to-action** and advertisement placeholders
- **Admin CMS** at `/admin` — articles, categories, tags, images, inbox, subscribers, team and site settings

## Writing articles

Article bodies use a deliberately simple, WhatsApp-style format:

- `**bold text**` for bold
- Blank line between paragraphs
- `## Heading` for a section heading
- `- item` for bullet lists
- `> text` for a highlighted quote

## Admin access

1. Create an account at `/auth`.
2. An existing administrator can grant access from **Admin → Team**.
3. Two owner email addresses are promoted to administrator automatically on sign-up.

## Tech

- TanStack Start (React 19) + Vite 7
- Tailwind CSS v4 with a green / emerald / gold design system
- Lovable Cloud (Postgres, auth, storage) with row level security on every table
- SEO/AEO: per-page metadata, Open Graph, Article/Breadcrumb/Organization structured data, `sitemap.xml`, `robots.txt`, `llms.txt`

## Running it

```bash
npm install
npm run dev          # local development
npm run build        # standard server build
npm run build:static # static build for plain cPanel/shared hosting (outputs dist-static)
```

Deployment options and the QServers/GitHub Actions route are documented in
[`DEPLOY.md`](./DEPLOY.md).
