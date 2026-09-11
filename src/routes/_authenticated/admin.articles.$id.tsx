import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { Bold, Eye, Heading2, ImagePlus, Italic, Link2, List, ListOrdered, Loader2, Quote, Sparkles } from "lucide-react";
import { ArticleBody } from "@/components/site/ArticleBody";
import { FormatGuide } from "@/components/site/FormatGuide";
import {
  adminGetArticle,
  adminListTaxonomy,
  adminSaveArticle,
  adminUploadImage,
} from "@/lib/admin.functions";
import { slugify } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/articles/$id")({
  component: ArticleEditor,
});

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  category_id: string;
  author_name: string;
  status: "draft" | "published";
  featured: boolean;
  popular: boolean;
  trending: boolean;
  read_minutes: number;
  seo_title: string;
  seo_description: string;
  tagIds: string[];
};

const EMPTY: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: null,
  category_id: "",
  author_name: "GistPlugWealth Editorial",
  status: "draft",
  featured: false,
  popular: false,
  trending: false,
  read_minutes: 4,
  seo_title: "",
  seo_description: "",
  tagIds: [],
};

const inputClass = "field mt-1.5 text-sm";

const TOOLS = [
  { label: "Bold", icon: Bold, wrap: ["*", "*"], sample: "bold text" },
  { label: "Italic", icon: Italic, wrap: ["_", "_"], sample: "italic text" },
  { label: "Highlight", icon: Sparkles, wrap: ["==", "=="], sample: "key point" },
  { label: "Heading", icon: Heading2, wrap: ["\n# ", "\n"], sample: "Section heading" },
  { label: "Bullet list", icon: List, wrap: ["\n- ", ""], sample: "First point" },
  { label: "Numbered list", icon: ListOrdered, wrap: ["\n1. ", ""], sample: "First step" },
  { label: "Quote", icon: Quote, wrap: ["\n> ", "\n"], sample: "Quoted line" },
  { label: "Link", icon: Link2, wrap: ["[", "](https://)"], sample: "link text" },
] as const;

