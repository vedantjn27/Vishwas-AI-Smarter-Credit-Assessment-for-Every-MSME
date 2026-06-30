import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Search, Filter } from "lucide-react";

export const Route = createFileRoute("/_app/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio · Vishwas AI" }] }),
  component: Portfolio,
});

function Portfolio() {
  const { role, linkedMsmeId } = useAuth();
  const [sector, setSector] = useState("");
  const [state, setState] = useState("");
  const [ntc, setNtc] = useState(false);
  const [q, setQ] = useState("");

  const list = useQuery({
    queryKey: ["portfolio-list", sector, state, ntc],
    queryFn: () =>
      api.listMsmes({
        limit: 100,
        sector: sector || undefined,
        state: state || undefined,
        credit_invisible: ntc || undefined,
      }),
    retry: false,
    enabled: role !== "msme_owner",
  });

  const items = (list.data?.items || []).filter((m) =>
    !q
      ? true
      : m.business_name.toLowerCase().includes(q.toLowerCase()) ||
        m.owner_name?.toLowerCase().includes(q.toLowerCase()),
  );

  if (role === "msme_owner") {
    return (
      <Restricted
        title="Portfolio is for bank users"
        message="MSME owners can view and update only their linked business."
        to="/msme/$id"
        params={{ id: String(linkedMsmeId || "") }}
        label="Open my MSME"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">MSME Portfolio</h1>
        <p className="text-sm text-muted-foreground">
          {list.data?.total ?? 0} businesses · click any to open Health Card.
        </p>
      </div>

      <div className="rounded-3xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search business…"
              className="h-11 w-full rounded-xl border bg-background pl-9 pr-3 text-sm"
            />
          </div>
          <input
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Sector (e.g. Retail)"
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          />
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State (e.g. Maharashtra)"
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          />
          <label className="flex h-11 items-center gap-2 rounded-xl border bg-background px-3 text-sm">
            <input type="checkbox" checked={ntc} onChange={(e) => setNtc(e.target.checked)} />
            <Filter className="h-4 w-4 text-warning" /> Credit-invisible only
          </label>
        </div>
      </div>

      {list.isLoading && (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      )}
      {list.error && (
        <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 text-sm">
          Could not load MSMEs. Make sure backend is running and demo is seeded.
        </div>
      )}

      {!list.isLoading && !!items.length && (
        <div className="overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Sector</th>
                <th className="hidden px-4 py-3 md:table-cell">Location</th>
                <th className="hidden px-4 py-3 md:table-cell">Employees</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((m) => (
                <tr key={m.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <Link
                      to="/msme/$id"
                      params={{ id: String(m.id) }}
                      className="font-medium text-primary hover:underline"
                    >
                      {m.business_name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{m.owner_name}</div>
                  </td>
                  <td className="px-4 py-3">{m.sector}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {m.city || "—"}, {m.state || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {m.employee_count ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {!m.udyam_number || m.requested_credit_invisible_flag ? (
                      <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-warning">
                        NTC/NTB
                      </span>
                    ) : (
                      <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
                        Formalized
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!list.isLoading && !items.length && !list.error && (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No MSMEs match. Try seeding demo data.
        </div>
      )}
    </div>
  );
}

function Restricted({ title, message, to, params, label }: any) {
  return (
    <div className="rounded-3xl border bg-card p-8">
      <h1 className="font-display text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {params.id && (
        <Link
          to={to}
          params={params}
          className="mt-5 inline-flex h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {label}
        </Link>
      )}
    </div>
  );
}
