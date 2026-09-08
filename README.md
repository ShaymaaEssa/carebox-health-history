# CareBox Health Records

CareBox project:
Build a mobile-first web app called "CareBox" that lets a user keep a

photographed/scanned history of medical prescriptions for themselves and

their family members. I have an existing Supabase backend already built

and tested — connect to it via the Supabase integration. Do not modify

the database schema, table names, column names, or RPC function

signatures described below. Build the UI to match this backend exactly.

## EXISTING DATABASE SCHEMA (do not change this)

- profiles: id (= auth user id), full_name, avatar_url, created_at, updated_at

  — auto-created on signup, read-only from the frontend's perspective

  except for full_name/avatar_url updates.

- family_members: id, user_id, name, relationship, date_of_birth, notes,

  created_at, updated_at

- prescriptions: id, user_id, family_member_id, prescription_date,

  doctor_name, specialty, notes, created_at, updated_at

- prescription_attachments: id, user_id, prescription_id, storage_path,

  original_file_name, file_name, mime_type, file_size,

  original_file_size, display_order (0-3), created_at

  — A PRESCRIPTION MAY HAVE AT MOST 4 ATTACHMENTS. This is enforced by

  the database itself, not just the UI.

  — Allowed mime_type values ONLY: image/jpeg, image/png, image/webp,

  application/pdf. No other file types.

- Storage bucket "prescription-attachments" (PRIVATE — never use public

  URLs, always request a signed URL to display or download a file).

  Path convention: {user_id}/{prescription_id}/{random_uuid}.{ext}

- Row Level Security is already enforced on every table: each user only

  ever sees their own data. Don't add manual user_id filters on reads —

  just query normally as the authenticated user. DO set user_id to the

  current auth user's id on every insert into family_members and

  prescriptions.

- Three RPC functions already exist — use them instead of plain

  inserts/updates for these specific actions:

  1. create_attachment(p_prescription_id, p_storage_path,

     p_original_file_name, p_file_name, p_mime_type, p_file_size,

     p_original_file_size) — call this AFTER uploading a file to

     Storage, to create its metadata row. It safely assigns the next

     free display_order slot (0-3) and enforces the 4-attachment limit.

     It throws an error with the message "Attachment limit reached: a

     prescription may have at most 4 attachments" if 4 already exist —

     show this to the user as a friendly inline message, not a raw

     error toast.

  2. reorder_attachments(p_prescription_id, p_ordered_ids) — call this

     when the user reorders attachment thumbnails via drag-and-drop.

     p_ordered_ids is an array of attachment ids in the new desired

     order. Never update display_order directly with a plain .update()

     call — it will fail due to a uniqueness constraint if done naively.

  3. get_dashboard_summary() — call this on the dashboard/home screen.

     Returns one JSON object: { total_family_members, total_prescriptions,

     per_family_member: [{family_member_id, name, prescription_count}],

     recent_prescriptions: [{id, family_member_id, prescription_date,

     doctor_name, specialty}] }. Use this instead of separate count

     queries.

- A read-only search view, prescription_search_view, joins prescriptions

  with the family member's name for convenient filtering: same columns

  as prescriptions plus family_member_name and

  family_member_relationship. Use this view (not the prescriptions

  table directly) for the search/filter screen.

## AUTH

- Email + password sign up and sign in, and "Continue with Google",

  both via Supabase Auth (already configured on the backend).

- Standard flows: forgot/reset password, sign out, protected routes

  that redirect to login if not authenticated.

- Note: the backend's default email sending is rate-limited (fine for

  real use at small scale, just don't build any assumption of instant

  bulk signups into the UI).

## CORE SCREENS

1. **Login / Sign up** — centered card, Google button with a clear

   divider above/below the email/password form. Minimal, no clutter.

2. **Home / Dashboard** — call get_dashboard_summary() on load. Show:

   total family members and total prescriptions as small stat cards, a

   grid of family member cards (avatar/initials, name, relationship,

   their prescription_count from per_family_member), a "+ Add Family

   Member" card, and a "Recent Prescriptions" list built from

   recent_prescriptions (each row: family member name — look this up

   from the family members you already fetched — prescription_date,

   doctor_name). Tapping a family member card opens their detail

   screen; tapping a recent prescription opens that prescription's

   detail screen directly.

