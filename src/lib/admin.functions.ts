import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { publicImageUrl } from "./media";

/**
 * Admin reads and writes. These run in the browser as the signed-in user, so
 * every operation is protected by the database's row level security policies
 * (only accounts with the admin role can write) — nothing here can be abused
 * by simply calling it from a console.
 */

const articleInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and dashes"),
  excerpt: z.string().trim().max(400).nullable().default(null),
  content: z.string().max(120000).default(""),
  featured_image: z.string().trim().max(600).nullable().default(null),
  category_id: z.string().uuid().nullable().default(null),
  author_name: z.string().trim().min(2).max(120),
  status: z.enum(["draft", "published"]),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  trending: z.boolean().default(false),
  read_minutes: z.number().int().min(1).max(60).default(4),
  seo_title: z.string().trim().max(200).nullable().default(null),
  seo_description: z.string().trim().max(320).nullable().default(null),
  tagIds: z.array(z.string().uuid()).max(20).default([]),
});

const categoryInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and dashes"),
  description: z.string().trim().max(400).nullable().default(null),
  icon: z.string().trim().max(60).nullable().default(null),
  featured_image: z.string().trim().max(600).nullable().default(null),
  sort_order: z.number().int().min(0).max(999).default(0),
});

const tagInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(60),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and dashes"),
});

const idInput = z.object({ id: z.string().uuid() });

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Please sign in again.");
  return data.user.id;
}

async function assertAdmin() {
  const userId = await currentUserId();
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("You do not have administrator access.");
  return userId;
}

export async function getAdminOverview() {
  await assertAdmin();

  const countOf = async (
    table: "articles" | "categories" | "tags" | "newsletter_subscribers" | "contact_messages",
  ) => {
    const { count } = await supabase.from(table).select("id", { count: "exact", head: true });
    return count ?? 0;
  };

  const countArticles = async (status: "published" | "draft") => {
    const { count } = await supabase
      .from("articles")
      .select("id", { count: "exact", head: true })
      .eq("status", status);
    return count ?? 0;
  };

  const [total, published, drafts, categories, tags, subscribers, messages] = await Promise.all([
    countOf("articles"),
    countArticles("published"),
    countArticles("draft"),
    countOf("categories"),
    countOf("tags"),
    countOf("newsletter_subscribers"),
    countOf("contact_messages"),
  ]);

  const { data: recent } = await supabase
    .from("articles")
    .select("id,title,slug,status,updated_at")
    .order("updated_at", { ascending: false })
    .limit(5);

  return {
    stats: { total, published, drafts, categories, tags, subscribers, messages },
    recent: recent ?? [],
  };
}

export async function adminListArticles() {
  await assertAdmin();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id,title,slug,status,featured,popular,trending,updated_at,published_at,category:categories(id,name,slug)",
    )
    .order("updated_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminGetArticle({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { id } = idInput.parse(input);
  const { data: article, error } = await supabase
    .from("articles")
    .select("*,article_tags(tag_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!article) return null;
  return {
    ...article,
    tagIds: (article.article_tags ?? []).map((row: { tag_id: string }) => row.tag_id),
  };
}

export async function adminSaveArticle({ data: input }: { data: unknown }) {
  const userId = await assertAdmin();
  const { id, tagIds, ...fields } = articleInput.parse(input);

  let publishedAt: string | null | undefined;
  if (fields.status === "published") {
    const existing = id
      ? await supabase.from("articles").select("published_at").eq("id", id).maybeSingle()
      : null;
    publishedAt = existing?.data?.published_at ?? new Date().toISOString();
  }

  const payload = {
    ...fields,
    author_id: userId,
    ...(publishedAt !== undefined ? { published_at: publishedAt } : {}),
  };

  let articleId = id;
  if (id) {
    const { error } = await supabase.from("articles").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { data: inserted, error } = await supabase
      .from("articles")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    articleId = inserted.id;
  }

  await supabase.from("article_tags").delete().eq("article_id", articleId!);
  if (tagIds.length > 0) {
    await supabase
      .from("article_tags")
      .insert(tagIds.map((tagId) => ({ article_id: articleId!, tag_id: tagId })));
  }

  return { id: articleId! };
}

export async function adminSetArticleStatus({ data: input }: { data: unknown }) {
  await assertAdmin();
  const data = z
    .object({ id: z.string().uuid(), status: z.enum(["draft", "published"]) })
    .parse(input);

  const patch: { status: "draft" | "published"; published_at?: string } = { status: data.status };
  if (data.status === "published") {
    const { data: existing } = await supabase
      .from("articles")
      .select("published_at")
      .eq("id", data.id)
      .maybeSingle();
    patch.published_at = existing?.published_at ?? new Date().toISOString();
  }
  const { error } = await supabase.from("articles").update(patch).eq("id", data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminReorderCategories({ data: input }: { data: unknown }) {
  await assertAdmin();
  const data = z
    .object({
      order: z
        .array(z.object({ id: z.string().uuid(), sort_order: z.number().int().min(0).max(999) }))
        .max(60),
    })
    .parse(input);

  for (const row of data.order) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: row.sort_order })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
  }
  return { ok: true };
}

