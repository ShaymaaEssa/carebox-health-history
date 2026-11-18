---
name: Serene Apothecary
colors:
  surface: '#fafaf5'
  surface-dim: '#dadad6'
  surface-bright: '#fafaf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ef'
  surface-container: '#eeeee9'
  surface-container-high: '#e8e8e4'
  surface-container-highest: '#e2e3de'
  on-surface: '#1a1c19'
  on-surface-variant: '#3f4945'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f1f1ec'
  outline: '#6f7975'
  outline-variant: '#bec9c4'
  surface-tint: '#1f6a5a'
  primary: '#004539'
  on-primary: '#ffffff'
  primary-container: '#0d5e4f'
  on-primary-container: '#8ed5c2'
  inverse-primary: '#8ed4c1'
  secondary: '#4f635b'
  on-secondary: '#ffffff'
  secondary-container: '#d1e7dd'
  on-secondary-container: '#556961'
  tertiary: '#6a2700'
  on-tertiary: '#ffffff'
  tertiary-container: '#8b3b0e'
  on-tertiary-container: '#ffb796'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9f1dd'
  primary-fixed-dim: '#8ed4c1'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#d1e7dd'
  secondary-fixed-dim: '#b6cbc2'
  on-secondary-fixed: '#0c1f19'
  on-secondary-fixed-variant: '#374b44'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb694'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7a2f01'
  background: '#fafaf5'
  on-background: '#1a1c19'
  surface-variant: '#e2e3de'
typography:
  display:
    fontFamily: Merriweather
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 52px
  display-mobile:
    fontFamily: Merriweather
    fontSize: 30px
    fontWeight: '400'
    lineHeight: 40px
  headline-lg:
    fontFamily: Merriweather
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 42px
  headline-lg-mobile:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  headline-md:
    fontFamily: Merriweather
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  headline-sm:
    fontFamily: Merriweather
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style

This design system expresses quiet competence, empathetic warmth, and clinical precision tailored for family health management. Managing prescriptions across generations often introduces cognitive load and latent anxiety; the interface counterbalances this with a soothing, grounded aesthetic that feels like a trusted apothecary rather than a cold institutional portal.

The visual style blends refined editorial warmth with modern tactile elements:
- Generous breathing room and soft, layered tonal surfaces ease user anxiety during complex dosage scheduling.
- Deep botanical teals evoke medical authority and organic health, paired with sunlit amber accents for timely reminders and calls to action.
- Rich serif headlines bring a human, reassuring literary cadence, balanced by a highly legible humanist sans-serif body for error-free medical comprehension.

## Colors

The palette establishes an atmosphere of safety, natural vitality, and immediate clarity. 

- **Primary (`#0D5E4F` - Deep Forest Teal):** Represents security, efficacy, and clinical grounding. Applied to primary CTAs, active states, key titles, and authoritative navigation elements.
- **Secondary (`#D1E7DD` - Soft Sage Mint):** Acts as a structural calming agent. Paired with its tint variant (`#E8F3EE`) for container backgrounds, passive selection fills, medication schedule tracking blocks, and informational tags.
- **Tertiary (`#D97746` - Warm Terracotta Amber):** Provides warm visual punch for refill alerts, urgent intake schedules, primary creation badges, and low-inventory warnings.
- **Neutral Surface (`#FAFAF5` - Warm Cream Canvas):** Replaces harsh sterile white with a gentle, paper-like off-white background that reduces ocular fatigue during prolonged medication entry.
- **Typography & Details:**
  - High-contrast body text uses Dark Slate (`#1D2925`) to preserve readability without harsh black lines.
  - Subtext and metadata use Soft Botanical Slate (`#5C6B64`), maintaining accessible WCAG AAA contrast ratios across mint and off-white backgrounds.

## Typography

Typography balances warmth and absolute clinical clarity:

- **Headlines (Merriweather):** Used deliberately for screen titles, high-level summaries, and modal headers. Its rounded serifs and solid construction lend a reassuring, physician-desk presence.
- **Interface & Text (Plus Jakarta Sans):** Applied across all interactive controls, tables, inputs, dosages, instructions, and timestamps. Its open counters and geometric humanism prevent misreading critical dosage numbers (e.g., distinguishing "0", "8", and "O" or "1", "l", and "I").
- **Hierarchy Rules:** Keep body line lengths within 50–70 characters for optimal scanability during prescription reviews. Numerical dose units (mg, ml, daily) must always use `label-md` or `title-md` bolding to anchor patient safety.

## Layout & Spacing

The layout model enforces calm focus through bounded containers and expansive whitespace:

