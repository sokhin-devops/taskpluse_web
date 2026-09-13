import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

import { LocaleService } from '../i18n/locale.service';
import { AmbientAppearancePanelComponent } from './ambient-appearance-panel.component';
import { AmbientButtonDirective } from './ambient-button.directive';
import { AmbientAccent, AmbientThemeService } from './ambient-theme.service';

/**
 * The control that opens the appearance panel.
 *
 * <p>Everything the panel can change lives in
 * {@link AmbientAppearancePanelComponent}; what is here is the button, the
 * state of whether the panel is open, and the sentence a screen reader hears
 * instead of an icon.</p>
 *
 * <p>Split that way so the panel can be opened by something other than this
 * button — a menu item, a keyboard shortcut — without that thing inheriting a
 * sun icon.</p>
 *
 * <p><strong>Render this once per screen.</strong> Each instance carries its own
 * drawer, so two of them means two drawers in the document, two focus traps, and
 * every control in the panel announced twice. The shell puts one in the topbar
 * when signed in and one in the guest bar when signed out, and those two states
 * are mutually exclusive.</p>
 *
 * @example
 * <amb-theme-switcher />
 */
@Component({
  selector: 'amb-theme-switcher',
  imports: [ButtonModule, AmbientButtonDirective, AmbientAppearancePanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-button
      ambButton="ghost"
      [icon]="triggerIcon()"
      [rounded]="true"
      [ariaLabel]="triggerLabel()"
      aria-haspopup="dialog"
      (onClick)="open.set(true)"
    />

    <amb-appearance-panel [(visible)]="open" [pageLink]="pageLink()" />
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `
})
export class AmbientThemeSwitcherComponent {
  protected readonly theme = inject(AmbientThemeService);
  private readonly i18n = inject(LocaleService);

  /** Whether the panel is showing. */
  protected readonly open = signal(false);

  /** Passed to the panel: whether to offer the way out to the Appearance
      screen. False where that screen cannot be reached. */
  readonly pageLink = input(true);

  /** The trigger shows what is on screen, not what was chosen. */
  protected readonly triggerIcon = computed(() =>
    this.theme.isDark() ? 'pi pi-moon' : 'pi pi-sun'
  );

  /**
   * Names all three settings and their current values.
   *
   * <p>Assembled from the catalogue rather than by interpolating the raw enum
   * values, which is what it used to do. "dark", "indigo" and "minimal" happen
   * to be English words as well as identifiers, and reading an identifier out
   * to a screen-reader user is only invisible while the interface is in
   * English.</p>
   */
  protected readonly triggerLabel = computed(() =>
    this.i18n.t('appearance.trigger', {
      vibe: this.vibeLabel(),
      scheme: this.i18n.t(
        this.theme.resolvedScheme() === 'dark' ? 'appearance.dark' : 'appearance.light'
      ),
      accent: this.accentLabel()
    })
  );

  private readonly accentLabel = computed(() => {
    const accent = this.theme.accent();
    if (accent === 'custom') {
      return this.i18n.t('appearance.accent.custom');
    }

    const labels: Record<AmbientAccent, string> = {
      indigo: this.i18n.t('appearance.accent.indigo'),
      violet: this.i18n.t('appearance.accent.violet'),
      blue: this.i18n.t('appearance.accent.blue'),
      teal: this.i18n.t('appearance.accent.teal'),
      emerald: this.i18n.t('appearance.accent.emerald'),
      rose: this.i18n.t('appearance.accent.rose')
    };
    return labels[accent];
  });

  private readonly vibeLabel = computed(() => {
    switch (this.theme.vibe()) {
      case 'ambient':
        return this.i18n.t('appearance.vibe.ambient');
      case 'glass':
        return this.i18n.t('appearance.vibe.glass');
      case 'material':
        return this.i18n.t('appearance.vibe.material');
      case 'neumorph':
        return this.i18n.t('appearance.vibe.neumorph');
      default:
        return this.i18n.t('appearance.vibe.minimal');
    }
  });

  /** Closes the panel, for a caller that has navigated away from it. */
  hide(): void {
    this.open.set(false);
  }
}
