import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * An icon, a word, and somewhere to go: the tile a grid of shortcuts is made of.
 *
 * <h2>How it differs from {@code <amb-stat-card>}</h2>
 *
 * <p>A stat card is a <em>figure</em> that happens to be clickable. This is a
 * <em>verb</em> — it has no value to report and exists only to be followed. They
 * look like relatives because they are built from the same interactive surface
 * and the same medallion, and they are separate components because a stat card
 * without a number is a broken stat card rather than a shortcut.</p>
 *
 * <h2>Link or button</h2>
 *
 * <p>Set {@code link} for somewhere to navigate, or listen to {@code action} for
 * something that happens on this screen — opening the new-task dialog, say. One
 * of the two is required in practice: the element rendered is an {@code <a>}
 * when there is a route and a {@code <button>} when there is not, so the thing
 * under the cursor is always the right kind of control. A route that renders as
 * a button cannot be opened in a new tab; a command that renders as a link
 * lies about what will happen.</p>
 *
 * @example
 * <amb-action-tile
 *   icon="pi pi-plus"
 *   label="New task"
 *   link="/tasks"
 *   [query]="{ new: '1' }"
 * />
 */
@Component({
  selector: 'amb-action-tile',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (link()) {
      <a class="amb-action amb-interactive" [routerLink]="link()" [queryParams]="query()">
        <span class="amb-action__medallion" aria-hidden="true">
          <i [class]="icon()"></i>
        </span>
        <span class="amb-action__label">{{ label() }}</span>
      </a>
    } @else {
      <button type="button" class="amb-action amb-interactive" (click)="action.emit()">
        <span class="amb-action__medallion" aria-hidden="true">
          <i [class]="icon()"></i>
        </span>
        <span class="amb-action__label">{{ label() }}</span>
      </button>
    }
  `,
  styles: `
    @use 'ambient' as amb;

    :host {
      display: block;
    }

    .amb-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--amb-space-2);
      width: 100%;
      height: 100%;
      padding: var(--amb-pad-compact) var(--amb-space-2);
      // The button branch: strip the two things a <button> brings that an <a>
      // does not, so both render identically.
      font: inherit;
      text-align: center;
    }

    .amb-action__medallion {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--amb-radius-pill);
      background: var(--amb-accent-soft);
      color: var(--amb-accent-on-soft);
      font-size: var(--amb-text-lg);
      box-shadow: var(--amb-fill-sheen);
      transition: var(--amb-transition);
    }

    // The medallion fills in on hover. It is the surface's own hover that is
    // doing the work; this just gives the eye something to land on inside it.
    .amb-action:hover .amb-action__medallion {
      background: var(--amb-accent);
      color: var(--amb-accent-contrast);
    }

    .amb-action__label {
      font-size: var(--amb-text-sm);
      font-weight: var(--amb-weight-medium);
      line-height: var(--amb-leading-snug);
      color: var(--amb-text);
      // Two words is the ceiling for a tile this size; wrapping is expected and
      // the balance keeps "New task" from breaking as "New" over "task".
      text-wrap: balance;
    }
  `
})
export class AmbientActionTileComponent {
  readonly icon = input.required<string>();

  readonly label = input.required<string>();

  /** Route to navigate to. Omit for a tile that does something here instead. */
  readonly link = input<string>();

  readonly query = input<Record<string, string>>();

  /** Emitted when a tile with no route is pressed. */
  readonly action = output<void>();
}
