import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColorPickerModule } from 'primeng/colorpicker';

import { LocaleService } from '../i18n/locale.service';
import { TranslatePipe } from '../i18n/translate.pipe';
import { normaliseHex } from './ambient-accent-ramp';
import {
  AMBIENT_ACCENTS,
  AmbientAccent,
  AmbientScheme,
  AmbientThemeService,
  AmbientVibe
} from './ambient-theme.service';

/** One option in the scheme or style group. */
interface AppearanceOption<T> {
  value: T;
  label: string;
  hint?: string;
  icon?: string;
}

/**
 * The three appearance settings, as controls: style, colour scheme, primary
 * colour.
 *
 * <h2>Why this is separate from where it is shown</h2>
 *
 * <p>There are two ways into these settings — the Appearance screen, and the
 * drawer behind the sun icon in the topbar — and there must only ever be one
 * implementation of the controls themselves. A page and a drawer that each
 * built their own radio groups would drift within a week, and the one that got
 * less use would be the one with the bug.</p>
 *
 * <p>So this component is the controls and nothing else: no heading, no card,
 * no drawer. {@link AmbientAppearancePanelComponent} puts it in a drawer; the
 * Appearance screen puts it on a page. Both get the same behaviour because
 * there is only one of it.</p>
 *
 * <h2>The previews are real</h2>
 *
 * <p>Each style tile carries {@code data-amb-vibe} for the style it applies,
 * and {@code _ambient-vibes.scss} matches a descendant as readily as it matches
 * the document root. So a tile is painted by the very tokens it would install:
 * glass really is blurring the little glow behind it, neumorphism really is
 * extruded by the same two shadows, and Material really is casting its own
 * umbra and penumbra. Nothing here is a picture of a style — it is a small
 * instance of one, and it cannot fall out of date.</p>
 *
 * <h2>Accessibility</h2>
 *
 * <p>All three groups are radio groups, because each is one choice from several
 * — arrow keys move within a group and the current option is announced as
 * checked. Every option is labelled in words, so none of the three depends on
 * seeing a colour or a texture. All of them apply immediately: there is no
 * Save, and so no way to be left in a state nobody asked for.</p>
 *
 * @example
 * <amb-appearance-controls layout="page" />
 */
