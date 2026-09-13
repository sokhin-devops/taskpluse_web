import { AMBIENT_VIBES, AmbientVibe } from '../../app/ambient/ambient-theme.service';

/**
 * The vibes, measured in a real browser.
 *
 * <p>Every other test in this system checks what the application <em>writes</em>
 * — the attribute on {@code <html>}, the value in storage. None of them can
 * catch the failure that matters most here, which is the attribute being
 * written correctly and the page not changing: a selector that does not match,
 * a rule that loses the cascade, a token nothing reads. Those are properties of
 * the stylesheet, and the only honest way to assert them is to set the
 * attribute and ask the browser what it actually computed.</p>
 *
 * <p>Karma loads {@code src/styles.scss}, so the cascade under test here is the
 * same one that ships.</p>
 */
describe('vibes (computed in the browser)', () => {
  const root = document.documentElement;

  let savedVibe: string | null;
  let savedDark: boolean;

  /** The canvas colour each vibe declares, per scheme. */
  const CANVAS: Record<AmbientVibe, { light: string; dark: string }> = {
    minimal: { light: '#f7f8fa', dark: '#121419' },
    ambient: { light: '#eef1f8', dark: '#0a0d17' },
    glass: { light: '#e7ecfb', dark: '#070a15' },
    material: { light: '#f8f6fc', dark: '#141218' },
    neumorph: { light: '#e8ebf2', dark: '#23262e' }
  };

  /** Which vibes are made of glass, and so keep a backdrop filter. */
  const BLURRED: Record<AmbientVibe, boolean> = {
    minimal: false,
    ambient: true,
    glass: true,
    material: false,
    neumorph: false
  };

  function token(name: string): string {
    return getComputedStyle(root).getPropertyValue(name).trim();
  }

  /** What a card actually ends up painted, with the whole chain applied. */
  function surfaceColour(): string {
    const card = document.createElement('div');
    card.className = 'amb-surface-2';
    document.body.appendChild(card);
    const painted = getComputedStyle(card).backgroundColor;
    card.remove();
    return painted;
  }

  function apply(vibe: AmbientVibe, scheme: 'light' | 'dark'): void {
    root.setAttribute('data-amb-vibe', vibe);
    root.classList.toggle('amb-dark', scheme === 'dark');
  }

  beforeEach(() => {
    savedVibe = root.getAttribute('data-amb-vibe');
    savedDark = root.classList.contains('amb-dark');
  });

  afterEach(() => {
    if (savedVibe === null) {
      root.removeAttribute('data-amb-vibe');
    } else {
      root.setAttribute('data-amb-vibe', savedVibe);
    }
    root.classList.toggle('amb-dark', savedDark);
  });

  for (const vibe of AMBIENT_VIBES) {
    for (const scheme of ['light', 'dark'] as const) {
      it(`${vibe} / ${scheme} sets its own canvas`, () => {
        apply(vibe, scheme);

        expect(token('--amb-canvas')).toBe(CANVAS[vibe][scheme]);
      });
    }

    it(`${vibe} ${BLURRED[vibe] ? 'blurs' : 'does not blur'} its surfaces`, () => {
      apply(vibe, 'light');

      const filter = token('--amb-glass-filter');
      if (BLURRED[vibe]) {
        expect(filter).toContain('blur(');
      } else {
        expect(filter).toBe('none');
      }
    });
  }

  it('gives every vibe a different canvas, in both schemes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const canvases = AMBIENT_VIBES.map((vibe) => {
        apply(vibe, scheme);
        return token('--amb-canvas');
      });

      expect(new Set(canvases).size)
        .withContext(`${scheme}: ${canvases.join(', ')}`)
        .toBe(AMBIENT_VIBES.length);
    }
  });

  // The one that would have caught a vibe applying to the tokens but not to the
  // surfaces built from them: `--amb-surface-2` is derived from the tint and the
  // opacity, and a vibe that changed those without re-deriving it would leave
  // every card in the product painted by whatever the defaults said.
  it('repaints a real card surface for every vibe', () => {
    const painted = AMBIENT_VIBES.map((vibe) => {
      apply(vibe, 'light');
      return surfaceColour();
    });

    expect(new Set(painted).size)
      .withContext(painted.join(' | '))
      .toBeGreaterThan(1);
  });

  it('changes the corner radius and the depth between vibes', () => {
    apply('minimal', 'light');
    const flat = { radius: token('--amb-radius-card'), shadow: token('--amb-shadow-md') };

    apply('neumorph', 'light');
    const pressed = { radius: token('--amb-radius-card'), shadow: token('--amb-shadow-md') };

    expect(pressed.radius).not.toBe(flat.radius);
    expect(pressed.shadow).not.toBe(flat.shadow);
    // Neumorphism's depth is the two lights, one dark and one light, from a
    // single source. If this stops being a pair the illusion is gone.
    expect(pressed.shadow).toContain('-6px -6px');
  });

  it('leaves no vibe without a rule, however the list grows', () => {
    for (const vibe of AMBIENT_VIBES) {
      apply(vibe, 'light');
      expect(token('--amb-canvas'))
        .withContext(`${vibe} has no light block in _ambient-vibes.scss`)
        .toBe(CANVAS[vibe].light);
    }
  });
});
