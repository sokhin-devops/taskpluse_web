import { Pipe, PipeTransform, inject } from '@angular/core';

import { LocaleService, MessageParams } from './locale.service';
import { MessageKey } from './messages.en';

/**
 * Renders a message key in the current language.
 *
 * @example
 * {{ 'nav.dashboard' | t }}
 * {{ 'tasks.filter.clear' | t: { count: activeFilterCount() } }}
 * <p-button [label]="'common.save' | t" />
 *
 * <h2>Why this pipe is impure</h2>
 *
 * <p>Because a pure one would be wrong, not because impurity is convenient.</p>
 *
 * <p>A pure pipe is skipped entirely when its arguments have not changed by
 * reference — Angular returns the previous result without calling
 * {@code transform} at all. The argument here is a string literal, which never
 * changes, so a pure version would translate each key exactly once and then
 * serve that first answer for the life of the view. Switching language would
 * repaint every screen with the old words.</p>
 *
 * <p>The usual escape hatch is to pass the reactive value in as a second
 * argument — {@code 'nav.tasks' | t: locale()} — which works by making the
 * cache key change. It also puts a member on every component that uses the
 * pipe and an argument on every call site, to express something that is true of
 * the whole application. Not worth it for what impurity actually costs here: a
 * {@code transform} that is one object property lookup, run once per binding
 * per change-detection pass, in an application whose components are
 * {@code OnPush} and are therefore mostly not checked at all.</p>
 *
 * <p>Reading the signal inside {@code transform} still registers the dependency
 * — the call happens while the template's reactive context is active — so a
 * language change also marks the view dirty rather than waiting for an
 * unrelated event to trigger the next pass.</p>
 *
 * <h2>Name</h2>
 *
 * <p>One letter, against the usual rule that names should be words. It appears
 * several hundred times across these templates, often twice in one element, and
 * at that density {@code | translate} is what stops a line fitting on screen.
 * The convention is common enough in i18n code to be read correctly on sight.</p>
 */
@Pipe({
  name: 't',
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly locale = inject(LocaleService);

  transform(key: MessageKey, params?: MessageParams): string {
    return this.locale.t(key, params);
  }
}
