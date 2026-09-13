import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';

import { TranslatePipe } from '../i18n/translate.pipe';
import { AmbientAppearanceControlsComponent } from './ambient-appearance-controls.component';

/**
 * The appearance settings in a drawer: the quick way in, from anywhere.
 *
 * <p>All of the controls come from {@link AmbientAppearanceControlsComponent},
 * so this component is the drawer and nothing else — the width it opens to, and
 * the link out to the full screen for anyone who would rather see the styles at
 * a size where the previews are worth looking at.</p>
 *
 * <p>PrimeNG's {@code p-drawer} underneath, which supplies the focus trap, the
 * {@code Esc} handler, dismissal on outside click and the return of focus to
 * the trigger.</p>
 *
 * <p><strong>Render this once per screen.</strong> Each instance carries its own
 * drawer, so two of them means two drawers in the document, two focus traps,
 * and every control announced twice.</p>
 *
 * @example
 * <amb-appearance-panel [(visible)]="open" />
 */
@Component({
  selector: 'amb-appearance-panel',
  imports: [DrawerModule, RouterLink, AmbientAppearanceControlsComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-drawer
      [(visible)]="visible"
      position="right"
      styleClass="amb-appearance"
      [header]="'appearance.title' | t"
      [ariaCloseLabel]="'common.close' | t"
    >
      <amb-appearance-controls layout="panel" />

      <!-- The drawer is 21rem wide and the style previews are the one control
           here that genuinely wants room. Rather than cramp them, point at the
           screen that has it — where there is one to point at. -->
      @if (pageLink()) {
        <a class="amb-appearance__more" routerLink="/appearance" (click)="visible.set(false)">
          {{ 'appearance.openPage' | t }}
          <i class="pi pi-arrow-right" aria-hidden="true"></i>
        </a>
      }
    </p-drawer>
  `,
  styles: `
    @use 'ambient' as amb;

    // The drawer itself is appended to <body>, so its own box has to be reached
    // from outside this component's scope. Everything *inside* it belongs to
    // <amb-appearance-controls> and needs no such thing.
    ::ng-deep .amb-appearance {
      width: 21rem;
      max-width: 100vw;
    }

    .amb-appearance__more {
      display: inline-flex;
      align-items: center;
      gap: var(--amb-space-2);
      margin-top: var(--amb-space-6);
      font-size: var(--amb-text-sm);
      font-weight: var(--amb-weight-medium);

      i {
        font-size: var(--amb-text-xs);
      }
    }
  `
})
export class AmbientAppearancePanelComponent {
  /** Whether the drawer is open. Two-way, because the trigger owns it. */
  readonly visible = model(false);

  /**
   * Whether to offer the way out to the Appearance screen.
   *
   * <p>Set it false where that screen cannot be reached — signed out, it is
   * behind the auth guard, and following the link would bounce straight back to
   * the page you were already on. An input rather than something this component
   * works out for itself, because the Ambient layer has no business knowing what
   * the application's routes are guarded by.</p>
   */
  readonly pageLink = input(true);
}
