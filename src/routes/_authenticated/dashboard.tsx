import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileHeart, FileText, LockKeyhole, Pill, Plus, Users } from "lucide-react";

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
    <div className="space-y-8 sm:space-y-10">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
        <div className="min-w-0 space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" /> Family health vault
          </span>
          <div>
            <h1 className="text-page-title text-foreground">Your family, in one place.</h1>
            <p className="text-body mt-2 max-w-xl text-muted-foreground">
              A calm, private home for the prescription records you want close at hand.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <LockKeyhole className="h-3.5 w-3.5 text-primary" /> Private by design · Your records stay yours
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:max-w-md sm:gap-4 lg:w-[min(100%,26rem)]">
          {[
            { label: "Family members", value: summary.data?.total_family_members ?? 0, icon: Users },
            { label: "Prescriptions", value: summary.data?.total_prescriptions ?? 0, icon: Pill },
          ].map((stat) => (
            <div key={stat.label} className="stat-card min-w-0 p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-eyebrow leading-tight">{stat.label}</p>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <stat.icon className="h-4 w-4" />
                </span>
              </div>
              {summary.isLoading ? (
                <Skeleton className="mt-2 h-8 w-12" />
              ) : (
                <p className="font-display mt-1 text-3xl font-semibold text-foreground">
                  {stat.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-section-title text-foreground">Family circle</h2>
              {!members.isLoading && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">{memberList.length}</span>}
            </div>
            <p className="text-meta mt-1">Quick access to each person’s records.</p>
          </div>
          <Button asChild variant="ghost" className="h-10 shrink-0 px-2 sm:px-3">
            <Link to="/family/new"><Plus className="mr-1 h-4 w-4" /> Add member</Link>
          </Button>
        </div>

        {members.isLoading ? (
          <div className="-mx-4 flex gap-3 overflow-hidden px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-60 shrink-0 rounded-xl sm:h-32 sm:w-auto" />)}
          </div>
        ) : memberList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No family members yet"
            description="Add the first person you look after, then start saving their prescriptions."
            action={<Button asChild className="h-11"><Link to="/family/new"><Plus className="mr-1 h-4 w-4" /> Add family member</Link></Button>}
          />
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
            {memberList.map((member) => (
              <Link
                key={member.id}
                to="/family/$memberId"
                params={{ memberId: member.id }}
                className="card-interactive min-h-36 w-60 shrink-0 snap-start p-4 sm:w-auto sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold ${memberStyle(member.id).avatar}`}>
                    {memberInitials(member.name) || <Users className="h-4 w-4" />}
                  </div>
                  <span className={relationshipBadgeClass(member.id, "max-w-[9rem] truncate")}>{member.relationship ?? "Family"}</span>
                </div>
                <div className="mt-4 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-card-title truncate text-foreground">{member.name}</p>
                    <p className="text-meta mt-1">{countById.get(member.id) ?? 0} prescriptions</p>
                  </div>
                  <ArrowRight className="mb-1 h-4 w-4 shrink-0 text-primary" />
                </div>
              </Link>
            ))}
            <Link
              to="/family/new"
              className="flex min-h-36 w-60 shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-secondary/50 hover:text-primary sm:w-auto"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-primary"><Plus className="h-5 w-5" /></span>
              Add family member
            </Link>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-section-title text-foreground">Recent prescriptions</h2>
            <p className="text-meta mt-1">The latest records added to your family vault.</p>
          </div>
          <Link to="/search" className="flex min-h-10 shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Search <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {summary.isLoading && (
          <div className="grid gap-3 lg:grid-cols-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        )}
        {!summary.isLoading && recent.length === 0 && (
          <EmptyState icon={FileHeart} title="No prescriptions yet" description="Once you save a prescription it will appear here with the most recent first." action={<Button asChild className="h-11"><Link to="/prescriptions/new"><Plus className="mr-1 h-4 w-4" /> Add prescription</Link></Button>} />
        )}
        <div className="grid gap-3 lg:grid-cols-2">
          {recent.map((p) => <RecentPrescriptionCard key={p.id} prescription={p} memberName={nameById.get(p.family_member_id) ?? "Family member"} relationship={relationshipById.get(p.family_member_id) ?? "Family"} />)}
        </div>
      </section>
    </div>
  );
}
