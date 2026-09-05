import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AMBIENT_PREFERENCE_KEYS, readPreference, writePreference } from './ambient-preferences';

/** What the user chose. `system` follows the OS and keeps following it. */
export type AmbientScheme = 'light' | 'dark' | 'system';

/** What is actually on screen. `system` has been resolved away. */
export type AmbientResolvedScheme = 'light' | 'dark';

/** The accent palettes in `_ambient-accents.scss`. Keep the two lists in step. */
export const AMBIENT_ACCENTS = ['indigo', 'violet', 'blue', 'teal', 'emerald', 'rose'] as const;

export type AmbientAccent = (typeof AMBIENT_ACCENTS)[number];

/** Human-readable names for the accent picker. */
export const AMBIENT_ACCENT_LABELS: Record<AmbientAccent, string> = {
  indigo: 'Indigo',
  violet: 'Violet',
  blue: 'Blue',
  teal: 'Teal',
  emerald: 'Emerald',
  rose: 'Rose'
};

/** The class `_ambient-tokens.scss` and PrimeNG's `darkModeSelector` both watch. */
const DARK_CLASS = 'amb-dark';

/** The attribute `_ambient-accents.scss` selects a palette with. */
const ACCENT_ATTR = 'data-amb-accent';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Owns the colour scheme and the accent palette.
 *
 * <h2>How little this actually does</h2>
 *
 * <p>It writes one class and one attribute onto {@code <html>}. Everything else
 * follows from CSS: {@code _ambient-tokens.scss} redefines its scheme-dependent
 * tokens under {@code :root.amb-dark}, {@code _ambient-accents.scss} swaps the
 * accent ramp under {@code [data-amb-accent]}, and PrimeNG follows both because
 * its own theme tokens point at the same custom properties. No component
 * subscribes to this service, and none needs to.</p>
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

  readonly accent = signal<AmbientAccent>('indigo');

  /** What is actually on screen, with `system` resolved. */
  readonly resolvedScheme = computed<AmbientResolvedScheme>(() => {
    const chosen = this.scheme();
    if (chosen !== 'system') {
      return chosen;
    }
    return this.systemPrefersDark() ? 'dark' : 'light';
  });

  readonly isDark = computed(() => this.resolvedScheme() === 'dark');

  constructor() {
    this.restore();
    this.watchSystemPreference();

    // One effect for both, because both are the same operation: reflect state
    // onto the document root and let CSS do the rest.
    effect(() => this.applyScheme(this.resolvedScheme()));
    effect(() => this.applyAccent(this.accent()));
  }

  setScheme(scheme: AmbientScheme): void {
    this.scheme.set(scheme);
    writePreference(AMBIENT_PREFERENCE_KEYS.scheme, scheme);
  }

  setAccent(accent: AmbientAccent): void {
    this.accent.set(accent);
    writePreference(AMBIENT_PREFERENCE_KEYS.accent, accent);
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

    const accent = readPreference(AMBIENT_PREFERENCE_KEYS.accent);
    if (accent && (AMBIENT_ACCENTS as readonly string[]).includes(accent)) {
      this.accent.set(accent as AmbientAccent);
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

  private applyAccent(accent: AmbientAccent): void {
    const root = this.document.documentElement;

    // Same guard as the scheme: on the first run the bootstrap script has
    // already written this, and re-writing the identical value would start a
    // cross-fade of nothing.
    if (root.getAttribute(ACCENT_ATTR) === accent) {
      return;
    }

    this.crossFade(() => root.setAttribute(ACCENT_ATTR, accent));
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

    this.document.startViewTransition(commit);
  }
}
