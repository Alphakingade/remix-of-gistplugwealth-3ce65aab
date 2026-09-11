import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { WhatsAppCta } from "@/components/site/WhatsAppCta";
import { sendContactMessage } from "@/lib/content.functions";
import { siteQuery } from "@/lib/queries";

const TITLE = "Contact GistPlugWealth — Partnerships & Feedback";
const DESCRIPTION =
  "Send GistPlugWealth a message about advertising, partnerships, guest posts, corrections or reader questions.";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address").max(255),
  subject: z.string().trim().min(2, "Please add a subject").max(150),
  message: z.string().trim().min(10, "Please write at least 10 characters").max(3000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const FIELDS = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email address", type: "email", autoComplete: "email" },
  { name: "subject", label: "Subject", type: "text", autoComplete: "off" },
] as const;

function ContactPage() {
  const send = useServerFn(sendContactMessage);
  const { data: site } = useQuery(siteQuery());
  const [values, setValues] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: z.infer<typeof schema>) => send({ data: payload }),
    onSuccess: (result) => {
      setStatus(result);
      if (result.ok) setValues({ name: "", email: "", subject: "", message: "" });
    },
    onError: () => setStatus({ ok: false, message: "Something went wrong. Please try again." }),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  return (
    <SiteLayout>
      <div className="border-b border-border bg-primary-soft">
        <div className="container-page py-12">
          <span className="eyebrow text-emerald">Contact</span>
          <h1 className="mt-2 text-3xl sm:text-4xl">Let&apos;s talk</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">{DESCRIPTION}</p>
        </div>
      </div>

      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr,1fr]">
          <form
            onSubmit={onSubmit}
            noValidate
            className="surface p-6 sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {FIELDS.map((field) => (
                <div key={field.name} className={field.name === "subject" ? "sm:col-span-2" : ""}>
                  <label htmlFor={field.name} className="text-sm font-semibold">
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    value={values[field.name]}
                    onChange={(event) =>
                      setValues((prev) => ({ ...prev, [field.name]: event.target.value }))
                    }
                    aria-invalid={Boolean(errors[field.name])}
                    className="field mt-1.5"
                  />
                  {errors[field.name] ? (
                    <p className="mt-1 text-sm text-destructive">{errors[field.name]}</p>
                  ) : null}
                </div>
              ))}

              <div className="sm:col-span-2">
                <label htmlFor="message" className="text-sm font-semibold">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={7}
                  value={values.message}
                  onChange={(event) =>
                    setValues((prev) => ({ ...prev, message: event.target.value }))
                  }
                  aria-invalid={Boolean(errors["message"])}
                  className="field mt-1.5"
                />
                {errors["message"] ? (
                  <p className="mt-1 text-sm text-destructive">{errors["message"]}</p>
                ) : null}
              </div>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-lg btn-primary mt-6"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Send message
            </button>

            {status ? (
              <p
                role="status"
                className={`mt-4 text-sm ${status.ok ? "text-primary" : "text-destructive"}`}
              >
                {status.message}
              </p>
            ) : null}
          </form>

          <aside className="space-y-6">
            <div className="surface p-6">
              <h2 className="font-heading text-lg font-semibold">What to reach out about</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Advertising and sponsored placements</li>
                <li>Brand partnerships and collaborations</li>
                <li>Guest posts and contributor pitches</li>
                <li>Corrections and feedback on a guide</li>
              </ul>
            </div>
            <WhatsAppCta url={site?.settings["whatsapp_url"]} />
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
