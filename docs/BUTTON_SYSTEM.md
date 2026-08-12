# Button system

## Current status: phase 1 ? class freeze

The existing UI has multiple page-owned button, CTA, link-action, and selection-control
families. They remain in place during phase 1 so this governance change does not alter
the visual design or behavior of any page.

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

## Existing seeds

| Existing class | Current role | Direction |
|---|---|---|
| `.main_button` | Shared text CTA used by Main and Shop | Rename/migrate to a shared text-button API |
| `.bespoke_button` | Primary and secondary boxed button | Use as the behavioral seed for the shared Button |
| `.top_button` | Unique scroll-to-top control | Keep specialized; inherit shared tokens |
| `.brand_stack_action` | Campaign-specific animated action | Keep as a documented marketing exception |

Using `.bespoke_button` on an unrelated page is not the final system. It is preferable
to adding another one-off class only when its existing design and behavior already fit
the intended action exactly.

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

Phase 2 will define the shared Button tokens and API before any legacy CTA is migrated.

## Minimum state and accessibility contract

Every shared family must document and implement the states that apply to it:

- default, hover, focus-visible, active/pressed, disabled, and loading;
- keyboard operation matching the native semantic element;
- an accessible name for icon-only controls;
- a focus treatment that remains visible on both light and dark backgrounds;
- `prefers-reduced-motion` behavior for non-essential motion.

Use `button` for an action and `a` for navigation. Do not create a `span` or `a href="#"`
and convert it into a button only after JavaScript runs.
