import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { PrimeNG } from 'primeng/config';

import {
  AMBIENT_PREFERENCE_KEYS,
  readPreference,
  writePreference
} from '../ambient/ambient-preferences';
import {
  AMBIENT_LOCALE_INFO,
  AmbientLocale,
  DEFAULT_LOCALE,
  isAmbientLocale
} from './locale';
import { EN_MESSAGES, MessageCatalogue, MessageKey } from './messages.en';
import { KM_MESSAGES } from './messages.km';
import { primeNgTranslation } from './primeng-translations';

/** Values a message placeholder can be filled with. */
export type MessageParams = Readonly<Record<string, string | number>>;

/** Every catalogue, by tag. Adding a language adds one line here. */
const CATALOGUES: Record<AmbientLocale, MessageCatalogue> = {
  en: EN_MESSAGES,
  km: KM_MESSAGES
};

/** Matches `{name}` in a message. Deliberately not `{{ }}`: that is Angular's. */
const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * The attribute the Khmer font stack is selected with.
 *
 * <p>Separate from `<html lang>` even though the two always agree. `lang` is a
 * document-semantics attribute — it tells the browser which language to
 * hyphenate, spell-check and speak, and a screen reader switches voice on it —
 * so the stylesheet has no business overloading it as a styling hook. Writing
 * both keeps the CSS selector from being the reason `lang` cannot change.</p>
 */
const LOCALE_ATTR = 'data-amb-locale';

