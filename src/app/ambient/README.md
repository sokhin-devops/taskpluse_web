# Ambient UI

The design system TaskPulse is built on.

```
PrimeNG  →  Ambient theme + components  →  application screens
```

Nothing here reimplements a PrimeNG component. Each piece either wraps one —
`<amb-card>` is `p-card`, `<amb-dialog>` is `p-dialog`, `<amb-badge>` is `p-tag`
— or is a small composition PrimeNG has no equivalent for, like the page
scaffolding and the empty state. PrimeNG keeps its behaviour, its accessibility
and its upgrade path; the product gets one coherent surface.

## Where things live

| | |
|---|---|
| `src/styles/ambient/_ambient-tokens.scss` | every colour, radius, shadow, blur, space, type step and duration — light scheme on `:root`, dark on `:root.amb-dark` |
| `src/styles/ambient/_ambient-accents.scss` | the six accent palettes, and which step each nominates per scheme |
| `src/styles/ambient/_ambient-breakpoints.scss` | the Sass breakpoints (`@media` cannot read a custom property) |
| `src/styles/ambient/_ambient-mixins.scss` | `glass()`, `focus-ring()`, `hover-lift()`, `respond-below()` … |
| `src/styles/ambient/_ambient-base.scss` | reset, document, type scale, keyframes, **the CSS layer contract** |
| `src/styles/ambient/_ambient-background.scss` | the ambient canvas |
| `src/styles/ambient/_ambient-glass.scss` | surface classes: `.amb-surface-1/2/3`, `.amb-sunken`, `.amb-interactive` |
| `src/styles/ambient/_ambient-layout.scss` | the shell, the page column, the grids |
| `src/styles/ambient/_ambient-components.scss` | the PrimeNG layer — only what a token cannot express |
| `src/app/ambient/ambient.preset.ts` | points PrimeNG's own tokens at the `--amb-*` properties |
| `src/app/ambient/ambient-theme.service.ts` | owns the colour scheme and the accent |
| `src/app/ambient/*.component.ts` | the reusable components |

## Making a change

| I want to change… | Edit |
|---|---|
| a colour, radius, shadow, spacing, duration | `_ambient-tokens.scss` — nothing else |
| how strong the glass looks | `--amb-blur-*`, `--amb-glass-opacity-*`, `--amb-glass-inset`, `--amb-glass-sheen` |
| add or retune an accent palette | `_ambient-accents.scss`, then `AMBIENT_ACCENTS` in the service |
| how a PrimeNG component looks | `ambient.preset.ts` first; `_ambient-components.scss` only if no token exists |
| a reusable surface or layout | `_ambient-glass.scss` / `_ambient-layout.scss` |
| a reusable piece of UI with behaviour | a component in this folder |
| something true of one screen only | that screen's own component |

The rule of thumb: if two screens would write it the same way, it belongs here.
If the second screen would want it slightly different, it does not.

## Theming

Two axes, both applied by writing to `<html>` and nothing else:

| | written as | switched by |
|---|---|---|
| colour scheme | `class="amb-dark"` on `<html>` | `AmbientThemeService.setScheme('light' \| 'dark' \| 'system')` |
| accent | `data-amb-accent="teal"` on `<html>` | `AmbientThemeService.setAccent('teal')` |
| rail collapsed | `.amb-shell--rail` on the shell | `[(collapsed)]` on `<amb-sidebar>` |

No component subscribes to either, and none needs to. The tokens redefine
themselves under those selectors, and PrimeNG follows because its own theme
tokens are `var(--amb-*)` — including its `primary` ramp, which is what makes the
accent switchable at runtime with no theme regeneration and no re-render.

Three places name the dark class and **must agree**: `_ambient-tokens.scss`
(`:root.amb-dark`), `app.config.ts` (`darkModeSelector`), and the service.
Two places name the storage keys: the service, and the inline bootstrap script in
`index.html` — which exists because Angular boots after first paint, so without
it a dark-mode user sees a white flash on every reload.

