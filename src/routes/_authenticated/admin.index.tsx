import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { getAdminOverview } from "@/lib/admin.functions";
import { formatDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminDashboard,
});

const CARDS = [
  { key: "total", label: "Articles" },
  { key: "published", label: "Published" },
  { key: "drafts", label: "Drafts" },
  { key: "categories", label: "Categories" },
  { key: "tags", label: "Tags" },
  { key: "subscribers", label: "Subscribers" },
  { key: "messages", label: "Messages" },
] as const;

function AdminDashboard() {
  const overview = useServerFn(getAdminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => overview() });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your publication at a glance.
          </p>
        </div>
        <Link
          to="/admin/articles/$id"
          params={{ id: "new" }}
          className="btn btn-sm btn-primary"
        >
          New article
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((card) => (
          <div key={card.key} className="surface p-5">
            <p className="eyebrow text-muted-foreground">{card.label}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-primary">
              {isLoading ? "—" : (data?.stats[card.key] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <section className="surface p-6">
        <h2 className="text-lg">Recently updated</h2>
        <ul className="mt-4 divide-y divide-border">
          {(data?.recent ?? []).map(
            (item: { id: string; title: string; status: string; updated_at: string }) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                <Link
                  to="/admin/articles/$id"
                  params={{ id: item.id }}
                  className="font-semibold hover:text-primary"
                >
                  {item.title}
                </Link>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {item.status} · {formatDate(item.updated_at)}
                </span>
              </li>
            ),
          )}
          {!isLoading && (data?.recent ?? []).length === 0 ? (
            <li className="py-3 text-sm text-muted-foreground">No articles yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
