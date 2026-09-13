import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { AmbientAppearancePanelComponent } from './ambient-appearance-panel.component';
import { AMBIENT_PREFERENCE_KEYS } from './ambient-preferences';
import { AmbientThemeService } from './ambient-theme.service';

/**
 * The wiring between a click in the panel and the attribute on {@code <html>}.
 *
 * <p>{@link AmbientThemeService} already has its own tests, and they pass — so
 * a fault that only shows up in the running application is by definition
 * between the two: the binding, the projection into the drawer, or the effect
 * never being flushed. That is what this exercises, by rendering the real
 * component and clicking the real button.</p>
 *
 * <p>The controls themselves live in
 * {@code AmbientAppearanceControlsComponent}, which the Appearance screen also
 * renders. Driving them through the drawer here tests both the controls and the
 * composition, which is the pair that can actually break.</p>
 */
describe('AmbientAppearancePanelComponent', () => {
  const root = document.documentElement;

  let fixture: ComponentFixture<AmbientAppearancePanelComponent>;
  let savedVibe: string | null;
  let savedStartViewTransition: Document['startViewTransition'] | undefined;

  beforeEach(async () => {
    savedVibe = root.getAttribute('data-amb-vibe');
    root.removeAttribute('data-amb-vibe');
    localStorage.removeItem(AMBIENT_PREFERENCE_KEYS.vibe);

    // The real API defers its callback by a frame; the assertions below are
    // about what is written, not when the browser paints it.
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

    await TestBed.configureTestingModule({
      imports: [AmbientAppearancePanelComponent],
      // The panel links out to the Appearance screen, so it needs a router.
      providers: [provideNoopAnimations(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AmbientAppearancePanelComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (savedStartViewTransition) {
      document.startViewTransition = savedStartViewTransition;
    } else {
      delete (document as Partial<Document>).startViewTransition;
    }
    if (savedVibe === null) {
      root.removeAttribute('data-amb-vibe');
    } else {
      root.setAttribute('data-amb-vibe', savedVibe);
    }
    localStorage.removeItem(AMBIENT_PREFERENCE_KEYS.vibe);
  });

  /** The drawer is appended to <body>, so the buttons are not under the host. */
  function vibeButtons(): HTMLButtonElement[] {
    return Array.from(document.querySelectorAll<HTMLButtonElement>('.amb-vibe'));
  }

  it('renders one tile per vibe', () => {
    expect(vibeButtons().length).toBe(5);
  });

  it('writes the vibe onto the document root when a tile is clicked', () => {
    const glass = vibeButtons()[2];
    glass.click();
    fixture.detectChanges();

    expect(TestBed.inject(AmbientThemeService).vibe()).toBe('glass');
    expect(root.getAttribute('data-amb-vibe')).toBe('glass');
  });

  it('marks the chosen tile as checked and the others as not', () => {
    vibeButtons()[4].click();
    fixture.detectChanges();

    const checked = vibeButtons().map((button) => button.getAttribute('aria-checked'));
    expect(checked).toEqual(['false', 'false', 'false', 'false', 'true']);
  });

  it('gives every preview tile the vibe it applies, so the picture is the thing', () => {
    const previews = Array.from(
      document.querySelectorAll<HTMLElement>('.amb-vibe__preview')
    ).map((preview) => preview.getAttribute('data-amb-vibe'));

    expect(previews).toEqual(['minimal', 'ambient', 'glass', 'material', 'neumorph']);
  });
});

