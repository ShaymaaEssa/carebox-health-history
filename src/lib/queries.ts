import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { listAttachments } from "./attachments";
import type { FamilyMember, Prescription } from "./types";

export type DashboardSummary = {
  total_family_members: number;
  total_prescriptions: number;
  per_family_member: { family_member_id: string; name: string; prescription_count: number }[];
  recent_prescriptions: {
    id: string;
    family_member_id: string;
    prescription_date: string;
    doctor_name: string | null;
    specialty: string | null;
  }[];
};

export const dashboardQuery = queryOptions({
  queryKey: ["dashboard-summary"],
  queryFn: async (): Promise<DashboardSummary> => {
    const { data, error } = await supabase.rpc("get_dashboard_summary");
    if (error) throw error;
    return data as DashboardSummary;
  },
});

export const familyMembersQuery = queryOptions({
  queryKey: ["family-members"],
  queryFn: async (): Promise<FamilyMember[]> => {
    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as FamilyMember[];
  },
});

export const familyMemberQuery = (id: string) =>
  queryOptions({
    queryKey: ["family-member", id],
    queryFn: async (): Promise<FamilyMember> => {
      const { data, error } = await supabase.from("family_members").select("*").eq("id", id).single();
      if (error) throw error;
      return data as FamilyMember;
    },
  });

export const memberPrescriptionsQuery = (memberId: string) =>
  queryOptions({
    queryKey: ["prescriptions", memberId],
    queryFn: async (): Promise<(Prescription & { attachment_count: number })[]> => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*, prescription_attachments(id)")
        .eq("family_member_id", memberId)
        .order("prescription_date", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { prescription_attachments, ...rest } = row as Prescription & {
          prescription_attachments: { id: string }[] | null;
        };
        return { ...rest, attachment_count: prescription_attachments?.length ?? 0 };
      });
    },
  });

export const prescriptionQuery = (id: string) =>
  queryOptions({
    queryKey: ["prescription", id],
    queryFn: async (): Promise<Prescription> => {
      const { data, error } = await supabase.from("prescriptions").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Prescription;
    },
  });

export const attachmentsQuery = (prescriptionId: string) =>
  queryOptions({
    queryKey: ["attachments", prescriptionId],
    queryFn: () => listAttachments(prescriptionId),
  });