- **Desktop (1440px):** Employs a slim, fixed left navigation rail (80px collapsed / 240px expanded) anchored to the viewport height. The main canvas centers inside a max-width container of `1100px`, avoiding stretched cards on ultra-wide screens and ensuring medication schedules remain compact and cohesive.
- **Tablet (768px – 1024px):** Navigation collapses into an icon-rail (72px) with quick access to member switchers, while the content area uses a flexible 8-column layout with 24px margins.
- **Mobile (< 768px):** Navigation shifts to a persistent bottom tab bar with an elevated floating amber action button for fast medication intake logging. Grids condense to a single fluid column with 16px margins.
- **Spacing Rhythm:** Base units follow an intentional, airy step progression. Container paddings default to `space-lg` (32px) on desktop to eliminate visual crowding.

## Elevation & Depth

Visual hierarchy uses ambient diffusion rather than stark separation to maintain an organic, tactile sensibility:

- **Level 0 (Flat Ground):** Neutral Canvas (`#FAFAF5`). No shadow.
- **Level 1 (Resting Cards & Pill Trays):** Soft white (`#FFFFFF`) or tinted mint (`#E8F3EE`) surfaces lifted by dual ambient shadows:
  - `box-shadow: 0 4px 20px -2px rgba(13, 94, 79, 0.04), 0 2px 6px -1px rgba(29, 41, 37, 0.03);`
- **Level 2 (Hovered Cards & Interactive Modules):** Gentle elevation simulating paper lifting off wood:
  - `box-shadow: 0 12px 32px -4px rgba(13, 94, 79, 0.08), 0 4px 12px -2px rgba(29, 41, 37, 0.04);`
- **Level 3 (Modals & Prescription Overlays):** Deep, tranquil suspension focused over a gentle frosted scrim:
  - Backdrop: `rgba(29, 41, 37, 0.3)` with a `4px` blur.
  - Surface: `box-shadow: 0 24px 48px -8px rgba(13, 94, 79, 0.12), 0 8px 16px -4px rgba(29, 41, 37, 0.06);`
- **Outlines:** Minimal use of structural borders; when required for input boundaries or separators, use hairline `1px` solid `#D1E7DD` or `rgba(13, 94, 79, 0.1)`.

## Shapes

The design system adopts a welcoming, organic roundedness that mirrors physical apothecary bottles, lozenges, and smooth pill organizers:

- **Cards & Primary Modules (`rounded-xl` / 20px–24px):** Delivers a friendly, non-threatening perimeter to daily schedules and health dossiers.
- **Inputs & Nested Selectors (`rounded-lg` / 12px–16px):** Comfortable touch targets with smooth internal corner radius matching.
- **Buttons, Status Chips & Dose Pills (`rounded-full` / 9999px):** Pure pill shapes for quick-action pills, member avatars, dose frequencies, and primary interactive buttons to reinforce medical reassurance.

## Components

### Buttons
- **Primary CTA ("Add Prescription"):** Pill-shaped (`rounded-full`), clad in Deep Teal (`#0D5E4F`) with crisp white text. Elevated subtly on hover with a gentle scale up (`1.01`) and teal-tinted ambient glow.
- **Secondary CTA:** Tinted mint background (`#E8F3EE`), `#0D5E4F` typography, no border. Transitions to `#D1E7DD` on hover.
- **Warm Urgent Action ("Refill Now", "Missed Dose"):** Amber/Coral background (`#D97746`) with white text to demand attention without using alarming, panic-inducing reds.

### Prescription Cards & Dosage Trackers
- Encased in white `#FFFFFF` or pale mint `#E8F3EE` backgrounds with `24px` corner radii and `space-lg` internal padding.
- Employs an avatar/pill icon glyph in the top left, patient assignment chip top right, and large `Merriweather` drug name with clear, bolded `Plus Jakarta Sans` dosage guidelines underneath.
- Visual intake indicators show completed doses with filled teal icons and pending doses with soft mint dashed rings.

### Inputs & Dosage Pickers
- Backgrounds sit in solid `#FFFFFF` with a subtle `1px` border of `#D1E7DD`.
- On focus: Transition to a `2px` border in `#0D5E4F` with a soft 3px outer halo in `rgba(13, 94, 79, 0.15)`. No harsh browser outlines.
- Clear numeric step buttons for dose counts, styled with pill roundness.

### Chips & Member Badges
- **Status Chips:** Full pill radius (`9999px`), padding `6px 14px`. Color-coded by state:
  - Active: `#E8F3EE` background with `#0D5E4F` text.
  - Due Today: `#FDF1EB` background with `#D97746` text.
  - Refill Needed: `#FDE8E8` background with `#B83232` text.
- **Family Profile Badges:** Smooth circular avatars displaying initials or photos with a 2px inner border colored by family member category.

### Navigation Sidebar (Desktop)
- Fixed left layout (width 240px, or 80px slim), rendered on `#FAFAF5` with a delicate right border of `rgba(13, 94, 79, 0.08)`.
- Features an uncluttered vertical stack: Brand seal at top, primary links (Home, Search, Family, Medicine Chest, Account) with generous `12px 16px` padding and full-pill hover states, and a prominent "+ Add Prescription" button permanently anchored in the upper third.