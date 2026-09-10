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
  subtitle?: string | undefined;
  backTo?: string | undefined;
  backParams?: Record<string, string> | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <header className="page-band -mx-4 mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-4 pb-5 sm:-mx-6 sm:mb-8 sm:gap-4 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="min-w-0">
        {backTo && (
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={backTo as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            params={backParams as any}
            className="-ml-2 mb-2 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        )}
        <h1 className="text-page-title text-foreground">{title}</h1>
        {subtitle && <p className="text-meta mt-1.5">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
