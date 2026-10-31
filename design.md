# AI Image Workbench — design system

A neutral creative application with a canvas, compact command areas, and readable navigation.

## Source of truth

- `tokens.css`: palette, typography, spacing, and shape tokens.
- `src/studio-system.css`: shared application shell and component presentation.
- `src/studio.css`: retained layout behavior and legacy components; the scoped system stylesheet owns the refreshed surfaces.

## Palette

Dark mode uses charcoal canvas, slightly raised neutral surfaces, pale text, and muted teal actions. Light mode uses cool off-white canvas, white surfaces, dark text, and deep teal actions. Use the same semantic tokens in both modes. Avoid saturated backgrounds, gradients, inset highlights, and decorative glows.

## Typography

Self-hosted Inter Variable throughout. Use 400–450 for controls and body copy, 500–600 for labels and headings. Application header: 15px. Major collection headings: 24px. Editor text: 14px desktop, 16px mobile. Use sentence case.

## Layout

Desktop: 56px header, 216px navigation, and a flexible canvas. Collapse the rail to 64px when requested. The optional reference tray is 248px wide and starts closed; adding or dropping reference files opens it. At tablet widths the navigation and reference tray narrow. At 768px and below, navigation becomes a compact horizontal row and references open as a small tray.

The empty state centres one prompt composer below a short heading and three working examples. Choosing an example fills and focuses the prompt. Once an image or reference exists, the workspace prioritises the canvas and places the compact composer at the bottom with 24px clearance. Prompt text grows from two lines up to 160px; conversation history expands separately on request or when a response/status needs attention. The prompt input always remains available.

## Components

- Controls: 6px corners; editor and dialog surfaces: 8–10px.
- Separate large areas by surface tone; reserve borders for input boundaries, selected content, and upload targets.
- One primary action colour, quiet secondary controls, visible keyboard focus.
- Generation, loading, retry, errors, and empty states retain their existing behavior.
- All icon buttons retain accessible names. Mobile editor text uses 16px to prevent input zoom.
- Collection titles and explanatory copy wrap naturally; do not ellipsize category names, legal copy, or provider capabilities.
- Keep compact parameter summaries on one line within their own scrollable shelf.
- Settings dialogs render above navigation, with sticky close/actions and a dedicated content scroll area.
- Use explicit Generate image / Improve prompt labels. Put shortcut instructions outside the placeholder, and show missing API credentials beside the action area.
- Use sessions consistently for saved work; the app header identifies the current session.

## Motion

Stable hover colour changes at 160ms. No entrance animations, marquee, hover scaling, or decorative loops. Respect reduced-motion preferences.

## Verification

Check both modes at 375, 768, 1024, and 1440px. Inspect the canvas, prompt input, reference tray, history, inspiration, and settings. No horizontal page scroll; primary controls must remain within the viewport.
