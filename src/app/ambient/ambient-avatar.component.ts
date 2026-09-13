import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

/**
 * A person, as initials or a picture.
 *
 * <p>PrimeNG's {@code p-avatar} underneath. What is added is the one thing an
 * avatar in a real product always needs and PrimeNG cannot know: a name, so the
 * initials are not the only thing announced.</p>
 *
 * <p>When {@code name} is set the host carries it as an accessible label and the
 * initials themselves are hidden from assistive technology — "SR" read aloud as
 * two letters tells nobody who this is. When it is not, the avatar is treated as
 * decoration and hidden entirely, which is correct for an avatar sitting beside
 * the same name in text.</p>
 *
 * @example
 * <amb-avatar [initials]="initials()" [name]="user()?.displayName" />
 */
@Component({
  selector: 'amb-avatar',
  imports: [AvatarModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-avatar
      [label]="image() ? undefined : initials()"
      [image]="image()"
      [size]="primeSize()"
      [shape]="shape()"
      styleClass="amb-avatar"
    />
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    ::ng-deep .amb-avatar {
      font-weight: var(--amb-weight-semibold);
      letter-spacing: var(--amb-tracking-wide);
      border: 1px solid var(--amb-border-accent);
      // The initials are centred optically rather than metrically: uppercase
      // letters sit high in their box, so the default centring reads low.
      line-height: 1;
    }

    // A step below PrimeNG's smallest. It has three sizes and the smallest is
    // 2rem, which is right for an avatar that is the subject of its row and too
    // big for one that is only identifying the row — the account button at the
    // foot of the rail, where the name beside it is what is actually being read.
    :host(.amb-avatar--small) ::ng-deep .amb-avatar {
      width: 1.75rem;
      height: 1.75rem;
      font-size: var(--amb-text-2xs);
      letter-spacing: var(--amb-tracking-normal);
    }
  `,
  host: {
    '[attr.role]': 'name() ? "img" : null',
    '[attr.aria-label]': 'name()',
    '[attr.aria-hidden]': 'name() ? null : "true"',
    '[class.amb-avatar--small]': 'size() === "small"'
  }
})
export class AmbientAvatarComponent {
  /** One or two letters. Ignored when `image` is set. */
  readonly initials = input<string>('');

  /** A picture, which takes precedence over the initials. */
  readonly image = input<string>();

  /**
   * Who this is. Announced in place of the initials; omit for an avatar that is
   * pure decoration beside the name in text.
   */
  readonly name = input<string>();

  readonly size = input<'small' | 'normal' | 'large' | 'xlarge'>('normal');

  readonly shape = input<'square' | 'circle'>('circle');

  /**
   * PrimeNG uses `undefined` rather than `'normal'` for the default size, and
   * has no `small` at all — that one is PrimeNG's default scaled down by the
   * stylesheet above, so it is also `undefined` here.
   */
  protected readonly primeSize = computed(() => {
    const size = this.size();
    return size === 'normal' || size === 'small' ? undefined : size;
  });
}
