import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Popover, PopoverModule } from 'primeng/popover';

import { AmbientButtonDirective } from './ambient-button.directive';
import {
  AMBIENT_ACCENTS,
  AMBIENT_ACCENT_LABELS,
  AmbientScheme,
  AmbientThemeService
} from './ambient-theme.service';

/** One row of the appearance popover. */
interface SchemeOption {
  value: AmbientScheme;
  label: string;
  icon: string;
}

/**
 * The appearance control: colour scheme and accent, in one popover.
 *
 * <p>PrimeNG's {@code p-popover} underneath, which is what supplies the focus
 * trap, the {@code Esc} handler, dismissal on outside click and the return of
 * focus to the trigger. Only the contents are ours.</p>
 *
 * <h2>Why a popover rather than a menu</h2>
 *
 * <p>A menu is a list of commands; this is two settings with current values, and
 * one of them is a row of colours. Both controls need to show what is selected,
 * which a menu item cannot do without being dressed up as something it is not.</p>
 *
 * <h2>Accessibility</h2>
 *
 * <p>The scheme options are a radio group, because they are one choice from
 * three — arrow keys move between them and the current one is announced as
 * checked. The accent swatches are a second radio group, each labelled by name
 * rather than by hue, so the choice does not depend on seeing the colour. Both
 * apply immediately: there is no Save, and no way to be left in a state the user
 * did not ask for.</p>
 *
 * @example
 * <amb-theme-switcher />
 */
