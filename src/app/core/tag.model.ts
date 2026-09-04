/**
 * Tag types mirroring the TaskPulse API contract.
 *
 * Tags are per-account: a tag id is only ever meaningful for the signed-in user.
 */

export interface Tag {
  id: number;
  name: string;
  /** Six-digit hex colour including the leading '#', ready to drop into CSS. */
  color: string;
  /** How many of the caller's tasks carry this tag. Null when nested inside a task. */
  taskCount: number | null;
}

/** Payload for creating or renaming a tag. */
export interface TagRequest {
  name: string;
  color: string | null;
}

/** Fallback colour, matching the API default so a new tag looks the same either way. */
export const DEFAULT_TAG_COLOR = '#2a78d6';

/**
 * Palette offered in the tag editor.
 *
 * <p>A fixed set rather than a free colour picker, and specifically <em>these</em> eight
 * hues in <em>this</em> order. Tag colours are a categorical encoding — two chips side by
 * side have to be told apart — so the set was run through a colour-vision validator
 * rather than chosen by eye. An earlier hand-picked palette failed badly: its lime and
 * amber measured a perceptual distance of 1.5 under deuteranopia (effectively identical),
 * and its pink and red only 11.4 even with full colour vision.</p>
 *
 * <p>The order is the safety mechanism, not decoration: adjacent slots are the pairs most
 * likely to end up next to each other, and this ordering maximises their separation.
 * Three of the hues fall below a 3:1 contrast ratio against a white surface, which is
 * acceptable here only because a tag is always drawn as a filled pill carrying its own
 * name — colour never identifies a tag on its own. See {@link readableTextOn} for the
 * label side of that.</p>
 */
export const TAG_COLOR_CHOICES: readonly string[] = [
  '#2a78d6', // blue
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#e87ba4', // magenta
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948' // red
];

/** Ink used on a light tag colour. Near-black rather than pure black, to match body text. */
const DARK_INK = '#111827';

/** Ink used on a dark tag colour. */
const LIGHT_INK = '#ffffff';

/**
 * Picks the more readable of dark or light text for a background colour.
 *
 * <p>Works by computing the actual WCAG contrast ratio of each ink against the
 * background and returning whichever wins, rather than comparing the background's
 * luminance to a hand-picked threshold. A threshold is where this goes wrong: pick it
 * anywhere above the true crossover (a relative luminance of about 0.18) and mid-tone
 * colours get light text they cannot support — amber, for instance, gives white text
 * only 2.2:1 while dark text gets 9.8:1 on the very same fill.</p>
 *
 * <p>Both inks are candidates for every colour because the two ratios move in opposite
 * directions, so "the higher of the two" is always the readable answer and needs no
 * tuning as colours are added to the palette.</p>
 *
 * @param hex six-digit hex colour, with or without a leading '#'
 * @returns a CSS colour for text drawn on top of `hex`
 */
export function readableTextOn(hex: string): string {
  const luminance = relativeLuminance(hex);
  if (luminance === null) {
    return LIGHT_INK;
  }
  return contrastRatio(luminance, relativeLuminance(DARK_INK) ?? 0) >=
    contrastRatio(luminance, relativeLuminance(LIGHT_INK) ?? 1)
    ? DARK_INK
    : LIGHT_INK;
}

/**
 * WCAG relative luminance of a hex colour.
 *
 * <p>The per-channel curve is not decoration: the eye is far more sensitive to green
 * than to blue, so averaging the raw channels would rate a mid-blue and a mid-yellow as
 * equally bright when they are nothing of the sort.</p>
 *
 * @returns the luminance in 0..1, or {@code null} when the value is not a six-digit hex
 */
function relativeLuminance(hex: string): number | null {
  const normalised = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalised)) {
    return null;
  }

  const [red, green, blue] = [0, 2, 4].map((offset) => {
    const value = parseInt(normalised.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG contrast ratio between two relative luminances, always >= 1. */
function contrastRatio(one: number, other: number): number {
  const lighter = Math.max(one, other);
  const darker = Math.min(one, other);
  return (lighter + 0.05) / (darker + 0.05);
}
