import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div>
      <PageHeader title="Search" />

      <div className="space-y-4">
        <Input
          className="h-12"
          placeholder="Doctor, specialty, notes or family member"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />

        <div className="space-y-2">
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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" className="h-12" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" className="h-12" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {results.isLoading && [0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        {!results.isLoading && (results.data?.length ?? 0) === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              No prescriptions match these filters yet.
            </CardContent>
          </Card>
        )}
        {(results.data ?? []).map((row) => (
          <Link
            key={row.id}
            to="/prescriptions/$prescriptionId"
            params={{ prescriptionId: row.id }}
            className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate font-medium text-foreground">{row.family_member_name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDate(row.prescription_date)}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{row.doctor_name || "No doctor recorded"}</p>
            {row.specialty && <p className="text-xs text-muted-foreground">{row.specialty}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
