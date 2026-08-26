---
name: Clinical Intelligence System
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf4'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d5e3fd'
  on-surface: '#0d1c2f'
  on-surface-variant: '#41484b'
  inverse-surface: '#233144'
  inverse-on-surface: '#ebf1ff'
  outline: '#71787b'
  outline-variant: '#c1c7cb'
  surface-tint: '#3e6472'
  primary: '#073442'
  on-primary: '#ffffff'
  primary-container: '#244b59'
  on-primary-container: '#93bacb'
  inverse-primary: '#a5ccdd'
  secondary: '#346572'
  on-secondary: '#ffffff'
  secondary-container: '#b6e8f7'
  on-secondary-container: '#386977'
  tertiary: '#1f3337'
  on-tertiary: '#ffffff'
  tertiary-container: '#354a4d'
  on-tertiary-container: '#a2b9bd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1e9fa'
  primary-fixed-dim: '#a5ccdd'
  on-primary-fixed: '#001f29'
  on-primary-fixed-variant: '#254c5a'
  secondary-fixed: '#b9eafa'
  secondary-fixed-dim: '#9dcedd'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#184d5a'
  tertiary-fixed: '#d0e7eb'
  tertiary-fixed-dim: '#b4cbcf'
  on-tertiary-fixed: '#091f22'
  on-tertiary-fixed-variant: '#354a4e'
  background: '#f8f9ff'
  on-background: '#0d1c2f'
  surface-variant: '#d5e3fd'
  surface-muted: '#F8FAFC'
  border-subtle: '#E2E8F0'
  status-success: '#10B981'
  status-warning: '#F59E0B'
  status-error: '#EF4444'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  margin-sm: 16px
  margin-md: 24px
  margin-lg: 48px
  gutter: 20px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for the Midwest Spine & Brain Institute’s Marketing CRM, prioritizing **clinical precision, institutional trust, and high-density data management**. The aesthetic moves away from generic consumer SaaS trends, opting instead for a **Corporate / Modern** style that mirrors the reliability of a high-stakes medical environment.

The visual narrative is anchored in the "Medical Professional" ethos: 
- **Minimalism:** Use of expansive whitespace to reduce cognitive load during complex patient data analysis.
- **Precision:** Sharp, clear demarcations and a strict adherence to a systematic grid.
- **Atmosphere:** A calm, cool-toned environment that feels sterile yet accessible, utilizing the brand's deep slate and teal blues to evoke authority and care.

The target audience consists of healthcare administrators and marketing specialists who require an enterprise-grade interface that feels like a natural extension of the MSBI physical practice.

## Colors

The palette is derived directly from the MSBI brand identity, focused on a "Deep Sea" blue hierarchy.

- **Primary (#244B59):** Used for navigation sidebars, primary action buttons, and critical branding elements. It represents the "Brain" and "Spine" expertise—deep, stable, and foundational.
- **Secondary & Tertiary (#99CAD9, #CDE4E8):** Used for tonal layering, accent icons, and subtle background fills in data cards to differentiate content zones without adding visual noise.
- **Neutral (#334155):** A slate-gray utilized for primary body text and iconography to ensure high legibility and a sophisticated, non-black appearance.
- **Backgrounds:** The interface utilizes a near-white (`#F8FAFC`) background to maintain a "clean clinic" feel, ensuring that the primary brand blues stand out with high contrast.

## Typography

This system uses **Hanken Grotesk** for headlines to provide a modern, high-end editorial feel that remains professional, and **Inter** for all body and UI elements to ensure maximum legibility in data-heavy CRM views.

- **Data Density:** For tables and metrics, utilize the `data-mono` setting which triggers tabular nummbers, ensuring columns of figures align perfectly for quick scanning.
- **Hierarchy:** Headers should primarily use the Primary Blue (`#244B59`) to establish a clear content structure. 
- **Labels:** Use `label-md` in all-caps with the specified letter spacing for table headers and small metadata categories.

## Layout & Spacing

The layout utilizes a **Fixed Grid** model for desktop views to maintain a curated, dashboard experience that doesn't feel overly stretched on ultra-wide monitors.

- **Grid:** A 12-column grid with 20px gutters. Content is housed in a centered container with a maximum width of 1440px.
- **Rhythm:** An 8px linear scale governs all padding and margins (8, 16, 24, 32, 40, 48).
- **CRM Density:** For data tables, a "compact" vertical rhythm of 12px padding is permitted to allow more patient records to be visible on a single screen without scrolling.
- **Mobile Adaptivity:** On mobile devices, margins shrink to 16px and the 12-column grid collapses to a single-column stack. High-priority "Key Performance Indicators" (KPIs) should remain in a 2-column horizontal scroll or grid.

## Elevation & Depth

To maintain a professional, enterprise-grade feel, this design system avoids heavy shadows and instead uses **Tonal Layers** and **Low-contrast Outlines**.

- **Surface Levels:** 
    - **L0 (Background):** `#F8FAFC` - The base canvas.
    - **L1 (Cards/Containers):** `#FFFFFF` - Used for content blocks, with a 1px border of `#E2E8F0`.
    - **L2 (Popovers/Modals):** `#FFFFFF` - Uses a soft, ambient shadow (0px 4px 20px rgba(36, 75, 89, 0.08)) to suggest flight above the interface.
- **Interactions:** Hover states on interactive cards should not lift the element, but rather change the border color to the Secondary Blue (`#99CAD9`) or subtly darken the background tint.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding provides a modern touch while maintaining the serious, structured appearance required for medical software. 

- **Standard Elements:** Buttons, input fields, and checkboxes use a 4px (0.25rem) radius.
- **Large Elements:** Data cards and main content containers use an 8px (0.5rem) radius.
- **Exceptions:** Status badges (chips) may use a pill-shape (full rounding) to distinguish them from interactive buttons.

## Components

### Buttons
- **Primary:** Solid `#244B59` with white text. High-contrast, used for the main intent (e.g., "Add Patient").
- **Secondary:** Outline style using the Primary color or a light fill of `#CDE4E8` with `#244B59` text for less critical actions.

### Cards
- White background, 1px `#E2E8F0` border. Headers within cards should have a subtle bottom border and use `headline-sm`.

### Tables (The CRM Core)
- **Headers:** `#F8FAFC` background, `label-md` text color `#334155`.
- **Rows:** Alternating "zebra" stripes are not required; use thin 1px horizontal dividers instead.
- **Cells:** Use `body-sm` for standard data and `data-mono` for IDs or numerical values.

### Form Elements
- Inputs must have a 1px border. Focus states use a 2px ring of `#99CAD9`. 
- Help text and error messages use `body-sm` typography.

### Status Badges
- Used for patient status (e.g., "Scheduled," "In-Review," "Completed"). These should use highly desaturated versions of the status colors (Success/Warning/Error) for the background with high-contrast text for accessibility.

### Charts & Data Viz
- Use the primary brand blue (`#244B59`) as the lead data color, followed by `#99CAD9` and `#CDE4E8`. Avoid "traffic light" colors unless specifically indicating a health or performance status.