export async function adminDeleteArticle({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { id } = idInput.parse(input);
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminSaveCategory({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { id, ...fields } = categoryInput.parse(input);
  const query = id
    ? supabase.from("categories").update(fields).eq("id", id)
    : supabase.from("categories").insert(fields);
  const { error } = await query;
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminDeleteCategory({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { id } = idInput.parse(input);
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminSaveTag({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { id, ...fields } = tagInput.parse(input);
  const query = id
    ? supabase.from("tags").update(fields).eq("id", id)
    : supabase.from("tags").insert(fields);
  const { error } = await query;
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminDeleteTag({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { id } = idInput.parse(input);
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminListSubscribers() {
  await assertAdmin();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminListMessages() {
  await assertAdmin();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function adminUpdateMessageStatus({ data: input }: { data: unknown }) {
  await assertAdmin();
  const data = z
    .object({ id: z.string().uuid(), status: z.enum(["new", "handled"]) })
    .parse(input);
  const { error } = await supabase
    .from("contact_messages")
    .update({ status: data.status })
    .eq("id", data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminSaveSettings({ data: input }: { data: unknown }) {
  await assertAdmin();
  const data = z
    .object({ settings: z.record(z.string().max(60), z.string().trim().max(300)) })
    .parse(input);

  const rows = Object.entries(data.settings).map(([key, value]) => ({
    key,
    value,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("site_settings").upsert(rows);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function adminUploadImage({ data: input }: { data: unknown }) {
  await assertAdmin();
  const data = z
    .object({
      filename: z.string().trim().min(1).max(160),
      contentType: z.string().trim().max(100),
      dataBase64: z.string().max(14_000_000),
    })
    .parse(input);

  const binary = Uint8Array.from(atob(data.dataBase64), (char) => char.charCodeAt(0));
  const safeName = data.filename.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage
    .from("article-images")
    .upload(path, binary, { contentType: data.contentType || "image/jpeg", upsert: false });

  if (error) throw new Error(error.message);
  return { url: publicImageUrl(path) };
}

export async function adminListTaxonomy() {
  await assertAdmin();
  const [categories, tags] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("tags").select("*").order("name", { ascending: true }),
  ]);
  return { categories: categories.data ?? [], tags: tags.data ?? [] };
}

export async function adminWhoAmI() {
  const userId = await currentUserId();
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return { userId, isAdmin: Boolean(data) };
}

type AdminRow = {
  user_id: string;
  email: string;
  granted_at: string;
  last_sign_in_at: string | null;
};

export async function adminListAdmins() {
  const userId = await assertAdmin();
  const { data, error } = await supabase.rpc("list_admin_users");
  if (error) throw new Error(error.message);
  return { admins: (data ?? []) as unknown as AdminRow[], me: userId };
}

export async function adminGrantAdmin({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { email } = z.object({ email: z.string().trim().email().max(255) }).parse(input);
  const { data: result, error } = await supabase.rpc("grant_admin_by_email", { _email: email });
  if (error) throw new Error(error.message);
  return (result as unknown as { ok: boolean; message: string } | null) ?? {
    ok: false,
    message: "Unexpected error",
  };
}

export async function adminRevokeAdmin({ data: input }: { data: unknown }) {
  await assertAdmin();
  const { id } = idInput.parse(input);
  const { data: result, error } = await supabase.rpc("revoke_admin", { _user_id: id });
  if (error) throw new Error(error.message);
  return (result as unknown as { ok: boolean; message: string } | null) ?? {
    ok: false,
    message: "Unexpected error",
  };
}