@Component({
  selector: 'amb-appearance-controls',
  imports: [ColorPickerModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.amb-appearance--page]': 'layout() === "page"'
  },
  template: `
    <!-- 1. Style -->
    <fieldset class="amb-appearance__group">
      <legend class="amb-eyebrow">{{ 'appearance.vibeLegend' | t }}</legend>

      <div class="amb-appearance__vibes" role="radiogroup" [attr.aria-label]="'appearance.vibe' | t">
        @for (option of vibeOptions(); track option.value) {
          <button
            type="button"
            class="amb-vibe"
            [class.amb-vibe--active]="theme.vibe() === option.value"
            role="radio"
            [attr.aria-checked]="theme.vibe() === option.value"
            (click)="theme.setVibe(option.value)"
          >
            <!-- A real instance of the style, not a picture of one. -->
            <span
              class="amb-vibe__preview"
              [attr.data-amb-vibe]="option.value"
              aria-hidden="true"
            >
              <span class="amb-vibe__glow"></span>
              <span class="amb-vibe__card">
                <span class="amb-vibe__dot"></span>
                <span class="amb-vibe__bar"></span>
                <span class="amb-vibe__bar amb-vibe__bar--short"></span>
              </span>
            </span>

            <span class="amb-vibe__name">{{ option.label }}</span>
            <span class="amb-vibe__hint">{{ option.hint }}</span>
          </button>
        }
      </div>
    </fieldset>

    <!-- 2. Colour scheme -->
    <fieldset class="amb-appearance__group">
      <legend class="amb-eyebrow">{{ 'appearance.scheme' | t }}</legend>

      <div
        class="amb-appearance__schemes"
        role="radiogroup"
        [attr.aria-label]="'appearance.scheme' | t"
      >
        @for (option of schemeOptions(); track option.value) {
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

    <!-- 3. Primary colour -->
    <fieldset class="amb-appearance__group">
      <legend class="amb-eyebrow">{{ 'appearance.accentLegend' | t }}</legend>

      <div
        class="amb-appearance__accents"
        role="radiogroup"
        [attr.aria-label]="'appearance.accent' | t"
      >
        @for (accent of accents; track accent) {
          <button
            type="button"
            class="amb-appearance__accent"
            [class.amb-appearance__accent--active]="theme.accent() === accent"
            [attr.data-amb-accent]="accent"
            role="radio"
            [attr.aria-checked]="theme.accent() === accent"
            [attr.aria-label]="accentLabels()[accent]"
            [title]="accentLabels()[accent]"
            (click)="theme.setAccent(accent)"
          >
            <span class="amb-appearance__swatch amb-swatch" aria-hidden="true"></span>
          </button>
        }

        <!-- The seventh swatch is the one the user made. It paints itself in
             their colour rather than in a palette step, because that colour is
             what they picked — which step of the generated ramp the buttons end
             up using is a contrast decision, not theirs. -->
        <button
          type="button"
          class="amb-appearance__accent amb-appearance__accent--custom"
          [class.amb-appearance__accent--active]="isCustom()"
          role="radio"
          [attr.aria-checked]="isCustom()"
          [attr.aria-label]="'appearance.accent.custom' | t"
          [title]="'appearance.accent.custom' | t"
          (click)="theme.setCustomAccent(theme.customAccent())"
        >
          <span
            class="amb-appearance__swatch amb-appearance__swatch--custom amb-swatch"
            [style.background]="theme.customAccent()"
            aria-hidden="true"
          ></span>
        </button>
      </div>

      <!-- Two ways in, because they suit different people: drag a picker, or
           paste the hex out of a brand guideline. -->
      <div class="amb-appearance__custom">
        <p-colorpicker
          [ngModel]="theme.customAccent()"
          (ngModelChange)="theme.setCustomAccent($event)"
          [ngModelOptions]="{ standalone: true }"
          format="hex"
          [inputId]="pickerId()"
        />
        <label class="amb-sr-only" [attr.for]="pickerId()">
          {{ 'appearance.customPicker' | t }}
        </label>

        <label class="amb-appearance__hex">
          <span class="amb-sr-only">{{ 'appearance.customHex' | t }}</span>
          <input
            type="text"
            class="p-inputtext p-component p-inputtext-sm amb-num"
            spellcheck="false"
            autocapitalize="none"
            autocomplete="off"
            maxlength="7"
            [value]="hexDraft()"
            [attr.aria-invalid]="hexInvalid()"
            [placeholder]="theme.customAccent()"
            (input)="onHexInput($event)"
            (blur)="onHexBlur()"
          />
        </label>
      </div>

      @if (hexInvalid()) {
        <p class="amb-appearance__error" role="alert">
          {{ 'appearance.customHexInvalid' | t }}
        </p>
      }
    </fieldset>
  `,
  styles: `
    @use 'ambient' as amb;

    // No ::ng-deep anywhere in here, and that is the point of the split. These
    // elements are declared in this component's template, so they carry its
    // scoping attribute wherever the drawer relocates them in the DOM.
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-6);
    }

    // A fieldset carries the grouping for assistive technology; its default
    // border, padding and margin carry nothing at all.
    .amb-appearance__group {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-3);
      margin: 0;
      padding: 0;
      border: 0;
      min-width: 0;
    }

    .amb-appearance__group > legend {
      padding: 0;
    }

    // -- Style -------------------------------------------------------------

    // Two across in a drawer. On a page the tiles get a floor and take whatever
    // room there is, which lands all five on one row at desktop width.
    .amb-appearance__vibes {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: var(--amb-space-3);
    }

    :host(.amb-appearance--page) .amb-appearance__vibes {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
      gap: var(--amb-gap-grid);
    }

    .amb-vibe {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-1);
      padding: var(--amb-space-2);
      border: 1px solid var(--amb-border);
      border-radius: var(--amb-radius-card);
      background: transparent;
      text-align: left;
      cursor: pointer;

      @include amb.transition;

      &:hover {
        border-color: var(--amb-border-accent);
        background: var(--amb-surface-hover);
      }

      &:focus-visible {
        @include amb.focus-ring(1px);
      }
    }

    .amb-vibe--active {
      border-color: var(--amb-accent);
      background: var(--amb-accent-soft);
    }

    // The preview. Its own little canvas, so the tile is a genuine instance of
    // the style rather than a drawing of one — including the blur, which needs
    // something behind it to be worth having.
    .amb-vibe__preview {
      position: relative;
      display: block;
      height: 4.25rem;
      overflow: hidden;
      border-radius: calc(var(--amb-radius-card) - 2px);
      background: linear-gradient(180deg, var(--amb-canvas) 0%, var(--amb-canvas-deep) 100%);
    }

    :host(.amb-appearance--page) .amb-vibe__preview {
      height: 6.5rem;
    }

    // The thing the glass refracts. Transparent under every style that has no
    // ambient glow, so those previews come out flat — correctly.
    .amb-vibe__glow {
      position: absolute;
      inset: -40%;
      background:
        radial-gradient(closest-side, var(--amb-glow-1) 0%, transparent 70%) -10% 10% / 70% 90%
          no-repeat,
        radial-gradient(closest-side, var(--amb-glow-2) 0%, transparent 70%) 90% -10% / 65% 85%
          no-repeat,
        radial-gradient(closest-side, var(--amb-glow-3) 0%, transparent 70%) 70% 100% / 80% 80%
          no-repeat;
    }

    // A card, built from exactly the tokens a real card is built from.
    .amb-vibe__card {
      position: absolute;
      inset: 0.9rem 0.7rem 0.55rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.28rem;
      padding-inline: 0.45rem;
      border: 1px solid var(--amb-border);
      border-radius: calc(var(--amb-radius-card) * 0.6);
      background-color: var(--amb-surface-2);
      background-image: var(--amb-glass-sheen);
      box-shadow: var(--amb-shadow-md), var(--amb-glass-inset);
      -webkit-backdrop-filter: var(--amb-glass-filter);
      backdrop-filter: var(--amb-glass-filter);
    }

    .amb-vibe__dot {
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--amb-radius-pill);
      background: var(--amb-accent);
      box-shadow: var(--amb-fill-sheen);
    }

    .amb-vibe__bar {
      height: 0.25rem;
      width: 80%;
      border-radius: var(--amb-radius-pill);
      background: var(--amb-text-muted);
      opacity: 0.32;
    }

    .amb-vibe__bar--short {
      width: 52%;
    }

    .amb-vibe__name {
      font-size: var(--amb-text-sm);
      font-weight: var(--amb-weight-semibold);
      color: var(--amb-text);
    }

    .amb-vibe__hint {
      font-size: var(--amb-text-2xs);
      line-height: var(--amb-leading-snug);
      color: var(--amb-text-subtle);
    }

    // -- Colour scheme -----------------------------------------------------
    //
    // Three equal segments in a well, matching the select-buttons elsewhere in
    // the product rather than inventing a fourth kind of segmented control.

    .amb-appearance__schemes {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.1875rem;
      padding: 0.1875rem;
      border: 1px solid var(--amb-border);
      border-radius: var(--amb-radius-field);
      background: var(--amb-surface-sunken);
      box-shadow: var(--amb-sunken-shadow);
    }

    // On a page the control would stretch to the full column and look like a
    // toolbar; it is three words and wants to be its own size.
    :host(.amb-appearance--page) .amb-appearance__schemes {
      max-width: 22rem;
    }

    .amb-appearance__scheme {
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

      @include amb.transition;

      i {
        font-size: var(--amb-text-base);
        line-height: 1;
      }

      &:hover {
        background: var(--amb-surface-hover);
        color: var(--amb-text);
      }

      &:focus-visible {
        @include amb.focus-ring(-2px);
      }
    }

    .amb-appearance__scheme--active {
      background: var(--amb-surface-solid);
      box-shadow: var(--amb-shadow-sm), var(--amb-fill-sheen);
      color: var(--amb-accent-on-soft);
    }

    // -- Primary colour ----------------------------------------------------

    .amb-appearance__accents {
      display: flex;
      flex-wrap: wrap;
      gap: var(--amb-space-2);
    }

    // Each swatch carries its own data-amb-accent, so the palette it previews is
    // the one it will apply — the same mechanism, one element wide. Adding a
    // palette to the Sass map is all it takes for a correct swatch to appear.
    .amb-appearance__accent {
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

      @include amb.transition;

      &:hover .amb-appearance__swatch {
        transform: scale(1.12);
      }

      &:focus-visible {
        @include amb.focus-ring(1px);
      }
    }

    // Size and fill; the round shape and the ring come from .amb-swatch.
    .amb-appearance__swatch {
      width: 1.25rem;
      height: 1.25rem;
      // The palette's own accent, read from the tokens the swatch's own
      // attribute just set.
      background: linear-gradient(140deg, var(--amb-accent-400), var(--amb-accent-600));

      @include amb.transition-prop(transform, var(--amb-duration-base), var(--amb-ease-soft));
    }

    // Selected: a ring in the swatch's own hue, offset by a gap in the surface
    // colour so it reads as a ring rather than a thicker dot.
    .amb-appearance__accent--active .amb-appearance__swatch {
      box-shadow:
        inset 0 0 0 1px var(--amb-swatch-ring),
        0 0 0 2px var(--amb-surface-3),
        0 0 0 4px var(--amb-accent-500);
    }

    // The custom swatch has no palette, so its ring is drawn in the live accent
    // — which, while it is selected, is generated from the colour it shows.
    .amb-appearance__accent--custom.amb-appearance__accent--active .amb-appearance__swatch {
      box-shadow:
        inset 0 0 0 1px var(--amb-swatch-ring),
        0 0 0 2px var(--amb-surface-3),
        0 0 0 4px var(--amb-accent);
    }

    .amb-appearance__custom {
      display: flex;
      align-items: center;
      gap: var(--amb-space-2);
      max-width: 22rem;
    }

    .amb-appearance__hex {
      flex: 1 1 auto;
      min-width: 0;

      input {
        width: 100%;
        text-transform: lowercase;
      }
    }

    .amb-appearance__error {
      margin: 0;
      font-size: var(--amb-text-xs);
      color: var(--amb-danger);
    }
  `
})
export class AmbientAppearanceControlsComponent {
  protected readonly theme = inject(AmbientThemeService);
  private readonly i18n = inject(LocaleService);

