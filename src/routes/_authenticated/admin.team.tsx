import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { Loader2, ShieldCheck, ShieldOff, UserPlus } from "lucide-react";
import { adminGrantAdmin, adminListAdmins, adminRevokeAdmin } from "@/lib/admin.functions";
import { formatDate } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/team")({
  component: AdminTeam,
});

function AdminTeam() {
  const queryClient = useQueryClient();
  const list = useServerFn(adminListAdmins);
  const grant = useServerFn(adminGrantAdmin);
  const revoke = useServerFn(adminRevokeAdmin);

  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);

  const adminsQuery = useQuery({ queryKey: ["admin-team"], queryFn: () => list() });

  const grantMutation = useMutation({
    mutationFn: (value: string) => grant({ data: { email: value } }),
    onSuccess: (result) => {
      setNotice(result);
      if (result.ok) setEmail("");
      queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    },
    onError: (err) =>
      setNotice({ ok: false, message: err instanceof Error ? err.message : "Failed" }),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => revoke({ data: { id } }),
    onSuccess: (result) => {
      setNotice(result);
      queryClient.invalidateQueries({ queryKey: ["admin-team"] });
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    if (email.trim()) grantMutation.mutate(email.trim());
  }

  const admins = adminsQuery.data?.admins ?? [];
  const me = adminsQuery.data?.me;

  return (
    <div className="space-y-8 animate-rise">
      <header>
        <span className="eyebrow text-emerald">Access control</span>
        <h1 className="section-title mt-2 text-3xl">Admin team</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Anyone listed here can write, publish and manage everything on GistPlugWealth.
        </p>
      </header>

      <section className="surface p-6">
        <h2 className="text-lg">Grant admin access</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The person must already have an account — ask them to sign up at /auth first, then enter
          the same email here.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="grant-email" className="sr-only">
            Email address
          </label>
          <input
            id="grant-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="teammate@example.com"
            className="field flex-1"
          />
          <button
            type="submit"
            disabled={grantMutation.isPending}
            className="btn btn-primary"
          >
            {grantMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" aria-hidden="true" />
            )}
            Grant access
          </button>
        </form>
        {notice ? (
          <p
            role="status"
            className={`mt-3 text-sm font-semibold ${notice.ok ? "text-emerald" : "text-destructive"}`}
          >
            {notice.message}
          </p>
        ) : null}
      </section>

      <section className="surface overflow-hidden">
        <h2 className="border-b border-border px-6 py-4 text-lg">
          Administrators ({admins.length})
        </h2>
        {adminsQuery.isLoading ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Loading…</p>
        ) : (
          <ul className="divide-y divide-border">
            {admins.map((admin) => (
              <li
                key={admin.user_id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-4 w-4 text-emerald" aria-hidden="true" />
                    <span className="truncate">{admin.email}</span>
                    {admin.user_id === me ? (
                      <span className="chip chip-brand">You</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Access since {formatDate(admin.granted_at)}
                    {admin.last_sign_in_at
                      ? ` · last signed in ${formatDate(admin.last_sign_in_at)}`
                      : ""}
                  </p>
                </div>
                {admin.user_id === me ? null : (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    disabled={revokeMutation.isPending}
                    onClick={() => {
                      if (confirm(`Remove admin access for ${admin.email}?`))
                        revokeMutation.mutate(admin.user_id);
                    }}
                  >
                    <ShieldOff className="h-4 w-4" aria-hidden="true" /> Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
