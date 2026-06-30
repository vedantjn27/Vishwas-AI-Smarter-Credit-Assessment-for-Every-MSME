import { createFileRoute, Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { isAuthenticated, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait a tick so auth context can hydrate from localStorage
    const id = setTimeout(() => {
      if (!isAuthenticated && !token) {
        router.navigate({ to: "/login" });
      }
    }, 50);
    return () => clearTimeout(id);
  }, [isAuthenticated, token, router]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav showAppNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
