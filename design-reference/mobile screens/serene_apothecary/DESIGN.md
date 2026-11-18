---
name: Serene Apothecary
colors:
  surface: '#f3fbf8'
  surface-dim: '#d3dcd8'
  surface-bright: '#f3fbf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf6f2'
  surface-container: '#e7f0ec'
  surface-container-high: '#e1eae6'
  surface-container-highest: '#dce4e1'
  on-surface: '#151d1b'
  on-surface-variant: '#3f4945'
  inverse-surface: '#2a3230'
  inverse-on-surface: '#eaf3ef'
  outline: '#6f7975'
  outline-variant: '#bec9c4'
  surface-tint: '#1f6a5a'
  primary: '#004539'
  on-primary: '#ffffff'
  primary-container: '#0d5e4f'
  on-primary-container: '#8ed5c2'
  inverse-primary: '#8ed4c1'
  secondary: '#56615e'
  on-secondary: '#ffffff'
  secondary-container: '#dae5e1'
  on-secondary-container: '#5c6764'
  tertiary: '#6d240e'
  on-tertiary: '#ffffff'
  tertiary-container: '#8b3a22'
  on-tertiary-container: '#ffb5a1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a9f1dd'
  primary-fixed-dim: '#8ed4c1'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#005143'
  secondary-fixed: '#dae5e1'
  secondary-fixed-dim: '#bec9c5'
  on-secondary-fixed: '#141d1b'
  on-secondary-fixed-variant: '#3f4946'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb5a0'
  on-tertiary-fixed: '#3b0900'
  on-tertiary-fixed-variant: '#7b2e17'
  background: '#f3fbf8'
  on-background: '#151d1b'
  surface-variant: '#dce4e1'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
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
  margin-sm: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system is crafted for managing sensitive multi-generational health records, medication schedules, and family clinical histories. The emotional baseline is tranquil clarity: relieving clinical anxiety through the dignified, orderly aesthetic of an archival concierge. The interface fuses high-end editorial calm with the dependability of private banking.

The design philosophy combines **Warm Tactile Minimalism** with **Editorial Softness**:
- **Dignified & Reassuring:** Avoiding the cold, sterile starkness of hospital portals in favor of organic warmth and quiet authority.
- **Cognitive Ease:** High typographic clarity and spacious layouts prevent panic during urgent dosage lookups or refills.
- **Tactile Substance:** Micro-surfaces, gentle borders, and soft layered elevations invoke high-weight cotton stationery and bespoke card stocks.

## Colors

The palette balances restorative botanical tones with gentle, non-fatiguing warm neutrals:

- **Primary (`#0D5E4F`):** Deep Forest Teal. Imparts security, permanence, and clinical authority. Used for primary actions, critical brand touchpoints, active states, and grounding headers.
- **Secondary (`#E8F3EF`):** Soft Mint. Used for muted interactive containers, selected pill states, segmented tabs, and secondary surfaces. Paired with `#D1EBE2` for active chip outlines and hover states.
- **Tertiary (`#E27D60`):** Soft Terracotta / Warm Coral. Used strictly for contextual emphasis, dosage reminders, urgent refill notices, and critical interactions. Never applied across wide surface areas.
- **Neutral Surface & Canvas:** Backgrounds rest on `#FAFAF5` (warm cream canvas) with `#FFFFFF` for primary elevated cards. Borders sit at `#E5E7DC`.
- **Neutral Content (`#1C2422`):** Deep Charcoal Pine for all text hierarchies, replacing harsh pure black to maintain an organic, warm reading contrast.

## Typography

The type system blends literary craft with high legibility under stress:

- **Display & Headline Roles (Newsreader):** Brings warmth, human touch, and clinical authority to patient profiles, medication titles, and timeline anchors. It lends the product an archival, bespoke quality.
- **Body & Label Roles (Plus Jakarta Sans):** Supplies crisp geometry, balanced proportions, and open counters. Optimizes glanceability for dosages, administration instructions, expiry dates, and regulatory disclosures.
- **Line Heights:** Generous spacing prevents visual crowding on dense pharmaceutical datasheets.

## Layout & Spacing

A responsive fluid grid system anchors content across all breakpoints with breathable, deliberate gutters:

