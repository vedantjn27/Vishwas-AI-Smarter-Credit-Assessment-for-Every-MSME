import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, AlertCircle } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account · Vishwas AI" }] }),
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [role, setRole] = useState("credit_officer");
  const [linkedMsmeId, setLinkedMsmeId] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const ownerMsmeId =
        role === "msme_owner" && linkedMsmeId ? parseInt(linkedMsmeId) : undefined;
      await api.signup(u, p, role, ownerMsmeId);
      await login(u, p, role);
      router.navigate({ to: "/dashboard" });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <div className="hero-gradient">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-6 py-12">
          <form onSubmit={submit} className="w-full rounded-3xl border bg-card p-8 shadow-2xl">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Create account</h2>
            <p className="text-sm text-muted-foreground">Join Vishwas AI.</p>

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
                  minLength={8}
                  className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                >
                  <option value="credit_officer">Credit Officer</option>
                  <option value="msme_owner">MSME Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {role === "msme_owner" && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Linked MSME ID
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={linkedMsmeId}
                    onChange={(e) => setLinkedMsmeId(e.target.value)}
                    className="mt-1.5 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
              )}
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
              {loading ? "Creating…" : "Create account"}
            </button>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
