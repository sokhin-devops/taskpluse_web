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
      <span class="amb-stat__label">
        @if (icon()) {
          <i [class]="icon()" aria-hidden="true"></i>
        }
        {{ label() }}
      </span>

      <strong class="amb-stat__value">
        {{ value() | number }}@if (unit()) {<span class="amb-stat__unit">{{ unit() }}</span>}
      </strong>

      @if (caption()) {
        <span class="amb-stat__caption">{{ caption() }}</span>
      }
    </ng-template>
  `,
  styles: `
    @use 'ambient' as amb;

    :host {
      display: block;
    }

    .amb-stat {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-2);
      height: 100%;
      padding: var(--amb-pad-card);
    }

    .amb-stat__label {
      display: flex;
      align-items: center;
      gap: var(--amb-space-2);

      @include amb.eyebrow;

      i {
        font-size: var(--amb-text-sm);
        line-height: 1;
      }
    }

    .amb-stat__value {
      @include amb.figure(var(--amb-text-3xl));

      // Pushed to the bottom of the tile so a row of tiles aligns on the figure
      // even when one of them carries a second line of label.
      margin-top: auto;
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

    ::ng-deep .amb-stat__skeleton-value {
      margin-top: var(--amb-space-2);
    }
  `,
  host: {
    '[class.amb-stat--attention]': 'emphasis() === "attention"'
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

  /** Route the tile links to. Omit for a figure with nowhere to go. */
  readonly link = input<string>();

  readonly query = input<Record<string, string>>();

  readonly loading = input(false, { transform: booleanAttribute });
}
