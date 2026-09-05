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

/**
 * How long the cross-fade between light and dark runs. Long enough to read as a
 * transition rather than a flash, short enough that the interface is not
 * mid-animation by the time the user looks back at it.
 */
const SCHEME_TRANSITION_MS = 260;

const DARK_QUERY = '(prefers-color-scheme: dark)';

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

    // Colour is transitioned only while the scheme is actually changing. Leaving
    // the transition on permanently would make every hover on every surface
    // fade, which is both slower and wrong.
    root.classList.add('amb-scheme-changing');
    root.classList.toggle(DARK_CLASS, isDark);
    this.applyColorScheme(isDark);

    this.document.defaultView?.setTimeout(
      () => root.classList.remove('amb-scheme-changing'),
      SCHEME_TRANSITION_MS
    );
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
    this.document.documentElement.setAttribute(ACCENT_ATTR, accent);
  }
}
