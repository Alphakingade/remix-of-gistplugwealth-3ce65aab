import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { ExternalLink, Trash2 } from "lucide-react";
import {
  adminDeleteArticle,
  adminListArticles,
  adminSetArticleStatus,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/articles/")({
  component: AdminArticles,
});

type Row = {
  id: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  trending: boolean;
  popular: boolean;
  updated_at: string;
  category: { name: string } | null;
};

function AdminArticles() {
  const list = useServerFn(adminListArticles);
  const remove = useServerFn(adminDeleteArticle);
  const setStatus = useServerFn(adminSetArticleStatus);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: () => list() as Promise<Row[]>,
  });

  const deletion = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-articles"] }),
  });

  const statusChange = useMutation({
    mutationFn: (vars: { id: string; status: "draft" | "published" }) =>
      setStatus({ data: vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-articles"] }),
  });

  const term = search.trim().toLowerCase();
  const rows = (data ?? [])
    .filter((row) => filter === "all" || row.status === filter)
    .filter((row) => !term || row.title.toLowerCase().includes(term));


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl">Articles</h1>
        <Link
          to="/admin/articles/$id"
          params={{ id: "new" }}
          className="btn btn-sm btn-primary"
        >
          New article
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "published", "draft"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`h-9 rounded-md border px-4 text-sm font-semibold capitalize ${
              filter === value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background"
            }`}
          >
            {value}
          </button>
        ))}
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search titles…"
          aria-label="Search articles"
          className="field h-9 w-full max-w-xs text-sm sm:ml-auto sm:w-64"
        />
      </div>


      <div className="overflow-x-auto rounded-xl border border-border bg-background">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>
              <th className="p-4 font-semibold">Title</th>
              <th className="p-4 font-semibold">Category</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Updated</th>
              <th className="p-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="p-4">
                  <Link
                    to="/admin/articles/$id"
                    params={{ id: row.id }}
                    className="font-semibold hover:text-primary"
                  >
                    {row.title}
                  </Link>
                  <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                    {row.featured ? <span>Featured</span> : null}
                    {row.trending ? <span>Trending</span> : null}
                    {row.popular ? <span>Popular</span> : null}
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{row.category?.name ?? "—"}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.status === "published"
                        ? "bg-primary-soft text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="p-4 text-muted-foreground">{formatDate(row.updated_at)}</td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={statusChange.isPending}
                    onClick={() =>
                      statusChange.mutate({
                        id: row.id,
                        status: row.status === "published" ? "draft" : "published",
                      })
                    }
                    className="btn btn-sm btn-quiet"
                  >
                    {row.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  {row.status === "published" ? (
                    <a
                      href={`/article/${row.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`View ${row.title} on the live site`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:-translate-y-0.5 hover:border-emerald hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Delete ${row.title}`}
                    onClick={() => {
                      if (confirm(`Delete “${row.title}”? This cannot be undone.`)) {
                        deletion.mutate(row.id);
                      }
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-destructive transition-all hover:-translate-y-0.5 hover:border-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  No articles found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