@Component({
  selector: 'amb-theme-switcher',
  imports: [ButtonModule, PopoverModule, AmbientButtonDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-button
      ambButton="ghost"
      [icon]="triggerIcon()"
      [rounded]="true"
      [ariaLabel]="triggerLabel()"
      aria-haspopup="dialog"
      (onClick)="panel.toggle($event)"
    />

    <p-popover #panel appendTo="body" styleClass="amb-appearance">
      <div class="amb-appearance__body">
        <fieldset class="amb-appearance__group">
          <legend class="amb-eyebrow">Appearance</legend>

          <div class="amb-appearance__schemes" role="radiogroup" aria-label="Colour scheme">
            @for (option of schemeOptions; track option.value) {
              <button
                type="button"
                class="amb-appearance__scheme"
                [class.amb-appearance__scheme--active]="theme.scheme() === option.value"
                role="radio"
                [attr.aria-checked]="theme.scheme() === option.value"
                (click)="theme.setScheme(option.value)"
              >
                <i [class]="option.icon" aria-hidden="true"></i>
                <span>{{ option.label }}</span>
              </button>
            }
          </div>
        </fieldset>

        <fieldset class="amb-appearance__group">
          <legend class="amb-eyebrow">Accent</legend>

          <div class="amb-appearance__accents" role="radiogroup" aria-label="Accent colour">
            @for (accent of accents; track accent) {
              <button
                type="button"
                class="amb-appearance__accent"
                [class.amb-appearance__accent--active]="theme.accent() === accent"
                [attr.data-amb-accent]="accent"
                role="radio"
                [attr.aria-checked]="theme.accent() === accent"
                [attr.aria-label]="accentLabels[accent]"
                [title]="accentLabels[accent]"
                (click)="theme.setAccent(accent)"
              >
                <span class="amb-appearance__swatch" aria-hidden="true"></span>
              </button>
            }
          </div>
        </fieldset>
      </div>
    </p-popover>
  `,
  styles: `
    @use 'ambient' as amb;

    :host {
      display: inline-flex;
    }

    // The popover itself is appended to <body>, so everything inside it has to
    // be reached from outside this component's scope.
    ::ng-deep .amb-appearance .p-popover-content {
      padding: var(--amb-space-4);
    }

    ::ng-deep .amb-appearance .amb-appearance__body {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-5);
      min-width: 14rem;
    }

    // A fieldset carries the grouping for assistive technology; its default
    // border, padding and margin carry nothing at all.
    ::ng-deep .amb-appearance .amb-appearance__group {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-3);
      margin: 0;
      padding: 0;
      border: 0;
    }

    ::ng-deep .amb-appearance .amb-appearance__group > legend {
      padding: 0;
    }

    // -- Scheme ------------------------------------------------------------

    // Three equal segments in a well, matching the select-buttons elsewhere in
    // the product rather than inventing a fourth kind of segmented control.
    ::ng-deep .amb-appearance .amb-appearance__schemes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.1875rem;
      padding: 0.1875rem;
      border: 1px solid var(--amb-border);
      border-radius: var(--amb-radius-field);
      background: var(--amb-surface-sunken);
    }

    ::ng-deep .amb-appearance .amb-appearance__scheme {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--amb-space-1);
      padding: var(--amb-space-2) var(--amb-space-1);
      border: 0;
      border-radius: calc(var(--amb-radius-field) - 3px);
      background: transparent;
      font-size: var(--amb-text-xs);
      font-weight: var(--amb-weight-medium);
      color: var(--amb-text-muted);
      cursor: pointer;
      transition: var(--amb-transition);

      i {
        font-size: var(--amb-text-base);
        line-height: 1;
      }

      &:hover {
        background: var(--amb-surface-hover);
        color: var(--amb-text);
      }

      &:focus-visible {
        outline: 2px solid var(--amb-accent);
        outline-offset: -2px;
      }
    }

    ::ng-deep .amb-appearance .amb-appearance__scheme--active {
      background: var(--amb-surface-solid);
      box-shadow: var(--amb-shadow-sm), inset 0 1px 0 0 var(--amb-highlight);
      color: var(--amb-accent-on-soft);
    }

    // -- Accent ------------------------------------------------------------

    ::ng-deep .amb-appearance .amb-appearance__accents {
      display: flex;
      flex-wrap: wrap;
      gap: var(--amb-space-2);
    }

    // Each swatch carries its own data-amb-accent, so the palette it previews is
    // the one it will apply — the same mechanism, one element wide. Adding a
    // palette to the Sass map is all it takes for a correct swatch to appear.
    ::ng-deep .amb-appearance .amb-appearance__accent {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.875rem;
      height: 1.875rem;
      padding: 0;
      border: 0;
      border-radius: var(--amb-radius-pill);
      background: transparent;
      cursor: pointer;
      transition: var(--amb-transition);

      &:hover .amb-appearance__swatch {
        transform: scale(1.12);
      }

      &:focus-visible {
        outline: 2px solid var(--amb-accent);
        outline-offset: 1px;
      }
    }

    ::ng-deep .amb-appearance .amb-appearance__swatch {
      width: 1.25rem;
      height: 1.25rem;
      border-radius: var(--amb-radius-pill);
      // The palette's own accent, read from the tokens the swatch's own
      // attribute just set.
      background: linear-gradient(140deg, var(--amb-accent-400), var(--amb-accent-600));
      box-shadow: inset 0 0 0 1px var(--amb-swatch-ring);
      transition: transform var(--amb-duration-base) var(--amb-ease-soft);
    }

    // Selected: a ring in the swatch's own hue, offset by a gap in the surface
    // colour so it reads as a ring rather than a thicker dot.
    ::ng-deep .amb-appearance .amb-appearance__accent--active .amb-appearance__swatch {
      box-shadow:
        inset 0 0 0 1px var(--amb-swatch-ring),
        0 0 0 2px var(--amb-surface-3),
        0 0 0 4px var(--amb-accent-500);
    }
  `
})
export class AmbientThemeSwitcherComponent {
  protected readonly theme = inject(AmbientThemeService);

  protected readonly accents = AMBIENT_ACCENTS;
  protected readonly accentLabels = AMBIENT_ACCENT_LABELS;

  protected readonly schemeOptions: SchemeOption[] = [
    { value: 'light', label: 'Light', icon: 'pi pi-sun' },
    { value: 'dark', label: 'Dark', icon: 'pi pi-moon' },
    { value: 'system', label: 'System', icon: 'pi pi-desktop' }
  ];

  /** The trigger shows what is on screen, not what was chosen. */
  protected readonly triggerIcon = computed(() =>
    this.theme.isDark() ? 'pi pi-moon' : 'pi pi-sun'
  );

  protected readonly triggerLabel = computed(
    () => `Appearance: ${this.theme.resolvedScheme()} theme, ${this.theme.accent()} accent`
  );

  private readonly panel = viewChild.required<Popover>('panel');

  /** Closes the popover, for a caller that has navigated away from it. */
  hide(): void {
    this.panel().hide();
  }
}
