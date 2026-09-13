import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';

/**
 * A single figure with its label: the tile a KPI row is made of.
 *
 * <h2>Why it takes a link</h2>
 *
 * <p>A number on a dashboard that cannot be opened is a dead end. When
 * {@code link} is set the whole tile becomes an anchor with the shared
 * interactive-surface treatment, so "3 overdue" is a way into the filtered list
 * rather than a fact to go and find. Without it the tile is a plain
 * {@code <div>} and gains no hover affordance it cannot honour.</p>
 *
 * <h2>Emphasis</h2>
 *
 * <p>{@code emphasis="attention"} is for a figure that is something to act on —
 * overdue work, failures, anything counting down. It tints the surface and the
 * figure, and pairs that with the icon the caller already passes, so the
 * distinction never rests on colour alone.</p>
 *
 * @example
 * <amb-stat-card
 *   label="Overdue"
 *   [value]="stats.overdue"
 *   icon="pi pi-exclamation-circle"
 *   emphasis="attention"
 *   link="/tasks"
 *   [query]="{ scope: 'overdue' }"
 * />
 */
@Component({
  selector: 'amb-stat-card',
  imports: [DecimalPipe, NgTemplateOutlet, RouterLink, SkeletonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loading()) {
      <div class="amb-stat amb-surface-2" aria-hidden="true">
        <p-skeleton width="4.5rem" height="0.75rem" />
        <p-skeleton width="3rem" height="1.75rem" styleClass="amb-stat__skeleton-value" />
      </div>
    } @else if (link()) {
      <a class="amb-stat amb-interactive" [routerLink]="link()" [queryParams]="query()">
        <ng-container *ngTemplateOutlet="body" />
      </a>
    } @else {
      <div class="amb-stat amb-surface-2">
        <ng-container *ngTemplateOutlet="body" />
      </div>
    }

    <ng-template #body>
      @if (icon()) {
        <span class="amb-stat__medallion" aria-hidden="true">
          <i [class]="icon()"></i>
        </span>
      }

      <span class="amb-stat__text">
        <span class="amb-stat__label">{{ label() }}</span>

        <strong class="amb-stat__value">
          {{ value() | number }}@if (unit()) {<span class="amb-stat__unit">{{ unit() }}</span>}
        </strong>

        @if (caption()) {
          <span class="amb-stat__caption">{{ caption() }}</span>
        }
      </span>
    </ng-template>
  `,
  styles: `
    @use 'ambient' as amb;

    :host {
      display: block;
    }

    // Medallion beside the text rather than an icon above it. Centred and not
    // flex-start: the medallion is a fixed 2.75rem and the text beside it is
    // two lines, so centring is what puts the circle on the optical middle of
    // the pair instead of level with the eyebrow.
    .amb-stat {
      display: flex;
      align-items: center;
      gap: var(--amb-space-4);
      height: 100%;
      padding: var(--amb-pad-card);
    }

    // The tinted disc the icon sits in. It never flexes, so a long label cannot
    // squash it into an ellipse — which is what happens the first time someone
    // translates "Due in the next 7 days" into a language that needs more room.
    .amb-stat__medallion {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--amb-radius-pill);
      background: var(--amb-stat-tone-soft, var(--amb-accent-soft));
      color: var(--amb-stat-tone, var(--amb-accent-on-soft));
      font-size: var(--amb-text-lg);
      // The lit rim every other round surface in the system carries. A token,
      // so the disc goes flat under the vibes that have no bevel anywhere else.
      box-shadow: var(--amb-fill-sheen);
    }

    .amb-stat__text {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-1);
      min-width: 0;
    }

    .amb-stat__label {
      @include amb.eyebrow;
      @include amb.truncate;
    }

    // Proportional figures, not tabular: these are large standalone numbers,
    // and equal-width digits make a value like 121 look loose at this size.
    // Tabular figures are for columns that have to align vertically.
    .amb-stat__value {
      @include amb.figure(var(--amb-text-3xl));

      font-variant-numeric: normal;
    }

    .amb-stat__unit {
      margin-left: 0.125rem;
      font-size: var(--amb-text-xl);
      font-weight: var(--amb-weight-medium);
      color: var(--amb-text-subtle);
    }

    .amb-stat__caption {
      font-size: var(--amb-text-sm);
      color: var(--amb-text-muted);
    }

    // -- Tone --------------------------------------------------------------
    //
    // Which hue the medallion wears. Two custom properties per tone rather than
    // a rule per tone, so the disc is themed by setting a pair on the host and
    // the medallion itself has one background declaration.
    //
    // Every tone here *means* something — the caller picks the one that matches
    // what the figure is about. There is deliberately no palette of decorative
    // hues to rotate through: a row of tiles in four unrelated colours teaches a
    // reader that colour is noise here, and then the one tile that does mean
    // something cannot say so.

    :host(.amb-stat--info) {
      --amb-stat-tone: var(--amb-info);
      --amb-stat-tone-soft: var(--amb-info-soft);
    }

    :host(.amb-stat--success) {
      --amb-stat-tone: var(--amb-success);
      --amb-stat-tone-soft: var(--amb-success-soft);
    }

    :host(.amb-stat--warn) {
      --amb-stat-tone: var(--amb-warn);
      --amb-stat-tone-soft: var(--amb-warn-soft);
    }

    :host(.amb-stat--danger) {
      --amb-stat-tone: var(--amb-danger);
      --amb-stat-tone-soft: var(--amb-danger-soft);
    }

    // Attention: an accent-free warning tint, plus the figure in the warning
    // hue. The icon the caller passes is the second cue.
    :host(.amb-stat--attention) .amb-stat {
      border-color: var(--amb-warn-border);
      background: var(--amb-warn-soft);
    }

    :host(.amb-stat--attention) .amb-stat__value,
    :host(.amb-stat--attention) .amb-stat__label {
      color: var(--amb-warn);
    }

    // On the attention surface the medallion's own tint is a second wash of the
    // same hue and disappears into it, so it inverts: solid warning, light
    // glyph. It is the only tile in a row that does this, which is the point.
    :host(.amb-stat--attention) .amb-stat__medallion {
      background: var(--amb-warn);
      color: var(--amb-surface-solid);
    }

    // Below the smallest tile width the medallion is competing with the figure
    // for room, and the figure wins.
    @include amb.respond-below(amb.$amb-bp-xs) {
      .amb-stat {
        gap: var(--amb-space-3);
      }

      .amb-stat__medallion {
        width: 2.25rem;
        height: 2.25rem;
        font-size: var(--amb-text-base);
      }
    }

    ::ng-deep .amb-stat__skeleton-value {
      margin-top: var(--amb-space-2);
    }
  `,
  host: {
    '[class.amb-stat--attention]': 'emphasis() === "attention"',
    '[class.amb-stat--info]': 'tone() === "info"',
    '[class.amb-stat--success]': 'tone() === "success"',
    '[class.amb-stat--warn]': 'tone() === "warn"',
    '[class.amb-stat--danger]': 'tone() === "danger"'
  }
})
export class AmbientStatCardComponent {
  readonly label = input.required<string>();

  readonly value = input.required<number>();

  /** A suffix rendered smaller beside the figure — `%`, `h`, `/day`. */
  readonly unit = input<string>();

  readonly icon = input<string>();

  /** One line under the figure, for what the number means. */
  readonly caption = input<string>();

  /** Set to `attention` for a figure that is something to act on. */
  readonly emphasis = input<'default' | 'attention'>('default');

  /**
   * Which hue the icon medallion wears.
   *
   * <p>Every value names a meaning rather than a colour, so a tile cannot be
   * tinted for decoration. `accent` is the neutral default — the figure is just
   * a figure.</p>
   */
  readonly tone = input<'accent' | 'info' | 'success' | 'warn' | 'danger'>('accent');

  /** Route the tile links to. Omit for a figure with nowhere to go. */
  readonly link = input<string>();

  readonly query = input<Record<string, string>>();

  readonly loading = input(false, { transform: booleanAttribute });
}
