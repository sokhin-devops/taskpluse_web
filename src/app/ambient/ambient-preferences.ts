/**
 * Reading and writing the small set of choices the product remembers across
 * reloads: the colour scheme, the accent, the interface language, and whether
 * the navigation rail is collapsed.
 *
 * <h2>Why this is a module and not a service</h2>
 *
 * <p>Every caller needs the same three lines of defensive handling and none of
 * them needs injection. {@code localStorage} does not merely return
 * {@code null} when it is unavailable — Safari in private mode and any browser
 * with site data blocked <em>throw</em> on access, including on read. A
 * preference is never worth breaking the application over, so both functions
 * swallow and degrade: the app runs, it just forgets.</p>
 *
 * <p>The keys are duplicated in the inline bootstrap script in
 * {@code index.html}, which has to run before Angular exists. Changing one means
 * changing both.</p>
 */

/** Every key the product persists. Listed here so the set is visible at a glance. */
export const AMBIENT_PREFERENCE_KEYS = {
  scheme: 'amb-theme',
  accent: 'amb-accent',
  locale: 'amb-locale',
  navCollapsed: 'amb-nav-collapsed'
} as const;

export type AmbientPreferenceKey =
  (typeof AMBIENT_PREFERENCE_KEYS)[keyof typeof AMBIENT_PREFERENCE_KEYS];

/** The stored value, or null if there is none and if storage is unusable. */
export function readPreference(key: AmbientPreferenceKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Stores a value, or silently does not. */
export function writePreference(key: AmbientPreferenceKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not remembered across reloads. The app still works.
  }
}
