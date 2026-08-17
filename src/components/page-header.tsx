import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  backTo,
  backParams,
  action,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  backParams?: Record<string, string>;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0">
        {backTo && (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={backTo as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={backParams as any}
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        )}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
