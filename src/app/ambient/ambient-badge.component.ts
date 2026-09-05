import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

/** The severities the badge understands, matching PrimeNG's own set. */
export type AmbientBadgeSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger';

/**
 * A small status or category chip.
 *
 * <p>PrimeNG's {@code p-tag} underneath, so the six severities are the ones the
 * rest of the library already uses and the theme preset already colours. The
 * ambient layer adds a hairline border per severity, which is what lets a chip
 * read on a translucent surface where a fill alone would wash out.</p>
 *
 * <h2>Two kinds of badge</h2>
 *
 * <p>A <em>severity</em> badge means something — a priority, a status, an overdue
 * date — and takes its colour from the semantic palette. A <em>tag</em> badge
 * carries a user-chosen colour and means only itself; it passes {@code color},
 * and the caller is responsible for handing over a {@code textColor} with enough
 * contrast (the app's {@code readableTextOn} does this).</p>
 *
 * <p>Either way an icon should accompany a severity, so state never rests on hue
 * alone.</p>
 *
 * @example A status.
 * <amb-badge severity="warn" icon="pi pi-clock" label="In progress" rounded />
 *
 * @example A user-coloured tag.
 * <amb-badge [label]="tag.name" [color]="tag.color" [textColor]="readableTextOn(tag.color)" rounded />
 */
@Component({
  selector: 'amb-badge',
  imports: [TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-tag
      [value]="label()"
      [icon]="icon()"
      [severity]="severity()"
      [rounded]="rounded()"
      [style]="customStyle()"
      [styleClass]="badgeClass()"
    />
  `,
  styles: `
    :host {
      display: inline-flex;
      min-width: 0;
      // A chip is a label, not a paragraph: it never wraps, and a long tag name
      // is clipped by whatever contains it rather than growing the row.
      max-width: 100%;
    }

    // A user-coloured chip drops the semantic border, which would otherwise
    // outline an arbitrary colour in a meaning it does not have.
    //
    // It also opts out of the small-caps treatment the severity chips get.
    // Those are labels the product wrote — "URGENT", "OVERDUE" — and reading as
    // small caps is right for them. A tag name is something the user typed, and
    // upper-casing a person's own words is a liberty, not a style.
    ::ng-deep .amb-badge--custom {
      border-color: transparent;
      letter-spacing: var(--amb-tracking-normal);
      text-transform: none;
    }
  `
})
export class AmbientBadgeComponent {
  readonly label = input.required<string>();

  readonly severity = input<AmbientBadgeSeverity>('secondary');

  /** A PrimeIcons class. Strongly preferred alongside any severity. */
  readonly icon = input<string>();

  readonly rounded = input(false, { transform: booleanAttribute });

  /** A user-chosen background. Overrides `severity` when set. */
  readonly color = input<string>();

  /** The foreground to pair with `color`. The caller must ensure it contrasts. */
  readonly textColor = input<string>();

  protected readonly customStyle = computed(() => {
    const background = this.color();
    return background ? { background, color: this.textColor() } : null;
  });

  protected readonly badgeClass = computed(() =>
    this.color() ? 'amb-badge amb-badge--custom' : 'amb-badge'
  );
}
