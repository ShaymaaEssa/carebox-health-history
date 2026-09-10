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
      <aside className="brand-texture sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-brand-deep px-4 py-6 text-primary-foreground md:flex lg:w-64">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2 px-2 text-primary-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="font-display text-lg font-semibold text-primary-foreground">
            CareBox
          </span>
        </Link>
        <nav className="flex flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
               className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-primary-foreground/65 transition-all duration-150 hover:bg-primary-foreground/10 hover:text-primary-foreground active:scale-[0.98]"
               activeProps={{ className: "bg-primary-foreground/12 text-primary-foreground" }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto px-3 text-[10px] leading-relaxed text-primary-foreground/45">Private by design<br />Your records stay yours.</p>
      </aside>

      <div className="min-w-0 flex-1">
        <main className="animate-rise-in mx-auto w-full max-w-2xl px-4 pt-6 pb-28 sm:px-6 md:max-w-3xl md:pb-12 lg:max-w-5xl lg:px-10 lg:pt-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-primary-foreground/10 bg-brand-deep/95 text-primary-foreground backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-2xl grid-cols-3 pb-[env(safe-area-inset-bottom)]">
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex min-h-14 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium text-primary-foreground/55 transition-all active:scale-95"
              activeProps={{ className: "text-primary-foreground" }}
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
