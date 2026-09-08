import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/**
 * Public content reads. These run directly in the browser against the database
 * (row level security only exposes published content), so the site can be
 * hosted as plain static files.
 */

const CARD_FIELDS =
  "id,title,slug,excerpt,featured_image,author_name,read_minutes,published_at,created_at,category:categories(id,name,slug)";

const listSchema = z.object({
  categorySlug: z.string().max(120).optional(),
  q: z.string().max(120).optional(),
  limit: z.number().int().min(1).max(24).default(9),
  offset: z.number().int().min(0).max(5000).default(0),
});

const slugSchema = z.object({ slug: z.string().min(1).max(200) });

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(255),
});

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(255),
  subject: z.string().trim().min(2, "Please enter a subject").max(150),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(3000),
});

export async function getSiteData() {
  const [categories, settings] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("site_settings").select("key,value"),
  ]);

  if (categories.error) throw new Error(categories.error.message);

  const settingsMap: Record<string, string> = {};
  for (const row of settings.data ?? []) settingsMap[row.key] = row.value;

  return { categories: categories.data ?? [], settings: settingsMap };
}

export async function getHomeData() {
  const base = () => supabase.from("articles").select(CARD_FIELDS).eq("status", "published");

  const [featured, latest, trending] = await Promise.all([
    base().eq("featured", true).order("published_at", { ascending: false }).limit(4),
    base().order("published_at", { ascending: false }).limit(6),
    base()
      .or("trending.eq.true,popular.eq.true")
      .order("published_at", { ascending: false })
      .limit(5),
  ]);

  if (latest.error) throw new Error(latest.error.message);

  return {
    featured: featured.data ?? [],
    latest: latest.data ?? [],
    trending: trending.data ?? [],
  };
}

export async function listArticles({ data: input }: { data: unknown }) {
  const data = listSchema.parse(input);

  let categoryId: string | null = null;
  if (data.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", data.categorySlug)
      .maybeSingle();
    if (!cat) return { items: [], total: 0 };
    categoryId = cat.id;
  }

  let query = supabase
    .from("articles")
    .select(CARD_FIELDS, { count: "exact" })
    .eq("status", "published");

  if (categoryId) query = query.eq("category_id", categoryId);

  if (data.q) {
    const term = data.q.replace(/[%,()]/g, " ").trim();
    if (term) {
      query = query.or(
        `title.ilike.%${term}%,excerpt.ilike.%${term}%,content.ilike.%${term}%`,
      );
    }
  }

  const { data: items, count, error } = await query
    .order("published_at", { ascending: false })
    .range(data.offset, data.offset + data.limit - 1);

  if (error) throw new Error(error.message);
  return { items: items ?? [], total: count ?? 0 };
}

export async function getCategory({ data: input }: { data: unknown }) {
  const { slug } = slugSchema.parse(input);
  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return category;
}

type RelatedRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  read_minutes: number;
  published_at: string | null;
  created_at: string;
  category: { id: string; name: string; slug: string } | null;
};

export async function getArticle({ data: input }: { data: unknown }) {
  const { slug } = slugSchema.parse(input);

  const { data: article, error } = await supabase
    .from("articles")
    .select(
      `${CARD_FIELDS},content,seo_title,seo_description,category_id,article_tags(tags(id,name,slug))`,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!article) return null;

  const tags = (article.article_tags ?? [])
    .map((row: { tags: { id: string; name: string; slug: string } | null }) => row.tags)
    .filter((tag): tag is { id: string; name: string; slug: string } => Boolean(tag));

  let related: RelatedRow[] = [];
  if (article.category_id) {
    const { data: rel } = await supabase
      .from("articles")
      .select(CARD_FIELDS)
      .eq("status", "published")
      .eq("category_id", article.category_id)
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(3);
    related = (rel ?? []) as unknown as RelatedRow[];
  }

  if (related.length === 0) {
    const { data: rel } = await supabase
      .from("articles")
      .select(CARD_FIELDS)
      .eq("status", "published")
      .neq("id", article.id)
      .order("published_at", { ascending: false })
      .limit(3);
    related = (rel ?? []) as unknown as RelatedRow[];
  }

  return { article: { ...article, tags }, related };
}

export async function listAllPublishedSlugs() {
  const [articles, categories] = await Promise.all([
    supabase
      .from("articles")
      .select("slug,updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500),
    supabase.from("categories").select("slug"),
  ]);
  return { articles: articles.data ?? [], categories: categories.data ?? [] };
}

export async function subscribeToNewsletter({ data: input }: { data: unknown }) {
  const data = emailSchema.parse(input);

  const { error } = await supabase.from("newsletter_subscribers").insert({ email: data.email });

  if (error) {
    if (error.code === "23505") {
      return { ok: true as const, message: "You are already subscribed — thank you!" };
    }
    return {
      ok: false as const,
      message: "We could not save your email right now. Please try again shortly.",
    };
  }

  return { ok: true as const, message: "You're in. Watch your inbox for new guides." };
}

export async function sendContactMessage({ data: input }: { data: unknown }) {
  const data = contactSchema.parse(input);

  const { error } = await supabase.from("contact_messages").insert(data);

  if (error) {
    return {
      ok: false as const,
      message: "Your message could not be sent right now. Please try again shortly.",
    };
  }
  return { ok: true as const, message: "Thank you — your message has been received." };
}
