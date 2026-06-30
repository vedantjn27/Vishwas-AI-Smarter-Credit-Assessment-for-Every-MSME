import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Shield, LogIn, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { TopNav } from "@/components/TopNav";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login · Vishwas AI" }] }),
  component: LoginPage,
});

const demoUsers = [
  { u: "admin", r: "Admin · full access" },
  { u: "credit_officer", r: "Credit Officer" },
  { u: "owner_1", r: "MSME Owner" },
];

function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [u, setU] = useState("admin");
  const [p, setP] = useState("password123");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(u, p);
      router.navigate({ to: "/dashboard" });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="hero-gradient">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-12 px-6 py-12 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-4 py-1.5 text-xs font-medium backdrop-blur">
              <Shield className="h-3.5 w-3.5 text-accent" /> Secure demo login
            </div>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-tight">
              Welcome back to <span className="text-gradient">Vishwas AI</span>.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Log in to access the full MSME credit assessment journey — portfolio, health cards, AI
              insights, and decision support.
            </p>
            <div className="mt-8 space-y-2">
              {demoUsers.map((d) => (
                <button
                  key={d.u}
                  onClick={() => {
                    setU(d.u);
                    setP("password123");
                  }}
                  className="flex w-full items-center justify-between rounded-xl border bg-card/60 p-4 text-left backdrop-blur transition hover:border-accent hover:bg-card"
                >
                  <div>
                    <div className="font-medium">{d.u}</div>
                    <div className="text-xs text-muted-foreground">{d.r}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">Click to fill →</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <form
              onSubmit={submit}
              className="mx-auto w-full max-w-md rounded-3xl border bg-card p-8 shadow-2xl"
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">Sign in</h2>
              <p className="text-sm text-muted-foreground">Use a demo account or your own.</p>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Username
                  </label>
                  <input
                    value={u}
                    onChange={(e) => setU(e.target.value)}
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Password
                  </label>
                  <input
                    type="password"
                    value={p}
                    onChange={(e) => setP(e.target.value)}
                    required
                    className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
              </div>

              {err && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{err}</span>
                </div>
              )}

              <button
                disabled={loading}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <div className="mt-4 text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link to="/signup" className="font-semibold text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
