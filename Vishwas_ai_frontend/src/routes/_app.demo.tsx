import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { api, type MsmeCreate } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Building2, CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/demo")({
  head: () => ({ meta: [{ title: "Onboard MSME - Vishwas AI" }] }),
  component: AdminOnboarding,
});

const initialForm: MsmeCreate = {
  business_name: "Vishwas Demo Textiles",
  owner_name: "Aarav Sharma",
  udyam_number: "",
  sector: "Manufacturing",
  sub_sector: "Textiles",
  city: "Pune",
  state: "Maharashtra",
  registration_date: "2025-04-01",
  employee_count: 8,
  requested_credit_invisible_flag: true,
};

function AdminOnboarding() {
  const { role } = useAuth();
  const [form, setForm] = useState<MsmeCreate>(initialForm);
  const [created, setCreated] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (role !== "admin") {
    return (
      <div className="rounded-3xl border bg-card p-8">
        <h1 className="font-display text-2xl font-bold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          MSME onboarding setup is restricted to administrators.
        </p>
      </div>
    );
  }

  const update = (key: keyof MsmeCreate, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr(null);
    setCreated(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        udyam_number: form.udyam_number?.trim() || null,
        sub_sector: form.sub_sector?.trim() || null,
        registration_date: form.registration_date || null,
      };
      const msme = await api.onboardMsme(payload);
      let scoreResult: any = null;
      try {
        scoreResult = await api.computeScore(msme.id);
      } catch (scoreError: any) {
        scoreResult = { warning: scoreError.message || "MSME created, score pending data." };
      }
      setCreated({ msme, score: scoreResult });
    } catch (e: any) {
      setErr(e.message || "Could not onboard MSME");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Onboard New MSME</h1>
        <p className="text-sm text-muted-foreground">
          Add a business profile, then compute its first indicative Financial Health Score.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-3xl border bg-card p-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          <h3 className="font-display text-lg font-bold">Business information</h3>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field label="Business name">
            <input
              value={form.business_name}
              onChange={(e) => update("business_name", e.target.value)}
              required
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Owner name">
            <input
              value={form.owner_name}
              onChange={(e) => update("owner_name", e.target.value)}
              required
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Udyam number">
            <input
              value={form.udyam_number || ""}
              onChange={(e) => update("udyam_number", e.target.value)}
              placeholder="Leave blank for NTC/NTB"
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Sector">
            <input
              value={form.sector}
              onChange={(e) => update("sector", e.target.value)}
              required
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Sub-sector">
            <input
              value={form.sub_sector || ""}
              onChange={(e) => update("sub_sector", e.target.value)}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="City">
            <input
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="State">
            <input
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              required
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Registration date">
            <input
              type="date"
              value={form.registration_date || ""}
              onChange={(e) => update("registration_date", e.target.value)}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Employees">
            <input
              type="number"
              min={0}
              value={form.employee_count}
              onChange={(e) => update("employee_count", parseInt(e.target.value || "0"))}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <label className="flex h-11 items-center gap-3 rounded-xl border bg-background px-3 text-sm">
            <input
              type="checkbox"
              checked={form.requested_credit_invisible_flag}
              onChange={(e) => update("requested_credit_invisible_flag", e.target.checked)}
            />
            Mark as credit-invisible / NTC-NTB
          </label>
        </div>

        <button
          disabled={loading}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          {loading ? "Onboarding..." : "Create MSME and Compute Score"}
        </button>
      </form>

      {err && (
        <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
        </div>
      )}

      {created && (
        <div className="rounded-3xl border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <h3 className="font-display text-lg font-bold">MSME onboarded</h3>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Result label="MSME ID" value={`#${created.msme.id}`} />
            <Result label="Business" value={created.msme.business_name} />
            <Result
              label="Status"
              value={created.score?.warning ? "Score pending data" : "Initial score computed"}
            />
          </div>
          <Link
            to="/msme/$id"
            params={{ id: String(created.msme.id) }}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Open Health Card <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3 text-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
