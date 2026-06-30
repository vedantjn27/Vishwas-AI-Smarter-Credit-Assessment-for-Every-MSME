import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, type Alert } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AlertDetails, AlertList } from "./_app.msme.$id";

export const Route = createFileRoute("/_app/alerts")({
  head: () => ({ meta: [{ title: "Alerts · Vishwas AI" }] }),
  component: AlertsPage,
});

function AlertsPage() {
  const { role, linkedMsmeId } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["all-alerts"],
    queryFn: () => api.alerts(),
    retry: false,
    enabled: role !== "msme_owner",
  });
  const [filter, setFilter] = useState<"all" | "open" | "ack">("open");
  const [selected, setSelected] = useState<Alert | null>(null);

  if (role === "msme_owner") {
    return (
      <Restricted
        title="Portfolio alerts are for bank users"
        message="MSME owners can review alerts only for their own business."
        linkedMsmeId={linkedMsmeId}
      />
    );
  }

  const ack = async (id: number) => {
    await api.ackAlert(id);
    qc.invalidateQueries({ queryKey: ["all-alerts"] });
  };
  const alerts = (data || []).filter((a) =>
    filter === "all" ? true : filter === "open" ? !a.acknowledged : a.acknowledged,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Portfolio Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Compliance breaches, anomalies, consent changes, and score drops.
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl border bg-card p-1 w-fit">
        {(["open", "ack", "all"] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${filter === k ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
          >
            {k === "open" ? "Open" : k === "ack" ? "Acknowledged" : "All"} (
            {
              (data || []).filter((a) =>
                k === "all" ? true : k === "open" ? !a.acknowledged : a.acknowledged,
              ).length
            }
            )
          </button>
        ))}
      </div>

      {isLoading && <div className="rounded-2xl border bg-card p-6 text-sm">Loading…</div>}
      {error && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          Could not load alerts.
        </div>
      )}
      {!isLoading && !error && (
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <AlertList alerts={alerts} onAck={ack} selectedId={selected?.id} onSelect={setSelected} />
          <AlertDetails alert={selected} />
        </div>
      )}
    </div>
  );
}

function Restricted({
  title,
  message,
  linkedMsmeId,
}: {
  title: string;
  message: string;
  linkedMsmeId: number | null;
}) {
  return (
    <div className="rounded-3xl border bg-card p-8">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {linkedMsmeId && (
        <Link
          to="/msme/$id"
          params={{ id: String(linkedMsmeId) }}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Open my MSME alerts
        </Link>
      )}
    </div>
  );
}
