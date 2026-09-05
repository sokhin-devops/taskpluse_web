import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * The ambient canvas: the calm visual environment the whole product sits inside.
 *
 * <p>Rendered exactly once, at the top of the application shell. It is fixed to
 * the viewport and {@code pointer-events: none}, so it never scrolls, never
 * intercepts a click, and never needs to be repeated per screen — which is what
 * stops "ambient" from becoming each page inventing its own gradient.</p>
 *
 * <p>The layer is five elements: a sheen across the top, a faint mesh, three
 * radial glows that drift very slowly out of phase, and a vignette that lets
 * the corners fall away. All of it is decorative and none of it is announced:
 * the host carries {@code aria-hidden}, so assistive technology never sees any
 * of it.</p>
 *
 * <p>It flips with the colour scheme without knowing anything about it — every
 * layer paints in a token, and the tokens change under {@code .amb-dark}.</p>
 *
 * <p>Everything visual lives in {@code _ambient-background.scss}, including the
 * behaviour under {@code prefers-reduced-motion} and
 * {@code prefers-reduced-transparency}. There is nothing to configure here on
 * purpose: one canvas, one appearance, changed centrally through the tokens.</p>
 *
 * @example
 * <amb-background />
 * <div class="amb-shell"> ... </div>
 */
@Component({
  selector: 'amb-background',
  // The stylesheet is global (`_ambient-background.scss`), so this component
  // needs no styles of its own — but it must not scope the class names it
  // renders either, hence `None`. It emits no CSS, so there is nothing to leak.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true'
  },
  template: `
    <div class="amb-bg">
      <span class="amb-bg__sheen"></span>
      <span class="amb-bg__mesh"></span>
      <span class="amb-bg__glow amb-bg__glow--1"></span>
      <span class="amb-bg__glow amb-bg__glow--2"></span>
      <span class="amb-bg__glow amb-bg__glow--3"></span>
      <span class="amb-bg__vignette"></span>
    </div>
  `
})
export class AmbientBackgroundComponent {}