`system` is a live preference, not a startup reading: the service watches the
media query, so an OS that flips at sunset flips the app with it.

**Adding an accent palette**: add an entry to `$amb-accent-palettes` and its name
to `AMBIENT_ACCENTS`. Nothing else, including the picker, needs to know — each
swatch carries its own `data-amb-accent` and paints itself from the same tokens.
Pick the `light` step for contrast, not for looks: white on teal-600 is 3.9:1,
which is why teal and emerald nominate 700.

## The collapsing rail

`<amb-sidebar [(collapsed)]>` narrows the docked rail to icons. It is two-way
rather than internal because **the shell owns the grid the rail is a column of**:
`.amb-shell--rail` changes `--amb-sidebar-width`, and the transition on
`grid-template-columns` is what actually animates. The sidebar only restyles its
own contents to match. The shell also decides whether the choice is remembered —
`AppComponent` persists it through `readPreference`/`writePreference`.

Two things here are deliberate and easy to undo by accident:

- **The labels are not `display: none`.** They leave the flow and fade to
  `opacity: 0`, which keeps them in the accessibility tree — a screen reader
  still announces "Dashboard" while a sighted user reads the tooltip. Hiding
  them properly would turn the navigation into four unlabelled icons for anyone
  not looking at it.
- **The collapsed rules are scoped to `.amb-shell__sidebar`, not to the host.**
  The drawer renders the same nav markup from the same template. A host-level
  rule would strip the labels out of the drawer too, on a phone, where the rail
  is not even on screen and the collapsed state only exists because it was set
  on a desktop and remembered.

Collapsing is desktop-only: below the nav breakpoint the rail is `display: none`
and the drawer is always full width.

## Two things that are easy to get wrong

**Blur only where the surface sits on the canvas.** `backdrop-filter` samples
whatever is immediately behind the element, so a glass card nested inside a glass
panel blurs the panel — not the canvas — and the result is flat grey. Nested
surfaces use `glass-nested()` or `.amb-surface--flat`, which drop the blur *and*
the sheen. `_ambient-components.scss` ends with the guards that enforce this for
PrimeNG's own surfaces.

What makes a surface read as glass is three things composed by `glass()`: the
translucent tint, a sheen falling across the face (`--amb-glass-sheen`), and a lit
rim — a specular line on the top edge plus a hairline around the whole surface
(`--amb-glass-inset`). Raising the blur alone just makes it foggier.

**The cascade is a layer contract, not a specificity race.** PrimeNG appends its
generated `<style>` elements to the end of `<head>`, after `styles.css`, so an
ambient rule at the same specificity would silently lose. `_ambient-base.scss`
declares:

```
@layer amb-reset, primeng;   /* reset < PrimeNG < everything unlayered */
```

and `app.config.ts` passes the matching `cssLayer` option to `providePrimeNG`.
Change one and you must change the other. Because of this, no rule in the system
needs `!important` or a doubled selector to beat PrimeNG — and the reset sits
*below* PrimeNG so a bare `button { font: inherit }` cannot undo `.p-button-sm`.

## Using it from a screen

```ts
imports: [AmbientPageComponent, AmbientPageHeaderComponent, AmbientCardComponent]
```

```html
<amb-page>
  <amb-page-header title="Tasks" [subtitle]="summary()">
    <p-button label="New task" icon="pi pi-plus-circle" (onClick)="openCreate()" />
  </amb-page-header>

  <amb-card title="Open work">…</amb-card>
</amb-page>
```

In a component stylesheet, `src/styles` is on the Sass load path:

```scss
@use 'ambient' as amb;

.thing {
  @include amb.glass-nested(2);
  padding: var(--amb-pad-card);
}

@include amb.respond-below(amb.$amb-bp-md) { … }
```

That module forwards the breakpoints and the mixins only. The tokens are global
custom properties — read them as `var(--amb-*)`; never `@use` the token file from
a component, or its `:root` block is emitted once per component into a scoped
stylesheet where it matches nothing.
