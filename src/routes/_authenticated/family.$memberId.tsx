import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileHeart,
  FileText,
  Paperclip,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { memberInitials, memberStyle } from "@/lib/member-style";
import { familyMemberQuery, memberPrescriptionsQuery } from "@/lib/queries";
import type { Prescription } from "@/lib/types";
import { useActionError } from "@/lib/use-action-error";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/family/$memberId")({
  head: () => ({
    meta: [
      { title: "Family member — CareBox" },
      {
        name: "description",
        content: "Prescription history for this family member in CareBox.",
      },
      { property: "og:title", content: "Family member — CareBox" },
      {
        property: "og:description",
        content: "Prescription history for this family member in CareBox.",
      },
    ],
  }),
  component: MemberDetail,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonthYear(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function MemberDetail() {
  const { memberId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportError = useActionError();
  const member = useQuery(familyMemberQuery(memberId));
  const prescriptions = useQuery(memberPrescriptionsQuery(memberId));
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("all");

  async function handleDelete() {
    const { error } = await supabase.from("family_members").delete().eq("id", memberId);
    if (error) {
      reportError(error, {
        fallback: "We couldn't delete this family member. Please try again.",
        retry: handleDelete,
      });
      return;
    }
    await queryClient.invalidateQueries();
    toast.success("Family member deleted");
    navigate({ to: "/dashboard", replace: true });
  }

  const list = prescriptions.data ?? [];
  const style = memberStyle(memberId);

  const uniqueDoctors = new Set(
    list.map((p) => p.doctor_name?.trim()).filter((v): v is string => Boolean(v)),
  ).size;
  const lastVisitDate = list[0]?.prescription_date;

  const specialties = Array.from(
    new Set(list.map((p) => p.specialty?.trim()).filter((v): v is string => Boolean(v))),
  );

  const filteredList =
    selectedSpecialty === "all"
      ? list
      : list.filter((p) => p.specialty?.trim() === selectedSpecialty);

  const groupedByMonth = new Map<string, (Prescription & { attachment_count: number })[]>();
  for (const item of filteredList) {
    const key = formatMonthYear(item.prescription_date);
    const group = groupedByMonth.get(key) ?? [];
    group.push(item);
    groupedByMonth.set(key, group);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Top breadcrumb / back strip */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/dashboard"
          className="inline-flex min-h-10 items-center gap-1 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to family
        </Link>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-card shadow-2xs"
          >
            <Link to="/family/$memberId/edit" params={{ memberId }} aria-label="Edit family member">
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full bg-card text-destructive shadow-2xs hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete family member"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Member Hero Card */}
      {member.isLoading ? (
        <div className="rounded-[20px] border border-border/70 bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-11 w-40 rounded-full" />
          </div>
        </div>
      ) : (
        member.data && (
          <section
            className={cn(
              "rounded-[20px] border p-5 shadow-[var(--shadow-card)] sm:p-6",
              style.card,
            )}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <span
                  className={cn(
                    "grid h-18 w-18 shrink-0 place-items-center rounded-full text-xl font-bold shadow-xs ring-4 ring-card/85",
                    style.avatar,
                  )}
                >
                  {memberInitials(member.data.name) || <Users className="h-6 w-6" />}
                </span>

                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {member.data.name}
                    </h1>
                    <span className="rounded-full bg-card/90 px-3 py-0.5 text-xs font-semibold text-foreground/85 shadow-2xs">
                      {member.data.relationship ?? "Family"}
                    </span>
                  </div>
                  {member.data.date_of_birth && (
                    <p className="text-xs font-medium text-muted-foreground tabular-nums">
                      Born {formatDate(member.data.date_of_birth)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
                <div className="grid grid-cols-3 divide-x divide-border/70 rounded-2xl bg-card/80 px-2 py-2.5 text-center shadow-2xs backdrop-blur-xs">
                  <div className="px-3">
                    <p className="font-display text-lg font-semibold text-foreground tabular-nums">
                      {list.length}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">Prescriptions</p>
                  </div>
                  <div className="px-3">
                    <p className="font-display text-lg font-semibold text-foreground tabular-nums">
                      {uniqueDoctors}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">Doctors</p>
                  </div>
                  <div className="px-3">
                    <p className="font-display text-lg font-semibold text-foreground tabular-nums">
                      {lastVisitDate
                        ? new Date(lastVisitDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground">Last visit</p>
                  </div>
                </div>

                <Button
                  asChild
                  className="h-11 shrink-0 rounded-full px-5 font-semibold shadow-[0_6px_18px_-4px_rgba(13,94,79,0.28)]"
                >
                  <Link to="/prescriptions/new" search={{ memberId }}>
                    <Plus className="mr-1.5 h-4 w-4" /> Add prescription
                  </Link>
                </Button>
              </div>
            </div>

            {member.data.notes && (
              <div className="mt-4 rounded-2xl bg-card/75 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                {member.data.notes}
              </div>
            )}
          </section>
        )
      )}

      {/* Specialty Filter Tabs */}
      {!prescriptions.isLoading && specialties.length > 1 && (
        <div
          role="group"
          aria-label="Filter prescriptions by specialty"
          className="flex items-center gap-2 overflow-x-auto pb-1"
        >
          <button
            type="button"
            onClick={() => setSelectedSpecialty("all")}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
              selectedSpecialty === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-card text-muted-foreground shadow-2xs ring-1 ring-border/70 hover:text-foreground",
            )}
          >
            All records ({list.length})
          </button>
          {specialties.map((spec) => {
            const active = selectedSpecialty === spec;
            return (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card text-muted-foreground shadow-2xs ring-1 ring-border/70 hover:text-foreground",
                )}
              >
                {spec}
              </button>
            );
          })}
        </div>
      )}

      {/* Chronological Prescription Timeline */}
      <section className="space-y-6">
        {prescriptions.isLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-[20px] border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-4 w-48" />
                <Skeleton className="mt-2 h-4 w-full" />
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={FileHeart}
            title="No prescriptions yet"
            description={`Save ${member.data?.name ?? "their"} first prescription — snap a photo or attach a PDF.`}
            action={
              <Button asChild className="h-11 rounded-full px-5">
                <Link to="/prescriptions/new" search={{ memberId }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add prescription
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="relative space-y-8 pl-6 sm:pl-8">
            <div
              aria-hidden="true"
              className="absolute top-2 bottom-4 left-2 w-px bg-border sm:left-3"
            />

            {Array.from(groupedByMonth.entries()).map(([monthLabel, items]) => (
              <div key={monthLabel} className="space-y-3.5">
                <div className="relative flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="absolute -left-6 grid h-4 w-4 place-items-center rounded-full bg-secondary ring-4 ring-background sm:-left-8"
                  >
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    {monthLabel}
                  </h2>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                    {items.length} {items.length === 1 ? "visit" : "visits"}
                  </span>
                </div>

                <div className="grid gap-3.5 lg:grid-cols-2">
                  {items.map((p) => (
                    <Link
                      key={p.id}
                      to="/prescriptions/$prescriptionId"
                      params={{ prescriptionId: p.id }}
                      className="card-interactive group animate-fade-in flex flex-col justify-between gap-3 rounded-[20px] p-4 sm:p-5"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground tabular-nums">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              {formatDate(p.prescription_date)}
                            </span>
                            {p.specialty && (
                              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                {p.specialty}
                              </span>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/70 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                        </div>

                        <p className="font-display text-lg font-semibold text-foreground">
                          {p.doctor_name || "No doctor recorded"}
                        </p>

                        {(p.notes || p.doctor_instructions || p.symptoms) && (
                          <p className="line-clamp-2 rounded-xl bg-muted/55 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                            {p.notes || p.doctor_instructions || p.symptoms}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          {p.attachment_count > 0 ? (
                            <>
                              <Paperclip className="h-3.5 w-3.5 text-primary" />
                              <span className="tabular-nums">
                                {p.attachment_count}{" "}
                                {p.attachment_count === 1 ? "attachment" : "attachments"}
                              </span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3.5 w-3.5" />
                              <span>No attachments</span>
                            </>
                          )}
                        </span>
                        <span className="font-semibold text-primary">View record</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this family member?"
        description="This also deletes all of their prescriptions and attached files. This can't be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
