import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileHeart, FileText, Pill, Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signedUrl } from "@/lib/attachments";
import { memberInitials, memberStyle, relationshipBadgeClass } from "@/lib/member-style";
import { dashboardQuery, familyMembersQuery, firstImageAttachmentQuery } from "@/lib/queries";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RecentPrescriptionCard({
  prescription,
  memberName,
  relationship,
}: {
  prescription: { id: string; family_member_id: string; prescription_date: string; doctor_name: string | null };
  memberName: string;
  relationship: string;
}) {
  const attachment = useQuery(firstImageAttachmentQuery(prescription.id));
  const preview = useQuery({
    queryKey: ["signed-url", attachment.data?.storage_path],
    queryFn: () => signedUrl(attachment.data?.storage_path ?? ""),
    enabled: Boolean(attachment.data?.storage_path),
    staleTime: 50 * 60 * 1000,
  });

  return (
    <Link
      to="/prescriptions/$prescriptionId"
      params={{ prescriptionId: prescription.id }}
      className="card-interactive animate-fade-in grid grid-cols-[4.75rem_minmax(0,1fr)] overflow-hidden p-2"
    >
      <div className="grid aspect-square place-items-center overflow-hidden rounded-lg bg-brand-soft text-primary">
        {preview.data ? (
          <img src={preview.data} alt="Prescription attachment preview" loading="lazy" className="h-full w-full object-cover" />
        ) : attachment.isLoading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <FileText className="h-6 w-6" />
        )}
      </div>
      <div className="min-w-0 self-center px-3 py-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-card-title truncate text-foreground">{memberName}</span>
          <span className="text-meta shrink-0">{formatDate(prescription.prescription_date)}</span>
        </div>
        <span className={relationshipBadgeClass(prescription.family_member_id, "mt-1")}>{relationship}</span>
        <p className="text-meta mt-1 truncate">{prescription.doctor_name || "No doctor recorded"}</p>
      </div>
    </Link>
  );
}

function Dashboard() {
  const summary = useQuery(dashboardQuery);
  const members = useQuery(familyMembersQuery);

  const nameById = new Map((members.data ?? []).map((m) => [m.id, m.name]));
  const relationshipById = new Map((members.data ?? []).map((m) => [m.id, m.relationship ?? "Family"]));
  const countById = new Map(
    (summary.data?.per_family_member ?? []).map((p) => [p.family_member_id, p.prescription_count]),
  );
  const memberList = members.data ?? [];
  const recent = summary.data?.recent_prescriptions ?? [];

  return (
    <div className="space-y-10">
      <header className="page-band -mx-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-4 pb-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="min-w-0">
          <p className="text-eyebrow">Your household</p>
          <h1 className="text-page-title mt-1 text-foreground">CareBox</h1>
          <p className="text-meta mt-1.5">Prescription records for the people you care for.</p>
        </div>
        <Button asChild className="hidden h-11 shrink-0 sm:inline-flex">
          <Link to="/family/new">
            <Plus className="mr-1 h-4 w-4" /> Add member
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {[
          { label: "Family members", value: summary.data?.total_family_members ?? 0, icon: Users },
          { label: "Prescriptions", value: summary.data?.total_prescriptions ?? 0, icon: Pill },
        ].map((stat) => (
          <div key={stat.label} className="stat-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-eyebrow">{stat.label}</p>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><stat.icon className="h-4 w-4" /></span>
            </div>
            {summary.isLoading ? (
              <Skeleton className="mt-2 h-8 w-12" />
            ) : (
              <p className="font-display mt-1.5 text-3xl font-semibold text-foreground sm:text-4xl">
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-section-title text-foreground">Family</h2>

        {members.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : memberList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No family members yet"
            description="Add the first person you look after, then start saving their prescriptions."
            action={
              <Button asChild className="h-11">
                <Link to="/family/new">
                  <Plus className="mr-1 h-4 w-4" /> Add family member
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {memberList.map((member) => (
              <Link
                key={member.id}
                to="/family/$memberId"
                params={{ memberId: member.id }}
                className="card-interactive animate-fade-in block p-4 sm:p-5"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-full text-sm font-bold ${memberStyle(member.id).avatar}`}>
                  {memberInitials(member.name) || <Users className="h-4 w-4" />}
                </div>
                <p className="text-card-title mt-3 truncate text-foreground">{member.name}</p>
                <span className={relationshipBadgeClass(member.id, "mt-1")}>{member.relationship ?? "Family"}</span>
                <p className="text-meta mt-1">{countById.get(member.id) ?? 0} prescriptions</p>
              </Link>
            ))}
            <Link
              to="/family/new"
              className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50 hover:text-primary"
            >
              <Plus className="h-5 w-5" />
              Add family member
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-section-title text-foreground">Recent prescriptions</h2>
        {summary.isLoading && <Skeleton className="h-24 rounded-xl" />}
        {!summary.isLoading && recent.length === 0 && (
          <EmptyState
            icon={FileHeart}
            title="No prescriptions yet"
            description="Once you save a prescription it will appear here with the most recent first."
          />
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          {recent.map((p) => <RecentPrescriptionCard key={p.id} prescription={p} memberName={nameById.get(p.family_member_id) ?? "Family member"} relationship={relationshipById.get(p.family_member_id) ?? "Family"} />)}
        </div>
      </section>
    </div>
  );
}
