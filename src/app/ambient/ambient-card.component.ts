import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  booleanAttribute,
  computed,
  contentChild,
  input
} from '@angular/core';
import { CardModule } from 'primeng/card';

/**
 * Marks projected content as a surface's actions, so a card or a panel can put
 * it in the header row beside the title rather than in the body.
 *
 * <p>It is a marker, not a wrapper: it adds no element and no styling. Its only
 * job is to be findable by {@code contentChild}, which is what lets a card know
 * whether it has a header to draw at all.</p>
 *
 * @example
 * <amb-card title="Trend">
 *   <p-button ambActions icon="pi pi-refresh" />
 *   ...body...
 * </amb-card>
 */
@Directive({
  selector: '[ambActions]'
})
export class AmbientActionsDirective {}

/**
 * The workhorse surface: a level-2 glass card with an optional header.
 *
 * <p>It is PrimeNG's {@code p-card} underneath, so anything that already works
 * with a PrimeNG card keeps working. What this adds is the header convention —
 * eyebrow, title, supporting line, actions — and the two padding decisions a
 * page would otherwise make differently every time.</p>
 *
 * <p>The glass itself is not here. {@code .p-card} is styled once in
 * {@code _ambient-components.scss} and coloured by the theme preset, so a card
 * rendered by this component and one rendered by a page that reached for
 * {@code p-card} directly are the same surface.</p>
 *
 * @example
 * <amb-card title="Open work by priority" subtitle="Completed tasks are left out.">
 *   <ul> ... </ul>
 * </amb-card>
 *
 * @example A card that only frames a table.
 * <amb-card flush>
 *   <p-table ...></p-table>
 * </amb-card>
 */
@Component({
  selector: 'amb-card',
  imports: [CardModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-card [styleClass]="cardClass()">
      @if (hasHeader()) {
        <header class="amb-card__head">
          <div class="amb-card__titles">
            @if (eyebrow()) {
              <span class="amb-eyebrow">{{ eyebrow() }}</span>
            }
            @if (title()) {
              <h2 class="amb-section-title">{{ title() }}</h2>
            }
            @if (subtitle()) {
              <p class="amb-section-subtitle">{{ subtitle() }}</p>
            }
          </div>

          <div class="amb-card__actions">
            <ng-content select="[ambActions]" />
          </div>
        </header>
      }

      <ng-content />
    </p-card>
  `,
  styles: `
    @use 'ambient' as amb;

    :host {
      display: block;
    }

    .amb-card__head {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--amb-gap-inline);
      // The header is separated from the body by space, not by a rule. A line
      // across a glass card cuts it into two surfaces.
      margin-bottom: var(--amb-space-4);
    }

    .amb-card__titles {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-1);
      min-width: 0;
    }

    .amb-card__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--amb-gap-tight);
    }

    // A flush card frames its child rather than padding it, so the header needs
    // the padding the body no longer has.
    :host(.amb-card--is-flush) .amb-card__head {
      margin-bottom: 0;
      padding: var(--amb-pad-card) var(--amb-pad-card) var(--amb-space-4);
    }

    @include amb.respond-below(amb.$amb-bp-xs) {
      .amb-card__actions {
        width: 100%;
      }
    }
  `,
  host: {
    '[class.amb-card--is-flush]': 'flush()'
  }
})
export class AmbientCardComponent {
  /** The card's heading. Rendered as an `<h2>`: a page's `<h1>` is its title. */
  readonly title = input<string>();

  /** One supporting line under the title. */
  readonly subtitle = input<string>();

  /** A small uppercase label above the title. */
  readonly eyebrow = input<string>();

  /**
   * Removes the body padding, so the card becomes a frame around something that
   * brings its own — a table, a list of rows, a chart that bleeds to the edge.
   */
  readonly flush = input(false, { transform: booleanAttribute });

  /**
   * Gives the card the shared hover-and-focus treatment, for a card that is
   * itself a link or a button.
   *
   * <p>It does not make the card focusable. Whatever is inside must still be a
   * real interactive element, or the affordance is a lie.</p>
   */
  readonly interactive = input(false, { transform: booleanAttribute });

  /** Extra classes for the underlying `p-card`. */
  readonly styleClass = input<string>('');

  private readonly actions = contentChild(AmbientActionsDirective);

  /** A header is drawn when there is either something to title it or to act on. */
  protected readonly hasHeader = computed(
    () => !!this.title() || !!this.subtitle() || !!this.eyebrow() || !!this.actions()
  );

  protected readonly cardClass = computed(() => {
    const classes = ['amb-card'];

    if (this.flush()) {
      // Read by `_ambient-components.scss`, which is where the padding actually
      // comes off — `p-card-body` is PrimeNG's element, not ours.
      classes.push('amb-card--flush');
    }

    if (this.interactive()) {
      classes.push('amb-interactive');
    }

    const extra = this.styleClass();
    if (extra) {
      classes.push(extra);
    }

    return classes.join(' ');
  });
}
