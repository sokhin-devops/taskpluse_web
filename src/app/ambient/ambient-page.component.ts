import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The reading column every screen sits in.
 *
 * <p>It owns three things a page should never decide for itself: the maximum
 * width, the gutter, and the vertical rhythm between the blocks stacked inside
 * it. Because they live here, changing how spacious the whole product feels is
 * one token ({@code --amb-gap-section}) rather than an edit per screen.</p>
 *
 * @example
 * <amb-page>
 *   <amb-card> ... </amb-card>
 * </amb-page>
 */
@Component({
  selector: 'amb-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClass()'
  },
  // No `:host` display rule: `.amb-page` in `_ambient-layout.scss` makes this a
  // flex column, and a `:host { display: block }` here would match at the same
  // specificity and — being injected later — quietly win, collapsing the gap
  // between the page's sections.
  template: `<ng-content />`
})
export class AmbientPageComponent {
  /**
   * How wide the column is allowed to grow.
   *
   * <p>{@code default} is the reading width; {@code narrow} is for a single
   * form; {@code wide} removes the clamp for a screen that is better full-bleed,
   * such as a board whose columns want every pixel.</p>
   */
  readonly width = input<'default' | 'narrow' | 'wide'>('default');

  /**
   * Makes the column fill the viewport height rather than flow.
   *
   * <p>Only for a screen whose children scroll independently — again, the board.
   * A normal page must not set it, or a short screen grows a scrollbar it has no
   * content for.</p>
   */
  readonly fill = input(false);

  protected readonly hostClass = computed(() => {
    const classes = ['amb-page'];

    if (this.width() === 'narrow') {
      classes.push('amb-page--narrow');
    } else if (this.width() === 'wide') {
      classes.push('amb-page--wide');
    }

    if (this.fill()) {
      classes.push('amb-page--fill');
    }

    return classes.join(' ');
  });
}
