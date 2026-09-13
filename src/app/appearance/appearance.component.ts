import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import {
  AmbientAppearanceControlsComponent,
  AmbientCardComponent,
  AmbientPageComponent,
  AmbientThemeService
} from '../ambient/ambient';

/**
 * The Appearance screen: how the product looks, on a page of its own.
 *
 * <h2>Why a screen as well as the drawer</h2>
 *
 * <p>The drawer behind the sun icon in the topbar is the quick way to flip to
 * dark and get on with the day. It is not a good way to <em>discover</em> that
 * the product has five styles, and it is not wide enough to show them at a size
 * where the previews mean anything. A navigation item is: it sits in the rail
 * next to Tasks and Tags, so the settings are somewhere you can be sent, link
 * to, and come back to.</p>
 *
 * <p>There is no duplicated logic behind the two.
 * {@link AmbientAppearanceControlsComponent} is the controls; this screen is a
 * page header and a card around it, and the drawer is a drawer around it.</p>
 *
 * <h2>Everything applies immediately</h2>
 *
 * <p>No Save button, and nothing to discard. Every control on this page changes
 * the page you are looking at as you use it, which is the only honest way to
 * choose an appearance — and the whole screen is the preview, so it needs no
 * separate one.</p>
 */
@Component({
  selector: 'app-appearance',
  imports: [AmbientAppearanceControlsComponent, AmbientCardComponent, AmbientPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- The default reading column, not the narrow one: five style tiles at a
         size worth looking at is the whole reason this screen exists, and they
         need the width. The page component binds its own host class, so width
         is an input on it rather than a class written here. -->
    <amb-page>
      <!-- No heading: the topbar already says "Appearance", and this screen
           carried it twice. -->
      <amb-card>
        <amb-appearance-controls layout="page" />
      </amb-card>
    </amb-page>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class AppearanceComponent {
  /**
   * Injected but not read.
   *
   * <p>The controls inject it too, so this is not what makes the screen work —
   * it is what makes the screen <em>reachable</em> in the first place: the
   * service is {@code providedIn: 'root'} and therefore only constructed when
   * something asks for it, and the effects that reflect the theme onto
   * {@code <html>} live in its constructor.</p>
   */
  protected readonly theme = inject(AmbientThemeService);
}
