import { cn } from "@/lib/utils";

const MEMBER_STYLES = [
  { avatar: "bg-member-coral text-member-coral-foreground", badge: "bg-member-coral/45 text-member-coral-foreground" },
  { avatar: "bg-member-gold text-member-gold-foreground", badge: "bg-member-gold/45 text-member-gold-foreground" },
  { avatar: "bg-member-mint text-member-mint-foreground", badge: "bg-member-mint/45 text-member-mint-foreground" },
  { avatar: "bg-member-sky text-member-sky-foreground", badge: "bg-member-sky/45 text-member-sky-foreground" },
  { avatar: "bg-member-lilac text-member-lilac-foreground", badge: "bg-member-lilac/45 text-member-lilac-foreground" },
  { avatar: "bg-member-rose text-member-rose-foreground", badge: "bg-member-rose/45 text-member-rose-foreground" },
] as const;

function memberIndex(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % MEMBER_STYLES.length;
}

export function memberStyle(id: string) {
  return MEMBER_STYLES[memberIndex(id)] ?? MEMBER_STYLES[0];
}

export function memberInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function relationshipBadgeClass(id: string, className?: string) {
  return cn("relationship-badge", memberStyle(id).badge, className);
}
