import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
import { useActionError } from "@/lib/use-action-error";

export function FamilyMemberForm({ memberId }: { memberId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportError = useActionError();
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

  async function save() {
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
        await queryClient.invalidateQueries();
        toast.success("Family member updated");
        navigate({ to: "/family/$memberId", params: { memberId }, replace: true });
      } else {
        const { data, error: insertError } = await supabase
          .from("family_members")
          .insert({ ...payload, user_id: user.id })
          .select("id")
          .single();
        if (insertError) throw insertError;
        await queryClient.invalidateQueries();
        toast.success("Family member added");
        navigate({ to: "/family/$memberId", params: { memberId: data.id as string }, replace: true });
      }
    } catch (err) {
      setError(
        reportError(err, {
          fallback: "We couldn't save this family member. Please try again.",
          retry: save,
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await save();
  }

  return (
    <div>
      <PageHeader
        title={memberId ? "Edit family member" : "Add family member"}
        subtitle="Keep a separate record for each person you look after."
        backTo="/dashboard"
      />
      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              disabled={busy}
              className="h-12 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship} disabled={busy}>
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

          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              disabled={busy}
              className="h-12 w-full"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          <div className="min-w-0 space-y-2 sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={4}
              disabled={busy}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="h-12 w-full sm:w-auto sm:min-w-44" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? "Saving…" : "Save"}
        </Button>
      </form>
    </div>
  );
}