/**
 * Owns the interface language.
 *
 * <h2>How a screen uses it</h2>
 *
 * <p>Templates go through the {@code | t} pipe. TypeScript goes through
 * {@link t} directly, and does it inside a {@code computed()} whenever the
 * result is displayed — reading {@link locale} is what makes that computed
 * recalculate when the language changes, and a label built once in a field
 * initialiser would keep the language it was born in forever. Every option
 * list, menu and summary line in this application is a {@code computed} for
 * that reason.</p>
 *
 * <h2>Why the catalogues are bundled rather than fetched</h2>
 *
 * <p>Two languages of UI strings is a few kilobytes after compression, and
 * fetching them costs a round trip on the critical path that the first paint
 * has to either wait for or flash through. Bundling also means
 * {@link MessageKey} is checked at build time: a key that does not exist is a
 * compile error rather than a string of {@code tasks.title} in front of a user.
 * A product with twenty languages would trade that away for lazy loading; one
 * with two should not.</p>
 *
 * <h2>Missing translations</h2>
 *
 * <p>Cannot happen — every catalogue is typed {@code Record<MessageKey, string>}
 * against the English one, so the build fails before a gap can ship. The
 * fallback in {@link t} exists for the case the type system cannot see: a key
 * arriving from data rather than from source, such as the status enum the API
 * sends. It returns the key itself, which is at least diagnosable.</p>
 *
 * <h2>What is not translated</h2>
 *
 * <p>Anything the user typed. Task titles, descriptions, tag names and their
 * own display name are their words, and stay exactly as they wrote them.</p>
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly primeng = inject(PrimeNG);

  /** The language on screen. */
  readonly locale = signal<AmbientLocale>(DEFAULT_LOCALE);

  /** The active catalogue. Read by {@link t}, and by the pipe through it. */
  private readonly catalogue = computed(() => CATALOGUES[this.locale()]);

  /** Facts about the active language, for the picker and the shell. */
  readonly info = computed(() => AMBIENT_LOCALE_INFO[this.locale()]);

  /**
   * The tag to hand Angular's {@code DatePipe} and {@code DecimalPipe}.
   *
   * <p>Those pipes take a locale as their last argument, which is the only way
   * to change their output without rebuilding the application — {@code
   * LOCALE_ID} is fixed at bootstrap. Every date and number binding in the
   * product passes this.</p>
   */
  readonly dateLocale = computed(() => this.info().dateLocale);

  constructor() {
    this.restore();

    // Reflect the choice onto the document: `lang` for the browser and assistive
    // technology, the attribute for the stylesheet's font stack.
    effect(() => this.applyToDocument(this.locale()));

    // PrimeNG renders a month grid, a paginator and a dozen aria labels that
    // never pass through this service's pipe. Its config is a separate sink for
    // the same choice.
    effect(() => this.applyPrimeNgTranslation(this.locale()));
  }

  setLocale(locale: AmbientLocale): void {
    this.locale.set(locale);
    writePreference(AMBIENT_PREFERENCE_KEYS.locale, locale);
  }

  /**
   * The message for a key, with any placeholders filled in.
   *
   * @param key    a key from the English catalogue
   * @param params values for the `{named}` placeholders in it, if it has any
   */
  t(key: MessageKey, params?: MessageParams): string {
    const template = this.catalogue()[key] ?? EN_MESSAGES[key] ?? key;
    return params ? interpolate(template, params) : template;
  }

  // --- internals ---------------------------------------------------------

  /**
   * Hands PrimeNG the strings it renders from its own config.
   *
   * <h2>Why `aria` is merged by hand</h2>
   *
   * <p>{@code setTranslation} is a <em>shallow</em> spread —
   * {@code { ...this.translation, ...value }} — and {@code aria} is the one
   * nested object in the shape. So passing an {@code aria} of our own does not
   * add to PrimeNG's defaults, it <em>replaces</em> them, and every aria key not
   * listed in {@code primeng-translations.ts} becomes {@code undefined}.</p>
   *
   * <p>That is not a silent cosmetic loss. The paginator does
   * {@code translation.aria.pageLabel.replace(...)} while rendering, so a
   * missing key throws mid-change-detection, which aborts the rest of that
   * pass — taking down whatever renders after the table, dialogs included.</p>
   *
   * <p>Merging onto whatever PrimeNG currently holds means a key we do not
   * translate keeps its English default rather than disappearing. It is also
   * idempotent: after the first call the base already contains our own values,
   * so re-applying on a language change is safe.</p>
   */
  private applyPrimeNgTranslation(locale: AmbientLocale): void {
    const next = primeNgTranslation(locale);
    this.primeng.setTranslation({
      ...next,
      aria: { ...this.primeng.translation.aria, ...next.aria }
    });
  }

  /**
   * The stored choice, or the browser's, or English.
   *
   * <p>Guessing from {@code navigator.language} only happens on a first visit.
   * Once someone has chosen, that choice wins even if it disagrees with their
   * browser: a Khmer speaker reading the English interface on purpose should
   * not have it switched back on them every reload.</p>
   */
  private restore(): void {
    const stored = readPreference(AMBIENT_PREFERENCE_KEYS.locale);
    if (isAmbientLocale(stored)) {
      this.locale.set(stored);
      return;
    }

    const preferred = this.detectFromBrowser();
    if (preferred) {
      this.locale.set(preferred);
    }
  }

  /**
   * The first browser language the product speaks.
   *
   * <p>Matched on the primary subtag, so `km-KH` finds `km`. Nothing is written
   * to storage: a guess is not a choice, and persisting it would make the
   * browser's setting stop mattering from the second visit onwards.</p>
   */
  private detectFromBrowser(): AmbientLocale | null {
    const navigator = this.document.defaultView?.navigator;
    const candidates = navigator?.languages ?? (navigator?.language ? [navigator.language] : []);

    for (const candidate of candidates) {
      const primary = candidate.split('-')[0].toLowerCase();
      if (isAmbientLocale(primary)) {
        return primary;
      }
    }
    return null;
  }

  /**
   * Writes the language onto {@code <html>}.
   *
   * <p>No view transition here, unlike a theme change. A cross-fade snapshots
   * the page, runs a callback and snapshots again — but the callback runs
   * outside change detection, so the text would still say what it said before,
   * and the second snapshot would be identical to the first. The re-render
   * arrives a frame later, unanimated and after the transition has finished,
   * which looks worse than no transition at all.</p>
   */
  private applyToDocument(locale: AmbientLocale): void {
    const root = this.document.documentElement;
    root.setAttribute('lang', locale);
    root.setAttribute(LOCALE_ATTR, locale);
  }
}

/**
 * Substitutes `{named}` placeholders.
 *
 * <p>A placeholder with no matching parameter is left standing rather than
 * replaced with an empty string: "Delete {title}?" is a visible bug, while
 * "Delete ?" reads as a finished sentence and would survive review.</p>
 */
function interpolate(template: string, params: MessageParams): string {
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}
