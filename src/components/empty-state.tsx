import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card animate-fade-in flex flex-col items-center gap-3 px-6 py-10 text-center sm:py-14">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-secondary text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <div className="space-y-1">
        <p className="text-card-title text-foreground">{title}</p>
        <p className="text-meta mx-auto max-w-sm">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
