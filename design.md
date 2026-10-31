# AI Image Workbench — design system

A dark-first creative workspace: an infinite canvas, one floating prompt composer, and a quiet sidebar.

## Source of truth

- `tokens.css`: palette, typography, radius, motion, and layout tokens for dark (default) and light (`data-theme="light"`).
- `src/studio.css`: the only application stylesheet. Base → shell → sidebar → desk → galleries → overlays → responsive → motion. Add to the matching section; do not append "final lock" override blocks at the end.

## Palette

Zinc neutrals with one creative pink accent. Dark: near-black canvas `#0c0c0f`, raised surfaces `#17171b`/`#1f1f25`, accent `#f472b6` with dark text on it. Light: `#f6f6f7` canvas, white surfaces, accent `#be185d` with white text. Status colours (success, warning, danger, info) are tokens; never hard-code hex in components.

## Typography

Self-hosted Space Grotesk Variable for headings and titles, Inter Variable for everything else (both include Vietnamese). Header title 15px, collection headings 22–28px, body 14px, composer input 15px desktop / 16px mobile.

## Layout

Sidebar spans the full height (248px, 216px under 960px, 64px collapsed). Header (56px) holds the session title plus the language and theme toggles. Under 768px the sidebar becomes a horizontal icon row below the header.

The empty state centres a heading, three example chips, and the composer. Once the canvas has content the composer floats at the bottom (max 760px) and the reference panel docks on the right (300px). Canvas zoom controls sit top-left with the generation queue below them; parameter popovers open top-right.

## Components

- Radii: 6px controls, 10px buttons/inputs, 14px cards and panels.
- One primary action colour; secondary actions are bordered or ghost. Disabled = 45% opacity.
- Base form fields use `:where()` so component rules override them without `!important`.
- Canvas node toolbars, ports, and resize handles appear on hover or selection.
- All icon buttons keep accessible names; focus uses a 2px accent outline.

## Motion

Shared 140–280ms transitions with `cubic-bezier(0.2, 0.8, 0.2, 1)`. Panels, dialogs, popovers, and list items rise or pop in once; active canvas links flow. Everything collapses to instant under `prefers-reduced-motion`.

## Verification

Check both themes at 375, 768, 1024, and 1440px: canvas, composer with thread open, reference panel, parameter popover, history, inspiration, and settings. No horizontal page scroll; the composer stays inside the viewport.
