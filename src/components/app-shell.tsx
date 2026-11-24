import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ChevronDown,
  ChevronsUpDown,
  HeartPulse,
  Home,
  LogOut,
  Plus,
  Search,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { memberInitials, memberStyle } from "@/lib/member-style";
import { familyMembersQuery } from "@/lib/queries";
import { useActionError } from "@/lib/use-action-error";

const navItems = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/settings", label: "Account", icon: Settings },
] as const;

function getDisplayName(user: ReturnType<typeof useAuth>["user"]) {
  const metaFull = user?.user_metadata?.["full_name"];
  const metaName = user?.user_metadata?.["name"];
  const raw =
    (typeof metaFull === "string" && metaFull.trim()) ||
    (typeof metaName === "string" && metaName.trim()) ||
    "";
  if (raw) return raw;
  if (user?.email) return user.email.split("@")[0] ?? "Account";
  return "Account";
}

function AccountMenu({
  children,
  displayName,
  email,
  initials,
  side = "bottom",
  align = "end",
  onQuickAdd,
  onRequestSignOut,
}: {
  children: ReactNode;
  displayName: string;
  email: string | undefined;
  initials: string;
  side?: "top" | "bottom" | "right" | "left";
  align?: "start" | "end" | "center";
  onQuickAdd: () => void;
  onRequestSignOut: () => void;
}) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        side={side}
        align={align}
        sideOffset={8}
        className="w-64 rounded-[20px] border-border/80 bg-card p-1.5 shadow-[var(--shadow-lift)]"
      >
        <DropdownMenuLabel className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 font-normal">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary ring-1 ring-border/70">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{email ?? "Private vault"}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-1 bg-border/70" />

        <DropdownMenuGroup className="space-y-0.5">
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/dashboard" })}
            className="cursor-pointer rounded-xl px-2.5 py-2 text-sm font-medium focus:bg-secondary/70 focus:text-primary"
          >
            <Home className="h-4 w-4 text-muted-foreground" />
            <span>Family dashboard</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/search" })}
            className="cursor-pointer rounded-xl px-2.5 py-2 text-sm font-medium focus:bg-secondary/70 focus:text-primary"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <span>Search prescriptions</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onQuickAdd}
            className="cursor-pointer rounded-xl px-2.5 py-2 text-sm font-medium focus:bg-secondary/70 focus:text-primary"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <span>Add prescription</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/family/new" })}
            className="cursor-pointer rounded-xl px-2.5 py-2 text-sm font-medium focus:bg-secondary/70 focus:text-primary"
          >
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span>Add family member</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate({ to: "/settings" })}
            className="cursor-pointer rounded-xl px-2.5 py-2 text-sm font-medium focus:bg-secondary/70 focus:text-primary"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span>Account settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="my-1 bg-border/70" />

        <DropdownMenuItem
          onSelect={onRequestSignOut}
          className="cursor-pointer rounded-xl px-2.5 py-2 text-sm font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const reportError = useActionError();
  const members = useQuery(familyMembersQuery);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const memberList = members.data ?? [];
  const displayName = getDisplayName(user);
  const initials = memberInitials(displayName) || "CB";
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  function handleQuickAdd() {
    if (memberList.length === 0) {
      navigate({ to: "/family/new" });
      return;
    }
    if (memberList.length === 1 && memberList[0]) {
      navigate({ to: "/prescriptions/new", search: { memberId: memberList[0].id } });
      return;
    }
    setPickerOpen(true);
  }

  async function handleSignOut() {
    try {
      await queryClient.cancelQueries();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      queryClient.clear();
      toast.success("Signed out");
      navigate({ to: "/auth", replace: true });
    } catch (error) {
      reportError(error, { fallback: "We couldn't sign you out. Please try again." });
    }
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Desktop / tablet left sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-border/80 bg-sidebar px-4 py-6 text-sidebar-foreground shadow-[1px_0_14px_rgba(13,94,79,0.03)] md:flex">
        <div className="flex flex-col gap-6">
          <Link to="/dashboard" className="flex items-center gap-2.5 px-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[0_4px_12px_-2px_rgba(13,94,79,0.25)]">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-xl leading-none font-semibold tracking-tight text-primary">
                CareBox
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                Family Prescriptions
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleQuickAdd}
            className="flex h-11 w-full cursor-pointer items-center justify-between rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_6px_18px_-4px_rgba(13,94,79,0.3)] transition-all duration-150 hover:bg-brand-deep active:scale-[0.98]"
          >
            <span className="whitespace-nowrap">Add prescription</span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-foreground/15 text-primary-foreground">
              <Plus className="h-4 w-4" />
            </span>
          </button>

          <nav aria-label="Primary" className="flex flex-col gap-1.5">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground active:scale-[0.98]"
                activeProps={{
                  className:
                    "bg-secondary text-primary font-semibold shadow-[0_1px_4px_rgba(13,94,79,0.06)]",
                }}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <AccountMenu
          displayName={displayName}
          email={user?.email}
          initials={initials}
          side="top"
          align="start"
          onQuickAdd={handleQuickAdd}
          onRequestSignOut={() => setSignOutOpen(true)}
        >
          <button
            type="button"
            aria-label="Account menu"
            className="flex w-full cursor-pointer items-center gap-3 rounded-[16px] border border-border/70 bg-card p-3 text-left shadow-[0_2px_10px_-2px_rgba(13,94,79,0.04)] transition-all hover:border-primary/30 hover:shadow-[var(--shadow-card)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary ring-2 ring-secondary">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email ?? "Private vault"}
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </AccountMenu>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <HeartPulse className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight text-primary">
              CareBox
            </span>
          </Link>

          <AccountMenu
            displayName={displayName}
            email={user?.email}
            initials={initials}
            side="bottom"
            align="end"
            onQuickAdd={handleQuickAdd}
            onRequestSignOut={() => setSignOutOpen(true)}
          >
            <button
              type="button"
              aria-label="Open account menu"
              className="flex h-11 min-w-11 cursor-pointer items-center gap-1.5 rounded-full border border-border/70 bg-card py-1 pr-2.5 pl-1 shadow-2xs transition-colors hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                {initials}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </AccountMenu>
        </header>

        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl md:block">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-6 px-6 lg:px-10">
            <Link
              to="/search"
              className="flex h-10 w-full max-w-sm items-center gap-2.5 rounded-full border border-border/80 bg-card px-4 text-xs font-medium text-muted-foreground shadow-[0_1px_4px_rgba(13,94,79,0.03)] transition-colors hover:border-primary/35 hover:text-foreground"
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">Search doctors, specialties, notes…</span>
            </Link>
            <div className="flex shrink-0 items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {todayLabel}
              </span>
              <AccountMenu
                displayName={displayName}
                email={user?.email}
                initials={initials}
                side="bottom"
                align="end"
                onQuickAdd={handleQuickAdd}
                onRequestSignOut={() => setSignOutOpen(true)}
              >
                <button
                  type="button"
                  aria-label="Open account menu"
                  className="flex h-10 max-w-52 cursor-pointer items-center gap-2 rounded-full border border-border/70 bg-card py-1 pr-3 pl-1 text-left shadow-[0_1px_4px_rgba(13,94,79,0.03)] transition-all hover:border-primary/35 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-primary">
                    {initials}
                  </span>
                  <span className="truncate text-xs font-semibold text-foreground">
                    {displayName}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              </AccountMenu>
            </div>
          </div>
        </header>

        <main className="animate-rise-in mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 sm:px-6 md:pb-12 lg:px-10 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(13,94,79,0.06)] backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-around px-2">
          <Link
            to="/dashboard"
            className="flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>

          <Link
            to="/search"
            className="flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </Link>

          <button
            type="button"
            aria-label="Add prescription"
            onClick={handleQuickAdd}
            className="-mt-6 grid h-14 w-14 shrink-0 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_24px_rgba(13,94,79,0.32)] ring-4 ring-background transition-transform hover:bg-brand-deep active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>

          <Link
            to="/settings"
            className="flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-muted-foreground transition-colors active:scale-95"
            activeProps={{ className: "text-primary font-semibold" }}
          >
            <Settings className="h-5 w-5" />
            <span>Account</span>
          </Link>
        </div>
      </nav>

      {/* Member picker dialog when adding a prescription from global "+" */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="rounded-[20px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add prescription</DialogTitle>
            <DialogDescription>
              Choose which family member this prescription belongs to.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 grid gap-2">
            {memberList.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  setPickerOpen(false);
                  navigate({ to: "/prescriptions/new", search: { memberId: member.id } });
                }}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-[16px] border border-border bg-card p-3 text-left transition-all hover:border-primary/40 hover:bg-secondary/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-bold ${memberStyle(member.id).avatar}`}
                  >
                    {memberInitials(member.name) || <Users className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.relationship ?? "Family"}
                    </p>
                  </div>
                </div>
                <Plus className="h-4 w-4 shrink-0 text-primary" />
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPickerOpen(false);
                navigate({ to: "/family/new" });
              }}
              className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-[16px] border border-dashed border-border p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <UserPlus className="h-4 w-4" />
              Add new family member
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out of CareBox?"
        description="You'll need to sign in again to view your family's records."
        confirmLabel="Sign out"
        busyLabel="Signing out…"
        onConfirm={handleSignOut}
      />
    </div>
  );
}
