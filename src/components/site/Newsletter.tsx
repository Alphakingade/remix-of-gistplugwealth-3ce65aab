import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { Loader2, Mail } from "lucide-react";
import { z } from "zod";
import { subscribeToNewsletter } from "@/lib/content.functions";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address").max(255),
});

export function Newsletter({ compact = false }: { compact?: boolean }) {
  const subscribe = useServerFn(subscribeToNewsletter);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (value: string) => subscribe({ data: { email: value } }),
    onSuccess: (result) => {
      if (result.ok) {
        setSuccess(result.message);
        setEmail("");
      } else {
        setError(result.message);
      }
    },
    onError: () => setError("Something went wrong. Please try again shortly."),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }
    mutation.mutate(parsed.data.email);
  }

  return (
    <section
      className={
        compact
          ? "rounded-2xl border border-border bg-primary-soft p-6"
          : "relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-primary-foreground shadow-lift sm:px-12"
      }
      aria-labelledby="newsletter-heading"
    >
      <div className={compact ? "" : "mx-auto max-w-2xl text-center"}>
        <span className={`eyebrow ${compact ? "text-emerald" : "text-gold"}`}>Newsletter</span>
        <h2
          id="newsletter-heading"
          className={compact ? "mt-2 text-xl" : "mt-3 text-3xl sm:text-4xl"}
        >
          Stay Informed. Stay Ahead.
        </h2>
        <p className={`mt-3 ${compact ? "text-sm text-muted-foreground" : "opacity-90"}`}>
          Get practical money tips, useful tools and new opportunities delivered straight to your
          inbox.
        </p>

        <form
          onSubmit={onSubmit}
          className={`mt-6 flex flex-col gap-3 sm:flex-row ${compact ? "" : "sm:mx-auto sm:max-w-lg"}`}
          noValidate
        >
          <label htmlFor={compact ? "email-compact" : "email-main"} className="sr-only">
            Email address
          </label>
          <div className="relative flex-1">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id={compact ? "email-compact" : "email-main"}
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="field h-12 rounded-full py-0 pl-9 pr-4 text-foreground"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "newsletter-error" : undefined}
            />
          </div>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn btn-lg btn-emerald"
          >
            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Subscribe
          </button>
        </form>

        {error ? (
          <p
            id="newsletter-error"
            role="alert"
            className={`mt-3 text-sm ${compact ? "text-destructive" : "text-gold"}`}
          >
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className={`mt-3 text-sm ${compact ? "text-primary" : "text-gold"}`}>
            {success}
          </p>
        ) : null}

        <p className={`mt-3 text-xs ${compact ? "text-muted-foreground" : "opacity-70"}`}>
          No spam. Unsubscribe any time.
        </p>
      </div>
    </section>
  );
}
