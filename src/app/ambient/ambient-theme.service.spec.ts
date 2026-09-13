import { TestBed } from '@angular/core/testing';

import { AMBIENT_PREFERENCE_KEYS } from './ambient-preferences';
import { AmbientThemeService, DEFAULT_VIBE } from './ambient-theme.service';

/**
 * The service writes to the real {@code <html>} — that is its entire job, and
 * mocking the document would leave the interesting part untested. So each test
 * takes a snapshot of what it is about to disturb and puts it back afterwards,
 * including the inline custom properties, which would otherwise leak into the
 * Karma page and into whatever runs next.
 */
describe('AmbientThemeService', () => {
  const root = document.documentElement;

  let savedClass: string;
  let savedStyle: string;
  let savedAttributes: Record<string, string | null>;
  let savedStartViewTransition: Document['startViewTransition'] | undefined;

  /** Runs the effects that reflect state onto the document. */
  function apply(): void {
    TestBed.flushEffects();
  }

  function service(): AmbientThemeService {
    return TestBed.inject(AmbientThemeService);
  }

  function inlineAccentProperties(): string[] {
    return Array.from({ length: root.style.length }, (_, index) => root.style.item(index)).filter(
      (name) => name.startsWith('--amb-accent-')
    );
  }

  beforeEach(() => {
    savedClass = root.className;
    savedStyle = root.getAttribute('style') ?? '';
    savedAttributes = {
      'data-amb-accent': root.getAttribute('data-amb-accent'),
      'data-amb-vibe': root.getAttribute('data-amb-vibe')
    };

    for (const key of Object.values(AMBIENT_PREFERENCE_KEYS)) {
      localStorage.removeItem(key);
    }

    // Neither attribute set, so the service's "already correct" guard cannot
    // short-circuit the very thing each test is checking.
    root.removeAttribute('data-amb-accent');
    root.removeAttribute('data-amb-vibe');

    // The real View Transition API defers the callback to the next frame, so
    // every assertion below would run against the document as it was before the
    // change. Stubbed to commit synchronously — what is under test is what the
    // service writes, not when the browser chooses to paint it.
    savedStartViewTransition = document.startViewTransition;
    document.startViewTransition = ((commit: () => void) => {
      commit();
      return {
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        finished: Promise.resolve(),
        skipTransition: () => undefined
      };
    }) as Document['startViewTransition'];

    TestBed.configureTestingModule({ providers: [AmbientThemeService] });
  });

  afterEach(() => {
    if (savedStartViewTransition) {
      document.startViewTransition = savedStartViewTransition;
    } else {
      delete (document as Partial<Document>).startViewTransition;
    }

    root.className = savedClass;
    if (savedStyle) {
      root.setAttribute('style', savedStyle);
    } else {
      root.removeAttribute('style');
    }
    for (const [name, value] of Object.entries(savedAttributes)) {
      if (value === null) {
        root.removeAttribute(name);
      } else {
        root.setAttribute(name, value);
      }
    }
    for (const key of Object.values(AMBIENT_PREFERENCE_KEYS)) {
      localStorage.removeItem(key);
    }
  });

  describe('vibe', () => {
    it('starts minimalist', () => {
      expect(service().vibe()).toBe(DEFAULT_VIBE);
    });

    it('writes the chosen vibe onto the document root', () => {
      const theme = service();

      theme.setVibe('neumorph');
      apply();

      expect(root.getAttribute('data-amb-vibe')).toBe('neumorph');
    });

    it('remembers the choice', () => {
      service().setVibe('material');

      expect(localStorage.getItem(AMBIENT_PREFERENCE_KEYS.vibe)).toBe('material');
    });

    it('restores a remembered choice', () => {
      localStorage.setItem(AMBIENT_PREFERENCE_KEYS.vibe, 'glass');

      expect(service().vibe()).toBe('glass');
    });

    it('ignores a stored value that is not a vibe', () => {
      localStorage.setItem(AMBIENT_PREFERENCE_KEYS.vibe, 'brutalism');

      expect(service().vibe()).toBe(DEFAULT_VIBE);
    });
  });

  describe('a custom accent', () => {
    it('writes the generated palette inline and marks the attribute custom', () => {
      const theme = service();

      theme.setCustomAccent('#ff5500');
      apply();

      expect(root.getAttribute('data-amb-accent')).toBe('custom');
      // The full contract: eleven steps plus four nominated tokens per scheme.
      expect(inlineAccentProperties().length).toBe(19);
      expect(root.style.getPropertyValue('--amb-accent-500').trim()).toBe('#ff5500');
    });

    it('stores the colour and the ramp, so the page can restore it before booting', () => {
      service().setCustomAccent('#0a84ff');

      expect(localStorage.getItem(AMBIENT_PREFERENCE_KEYS.accent)).toBe('custom');
      expect(localStorage.getItem(AMBIENT_PREFERENCE_KEYS.customAccent)).toBe('#0a84ff');

      const ramp = JSON.parse(localStorage.getItem(AMBIENT_PREFERENCE_KEYS.accentRamp)!);
      expect(ramp['--amb-accent-500']).toBe('#0a84ff');
    });

    it('ignores a value that is not a colour', () => {
      const theme = service();
      theme.setCustomAccent('#0a84ff');
      apply();

      theme.setCustomAccent('not a colour');
      apply();

      expect(theme.customAccent()).toBe('#0a84ff');
      expect(root.style.getPropertyValue('--amb-accent-500').trim()).toBe('#0a84ff');
    });

    // The regression this whole suite exists for. Inline properties outrank
    // every stylesheet, so a built-in palette selected after a custom one would
    // appear to do nothing at all if the inline ramp were left behind.
    it('is fully removed when a built-in palette is chosen again', () => {
      const theme = service();
      theme.setCustomAccent('#ff5500');
      apply();

      theme.setAccent('teal');
      apply();

      expect(root.getAttribute('data-amb-accent')).toBe('teal');
      expect(inlineAccentProperties()).toEqual([]);
    });

    it('keeps the colour when a built-in palette is chosen, so switching back is free', () => {
      const theme = service();
      theme.setCustomAccent('#ff5500');
      apply();

      theme.setAccent('rose');
      apply();

      expect(theme.customAccent()).toBe('#ff5500');
    });

    it('restores a remembered custom palette', () => {
      localStorage.setItem(AMBIENT_PREFERENCE_KEYS.accent, 'custom');
      localStorage.setItem(AMBIENT_PREFERENCE_KEYS.customAccent, '#12b886');

      const theme = service();
      apply();

      expect(theme.accent()).toBe('custom');
      // Regenerated from the colour rather than replayed from the stored ramp,
      // so a tampered cache cannot decide what the product looks like.
      expect(root.style.getPropertyValue('--amb-accent-500').trim()).toBe('#12b886');
    });

    it('falls back to a built-in palette when the stored colour is unusable', () => {
      localStorage.setItem(AMBIENT_PREFERENCE_KEYS.accent, 'violet');
      localStorage.setItem(AMBIENT_PREFERENCE_KEYS.customAccent, 'rubbish');

      const theme = service();
      apply();

      expect(theme.accent()).toBe('violet');
      expect(inlineAccentProperties()).toEqual([]);
    });
  });
});
