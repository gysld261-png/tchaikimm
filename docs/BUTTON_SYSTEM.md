# Button system

## Current status: phase 2 - shared Button foundation

The existing UI has multiple page-owned button, CTA, link-action, and selection-control
families. The class freeze remains active while those families are migrated. Bespoke,
Brand, Shop, Shop Detail, and the cart drawer now use the shared boxed Button foundation.

From this point, do not add another page-specific interactive-control class. A new
control must either reuse an approved class or wait for a reviewed shared component.
The current classes are recorded in
[`../scripts/button-class-baseline.json`](../scripts/button-class-baseline.json).

## Enforcement

Run this check before committing UI work:

```powershell
node scripts/check-button-class-freeze.mjs
```

The check scans `common/` and `pages/` for:

- classes on native interactive HTML elements;
- button-like CSS classes, including button, CTA, action, trigger, toggle, choice,
  swatch, select, tab, link, and related control names;
- classes added or assigned through common JavaScript DOM APIs.

Removing a legacy class is allowed. Adding an unreviewed class fails the check and
reports the source file.

## Deliberate baseline changes

`--update-baseline` is not a routine autofix. Use it only when a design-system change
intentionally introduces or renames a shared component.

1. Define the component role, variants, states, sizes, and accessibility behavior in
   this document.
2. Put shared tokens and styles under `common/`; do not create a page-owned replacement.
3. Add or migrate at least one real usage and verify Main, Shop, and Bespoke for shared
   changes.
4. Run `node scripts/check-button-class-freeze.mjs --update-baseline` and review the
   baseline diff.
5. Run the normal check again.

## Approved API

### Boxed Button

Use `.ui_button` with exactly one visual variant.

| Class | Use when | Default visual |
|---|---|---|
| `.is_primary` | The single strongest action in a section or step | Deep green fill, cream text |
| `.is_secondary` | A supporting or equal-weight alternative | White surface, neutral border, dark text |
| `.is_outline` | An action over a plain surface that needs less weight than Primary | Transparent surface, green border and text |

Size is independent of visual hierarchy:

| Class | Height | Minimum width | Use when |
|---|---:|---:|---|
| `.is_sm` | 44px | content | Compact utility actions |
| default (md) | 56px | 180px | Standard actions |
| `.is_lg` | 56px below 768px; 70px from 768px | 180px / 260px | Prominent page and form CTAs |

`.is_loading` is visual state only. JavaScript must also set `aria-busy="true"` and
prevent duplicate submission. Native `disabled` is preferred; links that cannot be
activated use `aria-disabled="true"` and must suppress navigation.

### Text Button

Use `.ui_text_button` for a text-and-arrow action without a box. `.main_button`
remains as a temporary compatibility alias and must not be used for new markup.

Text Button supports the existing `.is_pink` tone. Primary/Secondary/Outline do not
apply to Text Button.

### Layout

Use `.ui_button_row` only for wrapping and the shared gap. Page CSS may position a
Button or set container-driven width, but must not redefine color, typography, border,
hover, focus, disabled, or loading states.

## Existing seeds

| Existing class | Current role | Direction |
|---|---|---|
| `.main_button` | Shared text CTA used by Main and Shop | Rename/migrate to a shared text-button API |
| `.bespoke_button` | Legacy boxed-button class | Migrated to `.ui_button`; do not use in new markup |
| `.top_button` | Unique scroll-to-top control | Keep specialized; inherit shared tokens |
| `.brand_stack_action` | Campaign-specific animated action | Keep as a documented marketing exception |

`.bespoke_button` is no longer present in production CSS or markup. Historical references
must migrate to `.ui_button` rather than restoring the legacy alias.

## Migration status

| Area | Legacy classes removed | Shared result |
|---|---|---|
| Bespoke | `.bespoke_button`, `.atelier_button`, `.reservation_button` | Primary, secondary, responsive large, and shared rows |
| Brand | `.heritage_button` | Primary large; GSAP selects the shared Button inside Heritage |
| Shop | `.shop_more_button` | Primary large |
| Shop Detail | `.purchase_button`, `.purchase_complete_button` | Primary/secondary large and completion Primary |
| Cart drawer | `.cart_drawer_action` | Primary medium; drawer CSS owns flex placement only |
| Collections | 23 duplicated contextual rules across two files | Shared tabs, year links, crosslinks, carousel buttons, and As Worn tags in `collection_controls.css` |

## Planned shared families

The migration target is seven families rather than one oversized Button:

| Family | Responsibility |
|---|---|
| Button | Primary, secondary, outline, and ghost actions |
| TextButton | Text and arrow actions without a box |
| IconButton | Icon-only actions with a consistent hit area |
| ChoiceChip | Tabs, sizes, units, dates, and compact choices |
| Swatch | Product color and material choices; product colors remain data |
| CardChoice | Image cards, visit modes, and time choices |
| Select/Menu | Currency and shop-category selection |

The shared Button tokens and API are now defined. Remaining legacy CTAs migrate one page at a time.

## Minimum state and accessibility contract

Every shared family must document and implement the states that apply to it:

- default, hover, focus-visible, active/pressed, disabled, and loading;
- keyboard operation matching the native semantic element;
- an accessible name for icon-only controls;
- a focus treatment that remains visible on both light and dark backgrounds;
- `prefers-reduced-motion` behavior for non-essential motion.

Use `button` for an action and `a` for navigation. Do not create a `span` or `a href="#"`
and convert it into a button only after JavaScript runs.
