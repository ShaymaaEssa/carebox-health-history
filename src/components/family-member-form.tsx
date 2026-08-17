import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { familyMemberQuery } from "@/lib/queries";
import { RELATIONSHIPS } from "@/lib/types";

export function FamilyMemberForm({ memberId }: { memberId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const existing = useQuery({ ...familyMemberQuery(memberId ?? ""), enabled: Boolean(memberId) });

  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<string>("Self");
  const [dob, setDob] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existing.data) return;
    setName(existing.data.name);
    setRelationship(existing.data.relationship ?? "Other");
    setDob(existing.data.date_of_birth ?? "");
    setNotes(existing.data.notes ?? "");
  }, [existing.data]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);

    const payload = {
      name: name.trim(),
      relationship,
      date_of_birth: dob || null,
      notes: notes.trim() || null,
    };

    try {
      if (memberId) {
        const { error: updateError } = await supabase
          .from("family_members")
          .update(payload)
          .eq("id", memberId);
        if (updateError) throw updateError;
        toast.success("Family member updated");
      } else {
        const { data, error: insertError } = await supabase
          .from("family_members")
          .insert({ ...payload, user_id: user.id })
          .select("id")
          .single();
        if (insertError) throw insertError;
        toast.success("Family member added");
        await queryClient.invalidateQueries();
        navigate({ to: "/family/$memberId", params: { memberId: data.id as string }, replace: true });
        return;
      }
      await queryClient.invalidateQueries();
      navigate({ to: "/family/$memberId", params: { memberId }, replace: true });
    } catch {
      setError("We couldn't save this family member. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={memberId ? "Edit family member" : "Add family member"} backTo="/dashboard" />
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            className="h-12"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship">Relationship</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger id="relationship" className="h-12 w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            type="date"
            className="h-12"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="h-12 w-full" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}
