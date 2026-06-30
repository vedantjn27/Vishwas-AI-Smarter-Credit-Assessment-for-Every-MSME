import { Link, useRouter } from "@tanstack/react-router";
import { Moon, Sun, LogOut, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";

const navItems = {
  admin: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/demo", label: "Onboard MSME" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/credit", label: "Credit" },
    { to: "/uli", label: "ULI/OCEN" },
    { to: "/alerts", label: "Alerts" },
  ],
  credit_officer: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/portfolio", label: "Portfolio" },
    { to: "/credit", label: "Credit" },
    { to: "/uli", label: "ULI/OCEN" },
    { to: "/alerts", label: "Alerts" },
  ],
  msme_owner: [{ to: "/dashboard", label: "Dashboard" }],
};

export function TopNav({ showAppNav = false }: { showAppNav?: boolean }) {
  const { theme, toggle } = useTheme();
  const { isAuthenticated, username, role, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const appNavItems =
    navItems[(role || "credit_officer") as keyof typeof navItems] || navItems.credit_officer;

  return (
    <header className="sticky top-0 z-50 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-bold leading-none">Vishwas AI</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Trust in Credit
            </div>
          </div>
        </Link>

        <nav className="ml-6 hidden flex-1 items-center gap-1 md:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground [&.active]:text-foreground"
          >
            About
          </Link>
          {showAppNav &&
            appNavItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
              >
                {n.label}
              </Link>
            ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-md border bg-background hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">@{username}</span>
              <button
                onClick={() => {
                  logout();
                  router.navigate({ to: "/" });
                }}
                className="hidden h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-secondary sm:flex"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 sm:flex"
            >
              Login
            </Link>
          )}
          {showAppNav && (
            <button
              onClick={() => setOpen(!open)}
              className="grid h-9 w-9 place-items-center rounded-md border md:hidden"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      {open && showAppNav && (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col p-2">
            {appNavItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  router.navigate({ to: "/" });
                }}
                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
