import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { DrawerModule } from 'primeng/drawer';
import { TooltipModule } from 'primeng/tooltip';

/** One destination in the main navigation. */
export interface AmbientNavLink {
  label: string;
  /** A PrimeIcons class. Required: it is the only thing showing once collapsed. */
  icon: string;
  path: string;
  /** A count shown after the label — open items, matches, unread. */
  badge?: number;
}

/** The product mark at the top of the rail. */
export interface AmbientBrand {
  name: string;
  icon: string;
  /** Where the mark links to. Conventionally the default screen. */
  link: string;
}

/**
 * The application's main navigation.
 *
 * <p>One set of markup, rendered in two places: docked as a glass column beside
 * the content above 900px, and inside a PrimeNG drawer below it. The list of
 * destinations is a single {@code <ng-template>} used twice, so the two can
 * never disagree about what they contain — which is the usual failure mode of a
 * hand-written mobile menu.</p>
 *
 * <p>The {@code [ambSidebarFooter]} slot is rendered in the docked rail only.
 * Angular moves projected content rather than cloning it, so the same nodes
 * cannot appear in both; the shell puts the account control in the topbar, which
 * is where a phone reaches it.</p>
 *
 * <h2>Collapsing</h2>
 *
 * <p>{@code collapsed} narrows the rail to an icon strip. The shell has to know
 * too — it owns the grid the rail is a column of — so this is a two-way
 * {@code model} rather than internal state: the shell binds it, decides whether
 * to remember it, and puts {@code .amb-shell--rail} on the grid, which is what
 * actually animates.</p>
 *
 * <p>Collapsing applies to the docked rail only. Below the nav breakpoint the
 * rail is not on screen at all and the drawer is always full width: a 72px icon
 * strip permanently occupying part of a phone's screen would be worse than
 * either alternative.</p>
 *
 * <h2>Accessibility</h2>
 *
 * <p>The docked rail and the drawer are never both in the accessibility tree:
 * the rail is {@code display: none} under the breakpoint, and the drawer does
 * not exist above it, so a screen reader is never offered the same four links
 * twice. The active destination is marked with {@code aria-current="page"} as
 * well as with weight and a tinted pill, so it is not signalled by colour
 * alone.</p>
 *
 * <p>Collapsing hides the labels visually and <em>only</em> visually: they fade
 * to {@code opacity: 0} and leave the flow, which keeps them in the
 * accessibility tree. A screen reader still announces "Dashboard"; sighted users
 * get the same word from a tooltip. {@code display: none} would be the easy
 * version, and would quietly turn the navigation into four unlabelled icons for
 * anyone not looking at it.</p>
 *
 * @example
 * <amb-sidebar
 *   [brand]="brand"
 *   [links]="navLinks"
 *   [(open)]="navOpen"
 *   [(collapsed)]="navCollapsed"
 * >
 *   <div ambSidebarFooter> ...signed-in account... </div>
 * </amb-sidebar>
 */
