import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { api, ApiError, type HealthCard, type Alert } from "@/lib/api";
import {
  RefreshCw,
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Activity,
  MessageCircle,
  Lightbulb,
  FileText,
  Database,
  Building2,
  Send,
} from "lucide-react";

export const Route = createFileRoute("/_app/msme/$id")({
  component: MsmePage,
});

type Tab = "health" | "profile" | "data" | "insights" | "aa" | "alerts";

function MsmePage() {
  const { id } = Route.useParams();
  const msmeId = parseInt(id);
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("health");
  const [recomputeState, setRecomputeState] = useState<"idle" | "busy" | "done" | "error">("idle");

  const msme = useQuery({
    queryKey: ["msme", msmeId],
    queryFn: () => api.getMsme(msmeId),
    retry: false,
  });
  const card = useQuery<HealthCard>({
    queryKey: ["card", msmeId],
    queryFn: () => api.getCard(msmeId),
    retry: false,
  });

  const recompute = async () => {
    setRecomputeState("busy");
    try {
      await api.computeScore(msmeId);
      await qc.invalidateQueries({ queryKey: ["card", msmeId] });
      setRecomputeState("done");
    } catch {
      setRecomputeState("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/portfolio"
            className="grid h-9 w-9 place-items-center rounded-xl border hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold">
              {msme.data?.business_name || `MSME #${msmeId}`}
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {msme.data?.sector} · {msme.data?.city}, {msme.data?.state}
            </p>
          </div>
        </div>
        <button
          onClick={recompute}
          disabled={recomputeState === "busy"}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <RefreshCw className={`h-4 w-4 ${recomputeState === "busy" ? "animate-spin" : ""}`} />
          {recomputeState === "busy"
            ? "Recomputing..."
            : recomputeState === "done"
              ? "Score Updated"
              : "Recompute Score"}
        </button>
      </div>
      {recomputeState === "error" && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Recompute failed. Confirm the backend is running and this MSME has enough data.
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-2xl border bg-card p-1">
        {[
          ["health", "Health Card", Activity],
          ["profile", "Profile", Building2],
          ["data", "Data Ingestion", Database],
          ["insights", "AI Insights", Sparkles],
          ["aa", "AA Consent", ShieldAlert],
          ["alerts", "Alerts", AlertTriangle],
        ].map(([k, l, I]: any) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex flex-1 min-w-[120px] items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${tab === k ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          >
            <I className="h-4 w-4" /> {l}
          </button>
        ))}
      </div>

      {tab === "health" && (
        <HealthTab
          card={card.data}
          loading={card.isLoading}
          error={card.error}
          onRecompute={recompute}
        />
      )}
      {tab === "profile" && <ProfileTab msmeId={msmeId} />}
      {tab === "data" && <DataTab msmeId={msmeId} onAfter={recompute} />}
      {tab === "insights" && <InsightsTab msmeId={msmeId} />}
      {tab === "aa" && <AaTab msmeId={msmeId} />}
      {tab === "alerts" && <AlertsTab msmeId={msmeId} />}
    </div>
  );
}

/* ================== HEALTH CARD ================== */
const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

function HealthTab({
  card,
  loading,
  error,
  onRecompute,
}: {
  card?: HealthCard;
  loading: boolean;
  error: unknown;
  onRecompute: () => void;
}) {
  if (loading)
    return (
      <div className="rounded-2xl border bg-card p-8 text-center text-sm">Loading health card…</div>
    );
  if (error) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6">
        <p className="text-sm">No health card yet. Compute the first score:</p>
        <button
          onClick={onRecompute}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <RefreshCw className="h-4 w-4" /> Compute score now
        </button>
      </div>
    );
  }
  if (!card) return null;

  const score = parseFloat(card.overall_score);
  const conf = parseFloat(card.confidence_score);
  const dims = card.dimensions.map((d) => ({
    name: d.name,
    score: parseFloat(d.score),
    weight: parseFloat(d.weight) * 100,
  }));
  const trend = card.score_trend.map((t) => ({ month: t.month, score: parseFloat(t.score) }));

  const isIndicative = conf < 50 || card.data_quality?.startsWith("Limited");

  return (
    <div className="space-y-6">
      {/* Overall card */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-3xl border bg-gradient-to-br from-primary to-primary/70 p-6 text-primary-foreground">
          <div className="text-xs uppercase tracking-widest opacity-80">Overall Score</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-6xl font-extrabold">{score.toFixed(0)}</span>
            <span className="text-sm opacity-80">/100</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
              Grade {card.grade}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
              {card.risk_band}
            </span>
          </div>
          <div className="mt-6">
            <div className="text-xs opacity-80">Confidence</div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-accent" style={{ width: `${conf}%` }} />
            </div>
            <div className="mt-1 text-xs opacity-80">
              {conf.toFixed(0)}% · Data quality: {card.data_quality}
            </div>
          </div>
          {isIndicative && (
            <div className="mt-4 rounded-xl border border-white/30 bg-white/10 p-3 text-xs">
              ⚠ <strong>Indicative score.</strong>{" "}
              {card.recommended_next_data_source && (
                <>
                  Add <strong>{card.recommended_next_data_source}</strong> data to improve
                  confidence.
                </>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 rounded-3xl border bg-card p-6">
          <h3 className="font-display text-lg font-bold">Five Dimensions</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={dims}>
                  <PolarGrid stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {dims.map((d, i) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{d.name}</span>
                    <span className="text-muted-foreground">
                      {d.score.toFixed(0)}/100 · w{d.weight.toFixed(0)}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.score}%`, background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border bg-card p-6">
          <h3 className="font-display text-lg font-bold">Score Trend</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6">
          <h3 className="font-display text-lg font-bold">ML Second Opinion</h3>
          <div className="mt-4 rounded-xl bg-secondary/50 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Predicted band
            </div>
            <div className="mt-1 font-display text-2xl font-bold">{card.ml_predicted_band}</div>
            {card.ml_rule_divergence_flag ? (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/15 p-3 text-xs">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                <span>
                  <strong>Manual review recommended.</strong> ML and rules diverge.
                </span>
              </div>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-success/40 bg-success/10 p-3 text-xs">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>Aligned with rule-based score.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <CheckCircle2 className="h-5 w-5 text-success" /> Top Strengths
          </h3>
          <ul className="mt-3 space-y-2">
            {card.top_strengths?.map((s, i) => (
              <li key={i} className="rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
                {s}
              </li>
            )) || <li className="text-sm text-muted-foreground">—</li>}
          </ul>
        </div>
        <div className="rounded-3xl border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <AlertTriangle className="h-5 w-5 text-warning" /> Top Risks
          </h3>
          <ul className="mt-3 space-y-2">
            {card.top_risks?.map((s, i) => (
              <li key={i} className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">
                {s}
              </li>
            )) || <li className="text-sm text-muted-foreground">—</li>}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <h3 className="font-display text-lg font-bold">Dimension Weighting</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dims}
                dataKey="weight"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(d: any) => `${d.name}: ${d.weight.toFixed(0)}%`}
              >
                {dims.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ================== PROFILE ================== */
function ProfileTab({ msmeId }: { msmeId: number }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["msme", msmeId],
    queryFn: () => api.getMsme(msmeId),
  });
  const [employees, setEmployees] = useState<string>("");
  const [udyam, setUdyam] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    try {
      const patch: any = {};
      if (employees) patch.employee_count = parseInt(employees);
      if (udyam) patch.udyam_number = udyam;
      await api.updateMsme(msmeId, patch);
      qc.invalidateQueries({ queryKey: ["msme", msmeId] });
      setMsg("Saved.");
      setEmployees("");
      setUdyam("");
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  if (isLoading || !data)
    return <div className="rounded-2xl border bg-card p-6 text-sm">Loading…</div>;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border bg-card p-6">
        <h3 className="font-display text-lg font-bold">Profile</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Business" value={data.business_name} />
          <Row label="Owner" value={data.owner_name} />
          <Row
            label="Udyam #"
            value={data.udyam_number || <span className="text-warning">Not registered</span>}
          />
          <Row
            label="Sector"
            value={`${data.sector}${data.sub_sector ? " · " + data.sub_sector : ""}`}
          />
          <Row label="Location" value={`${data.city || "—"}, ${data.state || "—"}`} />
          <Row label="Registered" value={data.registration_date || "—"} />
          <Row label="Employees" value={data.employee_count ?? "—"} />
          <Row label="Formalized" value={data.udyam_number ? "Yes" : "No"} />
        </dl>
      </div>
      <div className="rounded-3xl border bg-card p-6">
        <h3 className="font-display text-lg font-bold">Update profile</h3>
        <div className="mt-4 space-y-3">
          <Field label="Employee count">
            <input
              value={employees}
              onChange={(e) => setEmployees(e.target.value)}
              type="number"
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <Field label="Udyam number">
            <input
              value={udyam}
              onChange={(e) => setUdyam(e.target.value)}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
          <button
            onClick={save}
            className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
          {msg && <div className="text-xs text-muted-foreground">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex justify-between gap-3 border-b py-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* ================== DATA INGESTION ================== */
function DataTab({ msmeId, onAfter }: { msmeId: number; onAfter: () => void }) {
  const [tab, setTab] = useState<"gst" | "upi" | "epfo" | "bank" | "note">("gst");
  const [msg, setMsg] = useState<string | null>(null);
  const wrap = async (fn: () => Promise<any>) => {
    setMsg(null);
    try {
      await fn();
      setMsg("✓ Saved. Recomputing score…");
      onAfter();
    } catch (e: any) {
      setMsg("⚠ " + (e.message || "Failed"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-2xl border bg-card p-1">
        {[
          ["gst", "GST"],
          ["upi", "UPI"],
          ["epfo", "EPFO"],
          ["bank", "Bank"],
          ["note", "Note"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k as any)}
            className={`flex-1 min-w-[80px] rounded-xl px-3 py-2 text-sm font-medium ${tab === k ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="rounded-3xl border bg-card p-6">
        {tab === "gst" && <GstForm onSubmit={(p: any) => wrap(() => api.addGst(msmeId, p))} />}
        {tab === "upi" && <UpiForm onSubmit={(p: any) => wrap(() => api.addUpi(msmeId, p))} />}
        {tab === "epfo" && <EpfoForm onSubmit={(p: any) => wrap(() => api.addEpfo(msmeId, p))} />}
        {tab === "bank" && <BankForm onSubmit={(p: any) => wrap(() => api.addBank(msmeId, p))} />}
        {tab === "note" && (
          <NoteForm onSubmit={(t: string) => wrap(() => api.addNote(msmeId, t))} />
        )}
        {msg && <div className="mt-4 rounded-xl bg-secondary/50 p-3 text-sm">{msg}</div>}
      </div>
    </div>
  );
}

function GstForm({ onSubmit }: any) {
  const [f, setF] = useState({
    period: "2026-05",
    declared_turnover: "125000.50",
    tax_paid: "22500.00",
    filing_status: "on_time",
    filing_delay_days: 0,
  });
  return (
    <Form
      title="GST filing"
      fields={[
        ["period", "Period (YYYY-MM)"],
        ["declared_turnover", "Turnover"],
        ["tax_paid", "Tax paid"],
      ]}
      values={f}
      setValues={setF}
      extra={
        <>
          <Field label="Filing status">
            <select
              value={f.filing_status}
              onChange={(e) => setF({ ...f, filing_status: e.target.value })}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            >
              <option value="on_time">on_time</option>
              <option value="late">late</option>
              <option value="missed">missed</option>
            </select>
          </Field>
          <Field label="Delay (days)">
            <input
              type="number"
              value={f.filing_delay_days}
              onChange={(e) => setF({ ...f, filing_delay_days: parseInt(e.target.value || "0") })}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
        </>
      }
      onSubmit={() => onSubmit(f)}
    />
  );
}
function UpiForm({ onSubmit }: any) {
  const [f, setF] = useState({
    txn_date: "2026-05-15",
    amount: "4500.00",
    direction: "credit",
    counterparty_type: "customer",
  });
  return (
    <Form
      title="UPI transaction"
      fields={[
        ["txn_date", "Date"],
        ["amount", "Amount"],
      ]}
      values={f}
      setValues={setF}
      extra={
        <>
          <Field label="Direction">
            <select
              value={f.direction}
              onChange={(e) => setF({ ...f, direction: e.target.value })}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            >
              <option>credit</option>
              <option>debit</option>
            </select>
          </Field>
          <Field label="Counterparty">
            <input
              value={f.counterparty_type}
              onChange={(e) => setF({ ...f, counterparty_type: e.target.value })}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
        </>
      }
      onSubmit={() => onSubmit(f)}
    />
  );
}
function EpfoForm({ onSubmit }: any) {
  const [f, setF] = useState({
    period: "2026-05",
    employee_count: 12,
    contribution_amount: "18000.00",
    compliance_status: "on_time",
  });
  return (
    <Form
      title="EPFO"
      fields={[
        ["period", "Period"],
        ["employee_count", "Employees"],
        ["contribution_amount", "Contribution"],
      ]}
      values={f}
      setValues={setF}
      extra={
        <Field label="Compliance">
          <select
            value={f.compliance_status}
            onChange={(e) => setF({ ...f, compliance_status: e.target.value })}
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
          >
            <option>on_time</option>
            <option>late</option>
            <option>missed</option>
          </select>
        </Field>
      }
      onSubmit={() => onSubmit(f)}
    />
  );
}
function BankForm({ onSubmit }: any) {
  const [f, setF] = useState({
    txn_date: "2026-05-15",
    balance_after_txn: "250000.00",
    amount: "12000.00",
    txn_type: "credit",
  });
  return (
    <Form
      title="Bank statement"
      fields={[
        ["txn_date", "Date"],
        ["amount", "Amount"],
        ["balance_after_txn", "Balance after"],
      ]}
      values={f}
      setValues={setF}
      extra={
        <Field label="Type">
          <select
            value={f.txn_type}
            onChange={(e) => setF({ ...f, txn_type: e.target.value })}
            className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
          >
            <option>credit</option>
            <option>debit</option>
          </select>
        </Field>
      }
      onSubmit={() => onSubmit(f)}
    />
  );
}
function NoteForm({ onSubmit }: any) {
  const [t, setT] = useState(
    "GST filing is regular, UPI sales improved, cash flow stable, employee count unchanged.",
  );
  return (
    <div>
      <h4 className="font-display text-lg font-bold">Unstructured note</h4>
      <textarea
        value={t}
        onChange={(e) => setT(e.target.value)}
        rows={4}
        className="mt-3 w-full rounded-xl border bg-background p-3 text-sm"
      />
      <button
        onClick={() => onSubmit(t)}
        className="mt-3 h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Extract signals
      </button>
    </div>
  );
}
function Form({ title, fields, values, setValues, extra, onSubmit }: any) {
  return (
    <div>
      <h4 className="font-display text-lg font-bold">{title}</h4>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {fields.map(([k, l]: any) => (
          <Field key={k} label={l}>
            <input
              value={values[k]}
              onChange={(e) => setValues({ ...values, [k]: e.target.value })}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            />
          </Field>
        ))}
        {extra}
      </div>
      <button
        onClick={onSubmit}
        className="mt-4 h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Submit
      </button>
    </div>
  );
}

/* ================== AI INSIGHTS ================== */
function InsightsTab({ msmeId }: { msmeId: number }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [question, setQuestion] = useState("Why is this MSME risky?");
  const [answer, setAnswer] = useState<string | null>(null);
  const [whatIf, setWhatIf] = useState("GST filings are on time for the next six months");
  const [whatIfResp, setWhatIfResp] = useState<string | null>(null);
  const [anoms, setAnoms] = useState<any>(null);
  const [busy, setBusy] = useState("");

  const wrap = async (k: string, fn: () => Promise<any>) => {
    setBusy(k);
    try {
      return await fn();
    } finally {
      setBusy("");
    }
  };

  const suggestions = [
    "GST filings are on time for the next six months",
    "UPI sales increase by 20%",
    "Bank account avoids overdraft for three months",
    "Business obtains Udyam registration",
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <FileText className="h-5 w-5 text-primary" /> Plain-language summary
        </h3>
        <button
          onClick={() =>
            wrap("sum", async () => {
              const r = await api.summary(msmeId);
              setSummary(r.content_text);
            })
          }
          disabled={busy === "sum"}
          className="mt-3 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy === "sum" ? "Generating…" : "Generate summary"}
        </button>
        {summary && <InsightCard tone="primary" title="Assessment Summary" text={summary} />}
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <MessageCircle className="h-5 w-5 text-primary" /> Ask anything
        </h3>
        <div className="mt-3 flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="h-11 flex-1 rounded-xl border bg-background px-3 text-sm"
          />
          <button
            onClick={() =>
              wrap("ask", async () => {
                const r = await api.ask(msmeId, question);
                setAnswer(r.content_text);
              })
            }
            disabled={busy === "ask"}
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {answer && <InsightCard tone="primary" title="AI Answer" text={answer} />}
      </div>

      <div className="rounded-3xl border bg-card p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <Lightbulb className="h-5 w-5 text-accent" /> What-if scenarios
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setWhatIf(s)}
              className="rounded-full border bg-background px-3 py-1 text-xs hover:bg-secondary"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            value={whatIf}
            onChange={(e) => setWhatIf(e.target.value)}
            className="h-11 flex-1 rounded-xl border bg-background px-3 text-sm"
          />
          <button
            onClick={() =>
              wrap("wi", async () => {
                const r = await api.whatIf(msmeId, whatIf);
                setWhatIfResp(r.content_text);
              })
            }
            disabled={busy === "wi"}
            className="h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            Simulate
          </button>
        </div>
        {whatIfResp && <InsightCard tone="accent" title="Scenario Impact" text={whatIfResp} />}
      </div>

      <div className="rounded-3xl border bg-card p-6 lg:col-span-2">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <AlertTriangle className="h-5 w-5 text-warning" /> Anomalies
        </h3>
        <button
          onClick={() => wrap("an", async () => setAnoms(await api.anomalies(msmeId)))}
          disabled={busy === "an"}
          className="mt-3 h-10 rounded-xl border bg-background px-4 text-sm font-semibold hover:bg-secondary disabled:opacity-50"
        >
          {busy === "an" ? "Loading…" : "Load anomalies"}
        </button>
        {anoms && (
          <div className="mt-4 space-y-3">
            {Array.isArray(anoms) && anoms.length ? (
              anoms.map((item: any, index: number) => (
                <InsightCard
                  key={`${item.insight_type || "anomaly"}-${index}`}
                  tone="warning"
                  title={`Anomaly ${index + 1}`}
                  text={item.content_text || JSON.stringify(item)}
                />
              ))
            ) : (
              <div className="rounded-xl border bg-secondary/50 p-4 text-sm text-muted-foreground">
                No anomalies were returned for this MSME.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({
  title,
  text,
  tone,
}: {
  title: string;
  text: string;
  tone: "primary" | "accent" | "warning";
}) {
  const parts = formatInsight(text);
  const toneClass =
    tone === "warning"
      ? "border-warning/30 bg-warning/10"
      : tone === "accent"
        ? "border-accent/30 bg-accent/10"
        : "border-primary/20 bg-primary/5";
  return (
    <div className={`mt-4 rounded-2xl border p-4 ${toneClass}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-3 space-y-3 text-sm leading-relaxed">
        {parts.map((part, index) =>
          part.kind === "bullet" ? (
            <div key={index} className="flex gap-2 rounded-xl bg-background/70 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span>{part.text}</span>
            </div>
          ) : (
            <p key={index} className="text-foreground/90">
              {part.text}
            </p>
          ),
        )}
      </div>
    </div>
  );
}

function formatInsight(text: string) {
  return text
    .replace(/\*\*/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .flatMap((line) => {
      const fragments = line
        .split(/(?=\s[-*]\s)/)
        .map((part) => part.trim())
        .filter(Boolean);
      return fragments.length ? fragments : [line];
    })
    .map((line) => {
      const bullet = /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line);
      return {
        kind: bullet ? "bullet" : "paragraph",
        text: line.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, ""),
      };
    });
}

/* ================== AA CONSENT ================== */
function AaTab({ msmeId }: { msmeId: number }) {
  const [consents, setConsents] = useState<Array<{ id: string; status: string }>>([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    setBusy("c");
    setErr(null);
    try {
      const r: any = await api.aaRequest({
        msme_id: msmeId,
        fip_name: "Simulated AA Bank",
        purpose: "Credit underwriting demo",
        expires_at: "2026-12-31T00:00:00",
      });
      setConsents([{ id: r.consent_id || r.id, status: r.status || "requested" }, ...consents]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  };
  const act = async (id: string, kind: "approve" | "revoke" | "status") => {
    setBusy(id + kind);
    setErr(null);
    try {
      const r: any =
        kind === "approve"
          ? await api.aaApprove(id)
          : kind === "revoke"
            ? await api.aaRevoke(id)
            : await api.aaStatus(id);
      setConsents(consents.map((c) => (c.id === id ? { ...c, status: r.status || c.status } : c)));
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy("");
    }
  };

  const badge = (s: string) => {
    const map: Record<string, string> = {
      requested: "border-warning/40 bg-warning/10 text-warning",
      active: "border-success/40 bg-success/10 text-success",
      revoked: "border-destructive/40 bg-destructive/10 text-destructive",
      expired: "border-muted-foreground/30 bg-muted text-muted-foreground",
    };
    return map[s] || "border bg-secondary";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">Account Aggregator consent</h3>
            <p className="text-xs text-muted-foreground">
              Simulated FIP: Simulated AA Bank · Purpose: Credit underwriting demo
            </p>
          </div>
          <button
            onClick={create}
            disabled={busy === "c"}
            className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {busy === "c" ? "Requesting…" : "Request consent"}
          </button>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-accent/10 px-3 py-1 text-xs text-accent-foreground">
          <ShieldAlert className="h-3 w-3" /> simulation: true
        </div>
        {err && (
          <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {err}
          </div>
        )}
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <h3 className="font-display text-lg font-bold">Consents</h3>
        {!consents.length && <p className="mt-3 text-sm text-muted-foreground">No consents yet.</p>}
        <div className="mt-3 space-y-2">
          {consents.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3"
            >
              <div className="min-w-0">
                <div className="truncate font-mono text-xs">{c.id}</div>
                <span
                  className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${badge(c.status)}`}
                >
                  {c.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => act(c.id, "approve")}
                  disabled={!!busy}
                  className="h-9 rounded-lg border border-success/40 bg-success/10 px-3 text-xs font-semibold text-success hover:bg-success/20"
                >
                  Approve
                </button>
                <button
                  onClick={() => act(c.id, "revoke")}
                  disabled={!!busy}
                  className="h-9 rounded-lg border border-destructive/40 bg-destructive/10 px-3 text-xs font-semibold text-destructive hover:bg-destructive/20"
                >
                  Revoke
                </button>
                <button
                  onClick={() => act(c.id, "status")}
                  disabled={!!busy}
                  className="h-9 rounded-lg border bg-background px-3 text-xs font-semibold hover:bg-secondary"
                >
                  Refresh
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================== ALERTS (per MSME) ================== */
function AlertsTab({ msmeId }: { msmeId: number }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Alert | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["alerts", msmeId],
    queryFn: () => api.msmeAlerts(msmeId),
    retry: false,
  });
  const ack = async (id: number) => {
    await api.ackAlert(id);
    qc.invalidateQueries({ queryKey: ["alerts", msmeId] });
  };
  if (isLoading) return <div className="rounded-2xl border bg-card p-6 text-sm">Loading…</div>;
  if (error)
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
        No alerts.
      </div>
    );
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <AlertList alerts={data || []} onAck={ack} selectedId={selected?.id} onSelect={setSelected} />
      <AlertDetails alert={selected} />
    </div>
  );
}

export function AlertList({
  alerts,
  onAck,
  selectedId,
  onSelect,
}: {
  alerts: Alert[];
  onAck: (id: number) => void;
  selectedId?: number;
  onSelect?: (alert: Alert) => void;
}) {
  if (!alerts.length)
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        No alerts yet.
      </div>
    );
  const sev = (s: string) =>
    s === "high"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : s === "medium"
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border-muted-foreground/30 bg-muted text-muted-foreground";
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          role={onSelect ? "button" : undefined}
          tabIndex={onSelect ? 0 : undefined}
          onClick={() => onSelect?.(a)}
          onKeyDown={(event) => {
            if (onSelect && (event.key === "Enter" || event.key === " ")) onSelect(a);
          }}
          className={`flex flex-wrap items-start justify-between gap-3 rounded-2xl border bg-card p-4 transition ${onSelect ? "cursor-pointer hover:border-primary/50 hover:bg-secondary/30" : ""} ${selectedId === a.id ? "border-primary/60 ring-2 ring-primary/15" : ""} ${a.acknowledged ? "opacity-60" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${sev(a.severity)}`}
              >
                {a.severity}
              </span>
              <span className="rounded-full border bg-background px-2 py-0.5 text-[10px] font-semibold uppercase">
                {a.alert_type}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(a.triggered_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-2 text-sm">{a.message}</p>
          </div>
          {!a.acknowledged && (
            <button
              onClick={(event) => {
                event.stopPropagation();
                onAck(a.id);
              }}
              className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Acknowledge
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function AlertDetails({ alert }: { alert: Alert | null }) {
  if (!alert) {
    return (
      <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
        Click an alert to view its details.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h3 className="font-display text-lg font-bold">Alert Details</h3>
      <div className="mt-4 space-y-3 text-sm">
        <DetailRow label="MSME ID" value={`#${alert.msme_id}`} />
        <DetailRow label="Alert type" value={alert.alert_type} />
        <DetailRow label="Severity" value={alert.severity} />
        <DetailRow label="Triggered time" value={new Date(alert.triggered_at).toLocaleString()} />
        <DetailRow label="Message" value={alert.message} />
        <DetailRow
          label="Acknowledged state"
          value={alert.acknowledged ? "Acknowledged" : "Open"}
        />
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words font-medium">{value}</div>
    </div>
  );
}

// re-exports for charts not used outside but keeps linter happy
export { BarChart, Bar, Legend };
