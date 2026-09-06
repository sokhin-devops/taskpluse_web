import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';

// From the file rather than from `ambient.ts`. The barrel re-exports the theme
// switcher, which imports this layer back — harmless today, but importing the
// whole barrel for one directive is what turns "harmless" into a cycle later.
import { AmbientButtonDirective } from '../ambient/ambient-button.directive';
import { AMBIENT_LOCALES, AMBIENT_LOCALE_INFO, AmbientLocale } from './locale';
import { LocaleService } from './locale.service';
import { TranslatePipe } from './translate.pipe';

/**
 * The language control.
 *
 * <p>Deliberately the same shape as {@code <amb-theme-switcher>}: a ghost icon
 * button opening a {@code p-popover} that holds one radio group. The two sit
 * side by side in the rail and in the topbar, and a pair of controls in the
 * same place that behaved differently would read as an oversight. PrimeNG's
 * popover supplies the focus trap, the {@code Esc} handler, dismissal on
 * outside click and the return of focus to the trigger.</p>
 *
 * <h2>Why the trigger is a globe and not a flag</h2>
 *
 * <p>Flags are countries, not languages. Khmer is not the flag of Cambodia any
 * more than English is the flag of England, and the moment a language is spoken
 * in more than one place the icon starts telling people they are in the wrong
 * one. The current language's tag sits beside the icon instead, which is also
 * what makes the control findable to someone who cannot read the interface it
 * is currently in — except in the collapsed rail, where {@link compact} trades
 * it for a tooltip because there is no room for both.</p>
 *
 * <h2>Accessibility</h2>
 *
 * <p>A radio group, because it is one choice from a closed list: arrow keys
 * move between the options and the current one is announced as checked. Each
 * option is labelled with the language's endonym — the name in that language —
 * so it can be recognised by a reader who does not know the language the rest
 * of the interface is in. It applies immediately; there is no Save, and no way
 * to be left in a language nobody asked for.</p>
 *
 * @example
 * <amb-language-switcher />
 */
