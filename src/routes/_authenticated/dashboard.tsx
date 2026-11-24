import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  FileHeart,
  FileText,
  LockKeyhole,
  Plus,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signedUrl } from "@/lib/attachments";
import { useAuth } from "@/lib/auth";
import { memberInitials, memberStyle } from "@/lib/member-style";
import { dashboardQuery, familyMembersQuery, firstImageAttachmentQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your family — CareBox" },
      {
        name: "description",
        content: "See every family member and their recent prescriptions in CareBox.",
      },
      { property: "og:title", content: "Your family — CareBox" },
      {
        property: "og:description",
        content: "See every family member and their recent prescriptions in CareBox.",
      },
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

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingFirstName(user: ReturnType<typeof useAuth>["user"]) {
  const metaFull = user?.user_metadata?.["full_name"];
  const metaName = user?.user_metadata?.["name"];
  const raw =
    (typeof metaFull === "string" && metaFull.trim()) ||
    (typeof metaName === "string" && metaName.trim()) ||
    "";
  if (raw) return raw.split(/\s+/)[0] ?? raw;
  const emailPrefix = user?.email?.split("@")[0]?.trim();
  return emailPrefix || "";
}

function RecentPrescriptionCard({
  prescription,
  memberName,
}: {
  prescription: {
    id: string;
    family_member_id: string;
    prescription_date: string;
    doctor_name: string | null;
    specialty: string | null;
  };
  memberName: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const attachment = useQuery(firstImageAttachmentQuery(prescription.id));
  const preview = useQuery({
    queryKey: ["signed-url", attachment.data?.storage_path],
    queryFn: () => signedUrl(attachment.data?.storage_path ?? ""),
    enabled: Boolean(attachment.data?.storage_path),
    staleTime: 50 * 60 * 1000,
  });

  const showSkeleton =
    attachment.isLoading || (Boolean(attachment.data?.storage_path) && preview.isLoading);
  const memberTint = memberStyle(prescription.family_member_id);

  return (
    <Link
      to="/prescriptions/$prescriptionId"
      params={{ prescriptionId: prescription.id }}
      className="card-interactive group animate-fade-in flex items-center gap-3.5 rounded-[20px] p-4"
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[14px] bg-secondary/75 text-primary ring-1 ring-border/50">
        {showSkeleton ? (
          <Skeleton className="h-full w-full rounded-[14px]" />
        ) : preview.data && !imageFailed ? (
          <img
            src={preview.data}
            alt={`Prescription attachment for ${memberName}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <FileText className="h-6 w-6" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
            {prescription.doctor_name || "No doctor recorded"}
          </span>
          {prescription.specialty && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              {prescription.specialty}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-medium text-foreground/85">
            <span
              className={cn(
                "grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold",
                memberTint.avatar,
              )}
            >
              <User className="h-2.5 w-2.5" />
            </span>
            For {memberName}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{formatDate(prescription.prescription_date)}</span>
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const summary = useQuery(dashboardQuery);
  const members = useQuery(familyMembersQuery);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("all");

  const memberList = members.data ?? [];
  const nameById = new Map(memberList.map((m) => [m.id, m.name]));
  const countById = new Map(
    (summary.data?.per_family_member ?? []).map((p) => [p.family_member_id, p.prescription_count]),
  );
  const recent = summary.data?.recent_prescriptions ?? [];

  const latestVisitByMember = new Map<
    string,
    { date: string; doctor: string | null; specialty: string | null }
  >();
  for (const item of recent) {
    const existing = latestVisitByMember.get(item.family_member_id);
    if (!existing || item.prescription_date > existing.date) {
      latestVisitByMember.set(item.family_member_id, {
        date: item.prescription_date,
        doctor: item.doctor_name,
        specialty: item.specialty,
      });
    }
  }

  const greeting = getTimeGreeting();
  const firstName = getGreetingFirstName(user);
  const greetingText = firstName ? `${greeting}, ${firstName}` : greeting;

  const totalMembers = summary.data?.total_family_members ?? 0;
  const totalPrescriptions = summary.data?.total_prescriptions ?? 0;

  const visibleRecent =
    selectedMemberId === "all"
      ? recent
      : recent.filter((item) => item.family_member_id === selectedMemberId);

  const membersInRecent = memberList.filter((m) =>
    recent.some((item) => item.family_member_id === m.id),
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Greeting + Summary Stats */}
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
        <div className="min-w-0 space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wider text-primary uppercase">
            <LockKeyhole className="h-3 w-3" /> Family health vault
          </span>
          <div>
            <h1 className="text-page-title text-balance text-foreground">{greetingText}</h1>
            <p className="text-body mt-2 max-w-xl text-muted-foreground">
              {summary.isLoading
                ? "Gathering your family’s prescription archive…"
                : totalMembers > 0
                  ? `${totalMembers} ${totalMembers === 1 ? "family profile" : "family profiles"} and ${totalPrescriptions} ${totalPrescriptions === 1 ? "prescription record" : "prescription records"} safely stored in your private vault.`
                  : "A calm, private home for the prescription records you want close at hand."}
            </p>
          </div>
        </div>

        {/* Stat Pair */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:w-[min(100%,27rem)]">
          <div className="surface-card min-w-0 rounded-[20px] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">Family members</p>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <Users className="h-3.5 w-3.5" />
              </span>
            </div>
            {summary.isLoading ? (
              <div className="mt-2.5 space-y-2">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
            ) : (
              <>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="font-display text-3xl font-semibold text-primary tabular-nums">
                    {totalMembers}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {totalMembers === 1 ? "profile" : "profiles"}
                  </span>
                </div>
                {memberList.length > 0 && (
                  <div className="mt-3 flex items-center -space-x-1.5">
                    {memberList.slice(0, 4).map((member) => (
                      <span
                        key={member.id}
                        title={member.name}
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ring-2 ring-card",
                          memberStyle(member.id).avatar,
                        )}
                      >
                        {memberInitials(member.name) || "?"}
                      </span>
                    ))}
                    {memberList.length > 4 && (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
                        +{memberList.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="surface-card min-w-0 rounded-[20px] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-muted-foreground">Prescriptions</p>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-secondary text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            </div>
            {summary.isLoading ? (
              <div className="mt-2.5 space-y-2">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="font-display text-3xl font-semibold text-foreground tabular-nums">
                    {totalPrescriptions}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {totalPrescriptions === 1 ? "record" : "records"}
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <LockKeyhole className="h-3 w-3 shrink-0" />
                  <span>Private &amp; encrypted</span>
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Family Circle */}
      <section className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-section-title text-foreground">Your family</h2>
              {!members.isLoading && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                  {memberList.length}
                </span>
              )}
            </div>
            <p className="text-meta mt-1">Quick access to individual records and histories.</p>
          </div>
          <Button asChild variant="ghost" className="h-10 shrink-0 px-2 text-primary sm:px-3">
            <Link to="/family/new">
              <Plus className="mr-1 h-4 w-4" /> Add member
            </Link>
          </Button>
        </div>

        {members.isLoading ? (
          <div className="-mx-4 flex gap-3.5 overflow-hidden px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-60 shrink-0 space-y-4 rounded-[20px] border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] sm:w-auto"
              >
                <div className="flex items-start justify-between">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : memberList.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No family members yet"
            description="Add the first person you look after, then start saving their prescriptions."
            action={
              <Button asChild className="h-11 rounded-full px-5">
                <Link to="/family/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Add family member
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-4">
            {memberList.map((member) => {
              const style = memberStyle(member.id);
              const count = countById.get(member.id) ?? 0;
              const lastVisit = latestVisitByMember.get(member.id);

              return (
                <Link
                  key={member.id}
                  to="/family/$memberId"
                  params={{ memberId: member.id }}
                  className={cn(
                    "group flex w-60 shrink-0 snap-start flex-col justify-between rounded-[20px] border p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] active:scale-[0.99] sm:w-auto sm:p-5",
                    style.card,
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={cn(
                          "grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold shadow-xs ring-2 ring-card/80",
                          style.avatar,
                        )}
                      >
                        {memberInitials(member.name) || <Users className="h-4 w-4" />}
                      </span>
                      <span className="max-w-[8.5rem] truncate rounded-full bg-card/85 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/85 shadow-2xs">
                        {member.relationship ?? "Family"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <p className="font-display truncate text-lg font-semibold text-foreground">
                        {member.name}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-primary tabular-nums">
                        {count} {count === 1 ? "prescription" : "prescriptions"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-card/75 px-3 py-2 backdrop-blur-xs">
                    <div className="flex min-w-0 items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold text-foreground/85 tabular-nums">
                          {lastVisit
                            ? `Last visit: ${formatDate(lastVisit.date)}`
                            : count > 0
                              ? "Last visit: Recorded"
                              : "Last visit: None yet"}
                        </p>
                        {lastVisit?.doctor && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {lastVisit.doctor}
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary transition-transform duration-150 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}

            <Link
              to="/family/new"
              className="flex min-h-44 w-60 shrink-0 snap-start flex-col items-center justify-center gap-2.5 rounded-[20px] border border-dashed border-border bg-card/50 p-4 text-sm font-semibold text-muted-foreground transition-all duration-150 hover:border-primary/60 hover:bg-secondary/40 hover:text-primary sm:w-auto"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">
                <Plus className="h-5 w-5" />
              </span>
              Add family member
            </Link>
          </div>
        )}
      </section>

      {/* Recent Prescriptions */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="text-section-title text-foreground">Recent prescriptions</h2>
            <p className="text-meta mt-1">The latest records added to your family vault.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {membersInRecent.length > 1 && (
              <div
                role="group"
                aria-label="Filter recent prescriptions by family member"
                className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
              >
                <button
                  type="button"
                  onClick={() => setSelectedMemberId("all")}
                  className={cn(
                    "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                    selectedMemberId === "all"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  All ({recent.length})
                </button>
                {membersInRecent.map((member) => {
                  const memberRecentCount = recent.filter(
                    (r) => r.family_member_id === member.id,
                  ).length;
                  const active = selectedMemberId === member.id;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => setSelectedMemberId(member.id)}
                      className={cn(
                        "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {member.name} ({memberRecentCount})
                    </button>
                  );
                })}
              </div>
            )}

            <Link
              to="/search"
              className="inline-flex min-h-9 shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {summary.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 rounded-[20px] border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]"
              >
                <Skeleton className="h-16 w-16 shrink-0 rounded-[14px]" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <Skeleton className="h-3.5 w-44" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={FileHeart}
            title="No prescriptions yet"
            description="Once you save a prescription it will appear here with the most recent first."
            action={
              memberList.length === 1 && memberList[0] ? (
                <Button asChild className="h-11 rounded-full px-5">
                  <Link to="/prescriptions/new" search={{ memberId: memberList[0].id }}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add prescription
                  </Link>
                </Button>
              ) : (
                <Button asChild className="h-11 rounded-full px-5">
                  <Link to={memberList.length === 0 ? "/family/new" : "/prescriptions/new"}>
                    <Plus className="mr-1.5 h-4 w-4" />{" "}
                    {memberList.length === 0 ? "Add family member first" : "Add prescription"}
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visibleRecent.map((p) => (
              <RecentPrescriptionCard
                key={p.id}
                prescription={p}
                memberName={nameById.get(p.family_member_id) ?? "Family member"}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
