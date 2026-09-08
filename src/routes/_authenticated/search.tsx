import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { friendlyMessage } from "@/lib/errors";
import { familyMembersQuery } from "@/lib/queries";
import type { PrescriptionSearchRow } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search prescriptions — CareBox" },
      { name: "description", content: "Search prescriptions by doctor, specialty, notes or family member." },
      { property: "og:title", content: "Search prescriptions — CareBox" },
      { property: "og:description", content: "Search prescriptions by doctor, specialty, notes or family member." },
    ],
  }),
  component: SearchPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SearchPage() {
  const [term, setTerm] = useState("");
  const [memberId, setMemberId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const members = useQuery(familyMembersQuery);

  const results = useQuery({
    queryKey: ["search", term, memberId, from, to],
    queryFn: async (): Promise<PrescriptionSearchRow[]> => {
      let query = supabase
        .from("prescription_search_view")
        .select("*")
        .order("prescription_date", { ascending: false })
        .limit(50);

      const clean = term.trim();
      if (clean) {
        const pattern = `%${clean}%`;
        query = query.or(
          `doctor_name.ilike.${pattern},specialty.ilike.${pattern},notes.ilike.${pattern},family_member_name.ilike.${pattern}`,
        );
      }
      if (memberId !== "all") query = query.eq("family_member_id", memberId);
      if (from) query = query.gte("prescription_date", from);
      if (to) query = query.lte("prescription_date", to);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PrescriptionSearchRow[];
    },
  });

  const hasFilters = Boolean(term.trim() || memberId !== "all" || from || to);
  const rows = results.data ?? [];

  function clearFilters() {
    setTerm("");
    setMemberId("all");
    setFrom("");
    setTo("");
  }

  return (
    <div>
      <PageHeader title="Search" subtitle="Find any prescription across your whole family." />

      <div className="surface-card grid gap-4 p-4 sm:p-5 lg:grid-cols-4">
        <div className="min-w-0 space-y-2 lg:col-span-2">
          <Label htmlFor="term">Keyword</Label>
          <Input
            id="term"
            className="h-12 w-full"
            placeholder="Doctor, specialty, notes or family member"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>

        <div className="min-w-0 space-y-2 lg:col-span-2">
          <Label>Family member</Label>
          <Select value={memberId} onValueChange={setMemberId}>
            <SelectTrigger className="h-12 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everyone</SelectItem>
              {(members.data ?? []).map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-2 lg:col-span-2">
          <Label htmlFor="from">From</Label>
          <Input
            id="from"
            type="date"
            className="h-12 w-full"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="min-w-0 space-y-2 lg:col-span-2">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            type="date"
            className="h-12 w-full"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {results.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}

        {results.isError && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {friendlyMessage(results.error, "We couldn't run that search. Please try again.")}
          </p>
        )}

        {!results.isLoading && !results.isError && rows.length === 0 && (
          <EmptyState
            icon={SearchX}
            title="No matching prescriptions"
            description={
              hasFilters
                ? "Try a different keyword, a wider date range, or clear the filters."
                : "Once you save prescriptions they'll be searchable here."
            }
            {...(hasFilters
              ? {
                  action: (
                    <Button variant="outline" className="h-11" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  ),
                }
              : {})}
          />
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((row) => (
            <Link
              key={row.id}
              to="/prescriptions/$prescriptionId"
              params={{ prescriptionId: row.id }}
              className="card-interactive animate-fade-in block p-4 sm:p-5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-card-title truncate text-foreground">{row.family_member_name}</span>
                <span className="text-meta shrink-0">{formatDate(row.prescription_date)}</span>
              </div>
              <p className="text-body mt-1 text-muted-foreground">
                {row.doctor_name || "No doctor recorded"}
              </p>
              {row.specialty && <p className="text-meta">{row.specialty}</p>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
