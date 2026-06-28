# Havit UI Standards

This document defines the project UI contract for product screens. It is intentionally practical: every rule should map to a reusable component, a vanilla-extract style, or a page-level layout decision.

## Design Direction

Havit is a dense asset-management product UI. The interface should feel quiet, precise, and work-focused:

- restrained light surfaces with one teal accent
- compact but readable controls
- data-first hierarchy, not marketing composition
- shadcn-style primitives migrated to vanilla-extract
- Base UI usage stays inside `web/src/components/ui/*`

## Component Ownership

Use `web/src/components/ui/*` for all basic controls.

- Buttons: `Button`
- Text inputs: `Input`, `TextField`
- Selects in forms: `SelectField`
- Selects in toolbars: compose `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectGroup`, `SelectLabel`, `SelectItem`
- Tabs: `Tabs`, `TabsList`, `TabsTrigger`
- Cards: `Card`
- Scroll containers: `ScrollArea`

Do not build page-local button, input, select, tab, badge, or scroll styles unless the component is missing. If a shadcn component is missing, list the component name for import instead of inventing an incompatible one.

## Size Scale

The product uses the shadcn compact scale:

| Use | Height | Component size |
| --- | --- | --- |
| Default form control | 36px | `default` |
| Compact toolbar control | 32px | `sm` |
| Dense auxiliary control | 28px | `xs` only when every control in the row is also 28px |
| Default icon button | 36px | `icon` |
| Compact icon button | 32px | `icon-sm` |

Rules:

- A single horizontal control row must use one height.
- Toolbar rows default to 32px controls.
- Do not mix `Input` default height with `Select` `sm` and `Button` `sm` unless the input is explicitly styled to the same height.
- Icon buttons in a toolbar use the matching icon size for the row.
- Width can vary by content, height cannot.

## Toolbar Pattern

Toolbar layout should be:

1. leading search input
2. filter selects
3. view toggles
4. secondary actions

Implementation rules:

- Search input and filters align center on the same baseline.
- Use `gap: 0.5rem` between controls.
- Wrap only at clear breakpoints; do not wrap a single select onto a second row on desktop.
- Toolbar selects do not show an external label. The trigger shows only the current value; the popup may include `SelectLabel`.
- Form selects do show labels through `SelectField`.

## Tabs Pattern

Use `Tabs`, `TabsList`, and `TabsTrigger`.

- Category navigation uses the line variant.
- Active tab has a bottom border/underline.
- Tabs are left-aligned.
- Overflow handling may use `Popover`, but visible tab items must still be `TabsTrigger`.

## Shape And Surface

- Controls use `themeVars.radius2` (8px).
- Cards use `themeVars.radius3` (12px).
- Inner badges and small tags use `themeVars.radius1` (4px).
- Avoid nested cards. Use sections, tables, lists, or side panels.
- Shadows are subtle and tokenized through `themeVars.shadowSoft`.

## Verification Checklist

Before shipping a page-level UI change:

- One control row has one height.
- Every basic control comes from `web/src/components/ui/*`.
- No page-local raw `<button>`, visible raw `<input>`, `<select>`, or `<textarea>`.
- Toolbar selects have no external label.
- Tabs render `data-slot="tabs-trigger"`.
- The page has no horizontal overflow at desktop and mobile widths.
- Build passes with `vite build`.
