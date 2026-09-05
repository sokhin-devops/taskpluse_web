import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

/**
 * The bridge between the Ambient design tokens and PrimeNG's own theme.
 *
 * <h2>Why this file exists</h2>
 *
 * <p>PrimeNG v19 is entirely token-driven: every component reads
 * {@code --p-*} custom properties that PrimeNG generates at runtime from a
 * preset and injects into the document head. That injection happens
 * <em>after</em> the application's stylesheets, so redeclaring {@code --p-*} in
 * SCSS loses the cascade and silently does nothing. Extending the preset is the
 * only place an override actually takes.</p>
 *
 * <h2>Why the values are {@code var(--amb-*)} rather than literals</h2>
 *
 * <p>A preset value is emitted into the generated CSS verbatim, so
 * {@code 'var(--amb-radius-card)'} produces
 * {@code --p-card-border-radius: var(--amb-radius-card)} and the component
 * resolves it against the ambient tokens at paint time. That keeps
 * {@code _ambient-tokens.scss} the single source of truth: changing the card
 * radius, the glass opacity or the accent there moves PrimeNG with it, and this
 * file never needs editing.</p>
 *
 * <p>The accent ramp goes further: its steps are {@code var()}s too, so the
 * whole product re-themes when {@code AmbientThemeService} writes a different
 * {@code data-amb-accent} onto {@code <html>}. The surface ramps are the one
 * place a literal hex survives, because they are the neutral scaffolding and do
 * not change with the accent.</p>
 *
 * <h2>Dark mode</h2>
 *
 * <p>There is no second theme. Every value here is a {@code var(--amb-*)} that
 * already flips under {@code .amb-dark}, so the dark colour scheme is the light
 * one called with a different surface ramp — see {@code colorScheme()} below.
 * The class is written by {@code AmbientThemeService} and named again in
 * {@code app.config.ts} as {@code darkModeSelector}; those two and
 * {@code _ambient-tokens.scss} must agree.</p>
 *
 * <h2>What is deliberately not here</h2>
 *
 * <p>Anything a token cannot express — {@code backdrop-filter}, the lit top
 * edge on a glass surface, the blurred modal mask — lives in
 * {@code _ambient-components.scss}. If a rule can be a token, it belongs here;
 * only what cannot be belongs there.</p>
 */

/**
 * PrimeNG's primary ramp, pointed at the live accent palette rather than at a
 * hue.
 *
 * <p>This is what makes the accent switchable at runtime. Each step emits as
 * {@code --p-primary-500: var(--amb-accent-500)}, so when
 * {@code AmbientThemeService} writes {@code data-amb-accent="teal"} onto
 * {@code <html>}, the ambient properties change, PrimeNG's resolve to the new
 * values on the next paint, and every button, focus ring, chip and selected row
 * follows. No stylesheet is swapped, no theme is regenerated, nothing
 * re-renders, and no component has to know.</p>
 *
 * <p>It works because PrimeNG substitutes token values into CSS verbatim — even
 * where Aura wraps one in {@code color-mix()}, which accepts a {@code var()}
 * perfectly well.</p>
 */
const ACCENT_RAMP: Record<number, string> = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [
    step,
    `var(--amb-accent-${step})`
  ])
);

/**
 * The neutral ramp, tinted towards the ink hue rather than pure grey.
 *
 * <p>Aura's default is Tailwind slate, which is cool but blue-grey; against the
 * ambient canvas it reads as slightly dirty. These are the same lightness steps
 * pulled towards the indigo the rest of the system uses, so a PrimeNG surface
 * and an ambient one sit in the same family. Steps 500-950 match the
 * `--amb-text-*` tokens exactly.</p>
 */
const SURFACE = {
  0: '#ffffff',
  50: '#f7f8fc',
  100: '#eef0f7',
  200: '#e1e4ee',
  300: '#cbd0e0',
  400: '#9aa1b8',
  500: '#6f7690',
  600: '#565d75',
  700: '#3d4358',
  800: '#272c3e',
  900: '#151a2e',
  950: '#0d1120'
};

/**
 * The same ramp for dark mode.
 *
 * <p>Not Aura's default zinc: these are the ambient ink hue at dark lightnesses,
 * so a PrimeNG surface and an ambient one stay in the same family in both
 * schemes.</p>
 *
 * <p>The ramp is inverted, not merely darkened. PrimeNG treats {@code surface.0}
 * as "the plainest background" and {@code surface.900} as "the strongest ink",
 * and in dark mode those are the near-black and the near-white respectively.
 * Handing it a dark ramp in light-mode order is the usual reason a dark theme
 * comes out with black text on black panels.</p>
 */
