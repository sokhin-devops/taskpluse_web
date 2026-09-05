import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ToolbarModule } from 'primeng/toolbar';

/**
 * A horizontal bar of controls: filters, bulk actions, a view switcher.
 *
 * <p>PrimeNG's {@code p-toolbar} underneath, which supplies the three named
 * regions — start, centre, end — and their responsive behaviour. What this adds
 * is the ambient surface choice and the one decision a toolbar always has to
 * make: whether it is a distinct surface or part of the one above it.</p>
 *
 * <p>{@code variant="plain"} drops the surface entirely, for a toolbar that sits
 * inside a card and would otherwise be a second box drawn inside the first.</p>
 *
 * @example
 * <amb-toolbar>
 *   <ng-container ambToolbarStart>
 *     <p-iconfield> ... </p-iconfield>
 *   </ng-container>
 *   <ng-container ambToolbarEnd>
 *     <p-button label="Clear" [text]="true" />
 *   </ng-container>
 * </amb-toolbar>
 */
@Component({
  selector: 'amb-toolbar',
  imports: [ToolbarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-toolbar [styleClass]="toolbarClass()">
      <ng-template #start>
        <div class="amb-toolbar__group">
          <ng-content select="[ambToolbarStart]" />
        </div>
      </ng-template>

      <ng-template #center>
        <div class="amb-toolbar__group">
          <ng-content select="[ambToolbarCenter]" />
        </div>
      </ng-template>

      <ng-template #end>
        <div class="amb-toolbar__group">
          <ng-content select="[ambToolbarEnd]" />
        </div>
      </ng-template>
    </p-toolbar>
  `,
  styles: `
    @use 'ambient' as amb;

    :host {
      display: block;
    }

    // Every region wraps rather than overflows. A filter bar that scrolls
    // sideways hides controls the user has no reason to expect are there.
    .amb-toolbar__group {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--amb-gap-tight);
      min-width: 0;
    }

    // Plain: no surface of its own, for a toolbar inside a card.
    :host(.amb-toolbar--plain) ::ng-deep .p-toolbar {
      padding: 0;
      border: 0;
      background: transparent;
      box-shadow: none;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }

    @include amb.respond-below(amb.$amb-bp-sm) {
      // On a phone the three regions stack, and each one stretches, so a lone
      // control in a region is full width instead of a stub in the corner.
      ::ng-deep .p-toolbar {
        flex-direction: column;
        align-items: stretch;
      }

      .amb-toolbar__group {
        justify-content: flex-start;
      }
    }
  `,
  host: {
    '[class.amb-toolbar--plain]': 'variant() === "plain"'
  }
})
export class AmbientToolbarComponent {
  /**
   * `surface` draws the level-2 glass; `plain` draws nothing, for a toolbar that
   * already sits on one.
   */
  readonly variant = input<'surface' | 'plain'>('surface');

  readonly styleClass = input<string>('');

  protected readonly toolbarClass = computed(() =>
    ['amb-toolbar', this.styleClass()].filter(Boolean).join(' ')
  );
}
