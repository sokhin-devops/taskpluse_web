import { ChangeDetectionStrategy, Component, booleanAttribute, input, viewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Menu, MenuModule } from 'primeng/menu';

/**
 * A list of commands, inline or as a popup.
 *
 * <p>PrimeNG's {@code p-menu} underneath, which is what makes the keyboard
 * behaviour correct: arrow keys, {@code Home}/{@code End}, type-ahead,
 * {@code Esc} to dismiss, and focus returning to the trigger. The ambient layer
 * only supplies the surface, which is level-3 glass because a popup floats over
 * arbitrary content.</p>
 *
 * <p>A popup menu is appended to {@code body} so it cannot be clipped by an
 * ancestor's {@code overflow: hidden} — the shell's scroll container would
 * otherwise cut off a menu opened near the foot of the page.</p>
 *
 * <p>For the common case of a button that opens a menu, use
 * {@code <amb-dropdown>}, which packages the trigger with it.</p>
 *
 * @example
 * <button (click)="menu.toggle($event)">Account</button>
 * <amb-menu #menu [items]="accountMenu()" popup />
 */
@Component({
  selector: 'amb-menu',
  imports: [MenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-menu
      #menu
      [model]="items()"
      [popup]="popup()"
      [appendTo]="popup() ? 'body' : null"
      [ariaLabel]="ariaLabel()"
      styleClass="amb-menu"
    />
  `,
  styles: `
    :host {
      display: contents;
    }
  `
})
export class AmbientMenuComponent {
  readonly items = input.required<MenuItem[]>();

  readonly popup = input(false, { transform: booleanAttribute });

  /** Names the menu for a screen reader. Required when it has no visible title. */
  readonly ariaLabel = input<string>();

  private readonly menu = viewChild.required<Menu>('menu');

  /**
   * Opens or closes a popup menu, anchored to the event's target.
   *
   * <p>The event is not optional: PrimeNG positions the overlay from it, and a
   * menu called without one appears in the corner of the viewport.</p>
   */
  toggle(event: Event): void {
    this.menu().toggle(event);
  }

  hide(): void {
    this.menu().hide();
  }
}
