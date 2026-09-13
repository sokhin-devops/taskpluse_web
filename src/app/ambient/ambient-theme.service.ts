import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AmbientAccentRamp, buildAccentRamp, normaliseHex } from './ambient-accent-ramp';
import { AMBIENT_PREFERENCE_KEYS, readPreference, writePreference } from './ambient-preferences';

/** What the user chose. `system` follows the OS and keeps following it. */
export type AmbientScheme = 'light' | 'dark' | 'system';

/** What is actually on screen. `system` has been resolved away. */
export type AmbientResolvedScheme = 'light' | 'dark';

/** The accent palettes in `_ambient-accents.scss`. Keep the two lists in step. */
export const AMBIENT_ACCENTS = ['indigo', 'violet', 'blue', 'teal', 'emerald', 'rose'] as const;

export type AmbientAccent = (typeof AMBIENT_ACCENTS)[number];

/**
 * What the accent is set to: one of the built-in palettes, or a colour the user
 * chose, whose palette is generated rather than authored.
 */
export type AmbientAccentChoice = AmbientAccent | 'custom';

/** The vibes in `_ambient-vibes.scss`. Keep the two lists in step. */
export const AMBIENT_VIBES = ['minimal', 'ambient', 'glass', 'material', 'neumorph'] as const;

export type AmbientVibe = (typeof AMBIENT_VIBES)[number];

/**
 * The vibe a reader gets before they have chosen one.
 *
 * <p>Minimalist, because it is the one that asks least of the content and least
 * of the machine: no blur anywhere means no compositing layer per surface, and
 * a first-run user should meet the product, not the theme engine.</p>
 */
export const DEFAULT_VIBE: AmbientVibe = 'minimal';

/** Where the custom colour starts, before anyone has moved it. */
export const DEFAULT_CUSTOM_ACCENT = '#6366f1';

// The pickers' human-readable names used to live here. They are in the message
// catalogues now: a label shown to a user is copy, and copy that sits in a
// service is copy that only exists in one language.

/** The class `_ambient-tokens.scss` and PrimeNG's `darkModeSelector` both watch. */
const DARK_CLASS = 'amb-dark';

/** The attribute `_ambient-accents.scss` selects a palette with. */
const ACCENT_ATTR = 'data-amb-accent';

/** The attribute `_ambient-vibes.scss` selects a vibe with. */
const VIBE_ATTR = 'data-amb-vibe';

/** What `data-amb-accent` is set to while a generated palette is live. It
    matches no block in `_ambient-accents.scss` on purpose: the palette arrives
    as inline custom properties, which outrank every stylesheet. */
const CUSTOM_ACCENT = 'custom';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Owns the three axes of appearance: the colour scheme, the accent palette and
 * the vibe.
 *
 * <h2>How little this actually does</h2>
 *
 * <p>It writes one class and two attributes onto {@code <html>}. Everything
 * else follows from CSS: {@code _ambient-tokens.scss} redefines its
 * scheme-dependent tokens under {@code :root.amb-dark},
 * {@code _ambient-accents.scss} swaps the accent ramp under
 * {@code [data-amb-accent]}, {@code _ambient-vibes.scss} swaps the surface
 * treatment under {@code [data-amb-vibe]}, and PrimeNG follows all three
 * because its own theme tokens point at the same custom properties. No
 * component subscribes to this service, and none needs to.</p>
 *
 * <p>The one exception is a custom accent, which has no stylesheet block to
 * select: its palette is generated at runtime and written as inline custom
 * properties on the same element. Inline styles outrank every selector, so the
 * generated ramp wins without needing a rule of its own — and everything
 * downstream still reads nothing but {@code --amb-accent-*}, so no component
 * can tell a generated palette from an authored one.</p>
 *
 * <h2>system is a live preference, not a one-off read</h2>
 *
 * <p>Choosing "system" means the app keeps following the OS, so the media query
 * is watched rather than sampled once at startup. Someone whose machine flips to
 * dark at sunset sees the app flip with it, without a reload.</p>
 *
 * <h2>How the change is animated</h2>
 *
 * <p>Through the View Transition API, which cross-fades two complete renderings
 * of the page on the GPU. The alternative — transitioning colour properties on
 * every element — cannot work here: the ambient canvas, its glows, its mesh and
 * the sheen on every glass surface are all gradients, so they would have to be
 * animated as {@code background-image}, and interpolating a dozen full-screen
 * gradients per frame is exactly the kind of thing that drops frames. Worse, any
 * property-by-property cross-fade passes through a midpoint of grey text on a
 * grey background, because each property is interpolated independently.</p>
 *
 * <p>Where the API is missing, or the reader has asked for less motion, the
 * change is applied instantly. That is deliberate: a partial cross-fade, where
 * some surfaces move and others snap, looks broken in a way that an instant
 * swap never does.</p>
 *
 * <h2>Why the flash is handled in index.html</h2>
 *
 * <p>Angular boots after the first paint, so a service that applied dark mode on
 * construction would still show a white screen for a beat — the single most
 * noticeable flaw a dark theme can have. The inline script in
 * {@code index.html} applies the stored choice before anything renders; this
 * service takes over afterwards and agrees with it.</p>
 */
