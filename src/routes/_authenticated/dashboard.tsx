import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardQuery, familyMembersQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your family — CareBox" },
      { name: "description", content: "See every family member and their recent prescriptions in CareBox." },
      { property: "og:title", content: "Your family — CareBox" },
      { property: "og:description", content: "See every family member and their recent prescriptions in CareBox." },
    ],
  }),
  component: Dashboard,
});

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Dashboard() {
  const summary = useQuery(dashboardQuery);
  const members = useQuery(familyMembersQuery);

  const nameById = new Map((members.data ?? []).map((m) => [m.id, m.name]));
  const countById = new Map(
    (summary.data?.per_family_member ?? []).map((p) => [p.family_member_id, p.prescription_count]),
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">CareBox</h1>
        <p className="mt-1 text-sm text-muted-foreground">Prescription records for the people you care for.</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Family members</p>
            {summary.isLoading ? (
              <Skeleton className="mt-2 h-7 w-10" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{summary.data?.total_family_members ?? 0}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Prescriptions</p>
            {summary.isLoading ? (
              <Skeleton className="mt-2 h-7 w-10" />
            ) : (
              <p className="mt-1 text-2xl font-semibold">{summary.data?.total_prescriptions ?? 0}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Family</h2>
        <div className="grid grid-cols-2 gap-3">
          {members.isLoading &&
            [0, 1].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          {(members.data ?? []).map((member) => (
            <Link
              key={member.id}
              to="/family/$memberId"
              params={{ memberId: member.id }}
              className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {initials(member.name) || <Users className="h-4 w-4" />}
              </div>
              <p className="mt-3 truncate font-medium text-foreground">{member.name}</p>
              <p className="text-xs text-muted-foreground">{member.relationship ?? "Family"}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {countById.get(member.id) ?? 0} prescriptions
              </p>
            </Link>
          ))}
          <Link
            to="/family/new"
            className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-5 w-5" />
            Add family member
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Recent prescriptions</h2>
        {summary.isLoading && <Skeleton className="h-20 rounded-xl" />}
        {!summary.isLoading && (summary.data?.recent_prescriptions.length ?? 0) === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No prescriptions yet. Add a family member, then save their first prescription.
            </CardContent>
          </Card>
        )}
        <div className="space-y-2">
          {(summary.data?.recent_prescriptions ?? []).map((p) => (
            <Link
              key={p.id}
              to="/prescriptions/$prescriptionId"
              params={{ prescriptionId: p.id }}
              className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-medium text-foreground">
                  {nameById.get(p.family_member_id) ?? "Family member"}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(p.prescription_date)}
                </span>
              </div>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {p.doctor_name || "No doctor recorded"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
