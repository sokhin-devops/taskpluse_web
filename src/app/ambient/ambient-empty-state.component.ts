import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The one empty, error and "nothing matched" state in the product.
 *
 * <p>Three screens had written their own before this existed, with three
 * different icon sizes and three different amounts of space around them. It is a
 * component rather than a class because the shape is fixed — icon, heading,
 * one explanatory line, one or two actions — and the only thing that varies is
 * the words.</p>
 *
 * <p>The heading is an {@code <h2>}: an empty state sits inside a page that
 * already has an {@code <h1>}, and a state that promotes itself to the page
 * title breaks the document outline. The icon is always
 * {@code aria-hidden} — the heading already says what it means.</p>
 *
 * @example
 * <amb-empty-state
 *   icon="pi pi-filter-slash"
 *   title="No tasks match these filters"
 *   text="Try widening the search, or clear the filters to see everything."
 * >
 *   <p-button label="Clear filters" [outlined]="true" (onClick)="clearFilters()" />
 * </amb-empty-state>
 */
@Component({
  selector: 'amb-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <i class="amb-empty__icon" [class]="icon()" aria-hidden="true"></i>

    <h2 class="amb-empty__title">{{ title() }}</h2>

    @if (text()) {
      <p class="amb-empty__text">{{ text() }}</p>
    }

    <div class="amb-empty__actions">
      <ng-content />
    </div>
  `,
  styles: `
    @use 'ambient' as amb;

    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      // Generous, because an empty state is the whole content of whatever
      // contains it. Cramped empty space reads as a broken layout.
      padding: var(--amb-space-9) var(--amb-space-6);
      text-align: center;
    }

    .amb-empty__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.25rem;
      height: 3.25rem;
      margin-bottom: var(--amb-space-4);
      border: 1px solid var(--amb-border);
      border-radius: var(--amb-radius-pill);
      background: var(--amb-surface-muted);
      font-size: 1.375rem;
      color: var(--amb-text-subtle);
    }

    .amb-empty__title {
      font-size: var(--amb-text-lg);
      font-weight: var(--amb-weight-semibold);
      letter-spacing: var(--amb-tracking-snug);
      color: var(--amb-text);
    }

    .amb-empty__text {
      max-width: 32rem;
      margin-top: var(--amb-space-2);
      font-size: var(--amb-text-base);
      color: var(--amb-text-muted);
    }

    .amb-empty__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--amb-gap-tight);

      // Only when there is something in it. An empty flex box with a top margin
      // adds space below the text for no reason.
      &:not(:empty) {
        margin-top: var(--amb-space-5);
      }
    }

    // The error tone. The icon carries it, not the heading: a red heading on a
    // screen that failed to load reads as an alarm rather than an explanation.
    :host(.amb-empty--error) .amb-empty__icon {
      border-color: var(--amb-danger-border);
      background: var(--amb-danger-soft);
      color: var(--amb-danger);
    }

    @include amb.respond-below(amb.$amb-bp-sm) {
      :host {
        padding: var(--amb-space-7) var(--amb-space-4);
      }
    }
  `,
  host: {
    '[class.amb-empty--error]': 'tone() === "error"'
  }
})
export class AmbientEmptyStateComponent {
  /** A PrimeIcons class, e.g. `pi pi-inbox`. */
  readonly icon = input.required<string>();

  /** What has happened, in the user's terms. Not "No data". */
  readonly title = input.required<string>();

  /** One line saying what to do about it. */
  readonly text = input<string>();

  /** `error` tints the icon and is for a state the user did not choose. */
  readonly tone = input<'neutral' | 'error'>('neutral');
}
