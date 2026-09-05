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
  `,
  host: {
    '[attr.role]': 'name() ? "img" : null',
    '[attr.aria-label]': 'name()',
    '[attr.aria-hidden]': 'name() ? null : "true"'
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

  readonly size = input<'normal' | 'large' | 'xlarge'>('normal');

  readonly shape = input<'square' | 'circle'>('circle');

  /** PrimeNG uses `undefined` rather than `'normal'` for the default size. */
  protected readonly primeSize = computed(() => {
    const size = this.size();
    return size === 'normal' ? undefined : size;
  });
}