  /**
   * How much room the controls have.
   *
   * <p>`panel` is the 21rem drawer; `page` is a content column. The only things
   * that change are how many style tiles sit on a row, how tall their previews
   * are, and whether the two narrow controls stretch — everything else is
   * identical, which is the whole reason this is one component.</p>
   */
  readonly layout = input<'panel' | 'page'>('panel');

  /**
   * Ties the colour picker to its visually hidden label.
   *
   * <p>Derived from the layout so the page and the drawer cannot both render an
   * element with the same id — they are not on screen at the same time today,
   * but a duplicate id is the kind of thing that only breaks later.</p>
   */
  protected readonly pickerId = computed(() => `amb-accent-picker-${this.layout()}`);

  protected readonly accents = AMBIENT_ACCENTS;

  protected readonly isCustom = computed(() => this.theme.accent() === 'custom');

  /**
   * What is in the hex field while it is being typed in.
   *
   * <p>Separate from the live colour because a half-typed value is not a
   * colour: someone typing `#3a7` passes through `#`, `#3`, `#3a`, and applying
   * each of those either fails or — worse — succeeds by accident. Empty means
   * "not being edited", and the field falls back to showing the live colour.</p>
   */
  protected readonly hexDraft = signal('');

  protected readonly hexInvalid = signal(false);

