import { Directive, input } from '@angular/core';

/**
 * The two button treatments the Ambient system adds to PrimeNG's own.
 *
 * <p>{@code ghost} is a glass button: translucent, hairline border, blurred
 * backdrop. It is for chrome — a control in the topbar or over a busy surface,
 * where a filled button would be a slab and a text button would disappear.</p>
 *
 * <p>{@code soft} is an accent tint with no border. It is for a secondary action
 * that is still the accent's — "Add another", "Show more" — where
 * {@code outlined} would read as equal in weight to the primary beside it.</p>
 */
export type AmbientButtonVariant = 'ghost' | 'soft';

/**
 * Adds an Ambient-specific variant to a PrimeNG button.
 *
 * <p>It is a directive rather than a wrapper component on purpose. Every
 * {@code p-button} in the product is already themed centrally through the theme
 * preset, so a wrapper would exist only to re-declare PrimeNG's twenty-odd
 * inputs — and each one re-declared is one that can fall behind. This adds a
 * class and nothing else; the appearance lives in
 * {@code _ambient-components.scss} beside every other button rule.</p>
 *
 * <p>PrimeNG's own variants — {@code [text]}, {@code [outlined]},
 * {@code [rounded]}, {@code severity} — keep working and should be preferred
 * wherever they fit. Reach for this only for the two cases above.</p>
 *
 * @example
 * <p-button ambButton="ghost" icon="pi pi-bars" ariaLabel="Open navigation" />
 * <p-button ambButton="soft" label="Add another" />
 */
@Directive({
  selector: 'p-button[ambButton], button[ambButton], a[ambButton]',
  host: {
    '[class.amb-btn--ghost]': 'ambButton() === "ghost"',
    '[class.amb-btn--soft]': 'ambButton() === "soft"'
  }
})
export class AmbientButtonDirective {
  readonly ambButton = input.required<AmbientButtonVariant>();
}
