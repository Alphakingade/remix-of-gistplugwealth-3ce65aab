/**
 * Turns the SPA build in dist/client into a folder that any plain file host can
 * serve (cPanel / Apache / Litespeed, e.g. QServers).
 *
 * - index.html + 404.html from the built app shell
 * - .htaccess so every URL (/blog, /article/x, /admin) loads the app
 * - sitemap.xml generated from the live published articles and categories
 *
 * Run with: STATIC_BUILD=1 vite build && node scripts/finalize-static.mjs
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

// Local runs read the repo .env; CI passes the values as environment variables.
if (existsSync(path.join(root, ".env"))) {
  for (const line of (await readFile(path.join(root, ".env"), "utf8")).split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

const source = path.join(root, "dist", "client");
const out = path.join(root, "dist-static");

const siteUrl = (process.env["SITE_URL"] || "https://gistplugwealth.com").replace(/\/+$/, "");
const supabaseUrl = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
const supabaseKey =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"];

if (!existsSync(source)) {
  console.error("dist/client is missing — run `STATIC_BUILD=1 vite build` first.");
  process.exit(1);
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(source, out, { recursive: true });

const shellPath = path.join(out, "_shell.html");
if (!existsSync(shellPath)) {
  console.error("_shell.html is missing — the SPA build did not run.");
  process.exit(1);
}
const shell = await readFile(shellPath, "utf8");
await writeFile(path.join(out, "index.html"), shell);
await writeFile(path.join(out, "404.html"), shell);

const htaccess = `# GistPlugWealth — single page app on shared hosting
Options -MultiViews
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
`;
await writeFile(path.join(out, ".htaccess"), htaccess);

const staticPaths = [
  "",
  "/blog",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-use",
  "/disclaimer",
];

async function restSelect(table, query) {
  if (!supabaseUrl || !supabaseKey) return [];
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: supabaseKey },
  });
  if (!res.ok) {
    console.warn(`sitemap: could not read ${table} (${res.status})`);
    return [];
  }
  return res.json();
}

const [articles, categories] = await Promise.all([
  restSelect("articles", "select=slug,updated_at&status=eq.published&order=updated_at.desc"),
  restSelect("categories", "select=slug"),
]);

const urls = [
  ...staticPaths.map((p) => ({ loc: `${siteUrl}${p || "/"}`, priority: p ? "0.6" : "1.0" })),
  ...categories.map((c) => ({ loc: `${siteUrl}/category/${c.slug}`, priority: "0.7" })),
  ...articles.map((a) => ({
    loc: `${siteUrl}/article/${a.slug}`,
    lastmod: a.updated_at ? new Date(a.updated_at).toISOString() : undefined,
    priority: "0.8",
  })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}<priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>
`;
await writeFile(path.join(out, "sitemap.xml"), sitemap);

await writeFile(
  path.join(out, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
);

console.log(
  `dist-static ready — ${urls.length} sitemap URLs (${articles.length} articles, ${categories.length} categories).`,
);