const SURFACE_DARK: Record<number, string> = {
  0: '#0a0d17',
  50: '#10141f',
  100: '#161c2e',
  200: '#1e253a',
  300: '#2a3350',
  400: '#3d4763',
  500: '#5c6684',
  600: '#8a92ab',
  700: '#a9b0c6',
  800: '#ced4e4',
  900: '#e9ecf5',
  950: '#f7f8fc'
};

/**
 * Both colour schemes, from one definition.
 *
 * <p>Every value below is a {@code var(--amb-*)} that already flips under
 * {@code .amb-dark}, so light and dark differ in exactly one thing: the surface
 * ramp. Writing the scheme out twice would be ninety lines that have to stay
 * identical forever, and the first token added to one and forgotten in the other
 * is a bug nobody notices until dark mode looks subtly wrong.</p>
 */
const colorScheme = (surface: Record<number, string>) => ({
  surface,

  primary: {
    color: 'var(--amb-accent)',
    contrastColor: 'var(--amb-accent-contrast)',
    hoverColor: 'var(--amb-accent-hover)',
    activeColor: 'var(--amb-accent-hover)'
  },

  // Selection: a tint of the accent rather than a fill, so a selected row stays
  // readable and does not out-shout the page's primary action.
  highlight: {
    background: 'var(--amb-accent-soft)',
    focusBackground: 'var(--amb-accent-soft-hover)',
    color: 'var(--amb-accent-on-soft)',
    focusColor: 'var(--amb-accent-on-soft)'
  },

  mask: {
    background: 'var(--amb-mask)',
    color: 'var(--amb-text-subtle)'
  },

  // Inputs are wells: they read as cut into the surface holding them, which is
  // the whole reason `--amb-surface-sunken` is more transparent than the card
  // above it rather than less.
  formField: {
    background: 'var(--amb-surface-sunken)',
    disabledBackground: 'var(--amb-surface-muted)',
    filledBackground: 'var(--amb-surface-sunken)',
    filledHoverBackground: 'var(--amb-surface-sunken)',
    filledFocusBackground: 'var(--amb-surface-sunken)',
    borderColor: 'var(--amb-border-strong)',
    hoverBorderColor: 'var(--amb-border-accent)',
    focusBorderColor: 'var(--amb-accent)',
    invalidBorderColor: 'var(--amb-danger)',
    color: 'var(--amb-text)',
    disabledColor: 'var(--amb-text-subtle)',
    placeholderColor: 'var(--amb-text-subtle)',
    invalidPlaceholderColor: 'var(--amb-danger)',
    floatLabelColor: 'var(--amb-text-subtle)',
    floatLabelFocusColor: 'var(--amb-accent)',
    floatLabelActiveColor: 'var(--amb-text-subtle)',
    floatLabelInvalidColor: 'var(--amb-danger)',
    iconColor: 'var(--amb-text-subtle)',
    // The well shadow from `glass-sunken()`, so a PrimeNG input and an ambient
    // one are cut into the surface to the same depth.
    shadow: 'inset 0 1px 3px rgb(0 0 0 / 0.07)'
  },

  text: {
    color: 'var(--amb-text)',
    hoverColor: 'var(--amb-text)',
    mutedColor: 'var(--amb-text-muted)',
    hoverMutedColor: 'var(--amb-text)'
  },

  // `content` is the widest lever in the whole preset: card, panel, toolbar,
  // table, tabs and paginator all read it. Setting it to the level-2 glass is
  // what gives every one of them the same surface without a rule per component.
  content: {
    background: 'var(--amb-surface-2)',
    hoverBackground: 'var(--amb-surface-hover)',
    borderColor: 'var(--amb-border)',
    color: 'var(--amb-text)',
    hoverColor: 'var(--amb-text)'
  },

  overlay: {
    select: {
      background: 'var(--amb-surface-3)',
      borderColor: 'var(--amb-border)',
      color: 'var(--amb-text)'
    },
    popover: {
      background: 'var(--amb-surface-3)',
      borderColor: 'var(--amb-border)',
      color: 'var(--amb-text)'
    },
    modal: {
      background: 'var(--amb-surface-3)',
      borderColor: 'var(--amb-border)',
      color: 'var(--amb-text)'
    }
  },

  list: {
    option: {
      focusBackground: 'var(--amb-surface-hover)',
      selectedBackground: 'var(--amb-accent-soft)',
      selectedFocusBackground: 'var(--amb-accent-soft-hover)',
      color: 'var(--amb-text)',
      focusColor: 'var(--amb-text)',
      selectedColor: 'var(--amb-accent-on-soft)',
      selectedFocusColor: 'var(--amb-accent-on-soft)',
      icon: {
        color: 'var(--amb-text-subtle)',
        focusColor: 'var(--amb-text-muted)'
      }
    },
    optionGroup: {
      background: 'transparent',
      color: 'var(--amb-text-subtle)'
    }
  },

  navigation: {
    item: {
      focusBackground: 'var(--amb-surface-hover)',
      activeBackground: 'var(--amb-accent-soft)',
      color: 'var(--amb-text-muted)',
      focusColor: 'var(--amb-text)',
      activeColor: 'var(--amb-accent-on-soft)',
      icon: {
        color: 'var(--amb-text-subtle)',
        focusColor: 'var(--amb-text-muted)',
        activeColor: 'var(--amb-accent-on-soft)'
      }
    },
    submenuLabel: {
      background: 'transparent',
      color: 'var(--amb-text-subtle)'
    },
    submenuIcon: {
      color: 'var(--amb-text-subtle)',
      focusColor: 'var(--amb-text-muted)',
      activeColor: 'var(--amb-accent-on-soft)'
    }
  }
});