@Component({
  selector: 'amb-sidebar',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, DrawerModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.amb-sidebar--rail]': 'collapsed()'
  },
  template: `
    <!-- Docked. Hidden below the nav breakpoint by _ambient-layout.scss. -->
    <aside class="amb-shell__sidebar">
      <div class="amb-sidebar__head">
        <a
          class="amb-brand"
          [routerLink]="brand().link"
          [attr.aria-label]="brand().name + ' home'"
          [pTooltip]="brand().name"
          tooltipPosition="right"
          [tooltipDisabled]="!collapsed()"
          [showDelay]="tooltipDelay"
        >
          <span class="amb-brand__mark" aria-hidden="true">
            <i [class]="brand().icon"></i>
          </span>
          <span class="amb-brand__name">{{ brand().name }}</span>
        </a>

        <button
          type="button"
          class="amb-sidebar__toggle"
          [attr.aria-label]="toggleLabel()"
          [attr.aria-expanded]="!collapsed()"
          [attr.aria-controls]="navId"
          [pTooltip]="toggleLabel()"
          tooltipPosition="right"
          [tooltipDisabled]="!collapsed()"
          [showDelay]="tooltipDelay"
          (click)="collapsed.set(!collapsed())"
        >
          <i class="pi pi-angle-double-left
" aria-hidden="true"></i>
        </button>
      </div>

      <ng-container *ngTemplateOutlet="nav; context: { docked: true }" />

      <div class="amb-sidebar__footer">
        <ng-content select="[ambSidebarFooter]" />
      </div>
    </aside>

    <!-- Mobile. Only instantiated while open, so the drawer's links are not a
         second copy of the rail's in the accessibility tree the rest of the
         time. -->
    <p-drawer
      [visible]="open()"
      (visibleChange)="open.set($event)"
      position="left"
      [header]="brand().name"
      styleClass="amb-sidebar__drawer"
      [style]="{ width: '17rem' }"
    >
      <ng-container *ngTemplateOutlet="nav" />
    </p-drawer>

    <!-- One template, rendered in both places, so the rail and the drawer can
         never disagree about what the destinations are.

         It contains no <ng-content> on purpose. Projected content is moved, not
         cloned, so the same nodes cannot appear in two outlets: the footer would
         migrate into the drawer the first time it opened and never come back.
         The footer is therefore projected into the docked rail only, and the
         shell puts the account control in the topbar where mobile can reach it.

         The docked flag is what keeps the tooltips off the drawer's copy, where the
         labels are always visible and a tooltip would only repeat them. -->
    <ng-template #nav let-docked="docked">
      <nav class="amb-nav" [attr.id]="docked ? navId : null" [attr.aria-label]="navLabel()">
        <ul class="amb-nav__list amb-list-reset">
          @for (link of links(); track link.path) {
            <li>
              <a
                class="amb-nav__link"
                [routerLink]="link.path"
                routerLinkActive="amb-nav__link--active"
                #active="routerLinkActive"
                [attr.aria-current]="active.isActive ? 'page' : null"
                [pTooltip]="link.label"
                tooltipPosition="right"
                [tooltipDisabled]="!docked || !collapsed()"
                [showDelay]="tooltipDelay"
                (click)="open.set(false)"
              >
                <i class="amb-nav__icon" [class]="link.icon" aria-hidden="true"></i>
                <span class="amb-nav__label">{{ link.label }}</span>
                @if (link.badge !== undefined) {
                  <span class="amb-nav__badge">{{ link.badge }}</span>
                }
              </a>
            </li>
          }
        </ul>
      </nav>
    </ng-template>
  `,
  styles: `
    @use 'ambient' as amb;

    // contents so the docked rail is itself a column of the shell's grid
    // rather than being wrapped in one.
    :host {
      display: contents;
    }

    // Which makes the drawer a grid column too — an empty one, sitting where
    // the content should be. contents on it as well drops it out of the grid;
    // its own panel and mask are position: fixed, so they are unaffected.
    p-drawer {
      display: contents;
    }

    // -- Head --------------------------------------------------------------

    .amb-sidebar__head {
      display: flex;
      align-items: center;
      gap: var(--amb-space-2);
      min-width: 0;
    }

    .amb-brand {
      position: relative;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: var(--amb-space-3);
      min-width: 0;
      padding: var(--amb-space-2);
      border-radius: var(--amb-radius-md);
      color: inherit;
      user-select: none;

      @include amb.transition;
      @include amb.focusable;

      &:hover {
        text-decoration: none;
        background: var(--amb-surface-hover);
      }
    }

    .amb-brand__mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: 2rem;
      height: 2rem;
      border-radius: var(--amb-radius-sm);
      // The one place a solid accent fill appears in the chrome. It is the
      // product mark, so it is allowed to be the loudest thing in the rail.
      background: linear-gradient(140deg, var(--amb-accent-500), var(--amb-accent));
      box-shadow: var(--amb-shadow-sm), inset 0 1px 0 rgb(255 255 255 / 0.25);
      color: var(--amb-accent-contrast);

      i {
        font-size: 1rem;
        line-height: 1;
      }
    }

    .amb-brand__name {
      @include amb.truncate;

      font-size: var(--amb-text-lg);
      font-weight: var(--amb-weight-semibold);
      letter-spacing: var(--amb-tracking-snug);
      color: var(--amb-text);
    }

    // -- Collapse toggle ---------------------------------------------------

    .amb-sidebar__toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: none;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      border: 1px solid transparent;
      border-radius: var(--amb-radius-sm);
      background: transparent;
      color: var(--amb-text-subtle);
      cursor: pointer;

      @include amb.transition;
      @include amb.focusable;

      &:hover {
        border-color: var(--amb-border);
        background: var(--amb-surface-hover);
        color: var(--amb-text);
      }

      i {
        font-size: var(--amb-text-sm);
        line-height: 1;

        @include amb.transition-prop(transform, var(--amb-duration-slow), var(--amb-ease-soft));
      }
    }

    // -- Navigation --------------------------------------------------------

    .amb-nav {
      min-width: 0;
    }

    .amb-nav__list {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .amb-nav__link {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--amb-space-3);
      padding: var(--amb-space-2) var(--amb-space-3);
      border: 1px solid transparent;
      border-radius: var(--amb-radius-md);
      font-size: var(--amb-text-base);
      font-weight: var(--amb-weight-medium);
      color: var(--amb-text-muted);

      @include amb.transition;
      @include amb.focusable(-2px);

      &:hover {
        background: var(--amb-surface-hover);
        color: var(--amb-text);
        text-decoration: none;
      }
    }

    .amb-nav__icon {
      flex: none;
      width: 1.125rem;
      font-size: var(--amb-text-md);
      line-height: 1;
      text-align: center;
      color: var(--amb-text-subtle);

      @include amb.transition-prop(color);
    }

    .amb-nav__label {
      @include amb.truncate;

      flex: 1 1 auto;
    }

    .amb-nav__badge {
      flex: none;
      min-width: 1.375rem;
      padding: 0 0.375rem;
      border-radius: var(--amb-radius-pill);
      background: var(--amb-surface-active);
      font-size: var(--amb-text-2xs);
      font-weight: var(--amb-weight-semibold);
      font-variant-numeric: tabular-nums;
      text-align: center;
      color: var(--amb-text-muted);
    }

    // The active destination: weight, a tinted pill and an accent edge, on top
    // of aria-current. Three cues, none of them only colour.
    .amb-nav__link--active {
      border-color: var(--amb-border-accent);
      background: var(--amb-accent-soft);
      font-weight: var(--amb-weight-semibold);
      color: var(--amb-accent-on-soft);

      .amb-nav__icon {
        color: var(--amb-accent-on-soft);
      }

      &:hover {
        background: var(--amb-accent-soft-hover);
        color: var(--amb-accent-on-soft);
      }
    }

    // -- Footer ------------------------------------------------------------

    // Pushed to the bottom of the rail, above a hairline. The account block
    // lives here on desktop and at the foot of the drawer on mobile.
    .amb-sidebar__footer:not(:empty) {
      margin-top: auto;
      padding-top: var(--amb-space-4);
      border-top: 1px solid var(--amb-border-subtle);
    }

    // -- Collapsed ---------------------------------------------------------
    //
    // Everything that is not an icon leaves the flow and fades; the shell
    // animates the column narrower around it.
    //
    // Nothing here is display:none. A faded, out-of-flow label is still in
    // the accessibility tree, so the navigation keeps its names for anyone who
    // is not looking at it. That is the whole reason this section is positions
    // and opacities rather than the two lines it could have been.
    //
    // Scoped to .amb-shell__sidebar and not to the host. The drawer renders
    // the same nav markup from the same template and is a sibling of the rail,
    // so a host-level rule would strip the labels out of the *drawer* too — on a
    // phone, where the rail is not even on screen and the collapsed state is
    // only there because it was set on a desktop and remembered.

    :host(.amb-sidebar--rail) .amb-shell__sidebar {
      .amb-sidebar__head {
        flex-direction: column;
        gap: var(--amb-space-1);
      }

      .amb-brand {
        flex: none;
        justify-content: center;
        padding-inline: 0;
      }

      // Out of the flow, so the icon stays centred in the rail rather than
      // being pushed off-centre by a zero-width label that still owns a gap.
      .amb-brand__name,
      .amb-nav__label,
      .amb-nav__badge {
        position: absolute;
        opacity: 0;
        pointer-events: none;
      }

      .amb-nav__link {
        justify-content: center;
        padding-inline: var(--amb-space-2);
      }

      .amb-sidebar__toggle i {
        transform: rotate(180deg);
      }
    }

    // The labels fade in both directions. Position is not animatable, so they
    // leave the flow at once and the opacity is what the eye follows; under the
    // rail's own width animation that reads as the text sliding away.
    .amb-brand__name,
    .amb-nav__label,
    .amb-nav__badge {
      @include amb.transition-prop(opacity, var(--amb-duration-base));
    }

    // No mobile rule for the head: the whole docked rail is display:none
    // below the nav breakpoint, which already takes the toggle out of the tab
    // order along with everything else in it.
  `
})
export class AmbientSidebarComponent {
  readonly brand = input.required<AmbientBrand>();

