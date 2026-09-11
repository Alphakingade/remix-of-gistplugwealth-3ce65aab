import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import {
  adminDeleteCategory,
  adminDeleteTag,
  adminListTaxonomy,
  adminReorderCategories,
  adminSaveCategory,
  adminSaveTag,
} from "@/lib/admin.functions";
import { slugify } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/taxonomy")({
  component: TaxonomyPage,
});

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
};

type TagRow = { id: string; name: string; slug: string };

const inputClass =
  "field mt-1.5 text-sm";

function TaxonomyPage() {
  const load = useServerFn(adminListTaxonomy);
  const saveCategory = useServerFn(adminSaveCategory);
  const deleteCategory = useServerFn(adminDeleteCategory);
  const saveTag = useServerFn(adminSaveTag);
  const deleteTag = useServerFn(adminDeleteTag);
  const reorder = useServerFn(adminReorderCategories);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-taxonomy"], queryFn: () => load() });
  const categories = (data?.categories ?? []) as CategoryRow[];
  const tags = (data?.tags ?? []) as TagRow[];

  const [categoryForm, setCategoryForm] = useState<{
    id?: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    sort_order: number;
  }>({ name: "", slug: "", description: "", icon: "", sort_order: 0 });
  const [tagForm, setTagForm] = useState<{ id?: string; name: string; slug: string }>({
    name: "",
    slug: "",
  });
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-taxonomy"] });

  const categoryMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveCategory({ data: payload as never }),
    onSuccess: () => {
      setCategoryForm({ name: "", slug: "", description: "", icon: "", sort_order: 0 });
      invalidate();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Save failed"),
  });

  const tagMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => saveTag({ data: payload as never }),
    onSuccess: () => {
      setTagForm({ name: "", slug: "" });
      invalidate();
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Save failed"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory({ data: { id } }),
    onSuccess: invalidate,
    onError: () => setError("Delete failed — articles may still use this category."),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => deleteTag({ data: { id } }),
    onSuccess: invalidate,
  });

  const reorderMutation = useMutation({
    mutationFn: (order: { id: string; sort_order: number }[]) => reorder({ data: { order } }),
    onSuccess: invalidate,
    onError: () => setError("Could not change the order. Try again."),
  });

  function move(index: number, direction: -1 | 1) {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    reorderMutation.mutate(next.map((category, i) => ({ id: category.id, sort_order: i })));
  }

  function submitCategory(event: FormEvent) {
    event.preventDefault();
    setError(null);
    categoryMutation.mutate({
      ...(categoryForm.id ? { id: categoryForm.id } : {}),
      name: categoryForm.name,
      slug: categoryForm.slug || slugify(categoryForm.name),
      description: categoryForm.description || null,
      icon: categoryForm.icon || null,
      featured_image: null,
      sort_order: categoryForm.sort_order,
    });
  }

  function submitTag(event: FormEvent) {
    event.preventDefault();
    setError(null);
    tagMutation.mutate({
      ...(tagForm.id ? { id: tagForm.id } : {}),
      name: tagForm.name,
      slug: tagForm.slug || slugify(tagForm.name),
    });
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl">Categories & tags</h1>
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-6 rounded-xl border border-border bg-background p-6">
          <h2 className="text-lg">Categories</h2>
          <form onSubmit={submitCategory} className="space-y-3">
            <div>
              <label htmlFor="cat-name" className="text-sm font-semibold">Name</label>
              <input
                id="cat-name"
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                    slug: prev.id ? prev.slug : slugify(event.target.value),
                  }))
                }
                className={inputClass}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cat-slug" className="text-sm font-semibold">Slug</label>
                <input
                  id="cat-slug"
                  value={categoryForm.slug}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({ ...prev, slug: slugify(event.target.value) }))
                  }
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="cat-order" className="text-sm font-semibold">Sort order</label>
                <input
                  id="cat-order"
                  type="number"
                  min={0}
                  value={categoryForm.sort_order}
                  onChange={(event) =>
                    setCategoryForm((prev) => ({
                      ...prev,
                      sort_order: Math.max(0, Number(event.target.value) || 0),
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="cat-desc" className="text-sm font-semibold">Description</label>
              <textarea
                id="cat-desc"
                rows={2}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={categoryMutation.isPending}
              className="btn btn-sm btn-primary"
            >
              {categoryForm.id ? "Update category" : "Add category"}
            </button>
            {categoryForm.id ? (
              <button
                type="button"
                onClick={() =>
                  setCategoryForm({ name: "", slug: "", description: "", icon: "", sort_order: 0 })
                }
                className="ml-3 text-sm text-muted-foreground underline"
              >
                Cancel edit
              </button>
            ) : null}
          </form>

          <ul className="divide-y divide-border">
            {isLoading ? <li className="py-3 text-sm text-muted-foreground">Loading…</li> : null}
            {categories.map((category, index) => (
              <li key={category.id} className="flex items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  onClick={() =>
                    setCategoryForm({
                      id: category.id,
                      name: category.name,
                      slug: category.slug,
                      description: category.description ?? "",
                      icon: category.icon ?? "",
                      sort_order: category.sort_order,
                    })
                  }
                  className="text-left font-semibold hover:text-primary"
                >
                  {category.name}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    /{category.slug}
                  </span>
                </button>
                <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Move ${category.name} up`}
                  disabled={index === 0 || reorderMutation.isPending}
                  onClick={() => move(index, -1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-emerald hover:text-primary disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${category.name} down`}
                  disabled={index === categories.length - 1 || reorderMutation.isPending}
                  onClick={() => move(index, 1)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-emerald hover:text-primary disabled:opacity-40"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${category.name}`}
                  onClick={() => {
                    if (confirm(`Delete category “${category.name}”?`))
                      deleteCategoryMutation.mutate(category.id);
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-destructive transition-all hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-6 rounded-xl border border-border bg-background p-6">
          <h2 className="text-lg">Tags</h2>
          <form onSubmit={submitTag} className="flex gap-3">
            <input
              aria-label="Tag name"
              value={tagForm.name}
              onChange={(event) =>
                setTagForm((prev) => ({
                  ...prev,
                  name: event.target.value,
                  slug: prev.id ? prev.slug : slugify(event.target.value),
                }))
              }
              placeholder="Tag name"
              className={inputClass}
              required
            />
            <button
              type="submit"
              disabled={tagMutation.isPending}
              className="btn btn-sm btn-primary shrink-0"
            >
              {tagForm.id ? "Update" : "Add"}
            </button>
          </form>

          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm"
              >
                <button
                  type="button"
                  onClick={() => setTagForm({ id: tag.id, name: tag.name, slug: tag.slug })}
                  className="font-semibold hover:text-primary"
                >
                  {tag.name}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${tag.name}`}
                  onClick={() => deleteTagMutation.mutate(tag.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
