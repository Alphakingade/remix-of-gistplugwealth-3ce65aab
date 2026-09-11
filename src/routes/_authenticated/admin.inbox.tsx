import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { Download } from "lucide-react";
import {
  adminListMessages,
  adminListSubscribers,
  adminUpdateMessageStatus,
} from "@/lib/admin.functions";
import { formatDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/inbox")({
  component: InboxPage,
});

type Message = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

type Subscriber = { id: string; email: string; status: string; created_at: string };

function exportSubscribers(rows: Subscriber[]) {
  const csv = ["email,status,joined"]
    .concat(rows.map((row) => `${row.email},${row.status},${row.created_at}`))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "gistplugwealth-subscribers.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function InboxPage() {
  const listMessages = useServerFn(adminListMessages);
  const listSubscribers = useServerFn(adminListSubscribers);
  const updateStatus = useServerFn(adminUpdateMessageStatus);
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["admin-messages"],
    queryFn: () => listMessages() as Promise<Message[]>,
  });
  const subscribersQuery = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: () => listSubscribers() as Promise<Subscriber[]>,
  });

  const statusMutation = useMutation({
    mutationFn: (args: { id: string; status: "new" | "handled" }) =>
      updateStatus({ data: args }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="surface p-6">
        <h1 className="text-2xl">Contact messages</h1>
        <ul className="mt-4 space-y-4">
          {(messagesQuery.data ?? []).map((message) => (
            <li key={message.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{message.subject}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    message.status === "new"
                      ? "bg-primary-soft text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {message.name} · {message.email} · {formatDate(message.created_at)}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{message.message}</p>
              {message.status === "new" ? (
                <button
                  type="button"
                  onClick={() => statusMutation.mutate({ id: message.id, status: "handled" })}
                  className="mt-3 text-sm font-semibold text-primary hover:underline"
                >
                  Mark as handled
                </button>
              ) : null}
            </li>
          ))}
          {messagesQuery.isSuccess && (messagesQuery.data ?? []).length === 0 ? (
            <li className="text-sm text-muted-foreground">No messages yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Newsletter subscribers</h2>
          <button
            type="button"
            disabled={(subscribersQuery.data ?? []).length === 0}
            onClick={() => exportSubscribers(subscribersQuery.data ?? [])}
            className="btn btn-sm btn-quiet"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export emails
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {subscribersQuery.data?.length ?? 0} subscribers
        </p>
        <ul className="mt-4 divide-y divide-border text-sm">
          {(subscribersQuery.data ?? []).map((subscriber) => (
            <li key={subscriber.id} className="flex justify-between gap-4 py-2.5">
              <span>{subscriber.email}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatDate(subscriber.created_at)}
              </span>
            </li>
          ))}
          {subscribersQuery.isSuccess && (subscribersQuery.data ?? []).length === 0 ? (
            <li className="py-2.5 text-muted-foreground">No subscribers yet.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
