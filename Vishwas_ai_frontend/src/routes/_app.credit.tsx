import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { CreditCard, TrendingUp, Target } from "lucide-react";

export const Route = createFileRoute("/_app/credit")({
  head: () => ({ meta: [{ title: "Credit Decision · Vishwas AI" }] }),
  component: Credit,
});

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

function Credit() {
  const { role } = useAuth();

  const summary = useQuery({
    queryKey: ["portfolio-sum"],
    queryFn: () => api.portfolioSummary(),
    retry: false,
    enabled: role !== "msme_owner",
  });
  const [msmeId, setMsmeId] = useState("1");
  const [amount, setAmount] = useState("1500000");
  const [loanType, setLoanType] = useState("msme_working_capital");
  const [result, setResult] = useState<any>(null);
  const [bench, setBench] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  if (role === "msme_owner") {
    return (
      <Restricted
        title="Credit decisioning is for bank users"
        message="MSME owners can view their own Health Card, insights, consent, and alerts from the dashboard."
      />
    );
  }

  const check = async () => {
    setErr(null);
    try {
      const r = await api.eligibility({
        msme_id: parseInt(msmeId),
        loan_type: loanType,
        requested_amount: amount,
      });
      setResult(r);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  const loadBench = async () => {
    setErr(null);
    try {
      setBench(await api.benchmark(parseInt(msmeId)));
    } catch (e: any) {
      setErr(e.message);
    }
  };

  const dist = summary.data
    ? Object.entries(summary.data.score_distribution).map(([k, v]) => ({ band: k, count: v }))
    : [];
  const risk = summary.data
    ? Object.entries(summary.data.risk_band_counts).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Credit Decision Support</h1>
        <p className="text-sm text-muted-foreground">
          Eligibility, portfolio insights, and benchmarks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat
          label="NTC/NTB scoreable"
          value={summary.data?.newly_scoreable_ntc_ntb_count ?? "—"}
        />
        {summary.data &&
          Object.entries(summary.data.risk_band_counts)
            .slice(0, 3)
            .map(([k, v]) => <Stat key={k} label={`${k} risk`} value={v} />)}
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <CreditCard className="h-5 w-5 text-primary" /> Eligibility check
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <input
            value={msmeId}
            onChange={(e) => setMsmeId(e.target.value)}
            placeholder="MSME ID"
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          />
          <select
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          >
            <option value="msme_working_capital">Working Capital</option>
            <option value="personal">Personal</option>
            <option value="home">Home</option>
            <option value="mortgage">Mortgage</option>
            <option value="auto">Auto</option>
          </select>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (INR)"
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          />
          <button
            onClick={check}
            className="h-11 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Check
          </button>
        </div>
        {err && (
          <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {err}
          </div>
        )}
        {result && (
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <Tile
              label="Result"
              value={result.eligibility_result}
              tone={result.eligibility_result === "eligible" ? "success" : "warning"}
            />
            <Tile label="Interest band" value={result.recommended_interest_band} />
            <Tile
              label="Collateral"
              value={result.collateral_required ? "Required" : "Not required"}
            />
            <Tile label="Scheme" value={result.recommended_scheme} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <TrendingUp className="h-5 w-5 text-primary" /> Score distribution
          </h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={dist}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
                <XAxis dataKey="band" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border bg-card p-6">
          <h3 className="font-display text-lg font-bold">Risk bands</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={risk} dataKey="value" nameKey="name" outerRadius={90} label>
                  {risk.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <Target className="h-5 w-5 text-primary" /> Benchmark vs sector
        </h3>
        <div className="mt-3 flex gap-2">
          <input
            value={msmeId}
            onChange={(e) => setMsmeId(e.target.value)}
            placeholder="MSME ID"
            className="h-11 w-32 rounded-xl border bg-background px-3 text-sm"
          />
          <button
            onClick={loadBench}
            className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Compare
          </button>
        </div>
        {bench && (
          <div className="mt-4">
            <div className="text-xs text-muted-foreground">
              Sector: <strong className="text-foreground">{bench.sector}</strong>
            </div>
            <div className="mt-3 space-y-2">
              {Object.keys(bench.msme_dimensions || {}).map((k) => {
                const mine = parseFloat(bench.msme_dimensions[k]);
                const avg = parseFloat(bench.sector_average_dimensions?.[k] || "0");
                return (
                  <div key={k} className="rounded-xl border bg-background p-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{k}</span>
                      <span className={mine >= avg ? "text-success" : "text-warning"}>
                        {mine.toFixed(1)} vs {avg.toFixed(1)}
                      </span>
                    </div>
                    <div className="relative mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="absolute h-2 rounded-full bg-muted-foreground/40"
                        style={{ width: `${avg}%` }}
                      />
                      <div
                        className="absolute h-2 rounded-full bg-primary"
                        style={{ width: `${mine}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {summary.data?.sector_average_scores && (
        <div className="rounded-3xl border bg-card p-6">
          <h3 className="font-display text-lg font-bold">Sector averages</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {Object.entries(summary.data.sector_average_scores).map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl border bg-background p-3 text-sm"
              >
                <span>{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Restricted({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-3xl border bg-card p-8">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function Stat({ label, value }: any) {
  return (
    <div className="rounded-3xl border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
function Tile({ label, value, tone }: any) {
  const t =
    tone === "success"
      ? "border-success/40 bg-success/10 text-success"
      : tone === "warning"
        ? "border-warning/40 bg-warning/10 text-warning"
        : "border bg-background";
  return (
    <div className={`rounded-xl border p-4 ${t}`}>
      <div className="text-xs uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}
