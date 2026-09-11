import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@/lib/use-fn";
import { Loader2 } from "lucide-react";
import { adminSaveSettings } from "@/lib/admin.functions";
import { siteQuery } from "@/lib/queries";
import { SOCIAL_KEYS } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const SETTING_FIELDS = [
  { key: "whatsapp_url", label: "WhatsApp community link", placeholder: "https://chat.whatsapp.com/…" },
  { key: "contact_email", label: "Public contact email", placeholder: "hello@gistplugwealth.com" },
  ...SOCIAL_KEYS.map((item) => ({
    key: item.key,
    label: item.label,
    placeholder: "https://…",
  })),
];

function SettingsPage() {
  const saveSettings = useServerFn(adminSaveSettings);
  const queryClient = useQueryClient();
  const site = useQuery(siteQuery());
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (site.data) setValues(site.data.settings);
  }, [site.data]);

  const mutation = useMutation({
    mutationFn: (settings: Record<string, string>) => saveSettings({ data: { settings } }),
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ["site-data"] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate(values);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl">Site settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These links appear across the site. Leave a field empty to hide it.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-xl border border-border bg-background p-6"
      >
        {SETTING_FIELDS.map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className="text-sm font-semibold">
              {field.label}
            </label>
            <input
              id={field.key}
              type="url"
              placeholder={field.placeholder}
              value={values[field.key] ?? ""}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, [field.key]: event.target.value }))
              }
              className="field mt-1.5 h-11 text-sm"
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={mutation.isPending}
          className="btn btn-primary"
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save settings
        </button>
        {saved ? (
          <p role="status" className="text-sm text-primary">
            Settings saved.
          </p>
        ) : null}
      </form>
    </div>
  );
}