3. **Add / Edit Family Member** — form: name (required), relationship

   (dropdown: Self, Spouse, Son, Daughter, Parent, Other), date_of_birth

   (optional date picker), notes (optional textarea).

4. **Family Member Detail** — header with their info, then their

   prescriptions in reverse-chronological order as cards (date, doctor

   name, specialty if present, notes preview, thumbnail count). "+ Add

   Prescription" button. Edit/delete for the family member itself, with

   a confirmation dialog before delete (deleting cascades to their

   prescriptions and files).

5. **Add / Edit Prescription** — form: prescription_date (required,

   default today), doctor_name (optional), specialty (optional),

   notes (optional), and a multi-file upload area supporting BOTH

   images and PDFs, max 4 files total per prescription. Show a running

   counter like "2/4 attachments". Once 4 are attached, disable the

   add-more control with a short explanation rather than letting the

   user hit the RPC's error.

   File handling, by type:

   - Images (jpeg/png/webp): validate original size ≤20MB, then

     compress/resize client-side to ≤1600px long edge at ~80% quality

     before upload (use a lightweight library like

     browser-image-compression). If still >5MB after compression,

     reject with a clear message. Show a brief "optimizing..." state.

   - PDFs: validate size ≤20MB. Do NOT attempt to compress or modify

     PDFs in any way — upload as-is.

   - Reject any other file type immediately with a clear message before

     attempting upload.

   Upload flow per file: upload to Storage at

   {user_id}/{prescription_id}/{crypto.randomUUID()}.{ext} (ext derived

   from the validated mime type, never from the original filename) →

   call create_attachment() with the resulting path and metadata. If

   create_attachment() fails after a successful upload, remove the

   just-uploaded Storage object so nothing orphaned is left behind.

   Show thumbnails of attached files with drag-to-reorder (call

   reorder_attachments() on drop) and a remove option per file before

   final save. PDFs should show a generic PDF icon/thumbnail, not

   attempt an image preview.

6. **Prescription Detail** — full date/doctor/specialty/notes, and a

   gallery of attachments. Images open in a full-screen swipeable

   lightbox (fetch a signed URL per image, since the bucket is

   private). PDFs open in a new tab/viewer via their own signed URL

   rather than trying to render inline. Edit and delete actions, with

   confirmation before delete — deleting removes both the metadata rows

   and their Storage files (collect the storage_path values before

   deleting the DB rows, delete the DB rows, then remove those paths

   from Storage).

7. **Search** — a search bar querying prescription_search_view across

   doctor_name, specialty, notes, and family_member_name (case-

   insensitive partial match), plus filters for a specific family

   member and a date range. Results list like the prescription cards

   elsewhere, showing which family member each result belongs to.

8. **Settings / Account** — email/name from profiles, sign out, and a

   placeholder "Delete account" (support-contact link is fine for now,

   not a fully wired destructive action).

## UX / DESIGN DIRECTION

- Mobile-first, calm and trustworthy rather than clinical or playful —

  think "personal health records," not "hospital software" or "cute

  consumer app."

- Generous touch targets, clear empty states with a short

  call-to-action rather than a blank screen, loading skeletons instead

  of blank flashes.

- Toast/snackbar confirmations for saves; all deletes require an

  explicit confirmation step.

- Lazy-load thumbnails so screens with many prescriptions/attachments

  stay fast.

- Surface backend errors as short, friendly inline messages — e.g. the

  attachment-limit error, or a rejected file type/size — never a raw

  Postgres error string.

## OUT OF SCOPE FOR NOW

- Sharing a family member between multiple accounts.

- Notifications/reminders.

- Native mobile app packaging.

- HEIC file support.

Please connect this to my existing Supabase project (I'll provide the

URL and anon key), use the schema and RPCs exactly as described above,

and prioritize getting auth and the full family member → prescription →

attachment flow working end to end before polishing visuals further.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/84cb4d65-e2dd-4d01-ba2c-b19c1094e09d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