function ArticleEditor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loadArticle = useServerFn(adminGetArticle);
  const loadTaxonomy = useServerFn(adminListTaxonomy);
  const save = useServerFn(adminSaveArticle);
  const upload = useServerFn(adminUploadImage);

  const [form, setForm] = useState<FormState>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const articleQuery = useQuery({
    queryKey: ["admin-article", id],
    queryFn: () => loadArticle({ data: { id } }),
    enabled: !isNew,
  });

  const taxonomyQuery = useQuery({
    queryKey: ["admin-taxonomy"],
    queryFn: () => loadTaxonomy(),
  });

  useEffect(() => {
    if (isNew) return;
    const article = articleQuery.data;
    if (!article) return;
    setForm({
      title: article.title ?? "",
      slug: article.slug ?? "",
      excerpt: article.excerpt ?? "",
      content: article.content ?? "",
      featured_image: article.featured_image ?? null,
      category_id: article.category_id ?? "",
      author_name: article.author_name ?? "GistPlugWealth Editorial",
      status: article.status ?? "draft",
      featured: Boolean(article.featured),
      popular: Boolean(article.popular),
      trending: Boolean(article.trending),
      read_minutes: article.read_minutes ?? 4,
      seo_title: article.seo_title ?? "",
      seo_description: article.seo_description ?? "",
      tagIds: article.tagIds ?? [],
    });
    setSlugTouched(true);
  }, [isNew, articleQuery.data]);

  const categories = taxonomyQuery.data?.categories ?? [];
  const tags = taxonomyQuery.data?.tags ?? [];

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => save({ data: payload as never }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      navigate({ to: "/admin/articles" });
      return result;
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Save failed"),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.onload = async () => {
          try {
            const base64 = String(reader.result).split(",")[1] ?? "";
            const result = await upload({
              data: { filename: file.name, contentType: file.type, dataBase64: base64 },
            });
            resolve(result.url);
          } catch (uploadError) {
            reject(uploadError);
          }
        };
        reader.readAsDataURL(file);
      }),
    onSuccess: (url) =>
      setForm((prev) => ({
        ...prev,
        featured_image: url,
      })),
    onError: () => setError("Image upload failed. Try a smaller file (under ~10 MB)."),
  });

  function onPickImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  }

  function applyTool(before: string, after: string, sample: string) {
    const node = contentRef.current;
    if (!node) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const value = node.value;
    const selected = value.slice(start, end) || sample;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
    setForm((prev) => ({ ...prev, content: next }));
    requestAnimationFrame(() => {
      node.focus();
      const caret = start + before.length;
      node.setSelectionRange(caret, caret + selected.length);
    });
  }

  const canSave = form.title.trim().length >= 3 && form.slug.trim().length >= 3;

  const previewText = useMemo(() => form.content.trim(), [form.content]);

  function onSave(nextStatus: "draft" | "published") {
    setError(null);
    saveMutation.mutate({
      ...(isNew ? {} : { id }),
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      featured_image: form.featured_image,
      category_id: form.category_id || null,
      author_name: form.author_name.trim(),
      status: nextStatus,
      featured: form.featured,
      popular: form.popular,
      trending: form.trending,
      read_minutes: form.read_minutes,
      seo_title: form.seo_title.trim() || null,
      seo_description: form.seo_description.trim() || null,
      tagIds: form.tagIds,
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <section className="surface space-y-6 p-6">
        <h1 className="text-2xl">{isNew ? "New article" : "Edit article"}</h1>

        <div>
          <label htmlFor="title" className="text-sm font-semibold">
            Title
          </label>
          <input
            id="title"
            value={form.title}
            onChange={(event) => {
              const title = event.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug: slugTouched ? prev.slug : slugify(title),
              }));
            }}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="slug" className="text-sm font-semibold">
            Slug
          </label>
          <input
            id="slug"
            value={form.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setForm((prev) => ({ ...prev, slug: slugify(event.target.value) }));
            }}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Public URL: /article/{form.slug || "your-slug"}
          </p>
        </div>

        <div>
          <label htmlFor="excerpt" className="text-sm font-semibold">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            rows={3}
            value={form.excerpt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, excerpt: event.target.value }))
            }
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="content" className="text-sm font-semibold">
              Content
            </label>
            <button
              type="button"
              onClick={() => setShowPreview((value) => !value)}
              className="btn btn-sm btn-quiet"
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
              {showPreview ? "Hide preview" : "Preview"}
            </button>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5 rounded-t-xl border border-b-0 border-input bg-muted/50 p-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.label}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                onClick={() => applyTool(tool.wrap[0], tool.wrap[1], tool.sample)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-border hover:bg-background hover:text-primary"
              >
                <tool.icon className="h-4 w-4" aria-hidden="true" />
              </button>
            ))}
          </div>
          <textarea
            id="content"
            ref={contentRef}
            rows={20}
            value={form.content}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, content: event.target.value }))
            }
            className="w-full rounded-b-xl rounded-t-none border border-input bg-background p-4 font-mono text-[0.8rem] leading-relaxed outline-none focus:border-emerald"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Write it like a WhatsApp message: <code>*bold*</code>, <code>_italic_</code>, one point
            per line.
          </p>
          <div className="mt-3">
            <FormatGuide />
          </div>
          {showPreview ? (
            <div className="mt-4 rounded-xl border border-border bg-card p-5">
              <p className="eyebrow text-emerald">Live preview</p>
              <div className="mt-3">
                <ArticleBody content={previewText} />
              </div>
            </div>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => onSave("draft")}
            className="btn btn-quiet"
          >
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save draft
          </button>
          <button
            type="button"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => onSave("published")}
            className="btn btn-primary"
          >
            {form.status === "published" ? "Update & keep published" : "Publish"}
          </button>
          {!isNew && form.status === "published" ? (
            <>
              <button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => {
                  if (confirm("Unpublish this article? It will disappear from the public site."))
                    onSave("draft");
                }}
                className="btn btn-quiet"
              >
                Unpublish
              </button>
              <a
                href={`/article/${form.slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-quiet"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                View live
              </a>
            </>
          ) : null}
        </div>
      </section>

      <aside className="space-y-6">
        <section className="surface p-5">
          <h2 className="text-lg">Featured image</h2>
          {form.featured_image ? (
            <img
              src={form.featured_image}
              alt="Featured"
              className="mt-3 aspect-[3/2] w-full rounded-md object-cover"
            />
          ) : (
            <div className="mt-3 flex aspect-[3/2] items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
              No image — a category fallback will be used
            </div>
          )}
          <label className="btn btn-sm btn-quiet mt-3 cursor-pointer">
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            Upload image
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onPickImage}
              className="sr-only"
            />
          </label>
        </section>

        <section className="surface space-y-4 p-5">
          <h2 className="text-lg">Organisation</h2>
          <div>
            <label htmlFor="category" className="text-sm font-semibold">
              Category
            </label>
            <select
              id="category"
              value={form.category_id}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category_id: event.target.value }))
              }
              className={inputClass}
            >
              <option value="">No category</option>
              {categories.map((category: { id: string; name: string }) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold">Tags</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag: { id: string; name: string }) => {
                const active = form.tagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        tagIds: active
                          ? prev.tagIds.filter((tagId) => tagId !== tag.id)
                          : [...prev.tagIds, tag.id],
                      }))
                    }
                    className={`chip ${active ? "chip-active" : "hover:border-emerald"}`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label htmlFor="author" className="text-sm font-semibold">
              Author name
            </label>
            <input
              id="author"
              value={form.author_name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, author_name: event.target.value }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="read_minutes" className="text-sm font-semibold">
              Read minutes
            </label>
            <input
              id="read_minutes"
              type="number"
              min={1}
              max={60}
              value={form.read_minutes}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  read_minutes: Math.max(1, Number(event.target.value) || 1),
                }))
              }
              className={inputClass}
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-1 text-sm font-semibold">
            {(["featured", "trending", "popular"] as const).map((flag) => (
              <label key={flag} className="flex items-center gap-2 capitalize">
                <input
                  type="checkbox"
                  checked={form[flag]}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, [flag]: event.target.checked }))
                  }
                  className="h-4 w-4 accent-emerald"
                />
                {flag}
              </label>
            ))}
          </div>
        </section>

        <section className="surface space-y-4 p-5">
          <h2 className="text-lg">SEO</h2>
          <div>
            <label htmlFor="seo_title" className="text-sm font-semibold">
              SEO title
            </label>
            <input
              id="seo_title"
              value={form.seo_title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seo_title: event.target.value }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="seo_description" className="text-sm font-semibold">
              SEO description
            </label>
            <textarea
              id="seo_description"
              rows={3}
              value={form.seo_description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, seo_description: event.target.value }))
              }
              className={inputClass}
            />
          </div>
        </section>

        {previewText ? (
          <section className="surface p-5">
            <h2 className="text-lg">Preview (first lines)</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{previewText}</p>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
