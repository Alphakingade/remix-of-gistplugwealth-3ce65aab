const SUPABASE_URL =
  (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ??
  (import.meta.env["SUPABASE_URL"] as string | undefined) ??
  "";

const BUCKET = "article-images";
const LEGACY_PREFIX = "/api/public/media/";

/** Public URL for a file stored in the article images bucket. */
export function publicImageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path.replace(/^\/+/, "")}`;
}

/**
 * Article images used to be streamed through a server route. On a static host
 * there is no server, so older `/api/public/media/...` values are rewritten to
 * the direct public storage URL.
 */
export function resolveImageUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith(LEGACY_PREFIX)) return publicImageUrl(url.slice(LEGACY_PREFIX.length));
  return url;
}
