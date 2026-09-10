import type { LucideIcon } from "lucide-react";

export function FormIntro({ icon: Icon, label, detail }: { icon: LucideIcon; label: string; detail: string }) {
  return (
    <div className="form-intro">
      <span className="form-intro-icon" aria-hidden="true">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-base font-semibold text-foreground">{label}</p>
        <p className="text-meta mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