/**
 * A component colour scheme that is the same in light and dark.
 *
 * <p>True of every one below, because they are all written in
 * {@code var(--amb-*)} terms and those already flip. Naming it says so, instead
 * of leaving two identical blocks to drift apart.</p>
 */
const inBothSchemes = <T>(scheme: T) => ({ light: scheme, dark: scheme });

export const AmbientPreset = definePreset(Aura, {
  // -- Primitives ----------------------------------------------------------
  //
  // Aura's own radius ramp, repointed at the ambient one. Components that ask
  // for `{border.radius.md}` rather than a role token land on the right corner
  // without every one of them needing an override below.
  primitive: {
    borderRadius: {
      none: '0',
      xs: 'var(--amb-radius-xs)',
      sm: 'var(--amb-radius-sm)',
      md: 'var(--amb-radius-md)',
      lg: 'var(--amb-radius-lg)',
      xl: 'var(--amb-radius-xl)'
    }
  },

  semantic: {
    primary: ACCENT_RAMP,

    transitionDuration: 'var(--amb-duration-base)',
    disabledOpacity: '0.55',
    iconSize: '1rem',
    anchorGutter: '4px',

    // One focus indicator for the whole product, matching `focus-ring()` in
    // `_ambient-mixins.scss`. Two pixels rather than Aura's one: a hairline
    // ring over a translucent surface is not reliably visible.
    focusRing: {
      width: '2px',
      style: 'solid',
      color: 'var(--amb-accent)',
      offset: '2px',
      shadow: 'none'
    },

    // -- Form fields -------------------------------------------------------
    //
    // Inputs are wells: they read as cut into the surface holding them, which
    // is the whole reason `--amb-surface-sunken` is more transparent than the
    // card above it rather than less.
    formField: {
      paddingX: 'var(--amb-space-3)',
      paddingY: '0.5625rem',
      borderRadius: 'var(--amb-radius-field)',
      transitionDuration: 'var(--amb-duration-fast)',
      sm: {
        fontSize: 'var(--amb-text-sm)',
        paddingX: 'var(--amb-space-2)',
        paddingY: 'var(--amb-space-1)'
      },
      lg: {
        fontSize: 'var(--amb-text-lg)',
        paddingX: 'var(--amb-space-4)',
        paddingY: 'var(--amb-space-3)'
      },
      // The field's own ring is suppressed so the border colour change carries
      // focus; the outline from `focusRing` above is what a keyboard user sees.
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: 'none'
      }
    },

    content: {
      borderRadius: 'var(--amb-radius-card)'
    },

    // Lists (select panels, menus) get the ambient spacing scale so an option
    // row is the same height as a nav item.
    list: {
      padding: 'var(--amb-space-2)',
      gap: '2px',
      header: { padding: 'var(--amb-space-3) var(--amb-space-3) var(--amb-space-2)' },
      option: {
        padding: 'var(--amb-space-2) var(--amb-space-3)',
        borderRadius: 'var(--amb-radius-sm)'
      },
      optionGroup: {
        padding: 'var(--amb-space-2) var(--amb-space-3)',
        fontWeight: 'var(--amb-weight-semibold)'
      }
    },

    navigation: {
      list: { padding: 'var(--amb-space-2)', gap: '2px' },
      item: {
        padding: 'var(--amb-space-2) var(--amb-space-3)',
        borderRadius: 'var(--amb-radius-sm)',
        gap: 'var(--amb-space-2)'
      },
      submenuLabel: {
        padding: 'var(--amb-space-2) var(--amb-space-3)',
        fontWeight: 'var(--amb-weight-semibold)'
      },
      submenuIcon: { size: 'var(--amb-text-base)' }
    },

    // -- Overlays ----------------------------------------------------------
    //
    // Every floating thing shares one corner and one shadow step, so a select
    // panel, a menu and a dialog read as the same family of surface.
    overlay: {
      select: {
        borderRadius: 'var(--amb-radius-lg)',
        shadow: 'var(--amb-shadow-xl)'
      },
      popover: {
        borderRadius: 'var(--amb-radius-lg)',
        padding: 'var(--amb-space-3)',
        shadow: 'var(--amb-shadow-xl)'
      },
      modal: {
        borderRadius: 'var(--amb-radius-overlay)',
        padding: 'var(--amb-pad-panel)',
        shadow: 'var(--amb-shadow-xl)'
      },
      navigation: { shadow: 'var(--amb-shadow-xl)' }
    },

    mask: { transitionDuration: 'var(--amb-duration-fast)' },

    colorScheme: {
      light: colorScheme(SURFACE),
      dark: colorScheme(SURFACE_DARK)
    }
  },

  components: {
    // -- Button ------------------------------------------------------------
    button: {
      root: {
        borderRadius: 'var(--amb-radius-field)',
        roundedBorderRadius: 'var(--amb-radius-pill)',
        gap: 'var(--amb-space-2)',
        paddingX: 'var(--amb-space-4)',
        paddingY: '0.5625rem',
        iconOnlyWidth: '2.375rem',
        label: { fontWeight: 'var(--amb-weight-semibold)' },
        transitionDuration: 'var(--amb-duration-fast)',
        sm: {
          fontSize: 'var(--amb-text-sm)',
          paddingX: 'var(--amb-space-3)',
          paddingY: 'var(--amb-space-1)',
          iconOnlyWidth: '2rem'
        },
        lg: {
          fontSize: 'var(--amb-text-md)',
          paddingX: 'var(--amb-space-5)',
          paddingY: 'var(--amb-space-3)',
          iconOnlyWidth: '3rem'
        }
      },
      colorScheme: inBothSchemes({
        root: {
          // Secondary is the workhorse "quiet" button. Aura fills it with a
          // solid grey, which sits on the canvas like a patch; the glass tint
          // keeps it part of the surface it is on.
          secondary: {
            background: 'var(--amb-surface-2)',
            hoverBackground: 'var(--amb-surface-3)',
            activeBackground: 'var(--amb-surface-3)',
            borderColor: 'var(--amb-border-strong)',
            hoverBorderColor: 'var(--amb-border-accent)',
            activeBorderColor: 'var(--amb-border-accent)',
            color: 'var(--amb-text-muted)',
            hoverColor: 'var(--amb-text)',
            activeColor: 'var(--amb-text)',
            focusRing: { color: 'var(--amb-accent)', shadow: 'none' }
          },
          danger: {
            background: 'var(--amb-danger)',
            hoverBackground: 'var(--amb-danger-strong)',
            activeBackground: 'var(--amb-danger-strong)',
            borderColor: 'var(--amb-danger)',
            hoverBorderColor: 'var(--amb-danger-strong)',
            activeBorderColor: 'var(--amb-danger-strong)',
            color: '#ffffff',
            hoverColor: '#ffffff',
            activeColor: '#ffffff',
            focusRing: { color: 'var(--amb-danger)', shadow: 'none' }
          }
        },
        outlined: {
          primary: {
            hoverBackground: 'var(--amb-accent-soft)',
            activeBackground: 'var(--amb-accent-soft-hover)',
            borderColor: 'var(--amb-border-accent)',
            color: 'var(--amb-accent-700)'
          },
          secondary: {
            hoverBackground: 'var(--amb-surface-hover)',
            activeBackground: 'var(--amb-surface-active)',
            borderColor: 'var(--amb-border-strong)',
            color: 'var(--amb-text-muted)'
          },
          danger: {
            hoverBackground: 'var(--amb-danger-soft)',
            activeBackground: 'var(--amb-danger-soft)',
            borderColor: 'var(--amb-danger-border)',
            color: 'var(--amb-danger)'
          }
        },
        text: {
          primary: {
            hoverBackground: 'var(--amb-accent-soft)',
            activeBackground: 'var(--amb-accent-soft-hover)',
            color: 'var(--amb-accent-700)'
          },
          secondary: {
            hoverBackground: 'var(--amb-surface-hover)',
            activeBackground: 'var(--amb-surface-active)',
            color: 'var(--amb-text-muted)'
          },
          danger: {
            hoverBackground: 'var(--amb-danger-soft)',
            activeBackground: 'var(--amb-danger-soft)',
            color: 'var(--amb-danger)'
          }
        }
      })
    },

    // -- Surfaces ----------------------------------------------------------
    //
    // Card, panel and toolbar inherit `content.background` above; what they need
    // here is the ambient radius, the ambient shadow and the ambient padding
    // scale, none of which `content` carries.
    card: {
      root: {
        borderRadius: 'var(--amb-radius-card)',
        shadow: 'var(--amb-shadow-md)'
      },
      body: { padding: 'var(--amb-pad-card)', gap: 'var(--amb-space-3)' },
      caption: { gap: 'var(--amb-space-1)' },
      title: { fontSize: 'var(--amb-text-lg)', fontWeight: 'var(--amb-weight-semibold)' },
      subtitle: { color: 'var(--amb-text-muted)' }
    },

    panel: {
      root: { borderRadius: 'var(--amb-radius-panel)' },
      header: { padding: 'var(--amb-pad-card)', borderWidth: '0', background: 'transparent' },
      toggleableHeader: { padding: 'var(--amb-space-3) var(--amb-pad-card)' },
      title: { fontWeight: 'var(--amb-weight-semibold)' },
      content: { padding: '0 var(--amb-pad-card) var(--amb-pad-card)' },
      footer: { padding: '0 var(--amb-pad-card) var(--amb-pad-card)' }
    },

    toolbar: {
      root: {
        borderRadius: 'var(--amb-radius-panel)',
        padding: 'var(--amb-space-3)',
        gap: 'var(--amb-space-2)'
      }
    },

    // -- Dialog ------------------------------------------------------------
    dialog: {
      root: {
        borderRadius: 'var(--amb-radius-overlay)',
        shadow: 'var(--amb-shadow-xl)'
      },
      header: { padding: 'var(--amb-pad-panel) var(--amb-pad-panel) var(--amb-space-4)' },
      title: { fontSize: 'var(--amb-text-xl)', fontWeight: 'var(--amb-weight-semibold)' },
      content: { padding: '0 var(--amb-pad-panel) var(--amb-space-2)' },
      footer: { padding: 'var(--amb-space-4) var(--amb-pad-panel) var(--amb-pad-panel)', gap: 'var(--amb-space-2)' }
    },

    // -- Table -------------------------------------------------------------
    //
    // Every background is transparent: the table always sits inside an
    // `<amb-card>`, and a second opaque surface inside a glass one is what turns
    // layered glass into flat grey. The card is the surface; the table is only
    // its content.
    datatable: {
      root: { transitionDuration: 'var(--amb-duration-fast)' },
      header: {
        background: 'transparent',
        borderColor: 'var(--amb-border)',
        padding: 'var(--amb-space-3) var(--amb-space-4)'
      },
      headerCell: {
        background: 'transparent',
        hoverBackground: 'var(--amb-surface-hover)',
        selectedBackground: 'var(--amb-accent-soft)',
        borderColor: 'var(--amb-border)',
        color: 'var(--amb-text-subtle)',
        hoverColor: 'var(--amb-text)',
        gap: 'var(--amb-space-2)',
        padding: 'var(--amb-space-3) var(--amb-space-4)'
      },
      columnTitle: { fontWeight: 'var(--amb-weight-semibold)' },
      row: {
        background: 'transparent',
        hoverBackground: 'var(--amb-surface-hover)',
        selectedBackground: 'var(--amb-accent-soft)',
        color: 'var(--amb-text)',
        hoverColor: 'var(--amb-text)'
      },
      bodyCell: {
        borderColor: 'var(--amb-border-subtle)',
        padding: 'var(--amb-space-3) var(--amb-space-4)'
      },
      footerCell: { background: 'transparent', borderColor: 'var(--amb-border)' },
      footer: { background: 'transparent', borderColor: 'var(--amb-border)' },
      sortIcon: { color: 'var(--amb-text-subtle)', hoverColor: 'var(--amb-text-muted)' },
      paginatorTop: { borderColor: 'var(--amb-border)', borderWidth: '0 0 1px 0' },
      paginatorBottom: { borderColor: 'var(--amb-border)', borderWidth: '1px 0 0 0' }
    },

    paginator: {
      root: {
        background: 'transparent',
        padding: 'var(--amb-space-3) var(--amb-space-4)',
        gap: 'var(--amb-space-1)',
        borderRadius: '0'
      },
      navButton: {
        width: '2.125rem',
        height: '2.125rem',
        borderRadius: 'var(--amb-radius-sm)',
        hoverBackground: 'var(--amb-surface-hover)',
        selectedBackground: 'var(--amb-accent-soft)',
        color: 'var(--amb-text-muted)',
        hoverColor: 'var(--amb-text)',
        selectedColor: 'var(--amb-accent-700)'
      },
      currentPageReport: { color: 'var(--amb-text-subtle)' }
    },

    // -- Menus and overlays ------------------------------------------------
    //
    // A menu floats over arbitrary content, so it takes the level-3 surface
    // rather than the level-2 it would inherit from `content`.
    menu: {
      root: {
        background: 'var(--amb-surface-3)',
        borderColor: 'var(--amb-border)',
        borderRadius: 'var(--amb-radius-lg)',
        shadow: 'var(--amb-shadow-xl)'
      },
      separator: { borderColor: 'var(--amb-border-subtle)' }
    },

    tieredmenu: {
      root: {
        background: 'var(--amb-surface-3)',
        borderColor: 'var(--amb-border)',
        borderRadius: 'var(--amb-radius-lg)',
        shadow: 'var(--amb-shadow-xl)'
      }
    },

    popover: {
      root: {
        background: 'var(--amb-surface-3)',
        borderColor: 'var(--amb-border)',
        borderRadius: 'var(--amb-radius-lg)',
        shadow: 'var(--amb-shadow-xl)'
      }
    },

    tooltip: {
      root: {
        maxWidth: '16rem',
        gutter: '0.375rem',
        borderRadius: 'var(--amb-radius-sm)',
        padding: 'var(--amb-space-2) var(--amb-space-3)',
        shadow: 'var(--amb-shadow-lg)'
      },
      colorScheme: inBothSchemes({
        root: { background: 'var(--amb-inverse-surface)', color: 'var(--amb-inverse-text)' }
      })
    },

    drawer: {
      root: {
        background: 'var(--amb-surface-3)',
        borderColor: 'var(--amb-border)',
        shadow: 'var(--amb-shadow-xl)'
      },
      header: { padding: 'var(--amb-space-5)' },
      title: { fontSize: 'var(--amb-text-lg)', fontWeight: 'var(--amb-weight-semibold)' },
      content: { padding: '0 var(--amb-space-4) var(--amb-space-5)' }
    },

    // -- Feedback ----------------------------------------------------------
    tag: {
      root: {
        fontSize: 'var(--amb-text-2xs)',
        fontWeight: 'var(--amb-weight-semibold)',
        padding: '0.1875rem var(--amb-space-2)',
        gap: 'var(--amb-space-1)',
        borderRadius: 'var(--amb-radius-sm)',
        roundedBorderRadius: 'var(--amb-radius-pill)'
      },
      icon: { size: 'var(--amb-text-2xs)' },
      colorScheme: inBothSchemes({
        primary: { background: 'var(--amb-accent-soft)', color: 'var(--amb-accent-700)' },
        secondary: { background: 'var(--amb-surface-active)', color: 'var(--amb-text-muted)' },
        success: { background: 'var(--amb-success-soft)', color: 'var(--amb-success)' },
        info: { background: 'var(--amb-info-soft)', color: 'var(--amb-info)' },
        warn: { background: 'var(--amb-warn-soft)', color: 'var(--amb-warn)' },
        danger: { background: 'var(--amb-danger-soft)', color: 'var(--amb-danger)' },
        contrast: { background: 'var(--amb-inverse-surface)', color: 'var(--amb-inverse-text)' }
      })
    },

    badge: {
      root: {
        borderRadius: 'var(--amb-radius-pill)',
        fontSize: 'var(--amb-text-2xs)',
        fontWeight: 'var(--amb-weight-semibold)'
      }
    },

    message: {
      root: { borderRadius: 'var(--amb-radius-md)', borderWidth: '1px' },
      content: { padding: 'var(--amb-space-3) var(--amb-space-4)', gap: 'var(--amb-space-2)' },
      text: { fontSize: 'var(--amb-text-sm)', fontWeight: 'var(--amb-weight-medium)' },
      colorScheme: inBothSchemes({
        info: {
          background: 'var(--amb-info-soft)',
          borderColor: 'var(--amb-info-border)',
          color: 'var(--amb-info)',
          shadow: 'none'
        },
        success: {
          background: 'var(--amb-success-soft)',
          borderColor: 'var(--amb-success-border)',
          color: 'var(--amb-success)',
          shadow: 'none'
        },
        warn: {
          background: 'var(--amb-warn-soft)',
          borderColor: 'var(--amb-warn-border)',
          color: 'var(--amb-warn)',
          shadow: 'none'
        },
        error: {
          background: 'var(--amb-danger-soft)',
          borderColor: 'var(--amb-danger-border)',
          color: 'var(--amb-danger)',
          shadow: 'none'
        }
      })
    },

    toast: {
      root: { width: '23rem', borderRadius: 'var(--amb-radius-lg)', borderWidth: '1px' },
      content: { padding: 'var(--amb-space-4)', gap: 'var(--amb-space-3)' },
      summary: { fontSize: 'var(--amb-text-base)', fontWeight: 'var(--amb-weight-semibold)' },
      detail: { fontSize: 'var(--amb-text-sm)', fontWeight: 'var(--amb-weight-normal)' },
      colorScheme: inBothSchemes({
        root: { blur: 'var(--amb-blur-md)' },
        info: {
          background: 'var(--amb-surface-3)',
          borderColor: 'var(--amb-info-border)',
          color: 'var(--amb-info)',
          detailColor: 'var(--amb-text-muted)',
          shadow: 'var(--amb-shadow-lg)'
        },
        success: {
          background: 'var(--amb-surface-3)',
          borderColor: 'var(--amb-success-border)',
          color: 'var(--amb-success)',
          detailColor: 'var(--amb-text-muted)',
          shadow: 'var(--amb-shadow-lg)'
        },
        warn: {
          background: 'var(--amb-surface-3)',
          borderColor: 'var(--amb-warn-border)',
          color: 'var(--amb-warn)',
          detailColor: 'var(--amb-text-muted)',
          shadow: 'var(--amb-shadow-lg)'
        },
        error: {
          background: 'var(--amb-surface-3)',
          borderColor: 'var(--amb-danger-border)',
          color: 'var(--amb-danger)',
          detailColor: 'var(--amb-text-muted)',
          shadow: 'var(--amb-shadow-lg)'
        },
        secondary: {
          background: 'var(--amb-surface-3)',
          borderColor: 'var(--amb-border)',
          color: 'var(--amb-text)',
          detailColor: 'var(--amb-text-muted)',
          shadow: 'var(--amb-shadow-lg)'
        },
        contrast: {
          background: 'var(--amb-inverse-surface)',
          borderColor: 'var(--amb-inverse-surface)',
          color: 'var(--amb-inverse-text)',
          detailColor: 'var(--amb-inverse-text)',
          shadow: 'var(--amb-shadow-lg)'
        }
      })
    },

    skeleton: {
      root: { borderRadius: 'var(--amb-radius-sm)' },
      colorScheme: inBothSchemes({
        root: {
          background: 'rgb(22 27 46 / 0.07)',
          animationBackground: 'rgb(255 255 255 / 0.55)'
        }
      })
    },

    progressbar: {
      root: {
        background: 'var(--amb-viz-track)',
        borderRadius: 'var(--amb-radius-pill)',
        height: '0.5rem'
      },
      value: { background: 'var(--amb-accent)' }
    },

    // -- Segmented controls ------------------------------------------------
    //
    // A select-button is a well with a raised chip sliding inside it, which is
    // the sunken/raised pair the rest of the system already uses.
    selectbutton: {
      root: { borderRadius: 'var(--amb-radius-field)' }
    },

    togglebutton: {
      root: {
        padding: '0.1875rem',
        borderRadius: 'var(--amb-radius-field)',
        fontWeight: 'var(--amb-weight-medium)',
        transitionDuration: 'var(--amb-duration-fast)'
      },
      content: {
        padding: '0.3125rem var(--amb-space-3)',
        borderRadius: 'calc(var(--amb-radius-field) - 3px)',
        checkedShadow: 'var(--amb-shadow-sm)'
      },
      colorScheme: inBothSchemes({
        root: {
          background: 'var(--amb-surface-sunken)',
          checkedBackground: 'var(--amb-surface-sunken)',
          hoverBackground: 'var(--amb-surface-sunken)',
          borderColor: 'var(--amb-border)',
          checkedBorderColor: 'var(--amb-border)',
          color: 'var(--amb-text-muted)',
          hoverColor: 'var(--amb-text)',
          checkedColor: 'var(--amb-accent-700)'
        },
        content: { checkedBackground: 'var(--amb-surface-solid)' },
        icon: {
          color: 'var(--amb-text-subtle)',
          hoverColor: 'var(--amb-text-muted)',
          checkedColor: 'var(--amb-accent-700)'
        }
      })
    },

    // -- Tabs, avatar, dividers -------------------------------------------
    tabs: {
      tablist: { background: 'transparent', borderColor: 'var(--amb-border)' },
      tab: {
        background: 'transparent',
        borderColor: 'var(--amb-border)',
        activeBorderColor: 'var(--amb-accent)',
        color: 'var(--amb-text-muted)',
        hoverColor: 'var(--amb-text)',
        activeColor: 'var(--amb-accent-700)',
        padding: 'var(--amb-space-3) var(--amb-space-4)',
        fontWeight: 'var(--amb-weight-semibold)',
        gap: 'var(--amb-space-2)'
      },
      tabpanel: { background: 'transparent', padding: 'var(--amb-space-5) 0 0' },
      navButton: { background: 'transparent', color: 'var(--amb-text-muted)' },
      activeBar: { background: 'var(--amb-accent)', height: '2px', bottom: '-1px' }
    },

    avatar: {
      root: {
        width: '2.25rem',
        height: '2.25rem',
        fontSize: 'var(--amb-text-sm)',
        background: 'var(--amb-accent-soft)',
        color: 'var(--amb-accent-700)',
        borderRadius: 'var(--amb-radius-md)'
      },
      lg: { width: '3rem', height: '3rem', fontSize: 'var(--amb-text-lg)' },
      xl: { width: '4rem', height: '4rem', fontSize: 'var(--amb-text-2xl)' }
    },

    divider: {
      root: { borderColor: 'var(--amb-border)' }
    },

    // -- Remaining form controls -------------------------------------------
    checkbox: {
      root: { borderRadius: 'var(--amb-radius-xs)', width: '1.25rem', height: '1.25rem' }
    },

    radiobutton: {
      root: { width: '1.25rem', height: '1.25rem' }
    },

    toggleswitch: {
      root: { borderRadius: 'var(--amb-radius-pill)' }
    },

    datepicker: {
      panel: {
        background: 'var(--amb-surface-3)',
        borderColor: 'var(--amb-border)',
        borderRadius: 'var(--amb-radius-lg)',
        shadow: 'var(--amb-shadow-xl)',
        padding: 'var(--amb-space-3)'
      },
      header: { background: 'transparent', borderColor: 'var(--amb-border-subtle)' },
      date: { borderRadius: 'var(--amb-radius-sm)' },
      today: { background: 'var(--amb-surface-active)', color: 'var(--amb-accent-700)' },
      buttonbar: { borderColor: 'var(--amb-border-subtle)' }
    },

    inputgroup: {
      addon: {
        background: 'var(--amb-surface-sunken)',
        borderColor: 'var(--amb-border-strong)',
        color: 'var(--amb-text-subtle)'
      }
    },

    confirmdialog: {
      icon: { size: '1.75rem', color: 'var(--amb-danger)' },
      content: { gap: 'var(--amb-space-4)' }
    }
  }
});
