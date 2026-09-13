import { buildAccentRamp, contrastRatio, normaliseHex } from './ambient-accent-ramp';

/**
 * What these tests are actually protecting.
 *
 * <p>A generated palette has one job the hand-made ones also have: whatever
 * colour someone picks, the button drawn in it must have a readable label. The
 * ramp is tunable — the lightness ladder, the chroma taper and the anchor band
 * are all numbers somebody will want to adjust — and the point of this file is
 * that adjusting them cannot quietly produce an unreadable interface.</p>
 *
 * <p>The palettes in {@code _ambient-accents.scss} are the yardstick for the
 * first test, because their nominated steps were chosen by hand for exactly
 * this reason and are documented as such: white on teal-600 is 3.9:1, so teal
 * nominates 700. A generator that reproduces those choices from nothing but the
 * 500 step is applying the same rule the designer did.</p>
 */

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const WHITE = { r: 255, g: 255, b: 255 };

/** `--amb-surface-2` over `--amb-canvas` in dark mode: the darkest ground an
    accent is ever drawn on. */
const DARK_GROUND = { r: 22, g: 27, b: 43 };

const MIN_CONTRAST = 4.5;

function rgb(hex: string): { r: number; g: number; b: number } {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/**
 * OKLab lightness, written out again rather than imported.
 *
 * <p>The ramp is built in this space, so measuring it in the same space using
 * the module's own code would only prove the module agrees with itself. This is
 * the published formula, transcribed independently.</p>
 */
function perceptualLightness(hex: string): number {
  const { r, g, b } = rgb(hex);
  const linear = (channel: number) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [linear(r), linear(g), linear(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
}

/** A spread of seeds wide enough that a regression cannot hide between them. */
function seedSweep(): string[] {
  const seeds: string[] = [];
  for (let hue = 0; hue < 360; hue += 15) {
    for (const [saturation, lightness] of [
      [0.7, 0.5],
      [0.95, 0.35],
      [0.4, 0.75],
      [1, 0.6],
      [0.25, 0.45]
    ]) {
      seeds.push(hsl(hue, saturation, lightness));
    }
  }
  return seeds;
}

function hsl(hue: number, saturation: number, lightness: number): string {
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return `#${[channel(0), channel(8), channel(4)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
}

describe('buildAccentRamp', () => {
  describe('nomination', () => {
    // The seed is each hand-made palette's 500 step; the expectation is the
    // step that palette nominates in `_ambient-accents.scss`.
    const palettes = [
      { name: 'indigo', seed: '#6366f1', light: 600, dark: 400 },
      { name: 'violet', seed: '#8b5cf6', light: 600, dark: 400 },
      { name: 'blue', seed: '#3b82f6', light: 600, dark: 400 },
      { name: 'teal', seed: '#14b8a6', light: 700, dark: 400 },
      { name: 'emerald', seed: '#10b981', light: 700, dark: 400 },
      { name: 'rose', seed: '#f43f5e', light: 600, dark: 400 }
    ];

    for (const palette of palettes) {
      it(`picks the same steps the hand-made ${palette.name} palette picks`, () => {
        const { properties } = buildAccentRamp(palette.seed)!;

        expect(properties['--amb-accent-light'])
          .withContext(`${palette.name} light accent`)
          .toBe(properties[`--amb-accent-${palette.light}`]);
        expect(properties['--amb-accent-dark'])
          .withContext(`${palette.name} dark accent`)
          .toBe(properties[`--amb-accent-${palette.dark}`]);
      });
    }
  });

  describe('contrast', () => {
    it('keeps white legible on the light accent for every seed', () => {
      const failures = seedSweep().filter(
        (seed) =>
          contrastRatio(rgb(buildAccentRamp(seed)!.properties['--amb-accent-light']), WHITE) <
          MIN_CONTRAST
      );

      expect(failures).toEqual([]);
    });

    it('keeps the dark accent legible on a dark surface for every seed', () => {
      const failures = seedSweep().filter(
        (seed) =>
          contrastRatio(
            rgb(buildAccentRamp(seed)!.properties['--amb-accent-dark']),
            DARK_GROUND
          ) < MIN_CONTRAST
      );

      expect(failures).toEqual([]);
    });

    // The seeds people actually break generators with: fully saturated primaries,
    // the two extremes, a pure grey, and colours that are far lighter than their
    // HSL lightness suggests.
    const awkward = [
      '#ffe600',
      '#ffffff',
      '#000000',
      '#808080',
      '#00ff00',
      '#1a1a5e',
      '#ffc0cb',
      '#00e5ff'
    ];

    for (const seed of awkward) {
      it(`survives ${seed}`, () => {
        const { properties } = buildAccentRamp(seed)!;

        expect(contrastRatio(rgb(properties['--amb-accent-light']), WHITE))
          .withContext('white on the light accent')
          .toBeGreaterThanOrEqual(MIN_CONTRAST);
        expect(contrastRatio(rgb(properties['--amb-accent-dark']), DARK_GROUND))
          .withContext('the dark accent on a dark surface')
          .toBeGreaterThanOrEqual(MIN_CONTRAST);
      });
    }
  });

  describe('the ramp', () => {
    it('runs light to dark with no reversals, for every seed', () => {
      const reversals: string[] = [];

      for (const seed of seedSweep()) {
        const { properties } = buildAccentRamp(seed)!;

        for (let i = 1; i < STEPS.length; i++) {
          const lighter = perceptualLightness(properties[`--amb-accent-${STEPS[i - 1]}`]);
          const darker = perceptualLightness(properties[`--amb-accent-${STEPS[i]}`]);

          if (darker >= lighter) {
            reversals.push(`${seed} at ${STEPS[i]}`);
          }
        }
      }

      expect(reversals).toEqual([]);
    });

    it('reproduces the chosen colour at step 500', () => {
      // An in-band seed: one whose own lightness the ladder is centred on, so
      // the round trip through OKLab is the only thing that can move it.
      const seed = '#3f8cff';
      const { r, g, b } = rgb(buildAccentRamp(seed)!.properties['--amb-accent-500']);
      const wanted = rgb(seed);

      expect(Math.abs(r - wanted.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(g - wanted.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(b - wanted.b)).toBeLessThanOrEqual(1);
    });

    it('emits every property the Sass mixin emits, and nothing else', () => {
      const { properties } = buildAccentRamp('#3f8cff')!;

      for (const step of STEPS) {
        expect(properties[`--amb-accent-${step}`]).toMatch(/^#[0-9a-f]{6}$/);
      }

      for (const scheme of ['light', 'dark']) {
        expect(properties[`--amb-accent-${scheme}`]).toMatch(/^#[0-9a-f]{6}$/);
        expect(properties[`--amb-accent-${scheme}-hover`]).toMatch(/^#[0-9a-f]{6}$/);
        expect(properties[`--amb-accent-on-soft-${scheme}`]).toMatch(/^#[0-9a-f]{6}$/);
        // The channel triplet, so an alpha tint can be mixed inline.
        expect(properties[`--amb-accent-${scheme}-rgb`]).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
      }

      // Nothing outside the accent namespace: these are written straight onto
      // the document root, and the bootstrap script replays them from storage.
      for (const name of Object.keys(properties)) {
        expect(name).toMatch(/^--amb-accent-[a-z0-9-]+$/);
      }
    });

    it('moves the hover step away from its own background, not towards it', () => {
      for (const seed of ['#6366f1', '#14b8a6', '#f43f5e']) {
        const { properties } = buildAccentRamp(seed)!;

        // Light mode writes white on the accent, so the hover must be darker.
        expect(perceptualLightness(properties['--amb-accent-light-hover']))
          .withContext(`${seed} light hover`)
          .toBeLessThan(perceptualLightness(properties['--amb-accent-light']));

        // Dark mode draws the accent on a dark ground, so the hover is lighter.
        expect(perceptualLightness(properties['--amb-accent-dark-hover']))
          .withContext(`${seed} dark hover`)
          .toBeGreaterThan(perceptualLightness(properties['--amb-accent-dark']));
      }
    });
  });
});

describe('normaliseHex', () => {
  it('accepts the forms people actually paste', () => {
    expect(normaliseHex('#4F46E5')).toBe('#4f46e5');
    expect(normaliseHex('4f46e5')).toBe('#4f46e5');
    expect(normaliseHex('  #f0a  ')).toBe('#ff00aa');
  });

  it('rejects anything that is not a colour', () => {
    for (const value of ['', '#', '#12', '#12345', 'rebeccapurple', '#1234gg', '#1234567']) {
      expect(normaliseHex(value)).withContext(value).toBeNull();
    }
  });

  it('makes buildAccentRamp refuse the same values', () => {
    expect(buildAccentRamp('nonsense')).toBeNull();
    expect(buildAccentRamp('#12345')).toBeNull();
  });
});
