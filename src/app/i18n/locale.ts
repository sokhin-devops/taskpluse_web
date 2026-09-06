/**
 * The languages TaskPulse speaks, and the facts about each that are not
 * translations.
 *
 * <p>Kept apart from the message catalogues on purpose. The catalogues are
 * bulk — a thousand strings that only {@link LocaleService} reads. This is the
 * short list that the shell, the stylesheet and the date pipes all need to
 * agree on, and it is small enough to read in one screen.</p>
 */

/** Every language the product ships. Adding one starts here. */
export const AMBIENT_LOCALES = ['en', 'km'] as const;

export type AmbientLocale = (typeof AMBIENT_LOCALES)[number];

/** The language used when nothing has been chosen and nothing can be guessed. */
export const DEFAULT_LOCALE: AmbientLocale = 'en';

/** What the language picker needs to draw one row. */
export interface AmbientLocaleInfo {
  /** BCP 47 tag. Written to `<html lang>` and handed to Angular's date pipes. */
  readonly tag: AmbientLocale;

  /**
   * The language's name in that language.
   *
   * <p>Never translated. Someone who has landed in a language they cannot read
   * needs to find their own in the list, and "Khmer" is no help to a reader who
   * only knows ខ្មែរ. Every picker worth using labels its options this way.</p>
   */
  readonly nativeName: string;

  /** The name in English, for the trigger's accessible label. */
  readonly englishName: string;

  /**
   * The locale Angular's `DatePipe` and `DecimalPipe` are given.
   *
   * <p>Separate from {@link tag} because Angular's registry keys off the exact
   * data file that was registered: `en` resolves to the built-in `en-US`, while
   * `km` is registered explicitly in `app.config.ts`. Passing an unregistered
   * tag throws at render time rather than falling back, so these two strings
   * have to match what was registered exactly.</p>
   */
  readonly dateLocale: string;
}

/** Declaration order is the order the picker lists them in. */
export const AMBIENT_LOCALE_INFO: Record<AmbientLocale, AmbientLocaleInfo> = {
  en: {
    tag: 'en',
    nativeName: 'English',
    englishName: 'English',
    dateLocale: 'en-US'
  },
  km: {
    tag: 'km',
    nativeName: 'ខ្មែរ',
    englishName: 'Khmer',
    dateLocale: 'km'
  }
};

/** Narrows an untrusted string — a stored preference, a browser setting. */
export function isAmbientLocale(value: unknown): value is AmbientLocale {
  return typeof value === 'string' && (AMBIENT_LOCALES as readonly string[]).includes(value);
}