  readonly links = input.required<AmbientNavLink[]>();

  /**
   * Whether the mobile drawer is open. Two-way, because the topbar's menu button
   * opens it and a link inside it closes it.
   */
  readonly open = model(false);

  /**
   * Whether the docked rail is narrowed to icons.
   *
   * <p>Two-way rather than internal, because the shell owns the grid this rail
   * is a column of: it has to put {@code .amb-shell--rail} on that grid for the
   * width to animate, and it is the shell that decides whether the choice is
   * remembered across reloads.</p>
   */
  readonly collapsed = model(false);

  /** Names the landmark. Only matters if a second `<nav>` is ever added. */
  readonly navLabel = input('Main');

  /**
   * Ties the toggle to what it expands, through {@code aria-controls}. Fixed
   * rather than generated: there is one docked rail per application, and a
   * generated id would differ between a server render and the browser's.
   */
  protected readonly navId = 'amb-sidebar-nav';

  /**
   * Long enough that running the cursor down the rail does not fire four
   * tooltips, short enough to feel like an answer rather than a wait.
   */
  protected readonly tooltipDelay = 250;

  /** Says what the button will do, not what the state currently is. */
  protected readonly toggleLabel = computed(() =>
    this.collapsed() ? 'Expand navigation' : 'Collapse navigation'
  );
}
