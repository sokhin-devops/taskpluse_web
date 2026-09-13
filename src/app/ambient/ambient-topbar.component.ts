import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The bar across the top of the application: where you are on the left, and the
 * controls that belong to the whole product on the right.
 *
 * <h2>What it is and is not</h2>
 *
 * <p>It is scaffolding, and almost all of it is projected. Only the title and
 * the subtitle are its own; the shell decides what the controls are, because the
 * shell is what knows whether anyone is signed in. Nothing about accounts,
 * routes or preferences is hard-coded here, which is what keeps it usable by a
 * screen that wants a topbar with different contents.</p>
 *
 * <p>It carried a search box until the screens it searched grew their own. A
 * second search in the chrome, pointing at one of several screens, was a
 * decision the reader had to make before typing — and the task list's own box,
 * directly above the results, filters as you type rather than waiting for
 * Enter. The bar is better without it.</p>
 *
 * <h2>Three projection slots</h2>
 *
 * <table>
 *   <tr><td><code>ambTopbarLead</code></td>
 *       <td>before the title — the drawer button, on a phone</td></tr>
 *   <tr><td><code>ambTopbarActions</code></td>
 *       <td>the right-hand cluster</td></tr>
 *   <tr><td>default</td>
 *       <td>between the title and the actions, pushed towards the actions</td></tr>
 * </table>
 *
 * @example
 * <amb-topbar [title]="pageTitle()" [subtitle]="greeting()">
 *   <button ambTopbarLead …></button>
 *   <amb-language-switcher ambTopbarActions />
 * </amb-topbar>
 */
@Component({
  selector: 'amb-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'amb-topbar'
  },
  template: `
    <ng-content select="[ambTopbarLead]" />

    <div class="amb-topbar__identity">
      <span class="amb-topbar__title">{{ title() }}</span>
      @if (subtitle()) {
        <span class="amb-topbar__subtitle">{{ subtitle() }}</span>
      }
    </div>

    <div class="amb-topbar__middle">
      <ng-content />
    </div>

    <div class="amb-topbar__actions">
      <ng-content select="[ambTopbarActions]" />
    </div>
  `,
  styles: `
    @use 'ambient' as amb;

    // A panel resting on the canvas, not a bar welded to the top edge: the
    // shell's inset puts canvas above and to both sides of it, so it takes a
    // border all the way round, a corner and a shadow, exactly as the rail
    // beside it does. Both read as the same kind of object, which is the point.
    //
    // It sits above the scroll container rather than inside it, so the page
    // scrolls *below* it and nothing ever passes behind it. Matching its width
    // to the page's is therefore the slot's job, not this component's — see
    // .amb-shell__topbar-slot in the layout stylesheet.
    :host {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--amb-gap-inline);
      height: var(--amb-topbar-height);
      padding-inline: var(--amb-pad-card);

      // The same reading column the page below uses, so the bar's left and
      // right edges land exactly where the cards' do. This did not matter while
      // the bar was a full-bleed strip with only a bottom border — it had no
      // side edges to disagree with. Now that it is a panel with corners, a bar
      // running wider than the content under it is the first thing you see.
      width: 100%;
      max-width: var(--amb-content-width);
      margin-inline: auto;

      // The panel surface, which is the right level again: this sits on the
      // known canvas with nothing passing behind it, exactly like the rail.
      background: var(--amb-surface-1);
      background-image: var(--amb-glass-sheen);
      border: 1px solid var(--amb-border);
      border-radius: var(--amb-radius-panel);
      box-shadow: var(--amb-shadow-sm), var(--amb-glass-inset);
      -webkit-backdrop-filter: var(--amb-glass-filter);
      backdrop-filter: var(--amb-glass-filter);
    }

    .amb-topbar__identity {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-width: 0;
    }

    .amb-topbar__title {
      font-size: var(--amb-text-md);
      font-weight: var(--amb-weight-semibold);
      line-height: var(--amb-leading-tight);
      letter-spacing: var(--amb-tracking-snug);
      color: var(--amb-text);

      @include amb.truncate;
    }

    .amb-topbar__subtitle {
      font-size: var(--amb-text-xs);
      line-height: var(--amb-leading-snug);
      color: var(--amb-text-subtle);

      @include amb.truncate;
    }

    // The middle takes the slack, which is what pushes the actions to the right
    // edge and lets the search grow into whatever is left over.
    .amb-topbar__middle {
      flex: 1 1 auto;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--amb-gap-inline);
      min-width: 0;
    }

    .amb-topbar__actions {
      flex: none;
      display: flex;
      align-items: center;
      gap: var(--amb-gap-tight);
    }

    // Two lines of chrome on a phone is most of the screen.
    @include amb.respond-below(amb.$amb-bp-md) {
      .amb-topbar__subtitle {
        display: none;
      }
    }

    @include amb.respond-below(amb.$amb-bp-sm) {
      :host {
        padding-inline: var(--amb-space-3);
      }
    }
  `
})
export class AmbientTopbarComponent {
  /** Where the reader is. Usually the current screen's name. */
  readonly title = input('');

  /** The line under it. Hidden on a phone, so nothing essential belongs here. */
  readonly subtitle = input('');
}
