import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model } from '@angular/core';
import { DialogModule } from 'primeng/dialog';

/**
 * A modal dialog on the level-3 glass surface.
 *
 * <p>PrimeNG's {@code p-dialog} underneath, and deliberately so: the focus trap,
 * the {@code Esc} handler, {@code aria-modal}, the return of focus to whatever
 * opened it and the scroll lock on the body are all things a hand-rolled dialog
 * gets wrong. None of that is reimplemented here.</p>
 *
 * <p>What this adds is the two decisions every dialog in the product should
 * share: a width from a named scale rather than a magic number per call site,
 * and a footer that is always a right-aligned button row.</p>
 *
 * @example
 * <amb-dialog [(visible)]="formVisible" header="New task" width="md">
 *   <form> ... </form>
 *   <ng-container ambDialogFooter>
 *     <p-button label="Cancel" [text]="true" (onClick)="close()" />
 *     <p-button label="Create" (onClick)="save()" />
 *   </ng-container>
 * </amb-dialog>
 */
@Component({
  selector: 'amb-dialog',
  imports: [DialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [header]="header()"
      [modal]="modal()"
      [draggable]="false"
      [dismissableMask]="dismissableMask()"
      [closeOnEscape]="true"
      [styleClass]="dialogClass()"
      [style]="{ width: widthValue() }"
      [breakpoints]="breakpoints"
    >
      <ng-content />

      <ng-template #footer>
        <div class="amb-dialog__footer">
          <ng-content select="[ambDialogFooter]" />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .amb-dialog__footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
      gap: var(--amb-gap-tight);
    }
  `
})
export class AmbientDialogComponent {
  /** Two-way. The caller owns whether the dialog is open. */
  readonly visible = model(false);

  readonly header = input<string>('');

  /**
   * How wide the dialog is, from a fixed scale.
   *
   * <p>A named step rather than a CSS length so the product does not end up with
   * a 26rem dialog beside a 28rem one for no reason anybody remembers.</p>
   */
  readonly width = input<'sm' | 'md' | 'lg'>('md');

  readonly modal = input(true, { transform: booleanAttribute });

  /**
   * Whether clicking the backdrop closes the dialog.
   *
   * <p>Off by default: these dialogs hold forms, and a stray click outside one
   * should not throw away what the user typed.</p>
   */
  readonly dismissableMask = input(false, { transform: booleanAttribute });

  readonly styleClass = input<string>('');

  /**
   * Below this width the dialog goes nearly full-bleed. The narrower phone case
   * is handled in `_ambient-components.scss`, which cannot be expressed here
   * because PrimeNG writes the width as an inline style.
   */
  protected readonly breakpoints = { '640px': '92vw' };

  protected readonly widthValue = computed(
    () => ({ sm: '26rem', md: '34rem', lg: '48rem' })[this.width()]
  );

  protected readonly dialogClass = computed(() =>
    ['amb-dialog', this.styleClass()].filter(Boolean).join(' ')
  );
}
