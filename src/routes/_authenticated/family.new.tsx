import { createFileRoute } from "@tanstack/react-router";

import { FamilyMemberForm } from "@/components/family-member-form";

export const Route = createFileRoute("/_authenticated/family/new")({
  head: () => ({
    meta: [
      { title: "Add family member — CareBox" },
      { name: "description", content: "Add a family member to keep their prescription history in CareBox." },
      { property: "og:title", content: "Add family member — CareBox" },
      { property: "og:description", content: "Add a family member to keep their prescription history in CareBox." },
    ],
  }),
  component: () => <FamilyMemberForm />,
});