@Injectable({ providedIn: 'root' })
export class AmbientThemeService {
  private readonly document = inject(DOCUMENT);

  /** What the OS currently prefers. Kept live, not sampled once. */
  private readonly systemPrefersDark = signal(false);

  /** The user's choice, which may be `system`. */
  readonly scheme = signal<AmbientScheme>('system');

  /** Which palette is live: a built-in one, or `custom`. */
  readonly accent = signal<AmbientAccentChoice>('indigo');

  /**
   * The colour a custom palette is generated from.
   *
   * <p>Kept even while a built-in palette is selected, so switching to
   * "custom" and back does not lose the colour someone spent time choosing.</p>
   */
  readonly customAccent = signal<string>(DEFAULT_CUSTOM_ACCENT);

  /** What the interface is made of. */
  readonly vibe = signal<AmbientVibe>(DEFAULT_VIBE);

  /** What is actually on screen, with `system` resolved. */
  readonly resolvedScheme = computed<AmbientResolvedScheme>(() => {
    const chosen = this.scheme();
    if (chosen !== 'system') {
      return chosen;
    }
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  readonly isDark = computed(() => this.resolvedScheme() === 'dark');

  /**
   * The generated palette, or null while a built-in one is selected.
   *
   * <p>A {@code computed}, so the ramp is derived from the colour rather than
   * stored beside it and kept in step by hand.</p>
   */
  private readonly customRamp = computed(() =>
    this.accent() === CUSTOM_ACCENT ? buildAccentRamp(this.customAccent()) : null
  );

  constructor() {
    this.restore();
    this.watchSystemPreference();

    // One effect per axis, because each is the same small operation: reflect
    // state onto the document root and let CSS do the rest.
    effect(() => this.applyScheme(this.resolvedScheme()));
    effect(() => this.applyAccent(this.accent(), this.customRamp()));
    effect(() => this.applyVibe(this.vibe()));
  }

  setScheme(scheme: AmbientScheme): void {
    this.scheme.set(scheme);
    writePreference(AMBIENT_PREFERENCE_KEYS.scheme, scheme);
  }

  /** Selects one of the built-in palettes. */
  setAccent(accent: AmbientAccent): void {
    this.accent.set(accent);
    writePreference(AMBIENT_PREFERENCE_KEYS.accent, accent);
  }

  /**
   * Generates a palette from one colour and makes it live.
   *
   * <p>A colour that is not a colour is ignored rather than applied: this is
   * driven by a picker that emits on every drag, and the one thing worse than
   * refusing a bad value is repainting the product in transparent.</p>
   */
  setCustomAccent(color: string): void {
    // Validated with `normaliseHex` rather than by building the ramp and seeing
    // whether it comes back: this runs on every pointer move while someone is
    // dragging the picker, and generating eleven steps to find out that `#3a`
    // is not a colour yet is work nobody asked for.
    const seed = normaliseHex(color);
    if (!seed) {
      return;
    }

    this.customAccent.set(seed);
    this.accent.set(CUSTOM_ACCENT);

    writePreference(AMBIENT_PREFERENCE_KEYS.accent, CUSTOM_ACCENT);
    writePreference(AMBIENT_PREFERENCE_KEYS.customAccent, seed);

    // The generated properties are stored as well as the colour they came from,
    // so the bootstrap script in index.html can put the palette back before the
    // first paint without carrying a copy of the colour-space maths. This
    // service recomputes from the colour rather than trusting what it reads
    // back, so the two can never drift into disagreeing about anything that
    // matters.
    //
    // Read from the computed, which the two `set` calls above have already
    // brought up to date, so the ramp is built once per change rather than once
    // here and again in the effect.
    const ramp = this.customRamp();
    if (ramp) {
      writePreference(AMBIENT_PREFERENCE_KEYS.accentRamp, JSON.stringify(ramp.properties));
    }
  }

  setVibe(vibe: AmbientVibe): void {
    this.vibe.set(vibe);
    writePreference(AMBIENT_PREFERENCE_KEYS.vibe, vibe);
  }

  /** Light → dark → light. `system` resolves first, so the toggle is never a no-op. */
  toggleScheme(): void {
    this.setScheme(this.isDark() ? 'light' : 'dark');
  }

  // --- internals ---------------------------------------------------------

  private restore(): void {
    const scheme = readPreference(AMBIENT_PREFERENCE_KEYS.scheme);
    if (scheme === 'light' || scheme === 'dark' || scheme === 'system') {
      this.scheme.set(scheme);
    }

    // The colour first, so that if the stored accent turns out to be `custom`
    // the ramp is generated from the right seed rather than from the default.
    const custom = normaliseHex(readPreference(AMBIENT_PREFERENCE_KEYS.customAccent) ?? '');
    if (custom) {
      this.customAccent.set(custom);
    }

    const accent = readPreference(AMBIENT_PREFERENCE_KEYS.accent);
    const isKnown =
      accent === CUSTOM_ACCENT ||
      (!!accent && (AMBIENT_ACCENTS as readonly string[]).includes(accent));
    if (isKnown) {
      this.accent.set(accent as AmbientAccentChoice);
    }

    const vibe = readPreference(AMBIENT_PREFERENCE_KEYS.vibe);
    if (vibe && (AMBIENT_VIBES as readonly string[]).includes(vibe)) {
      this.vibe.set(vibe as AmbientVibe);
    }
  }

  private watchSystemPreference(): void {
    const media = this.document.defaultView?.matchMedia?.(DARK_QUERY);
    if (!media) {
      return;
    }
    this.systemPrefersDark.set(media.matches);
    media.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
  }

  private applyScheme(scheme: AmbientResolvedScheme): void {
    const root = this.document.documentElement;
    const isDark = scheme === 'dark';

    if (root.classList.contains(DARK_CLASS) === isDark) {
      // Already correct — usually the very first run, agreeing with what the
      // bootstrap script did. Returning early is what stops the app animating a
      // scheme change it did not make.
      this.applyColorScheme(isDark);
      return;
    }

    this.crossFade(() => {
      root.classList.toggle(DARK_CLASS, isDark);
      this.applyColorScheme(isDark);
    });
  }

  /**
   * Tells the browser which scheme is in play, so form controls, scrollbars and
   * the space around the page are drawn to match. Without it a dark app still
   * gets a white native select and a light scrollbar gutter.
   */
  private applyColorScheme(isDark: boolean): void {
    this.document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }

  /**
   * Puts the accent on the document root — as an attribute for a built-in
   * palette, and as the generated ramp plus that attribute for a custom one.
   *
   * @param ramp the generated palette, or null for a built-in one.
   */
  private applyAccent(accent: AmbientAccentChoice, ramp: AmbientAccentRamp | null): void {
    const root = this.document.documentElement;
    const properties = ramp?.properties ?? null;

    // Same guard as the scheme: on the first run the bootstrap script has
    // already written all of this, and re-writing identical values would start
    // a cross-fade of nothing. For a custom palette the seed is the thing to
    // compare — the ramp is a pure function of it.
    if (
      root.getAttribute(ACCENT_ATTR) === accent &&
      root.style.getPropertyValue('--amb-accent-500') === (properties?.['--amb-accent-500'] ?? '')
    ) {
      return;
    }

    this.crossFade(() => {
      // Always clear first. Switching from a custom palette back to a built-in
      // one has to remove the inline properties, or they keep outranking the
      // stylesheet the attribute just selected and nothing appears to happen.
      this.clearAccentProperties(root);

      if (properties) {
        for (const [name, value] of Object.entries(properties)) {
          root.style.setProperty(name, value);
        }
      }

      root.setAttribute(ACCENT_ATTR, accent);
    });
  }

  /** Removes every inline `--amb-accent-*` this service may have written. */
  private clearAccentProperties(root: HTMLElement): void {
    // Collected before removing: `style` is a live list, and deleting from it
    // while iterating skips every other entry.
    const names = Array.from({ length: root.style.length }, (_, index) =>
      root.style.item(index)
    ).filter((name) => name.startsWith('--amb-accent-'));

    for (const name of names) {
      root.style.removeProperty(name);
    }
  }

  private applyVibe(vibe: AmbientVibe): void {
    const root = this.document.documentElement;

    if (root.getAttribute(VIBE_ATTR) === vibe) {
      return;
    }

    this.crossFade(() => root.setAttribute(VIBE_ATTR, vibe));
  }

  /**
   * Applies a document-wide restyle as a cross-fade where the browser can do it
   * properly, and instantly where it cannot.
   *
   * <p>{@code startViewTransition} takes a snapshot, runs the callback, takes a
   * second snapshot and blends them. Nothing in the callback may depend on
   * Angular — it runs outside change detection, after this method has already
   * returned — which is why both callers only touch a class or an attribute on
   * the document root and let CSS do the rest.</p>
   */
  private crossFade(commit: () => void): void {
    const view = this.document.defaultView;
    const reducedMotion = view?.matchMedia(REDUCED_MOTION_QUERY).matches ?? false;

    if (reducedMotion || typeof this.document.startViewTransition !== 'function') {
      commit();
      return;
    }

    const transition = this.document.startViewTransition(commit);

    // Starting a transition while one is still running skips the first, and a
    // skipped transition rejects its promises with an AbortError. Nobody is
    // awaiting them, so those become unhandled rejections — noise in the
    // console, and a failed run for anything watching for them.
    //
    // It is also the normal case rather than an edge one. This panel exists to
    // be clicked through: someone trying the five styles in a row will outrun a
    // 300ms cross-fade every time. The callback has already run and the new
    // state is on screen, so there is genuinely nothing to handle — which is
    // what these say.
    transition.ready.catch(() => undefined);
    transition.updateCallbackDone.catch(() => undefined);
    transition.finished.catch(() => undefined);
  }
}
