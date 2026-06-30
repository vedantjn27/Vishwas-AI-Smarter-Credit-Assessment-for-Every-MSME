import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Activity,
  Users,
  Bell,
  TrendingUp,
  Database,
  ArrowRight,
  Sparkles,
  ClipboardList,
} from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - Vishwas AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { role, linkedMsmeId, username } = useAuth();
  const [health, setHealth] = useState<"ok" | "down" | "loading">("loading");

  useEffect(() => {
    api
      .health()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("down"));
  }, []);

  const isOwner = role === "msme_owner";
  const msmes = useQuery({
    queryKey: ["msmes-summary"],
    queryFn: () => api.listMsmes({ limit: 5 }),
    retry: false,
    enabled: !isOwner,
  });
  const alerts = useQuery({
    queryKey: ["alerts-summary"],
    queryFn: () => api.alerts(),
    retry: false,
    enabled: !isOwner,
  });
  const portfolio = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => api.portfolioSummary(),
    retry: false,
    enabled: !isOwner,
  });
  const ownerMsme = useQuery({
    queryKey: ["owner-msme", linkedMsmeId],
    queryFn: () => api.getMsme(linkedMsmeId as number),
    retry: false,
    enabled: isOwner && !!linkedMsmeId,
  });
  const ownerCard = useQuery({
    queryKey: ["owner-card", linkedMsmeId],
    queryFn: () => api.getCard(linkedMsmeId as number),
    retry: false,
    enabled: isOwner && !!linkedMsmeId,
  });
  const ownerAlerts = useQuery({
    queryKey: ["owner-alerts", linkedMsmeId],
    queryFn: () => api.msmeAlerts(linkedMsmeId as number),
    retry: false,
    enabled: isOwner && !!linkedMsmeId,
  });
  const [autoSeeded, setAutoSeeded] = useState(false);

  useEffect(() => {
    if (!isOwner && role && msmes.data && msmes.data.total === 0 && !autoSeeded) {
      setAutoSeeded(true);
      api.seed(18).then(() => {
        msmes.refetch();
        alerts.refetch();
        portfolio.refetch();
      });
    }
  }, [isOwner, role, msmes.data, autoSeeded]);

  if (isOwner) {
    return (
      <div className="dashboard-media-shell space-y-6">
        <div className="dashboard-media-backdrop" aria-hidden="true" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My Business Health</h1>
            <p className="text-sm text-muted-foreground">
              Welcome @{username}. This workspace is limited to your linked MSME.
            </p>
          </div>
          <ApiBadge health={health} />
        </div>

        {!linkedMsmeId && (
          <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
            Your account is not linked to an MSME yet. Ask an admin to link your business profile.
          </div>
        )}

        {linkedMsmeId && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label="Linked MSME"
                value={`#${linkedMsmeId}`}
                hint={ownerMsme.data?.business_name || "Your business"}
                tone="primary"
              />
              <StatCard
                icon={Activity}
                label="Health Score"
                value={ownerCard.data?.overall_score ?? "Compute"}
                hint={ownerCard.data?.grade ? `Grade ${ownerCard.data.grade}` : "Open Health Card"}
                tone="success"
              />
              <StatCard
                icon={TrendingUp}
                label="Risk Band"
                value={ownerCard.data?.risk_band ?? "-"}
                hint="Latest score"
                tone="accent"
              />
              <StatCard
                icon={Bell}
                label="Open Alerts"
                value={ownerAlerts.data?.filter((a) => !a.acknowledged).length ?? "-"}
                hint="Needs attention"
                tone="destructive"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-3xl border bg-card p-6">
                <h3 className="font-display text-lg font-bold">My MSME</h3>
                {ownerMsme.data ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border bg-background p-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">
                        Business
                      </div>
                      <div className="mt-1 text-lg font-semibold">
                        {ownerMsme.data.business_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ownerMsme.data.sector} - {ownerMsme.data.city || "-"},{" "}
                        {ownerMsme.data.state || "-"}
                      </div>
                    </div>
                    <Link
                      to="/msme/$id"
                      params={{ id: String(linkedMsmeId) }}
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      Open my Health Card <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
                    Could not load your linked MSME. If you just reset demo data, log out and log in
                    as the freshly seeded owner account.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border bg-card p-6">
                <h3 className="font-display text-lg font-bold">Owner Actions</h3>
                <div className="mt-4 space-y-2">
                  <QA
                    to="/msme/$id"
                    params={{ id: String(linkedMsmeId) }}
                    icon={Activity}
                    label="View Health Card"
                  />
                  <QA
                    to="/msme/$id"
                    params={{ id: String(linkedMsmeId) }}
                    icon={Database}
                    label="Add Business Data"
                  />
                  <QA
                    to="/msme/$id"
                    params={{ id: String(linkedMsmeId) }}
                    icon={Sparkles}
                    label="Ask AI Insights"
                  />
                  <QA
                    to="/msme/$id"
                    params={{ id: String(linkedMsmeId) }}
                    icon={Bell}
                    label="Review My Alerts"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-media-shell space-y-6">
      <div className="dashboard-media-backdrop" aria-hidden="true" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {role === "admin" ? "Admin Dashboard" : "Credit Officer Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {role === "admin"
              ? "Demo control, portfolio oversight, and operational monitoring."
              : "MSME assessment, credit decisioning, and portfolio monitoring."}
          </p>
        </div>
        <ApiBadge health={health} />
      </div>

      {(msmes.error || alerts.error) && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <strong>Preparing portfolio data.</strong> Demo data is being initialized silently.
          Refresh in a moment if the cards do not populate automatically.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="MSMEs"
          value={msmes.data?.total ?? "-"}
          hint="In portfolio"
          tone="primary"
        />
        <StatCard
          icon={Bell}
          label="Open Alerts"
          value={alerts.data?.filter((a) => !a.acknowledged).length ?? "-"}
          hint="Unacknowledged"
          tone="destructive"
        />
        <StatCard
          icon={TrendingUp}
          label="Newly Scoreable"
          value={portfolio.data?.newly_scoreable_ntc_ntb_count ?? "-"}
          hint="NTC / NTB"
          tone="success"
        />
        <StatCard
          icon={Activity}
          label="Avg Sector Score"
          value={portfolio.data ? avgOf(portfolio.data.sector_average_scores) : "-"}
          hint="Across sectors"
          tone="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Recent MSMEs</h3>
            <Link
              to="/portfolio"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 divide-y">
            {msmes.data?.items.length ? (
              msmes.data.items.map((m) => (
                <Link
                  key={m.id}
                  to="/msme/$id"
                  params={{ id: String(m.id) }}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{m.business_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {m.sector} - {m.city || "-"}, {m.state || "-"}
                    </div>
                  </div>
                  {(!m.udyam_number || m.requested_credit_invisible_flag) && (
                    <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-warning">
                      NTC/NTB
                    </span>
                  )}
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No MSMEs yet.</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6">
          {role === "admin" ? (
            <AdminActions />
          ) : (
            <OfficerWorkQueue msmes={msmes.data?.items || []} alerts={alerts.data || []} />
          )}
        </div>
      </div>
    </div>
  );
}

function AdminActions() {
  return (
    <>
      <h3 className="font-display text-lg font-bold">Admin Actions</h3>
      <div className="mt-4 space-y-2">
        <QA to="/demo" icon={Database} label="Onboard New MSME" />
        <QA to="/portfolio" icon={Users} label="Review Full Portfolio" />
        <QA to="/alerts" icon={Bell} label="Monitor System Alerts" />
      </div>
      <div className="mt-6 rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground">
        <Sparkles className="h-5 w-5" />
        <h4 className="mt-2 font-semibold">Admin focus</h4>
        <p className="mt-1 text-xs opacity-90">
          Create MSMEs, supervise data quality, and maintain the demo operating environment.
        </p>
      </div>
    </>
  );
}

function OfficerWorkQueue({ msmes, alerts }: { msmes: any[]; alerts: any[] }) {
  const lowConfidence = msmes.filter((m) => !m.udyam_number || m.requested_credit_invisible_flag);
  const openAlerts = alerts.filter((a) => !a.acknowledged).slice(0, 3);

  return (
    <>
      <h3 className="flex items-center gap-2 font-display text-lg font-bold">
        <ClipboardList className="h-5 w-5 text-primary" /> Work Queue
      </h3>
      <div className="mt-4 space-y-3">
        <QueueTile
          label="Pending NTC/NTB assessment"
          value={lowConfidence.length}
          to="/portfolio"
        />
        <QueueTile label="Open alert reviews" value={openAlerts.length} to="/alerts" />
        <QueueTile label="Eligibility checks" value="Ready" to="/credit" />
      </div>
      <div className="mt-5 space-y-2">
        {openAlerts.map((alert) => (
          <Link
            key={alert.id}
            to="/alerts"
            className="block rounded-xl border bg-background p-3 text-sm hover:border-primary/50"
          >
            <div className="text-xs font-semibold uppercase text-muted-foreground">
              {alert.severity} alert
            </div>
            <div className="mt-1 line-clamp-2">{alert.message}</div>
          </Link>
        ))}
      </div>
    </>
  );
}

function QueueTile({ label, value, to }: { label: string; value: string | number; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center justify-between rounded-xl border bg-background p-3 text-sm hover:border-primary/50"
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </Link>
  );
}

function avgOf(rec: Record<string, string>) {
  const values = Object.values(rec)
    .map((n) => parseFloat(n))
    .filter((n) => !isNaN(n));
  if (!values.length) return "-";
  return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
}

function ApiBadge({ health }: { health: "ok" | "down" | "loading" }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${health === "ok" ? "border-success/30 bg-success/10 text-success" : health === "down" ? "border-destructive/30 bg-destructive/10 text-destructive" : ""}`}
    >
      <span
        className={`h-2 w-2 rounded-full ${health === "ok" ? "bg-success" : health === "down" ? "bg-destructive" : "bg-muted-foreground"}`}
      />
      API {health === "ok" ? "online" : health === "down" ? "unreachable" : "checking..."}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }: any) {
  const tones: Record<string, string> = {
    primary: "from-primary/15 text-primary",
    destructive: "from-destructive/15 text-destructive",
    success: "from-success/15 text-success",
    accent: "from-accent/30 text-accent-foreground",
  };
  return (
    <div className="rounded-3xl border bg-card p-5">
      <div
        className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${tones[tone]} to-transparent`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function QA({ to, params, icon: Icon, label }: any) {
  return (
    <Link
      to={to}
      params={params}
      className="flex items-center justify-between rounded-xl border bg-background p-3 text-sm hover:border-accent"
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </span>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
