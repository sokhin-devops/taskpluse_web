import { ChangeDetectionStrategy, Component, booleanAttribute, input, viewChild } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';

/**
 * A button that opens a menu of commands: the overflow "…" on a row, an account
 * menu, a set of secondary actions that would crowd a toolbar.
 *
 * <p>It is {@code p-button} plus {@code p-menu}, wired together — which is the
 * part that is easy to get subtly wrong. The trigger declares
 * {@code aria-haspopup="menu"}, and it must carry an accessible name even when
 * it is icon-only, so {@code ariaLabel} is required whenever there is no visible
 * label.</p>
 *
 * <p>This is distinct from {@code <p-select>}: a dropdown runs a command, a
 * select changes a value. Using one for the other is why "Delete" sometimes ends
 * up looking like a choice the user has made rather than an action they have
 * taken.</p>
 *
 * @example
 * <amb-dropdown
 *   icon="pi pi-ellipsis-h"
 *   ariaLabel="More actions for this task"
 *   [items]="rowMenu(task)"
 *   rounded
 *   text
 * />
 */
@Component({
  selector: 'amb-dropdown',
  imports: [ButtonModule, MenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-button
      [label]="label()"
      [icon]="icon()"
      [severity]="severity()"
      [text]="text()"
      [outlined]="outlined()"
      [rounded]="rounded()"
      [size]="size()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel() ?? label()"
      (onClick)="menu.toggle($event)"
    />

    <p-menu
      #menu
      [model]="items()"
      [popup]="true"
      appendTo="body"
      [ariaLabel]="ariaLabel() ?? label()"
      styleClass="amb-menu"
    />
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `,
  host: {
    // On the host rather than the button: PrimeNG owns the button element and
    // would overwrite an attribute bound on it.
    '[attr.aria-haspopup]': '"menu"'
  }
})
export class AmbientDropdownComponent {
  readonly items = input.required<MenuItem[]>();

  readonly label = input<string>();

  readonly icon = input<string>();

  /**
   * The trigger's accessible name. Falls back to the visible label; must be set
   * for an icon-only trigger, which otherwise announces as "button".
   */
  readonly ariaLabel = input<string>();

  readonly severity = input<'primary' | 'secondary' | 'danger'>('secondary');

  readonly text = input(false, { transform: booleanAttribute });

  readonly outlined = input(false, { transform: booleanAttribute });

  readonly rounded = input(false, { transform: booleanAttribute });

  readonly size = input<'small' | 'large' | undefined>(undefined);

  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly menu = viewChild.required<Menu>('menu');

  /** Closes the menu, for a caller that has just navigated or deleted the row. */
  hide(): void {
    this.menu().hide();
  }
}
