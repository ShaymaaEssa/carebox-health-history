import { Link } from "@tanstack/react-router";
import { Home, Search, Settings, HeartPulse } from "lucide-react";
import type { ReactNode } from "react";

const items = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Account", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop / tablet sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 md:flex lg:w-64">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            CareBox
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "bg-secondary text-primary" }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="animate-fade-in mx-auto w-full max-w-2xl px-4 pt-6 pb-28 sm:px-6 md:max-w-3xl md:pb-12 lg:max-w-5xl lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-3 pb-[env(safe-area-inset-bottom)]">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-14 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-muted-foreground transition-colors"
              activeProps={{ className: "text-primary" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
