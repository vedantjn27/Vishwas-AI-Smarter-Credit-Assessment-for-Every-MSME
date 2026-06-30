import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Network, Layers } from "lucide-react";

export const Route = createFileRoute("/_app/uli")({
  head: () => ({ meta: [{ title: "ULI / OCEN · Vishwas AI" }] }),
  component: Uli,
});

function Uli() {
  const { role } = useAuth();
  const [msmeId, setMsmeId] = useState("1");
  const [loanType, setLoanType] = useState("msme_working_capital");
  const [amount, setAmount] = useState("1500000");
  const [uli, setUli] = useState<any>(null);
  const [statusId, setStatusId] = useState("");
  const [statusRes, setStatusRes] = useState<any>(null);
  const [ocen, setOcen] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  if (role === "msme_owner") {
    return (
      <Restricted
        title="ULI / OCEN is for bank users"
        message="MSME owners do not submit ecosystem credit assessments directly from this demo workspace."
      />
    );
  }

  const payload = () => ({
    msme_id: parseInt(msmeId),
    loan_type: loanType,
    requested_amount: amount,
  });
  const apply = async () => {
    setErr(null);
    try {
      const r = await api.uliApply(payload());
      setUli(r);
      setStatusId(r.application_id);
    } catch (e: any) {
      setErr(e.message);
    }
  };
  const checkStatus = async () => {
    setErr(null);
    try {
      setStatusRes(await api.uliStatus(statusId));
    } catch (e: any) {
      setErr(e.message);
    }
  };
  const assess = async () => {
    setErr(null);
    try {
      setOcen(await api.ocenAssess(payload()));
    } catch (e: any) {
      setErr(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">ULI / OCEN Simulation</h1>
        <p className="text-sm text-muted-foreground">
          Ecosystem integration readiness — every response is a simulation.
        </p>
      </div>

      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold">
          <Network className="h-5 w-5 text-primary" /> Common request
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
            placeholder="Amount"
            className="h-11 rounded-xl border bg-background px-3 text-sm"
          />
        </div>
        {err && (
          <div className="mt-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {err}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border bg-card p-6">
          <h3 className="font-display text-lg font-bold">ULI Loan Application</h3>
          <button
            onClick={apply}
            className="mt-3 h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Submit application
          </button>
          {uli && (
            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                <span className="text-xs text-muted-foreground">Application ID</span>
                <div className="font-mono">{uli.application_id}</div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                <span className="text-xs text-muted-foreground">Status</span>
                <div className="font-semibold">{uli.status}</div>
              </div>
              <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                simulation: true
              </span>
            </div>
          )}
          <div className="mt-6 border-t pt-4">
            <h4 className="text-sm font-semibold">Check status by ID</h4>
            <div className="mt-2 flex gap-2">
              <input
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                placeholder="ULI-XXXX"
                className="h-10 flex-1 rounded-xl border bg-background px-3 text-sm font-mono"
              />
              <button
                onClick={checkStatus}
                className="h-10 rounded-xl border bg-secondary px-3 text-sm font-semibold hover:bg-accent/30"
              >
                Check
              </button>
            </div>
            {statusRes && <UliStatusCard status={statusRes} />}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold">
            <Layers className="h-5 w-5 text-accent" /> OCEN Credit Assessment
          </h3>
          <button
            onClick={assess}
            className="mt-3 h-10 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-foreground hover:opacity-90"
          >
            Run assessment
          </button>
          {ocen && (
            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                <span className="text-xs text-muted-foreground">Decision</span>
                <div className="font-semibold capitalize">{ocen.decision}</div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                <span className="text-xs text-muted-foreground">Risk band</span>
                <div className="font-semibold">{ocen.risk_band}</div>
              </div>
              <div className="rounded-xl bg-secondary/50 p-3 text-sm">
                <span className="text-xs text-muted-foreground">Reason codes</span>
                <ul className="mt-1 space-y-1">
                  {(ocen.reason_codes || []).map((r: string) => (
                    <li key={r} className="font-mono text-xs">
                      • {r}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="inline-block rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                simulation: true
              </span>
            </div>
          )}
        </div>
      </div>
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

function UliStatusCard({ status }: { status: any }) {
  const eligibility = status.eligibility;
  return (
    <div className="mt-4 space-y-3 rounded-2xl border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Application
          </div>
          <div className="font-mono text-sm font-semibold">{status.application_id}</div>
        </div>
        <span className="rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs font-semibold capitalize text-success">
          {status.status}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <MiniDetail label="Simulation" value={status.simulation ? "True" : "False"} />
        {eligibility && <MiniDetail label="Decision" value={eligibility.eligibility_result} />}
        {eligibility && (
          <MiniDetail label="Interest band" value={eligibility.recommended_interest_band} />
        )}
        {eligibility && <MiniDetail label="Scheme" value={eligibility.recommended_scheme} />}
      </div>
      {eligibility && (
        <div className="rounded-xl border bg-card p-3 text-sm">
          <div className="text-xs text-muted-foreground">Collateral</div>
          <div className="font-semibold">
            {eligibility.collateral_required ? "Required" : "Not required"}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3 text-sm">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-semibold">{value}</div>
    </div>
  );
}
