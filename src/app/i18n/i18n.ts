/**
 * The internationalisation layer.
 *
 * <h2>The pieces</h2>
 *
 * <table>
 *   <tr><td>{@code locale.ts}</td>
 *       <td>which languages exist, and the facts about each that are not
 *           translations</td></tr>
 *   <tr><td>{@code messages.en.ts}</td>
 *       <td>the English strings, <em>and</em> the definition of what a key
 *           is</td></tr>
 *   <tr><td>{@code messages.km.ts}</td>
 *       <td>the Khmer strings, checked against the above at build time</td></tr>
 *   <tr><td>{@code locale.service.ts}</td>
 *       <td>the choice, its persistence, and the lookup</td></tr>
 *   <tr><td>{@code translate.pipe.ts}</td>
 *       <td>{@code | t}, for templates</td></tr>
 *   <tr><td>{@code primeng-translations.ts}</td>
 *       <td>the strings PrimeNG renders from its own config</td></tr>
 *   <tr><td>{@code language-switcher.component.ts}</td>
 *       <td>the control</td></tr>
 * </table>
 *
 * <h2>Adding a string</h2>
 *
 * <p>Put it in {@code messages.en.ts}. The build then fails until
 * {@code messages.km.ts} has it too, which is the point.</p>
 *
 * <h2>Adding a language</h2>
 *
 * <ol>
 *   <li>Add the tag to {@code AMBIENT_LOCALES} and an entry to
 *       {@code AMBIENT_LOCALE_INFO}.</li>
 *   <li>Write {@code messages.<tag>.ts} as
 *       {@code MessageCatalogue}; the compiler lists what is missing.</li>
 *   <li>Register its Angular locale data in {@code app.config.ts} and add it to
 *       {@code CATALOGUES} in the service.</li>
 *   <li>If its script needs a different typeface, extend the
 *       {@code [data-amb-locale]} block in
 *       {@code _ambient-tokens.scss} and load the font in {@code index.html}.</li>
 * </ol>
 *
 * <h2>Using it from a screen</h2>
 *
 * <p>Templates import {@link TranslatePipe}. TypeScript injects
 * {@link LocaleService} and calls {@code t()} <em>inside a
 * {@code computed()}</em> — a label built in a field initialiser is translated
 * once and then keeps that language for the life of the component, which is the
 * one mistake this layer cannot catch for you.</p>
 *
 * @example
 * // template
 * <h1>{{ 'tasks.title' | t }}</h1>
 *
 * // component
 * private readonly i18n = inject(LocaleService);
 * readonly options = computed(() => [{ label: this.i18n.t('tasks.scope.all'), value: 'all' }]);
 */

export {
  AMBIENT_LOCALES,
  AMBIENT_LOCALE_INFO,
  DEFAULT_LOCALE,
  isAmbientLocale
} from './locale';
export type { AmbientLocale, AmbientLocaleInfo } from './locale';

export { EN_MESSAGES } from './messages.en';
export type { MessageCatalogue, MessageKey } from './messages.en';
export { KM_MESSAGES } from './messages.km';

export { LocaleService } from './locale.service';
export type { MessageParams } from './locale.service';

export { TranslatePipe } from './translate.pipe';
export { primeNgTranslation } from './primeng-translations';
export { AmbientLanguageSwitcherComponent } from './language-switcher.component';
