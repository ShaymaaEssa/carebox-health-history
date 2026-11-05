<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

Keep optional prescription-field normalization and validation in shared `src/lib/prescription-details.ts` so create and edit apply identical rules.


## CareBox project rules (read before changing anything)

- Stack: TanStack Start (file-based routes in src/routes), React,
  TypeScript, Tailwind/shadcn, Supabase. Package manager: bun.
- The Supabase database is managed OUTSIDE this repo. Never create,
  alter, or migrate tables, policies, storage buckets, or functions.
  Never add the Supabase service-role key anywhere. Only the public
  URL and anon key are used by the app.
- Existing tables: profiles, family_members, prescriptions,
  prescription_attachments, plus the view prescription_search_view and
  RPCs create_attachment, reorder_attachments, get_dashboard_summary.
- Attachments: max 4 per prescription. Always create them with the
  create_attachment RPC and reorder with reorder_attachments. Never
  update display_order directly.
- Storage bucket "prescription-attachments" is private. Always use
  signed URLs. Path: {user_id}/{prescription_id}/{uuid}.{ext}.
- src/routeTree.gen.ts is auto-generated. Never edit it by hand. After
  adding or renaming a route file, run the build (or dev server) so it
  regenerates, and commit the regenerated file.
- Keep changes small and scoped to the task. Do not restyle or refactor
  unrelated screens. Surface backend errors as friendly messages, never
  raw database errors.
- Before opening a PR: install dependencies, then run typecheck, lint,
  and build, and fix any failures.
