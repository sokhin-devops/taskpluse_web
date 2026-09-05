import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

import { AmbientCardComponent } from './ambient-card.component';

/**
 * The glass frame a data table lives in.
 *
 * <p>This is deliberately a frame and not a wrapper around {@code p-table}. A
 * component that owned the table would have to re-expose lazy loading,
 * templates, sorting, paging, row expansion and every other input the page
 * actually uses, and each one re-exposed is one more that can drift out of step
 * with PrimeNG. Projecting the table keeps all of it — the page writes an
 * ordinary {@code <p-table>} with all its own behaviour intact.</p>
 *
 * <p>What the frame contributes is the part every table screen was otherwise
 * repeating: a flush card so the table's own cell padding is the only padding,
 * a header row for a title and filters, and the states the table cannot draw for
 * itself.</p>
 *
 * <h2>Why the table stays mounted</h2>
 *
 * <p>The loading, error and empty states are projected as siblings of the table
 * rather than replacing it, because a lazy {@code p-table} performs its first
 * fetch from {@code (onLazyLoad)}. Unmounting it during loading would mean
 * nothing ever asks for the first page. The page hides it with
 * {@code [class.amb-hidden]} instead — see the task list.</p>
 *
 * @example
 * <amb-table title="Tasks" [state]="tableState()">
 *   <amb-empty-state ambTableEmpty icon="pi pi-inbox" title="No tasks yet" />
 *   <p-table [value]="tasks()" [class.amb-hidden]="!hasRows()"> ... </p-table>
 * </amb-table>
 */
@Component({
  selector: 'amb-table',
  imports: [AmbientCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <amb-card
      flush
      [title]="title() || undefined"
      [subtitle]="subtitle() || undefined"
      [styleClass]="cardClass()"
    >
      <div class="amb-table__frame">
        <ng-content />
      </div>
    </amb-card>
  `,
  styles: `
    :host {
      display: block;
    }

    // Deliberately not overflow: hidden. PrimeNG's paginator renders its
    // rows-per-page dropdown inline, so a clipping ancestor would cut the open
    // panel off at the foot of the card. The header and last-row corners are
    // rounded directly instead — see _ambient-components.scss.
    .amb-table__frame {
      min-width: 0;
    }

    // A table wider than its frame scrolls inside it rather than pushing the
    // page sideways. PrimeNG's own responsive "stack" mode handles the phone
    // case; this covers the laptop one, where the columns are merely tight.
    :host(.amb-table--scroll) .amb-table__frame {
      overflow-x: auto;
    }
  `,
  host: {
    '[class.amb-table--scroll]': 'scrollable()'
  }
})
export class AmbientTableComponent {
  /** A heading above the table. Omit when the page header already names it. */
  readonly title = input<string>('');

  readonly subtitle = input<string>('');

  /**
   * Lets a wide table scroll horizontally inside the card.
   *
   * <p>Off by default: most tables here use PrimeNG's stacked responsive layout,
   * which is a better answer than a scrollbar when the constraint is a phone
   * rather than a genuinely wide dataset.</p>
   */
  readonly scrollable = input(false, { transform: booleanAttribute });

  readonly styleClass = input<string>('');

  protected readonly cardClass = computed(() =>
    ['amb-table-card', this.styleClass()].filter(Boolean).join(' ')
  );
}
