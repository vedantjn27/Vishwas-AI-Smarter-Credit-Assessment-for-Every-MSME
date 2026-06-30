import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  BarChart3,
  Brain,
  Network,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Activity,
  Layers,
  Eye,
  Lock,
  Zap,
  PlayCircle,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { TopNav } from "@/components/TopNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vishwas AI — Trust in MSME Credit" },
      {
        name: "description",
        content:
          "Vishwas AI builds a Financial Health Card for every MSME using alternate data, AI, and the India Stack.",
      },
    ],
  }),
  component: Branding,
});

function Branding() {
  return (
    <div className="min-h-screen">
      <TopNav />

      {/* HERO */}
      <section className="hero-gradient relative overflow-hidden">
        <img
          src="/media/vishwas-msme-ecosystem.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.16] dark:opacity-[0.2]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-background via-background/88 to-background/72" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-float" />
          <div className="absolute right-10 top-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-float-slow" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>AI for Bharat's 63M MSMEs</span>
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              The <span className="text-gradient">Financial Health Card</span> every MSME deserves.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              <strong className="text-foreground">Vishwas</strong> means trust. We turn GST, UPI,
              EPFO, bank, and AA data into a multidimensional credit signal — even for
              credit-invisible businesses — so lenders decide faster and fairer.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
              >
                Launch Demo <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center gap-2 rounded-xl border bg-card/60 px-6 text-sm font-semibold backdrop-blur hover:bg-secondary"
              >
                How it works
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> ULI / OCEN ready
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> Account Aggregator
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-success" /> ML + Rule-based cross-check
              </span>
            </div>
          </div>

          {/* Hero visual: orbiting trust ring */}
          <div
            className="relative mx-auto h-[420px] w-full max-w-md animate-fade-up"
            style={{ animationDelay: "0.15s" }}
          >
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative h-72 w-72 rounded-full border border-dashed border-primary/30">
                <div className="absolute inset-6 rounded-full border border-dashed border-accent/30" />
                <div className="absolute inset-12 rounded-full border border-dashed border-primary/20" />
                {/* center shield */}
                <div className="absolute inset-0 grid place-items-center">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-3xl bg-primary/30 animate-pulse-ring" />
                    <div className="relative grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl">
                      <Shield className="h-10 w-10 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                {/* orbiting icons */}
                {[BarChart3, Brain, Network, Activity, Layers].map((Icon, i) => (
                  <div
                    key={i}
                    className="absolute left-1/2 top-1/2 -ml-6 -mt-6 animate-orbit"
                    style={{ animationDelay: `${-i * 3.6}s` }}
                  >
                    <div className="grid h-12 w-12 place-items-center rounded-2xl border bg-card shadow-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* floating score chip */}
            <div className="absolute right-0 top-4 hidden rounded-2xl border bg-card p-4 shadow-xl sm:block animate-float-slow">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Health Score
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-3xl font-bold text-gradient">72</span>
                <span className="text-xs text-muted-foreground">/100 · Grade B</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-0 hidden rounded-2xl border bg-card p-4 shadow-xl sm:block animate-float">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Risk Band
              </div>
              <div className="mt-1 text-sm font-semibold text-success">Low-Medium</div>
            </div>
          </div>
        </div>
      </section>

      {/* BRAND FILM */}
      <section className="relative overflow-hidden border-y bg-card/40">
        <div className="absolute inset-0 bg-[url('/media/vishwas-dashboard-intelligence.png')] bg-cover bg-center opacity-[0.09] dark:opacity-[0.13]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-card/85 to-background/95" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-xs font-semibold backdrop-blur">
              <PlayCircle className="h-3.5 w-3.5 text-primary" />
              <span>Vishwas intelligence in motion</span>
            </div>
            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              A living credit signal for fast, fair MSME decisions.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              This animated view shows how consented data streams move from raw business activity
              into explainable health scores, lender-ready recommendations, and continuous alerts.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { i: Workflow, t: "Signals", d: "GST, UPI, EPFO, bank and AA data" },
                { i: Brain, t: "Scoring", d: "ML confidence plus rule checks" },
                { i: ShieldCheck, t: "Trust", d: "Explainable outputs for lenders" },
              ].map((item) => (
                <div key={item.t} className="rounded-2xl border bg-background/80 p-4 backdrop-blur">
                  <item.i className="h-5 w-5 text-primary" />
                  <div className="mt-3 text-sm font-semibold">{item.t}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="brand-film" aria-label="Animated Vishwas AI credit assessment flow">
            <div className="film-stage">
              <div className="film-grid" />
              <div className="film-card film-card-left">
                <span>GST</span>
                <strong>Compliance</strong>
              </div>
              <div className="film-card film-card-top">
                <span>UPI</span>
                <strong>Cash flow</strong>
              </div>
              <div className="film-card film-card-right">
                <span>AA</span>
                <strong>Banking</strong>
              </div>
              <div className="film-path film-path-one" />
              <div className="film-path film-path-two" />
              <div className="film-path film-path-three" />
              <div className="film-core">
                <div className="film-ring" />
                <Shield className="h-12 w-12" />
                <span>72</span>
              </div>
              <div className="film-decision">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <span>Eligible</span>
                  <strong>Low-Medium Risk</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y bg-card/40">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 md:grid-cols-4">
          {[
            { k: "63M+", v: "MSMEs in India" },
            { k: "5", v: "Score Dimensions" },
            { k: "8+", v: "Alternate Data Sources" },
            { k: "<2s", v: "Score Recomputation" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <div className="font-display text-3xl font-bold text-gradient">{s.k}</div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">
            How it works
          </div>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            From raw signals to a trustworthy decision.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every step is auditable. Every score is explainable.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              i: Network,
              t: "1. Aggregate",
              d: "Pull GST returns, UPI flows, EPFO contributions, bank statements (via AA), and unstructured notes.",
            },
            {
              i: Brain,
              t: "2. Score & Explain",
              d: "5-dimension score with ML second opinion, confidence band, strengths and risks — in plain language.",
            },
            {
              i: Zap,
              t: "3. Decide & Monitor",
              d: "Eligibility, ULI/OCEN simulation, alerts on compliance breaches and anomalies.",
            },
          ].map((s, i) => (
            <div
              key={s.t}
              className="group rounded-3xl border bg-card p-8 transition hover:-translate-y-1 hover:shadow-2xl"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-110">
                <s.i className="h-6 w-6" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIMENSIONS */}
      <section className="bg-card/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-accent">
                Five Dimensions
              </div>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                A holistic view — not a single number.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Each MSME is assessed across five weighted dimensions. Combined, they form the
                <strong className="text-foreground"> Financial Health Card</strong> — designed to
                surface real risk and real opportunity.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { n: "Cash Flow Stability", w: "25%" },
                  { n: "Compliance Health", w: "25%" },
                  { n: "Banking Behavior", w: "25%" },
                  { n: "Statutory Stability", w: "15%" },
                  { n: "Digital Footprint", w: "10%" },
                ].map((d) => (
                  <li
                    key={d.n}
                    className="flex items-center justify-between rounded-xl border bg-background p-4"
                  >
                    <span className="font-medium">{d.n}</span>
                    <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-semibold text-accent-foreground">
                      {d.w}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-3xl border bg-card p-8 shadow-2xl">
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Demo MSME
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <div className="font-display text-5xl font-bold text-gradient">72</div>
                    <div className="text-sm text-muted-foreground">Grade B · Low-Medium risk</div>
                  </div>
                  <div className="rounded-xl bg-success/15 px-3 py-1.5 text-xs font-semibold text-success">
                    +4 this month
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    ["Cash Flow", 78],
                    ["Compliance", 65],
                    ["Banking", 74],
                    ["Statutory", 70],
                    ["Digital", 80],
                  ].map(([n, v]) => (
                    <div key={n as string}>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{n}</span>
                        <span className="text-muted-foreground">{v}/100</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                          style={{ width: `${v}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY VISHWAS */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-accent">
            Why Vishwas
          </div>
          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Built on the principles of trust.</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              i: Eye,
              t: "Transparent",
              d: "Every score is broken down with strengths, risks, and a recommended next data source.",
            },
            {
              i: Lock,
              t: "Consent-first",
              d: "Account Aggregator lifecycle baked in. No data without explicit, revocable consent.",
            },
            {
              i: Brain,
              t: "Cross-checked",
              d: "Rule engine + ML second opinion. Divergence flags trigger manual review.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-3xl border bg-card p-6">
              <c.i className="h-7 w-7 text-accent" />
              <h3 className="mt-4 font-display text-lg font-bold">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t bg-gradient-to-br from-primary to-primary/70 py-20 text-primary-foreground">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold">Ready to explore?</h2>
          <p className="mt-4 text-primary-foreground/80">
            Seed the demo, log in, and walk through the full MSME credit journey.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground hover:opacity-90"
            >
              Launch Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/signup"
              className="inline-flex h-12 items-center rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-semibold backdrop-blur hover:bg-white/20"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-background py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} Vishwas AI · Hackathon demo</span>
          </div>
          <div className="flex gap-4">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <Link to="/login" className="hover:text-foreground">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