- **Mobile (< 768px):** 4-column fluid layout with `1.25rem` outer canvas margin and `1rem` column gutters. Core actions maintain minimum touch footprints of 48px to support all ages and motor abilities.
- **Tablet (768px - 1024px):** 8-column layout with `2rem` outer margins. Prescription lists and detail drawers shift into side-by-side split view panes.
- **Desktop (> 1024px):** 12-column layout maxed at 1280px container width. Patient switching and timeline filters pin to an asymmetric navigation column (3 columns), leaving 9 columns for cards and clinical logs.

## Elevation & Depth

Visual hierarchy relies on warm-tinted ambient shadows, layered tonal panels, and hairline border delineation rather than harsh drop-shadows:

- **Canvas Base:** `#FAFAF5` (warm parchment), absorbing glare.
- **Surface Level 1 (Resting Cards):** `#FFFFFF` paired with an ultra-soft ambient shadow: `0 4px 20px -2px rgba(13, 94, 79, 0.04), 0 1px 3px 0 rgba(28, 36, 34, 0.03)` with a hairline stroke `1px solid #ECEEE4`.
- **Surface Level 2 (Floating & Active Cards):** Lifted cards (e.g. active dose modals, drag states) elevate with `0 12px 32px -4px rgba(13, 94, 79, 0.08), 0 4px 8px -2px rgba(28, 36, 34, 0.04)`.
- **Surface Level 3 (Sheets & Overlays):** `#FFFFFF` over a warm darkened scrim `rgba(28, 36, 34, 0.32)` blurred with `backdrop-filter: blur(6px)`.

## Shapes

The design system embraces deep organic curvature across interactive surfaces:

- **Base Components (Inputs, Small Badges):** Fixed at `0.75rem` (12px) for structured density.
- **Cards & Primary Modules:** Employ large `1.25rem` to `1.5rem` (20px–24px) border radiuses (`rounded-xl`), creating friendly, approachable surfaces reminiscent of tactile physical index cases.
- **Chips, Badges, and Pill Toggles:** True full pills (`rounded-full` / `9999px`) provide contrast against rectangular records cards.

## Components

### Buttons
- **Primary:** Filled `#0D5E4F` with `#FFFFFF` text. Height of 48px, radius of 16px. Active state transitions to `#084036` with a micro-scale of `0.99`.
- **Secondary:** Filled `#E8F3EF` with `#0D5E4F` text and no border. Hover transitions to `#D1EBE2`.
- **Tertiary / Ghost:** Transparent surface, `#0D5E4F` text with subtle underline or hover tint `#F2F7F4`.
- **Destructive / Alert Action:** Filled `#FDF2EE` with `#E27D60` text and hairline border `#F7D3C6`.

### Cards & Medication Panels
- **Medication Record Card:** `#FFFFFF` background, 20px radius, 1px border `#ECEEE4`. Includes left-edge accent ribbon or icon badge for patient identification (color-coded per family member).
- **Log Item / History Cell:** Flat card with `#FAFAF5` nested within parent panels, bordered with `#EAECE2`, hoverable with soft transition to mint background.

### Chips & Filter Pills
- **State Indicator:** Height of 32px, `rounded-full`, padding `0 14px`.
- **Active Filter:** Background `#0D5E4F`, text `#FFFFFF`.
- **Inactive Filter:** Background `#FFFFFF`, text `#1C2422`, border `1px solid #DCE0D4`.
- **Dosage Alert Tag:** Background `#FBEBE6`, text `#C45A3E`, border `1px solid #F6CEC3`.

### Input Fields & Controls
- **Text Inputs:** Height of 48px, background `#FFFFFF`, border `1px solid #DCE0D4`, radius 12px. Focus state triggers `1px solid #0D5E4F` along with a 3px soft mint outer halo (`rgba(13, 94, 79, 0.12)`).
- **Checkboxes & Radios:** 20px size, 6px radius for checkboxes, full circle for radios. Checked state fills `#0D5E4F` with white checkmark glyph.

### Specialized Family Healthcare Components
- **Family Profile Avatar Switcher:** Overlapping circular avatars with crisp 2px white borders; active profile ring highlighted in `#0D5E4F`.
- **Dosage Schedule Bar:** Segmented bar charting Morning, Midday, Evening, and Night routines using soft mint blocks `#E8F3EF` marked with deep teal check icons when taken, and amber `#E27D60` when pending.