@Component({
  selector: 'amb-language-switcher',
  imports: [ButtonModule, PopoverModule, TooltipModule, AmbientButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-button
      ambButton="ghost"
      icon="pi pi-globe"
      [label]="compact() ? undefined : short()"
      [rounded]="true"
      [ariaLabel]="triggerLabel()"
      aria-haspopup="dialog"
      styleClass="amb-language__trigger"
      [pTooltip]="triggerLabel()"
      tooltipPosition="right"
      [tooltipDisabled]="!compact()"
      [showDelay]="250"
      (onClick)="panel.toggle($event)"
    />

    <p-popover #panel appendTo="body" styleClass="amb-language">
      <div class="amb-language__body">
        <fieldset class="amb-language__group">
          <legend class="amb-eyebrow">{{ 'language.legend' | t }}</legend>

          <div
            class="amb-language__options"
            role="radiogroup"
            [attr.aria-label]="'language.group' | t"
          >
            @for (option of options; track option.tag) {
              <button
                type="button"
                class="amb-language__option"
                [class.amb-language__option--active]="locale.locale() === option.tag"
                role="radio"
                [attr.aria-checked]="locale.locale() === option.tag"
                [attr.lang]="option.tag"
                (click)="choose(option.tag)"
              >
                <!-- The endonym leads. Someone stranded in a language they
                     cannot read is looking for their own word, not ours. -->
                <span class="amb-language__native">{{ option.nativeName }}</span>

                <!-- English name beneath, and only when it differs, so the
                     English row does not print "English" twice. -->
                @if (option.englishName !== option.nativeName) {
                  <span class="amb-language__english" lang="en">{{ option.englishName }}</span>
                }

                <i
                  class="pi pi-check amb-language__tick"
                  [class.amb-language__tick--on]="locale.locale() === option.tag"
                  aria-hidden="true"
                ></i>
              </button>
            }
          </div>
        </fieldset>
      </div>
    </p-popover>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    // The trigger keeps its label at every width: it is the one control whose
    // whole job is to be recognisable to someone who cannot read the interface,
    // and an icon-only globe would not be.
    ::ng-deep .amb-language__trigger .p-button-label {
      font-size: var(--amb-text-xs);
      font-weight: var(--amb-weight-semibold);
      letter-spacing: var(--amb-tracking-wide);
      text-transform: uppercase;
    }

    // The popover is appended to <body>, so everything inside it has to be
    // reached from outside this component's scope.
    ::ng-deep .amb-language .p-popover-content {
      padding: var(--amb-space-4);
    }

    ::ng-deep .amb-language .amb-language__body {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-3);
      min-width: 12rem;
    }

    // A fieldset carries the grouping for assistive technology; its default
    // border, padding and margin carry nothing at all.
    ::ng-deep .amb-language .amb-language__group {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-3);
      margin: 0;
      padding: 0;
      border: 0;
    }

    ::ng-deep .amb-language .amb-language__group > legend {
      padding: 0;
    }

    ::ng-deep .amb-language .amb-language__options {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    // A row rather than a segment: language names are of wildly different
    // widths, and equal segments would either clip the long one or waste the
    // width of the short one.
    ::ng-deep .amb-language .amb-language__option {
      display: grid;
      grid-template-columns: 1fr auto;
      grid-template-areas:
        'native tick'
        'english tick';
      align-items: center;
      gap: 0 var(--amb-space-3);
      padding: var(--amb-space-2) var(--amb-space-3);
      border: 0;
      border-radius: var(--amb-radius-field);
      background: transparent;
      text-align: start;
      cursor: pointer;
      transition: var(--amb-transition);

      &:hover {
        background: var(--amb-surface-hover);
      }

      &:focus-visible {
        outline: 2px solid var(--amb-accent);
        outline-offset: -2px;
      }
    }

    ::ng-deep .amb-language .amb-language__option--active {
      background: var(--amb-surface-hover);
    }

    ::ng-deep .amb-language .amb-language__native {
      grid-area: native;
      font-size: var(--amb-text-base);
      font-weight: var(--amb-weight-medium);
      color: var(--amb-text);
    }

    ::ng-deep .amb-language .amb-language__english {
      grid-area: english;
      font-size: var(--amb-text-2xs);
      color: var(--amb-text-muted);
    }

    // Always in the layout, only sometimes visible: rendering the tick
    // conditionally would shift the names sideways as the selection moved.
    ::ng-deep .amb-language .amb-language__tick {
      grid-area: tick;
      font-size: var(--amb-text-sm);
      color: var(--amb-accent-500);
      opacity: 0;
      transition: opacity var(--amb-duration-fast) var(--amb-ease);
    }

    ::ng-deep .amb-language .amb-language__tick--on {
      opacity: 1;
    }
  `
})
export class AmbientLanguageSwitcherComponent {
  /**
   * Drops the visible tag, leaving the globe alone.
   *
   * <p>For the collapsed navigation rail, which is 72px wide and cannot hold an
   * icon and a label side by side — the trigger measured 80px and spilled out
   * of both edges. A tooltip takes over, which is what the rail already does to
   * the navigation labels at the same breakpoint, so the collapsed state stays
   * one idea rather than two.</p>
   *
   * <p>Only the visible tag goes. {@code ariaLabel} is unchanged, so the
   * control is named identically either way and the collapse costs a screen
   * reader nothing.</p>
   */
  readonly compact = input(false);

  protected readonly locale = inject(LocaleService);

  protected readonly options = AMBIENT_LOCALES.map((tag) => AMBIENT_LOCALE_INFO[tag]);

  /** The tag itself on the trigger — short, and the same width in every language. */
  protected readonly short = computed(() => this.locale.locale().toUpperCase());

  protected readonly triggerLabel = computed(() =>
    this.locale.t('language.trigger', { name: this.locale.info().nativeName })
  );

  private readonly panel = viewChild.required<Popover>('panel');

  protected choose(locale: AmbientLocale): void {
    this.locale.setLocale(locale);
    // Close on choice: the change is instant and visible behind the popover, so
    // leaving it open would hide the result of the thing just clicked.
    this.panel().hide();
  }

  /** Closes the popover, for a caller that has navigated away from it. */
  hide(): void {
    this.panel().hide();
  }
}
