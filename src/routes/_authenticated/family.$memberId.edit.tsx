import { createFileRoute } from "@tanstack/react-router";

import { FamilyMemberForm } from "@/components/family-member-form";

export const Route = createFileRoute("/_authenticated/family/$memberId/edit")({
  head: () => ({
    meta: [
      { title: "Edit family member — CareBox" },
      { name: "description", content: "Update this family member's details in CareBox." },
      { property: "og:title", content: "Edit family member — CareBox" },
      { property: "og:description", content: "Update this family member's details in CareBox." },
    ],
  }),
  component: EditMember,
});

function EditMember() {
  const { memberId } = Route.useParams();
  return <FamilyMemberForm memberId={memberId} />;
}