  protected readonly accentLabels = computed<Record<AmbientAccent, string>>(() => ({
    indigo: this.i18n.t('appearance.accent.indigo'),
    violet: this.i18n.t('appearance.accent.violet'),
    blue: this.i18n.t('appearance.accent.blue'),
    teal: this.i18n.t('appearance.accent.teal'),
    emerald: this.i18n.t('appearance.accent.emerald'),
    rose: this.i18n.t('appearance.accent.rose')
  }));

  /**
   * The styles, in the current language.
   *
   * <p>A {@code computed} and not a constant, which is the shape every
   * translated list in this application has: reading the catalogue inside the
   * computation is what makes it recalculate when the language changes. The
   * same list built in a field initialiser would keep the language it was born
   * in for the life of the component.</p>
   */
  protected readonly vibeOptions = computed<AppearanceOption<AmbientVibe>[]>(() => [
    {
      value: 'minimal',
      label: this.i18n.t('appearance.vibe.minimal'),
      hint: this.i18n.t('appearance.vibe.minimal.hint')
    },
    {
      value: 'ambient',
      label: this.i18n.t('appearance.vibe.ambient'),
      hint: this.i18n.t('appearance.vibe.ambient.hint')
    },
    {
      value: 'glass',
      label: this.i18n.t('appearance.vibe.glass'),
      hint: this.i18n.t('appearance.vibe.glass.hint')
    },
    {
      value: 'material',
      label: this.i18n.t('appearance.vibe.material'),
      hint: this.i18n.t('appearance.vibe.material.hint')
    },
    {
      value: 'neumorph',
      label: this.i18n.t('appearance.vibe.neumorph'),
      hint: this.i18n.t('appearance.vibe.neumorph.hint')
    }
  ]);

  protected readonly schemeOptions = computed<AppearanceOption<AmbientScheme>[]>(() => [
    { value: 'light', label: this.i18n.t('appearance.light'), icon: 'pi pi-sun' },
    { value: 'dark', label: this.i18n.t('appearance.dark'), icon: 'pi pi-moon' },
    { value: 'system', label: this.i18n.t('appearance.system'), icon: 'pi pi-desktop' }
  ]);

  /**
   * Applies a typed hex as soon as it is a whole colour, and says so when it is
   * not.
   *
   * <p>Applying on every keystroke rather than on blur is deliberate: the point
   * of typing a hex is to see it, and three-digit shorthand means a usable
   * value can arrive four characters in.</p>
   */
  protected onHexInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.hexDraft.set(raw);

    const hex = normaliseHex(raw);
    if (hex) {
      this.theme.setCustomAccent(hex);
    }

    // Nothing typed yet is not a mistake. Anything else that is not a colour is.
    this.hexInvalid.set(raw.trim().length > 0 && !hex);
  }

  /** Leaving the field abandons an unfinished value rather than keeping it on
      screen as if it had been accepted. */
  protected onHexBlur(): void {
    this.hexDraft.set('');
    this.hexInvalid.set(false);
  }
}
