import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

import {
  AmbientAvatarComponent,
  AmbientBackgroundComponent,
  AmbientBrand,
  AmbientButtonDirective,
  AmbientMenuComponent,
  AmbientNavLink,
  AmbientSidebarComponent,
  AmbientThemeSwitcherComponent,
  AMBIENT_PREFERENCE_KEYS,
  readPreference,
  writePreference
} from './ambient/ambient';
import { initialsOf } from './core/auth/auth.model';
import { AuthService } from './core/auth/auth.service';
import { TagService } from './core/tag.service';
import { AmbientLanguageSwitcherComponent } from './i18n/language-switcher.component';
import { LocaleService } from './i18n/locale.service';
import { TranslatePipe } from './i18n/translate.pipe';

/**
 * Application shell.
 *
 * <h2>Layout</h2>
 *
 * <p>Above 900px: a docked navigation rail beside one scrolling content column,
 * with the account block at the foot of the rail. Below it: the rail becomes a
 * drawer and a topbar appears carrying the menu button, the wordmark and the
 * account. The two sets of chrome never coexist — the topbar is
 * {@code display: none} above the breakpoint and the rail is hidden below it —
 * so the account control appearing in both is not a duplicate in the
 * accessibility tree.</p>
 *
 * <p>All of that lives in {@code _ambient-layout.scss} and
 * {@code <amb-sidebar>}. What is left in this component is the shell's
 * behaviour: who is signed in, what the navigation points at, and resetting the
 * scroll position between screens.</p>
 *
 * <p>The chrome hides itself while signed out. The login screen is the only
 * route reachable then, and showing navigation to places that would immediately
 * bounce back would be worse than showing none. The router outlet stays mounted
 * across that change rather than living inside the {@code @if}, so signing in
 * does not tear down and rebuild the scroll container.</p>
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    ButtonModule,
    TooltipModule,
    AmbientAvatarComponent,
    AmbientBackgroundComponent,
    AmbientButtonDirective,
    AmbientMenuComponent,
    AmbientSidebarComponent,
    AmbientThemeSwitcherComponent,
    AmbientLanguageSwitcherComponent,
    TranslatePipe
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly tagService = inject(TagService);
  private readonly router = inject(Router);
  private readonly i18n = inject(LocaleService);

  /** The scrolling content area. Optional because the first navigation can finish
      before the view has been created. */
  private readonly scrollArea = viewChild<ElementRef<HTMLElement>>('scrollArea');

  /**
   * The product mark.
   *
   * <p>The name is not translated — it is a name, and a product that calls
   * itself something else in Khmer is two products. Its accessible label is,
   * because "TaskPulse home" is a sentence about the name rather than the name
   * itself, and sentences have word order.</p>
   */
  readonly brand = computed<AmbientBrand>(() => ({
    name: 'TaskPulse',
    icon: 'pi pi-check-circle',
    link: '/dashboard',
    homeLabel: this.i18n.t('nav.home', { name: 'TaskPulse' })
  }));

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly initials = computed(() => initialsOf(this.user()));

  readonly navLinks = computed<AmbientNavLink[]>(() => [
    { label: this.i18n.t('nav.dashboard'), icon: 'pi pi-chart-bar', path: '/dashboard' },
    { label: this.i18n.t('nav.tasks'), icon: 'pi pi-list', path: '/tasks' },
    { label: this.i18n.t('nav.board'), icon: 'pi pi-th-large', path: '/board' },
    { label: this.i18n.t('nav.tags'), icon: 'pi pi-tags', path: '/tags' }
  ]);

  /** Whether the mobile navigation drawer is open. Closed on every navigation. */
  readonly navOpen = signal(false);

  /**
   * Whether the docked rail is collapsed to icons.
   *
   * <p>It lives here rather than inside {@code <amb-sidebar>} because the shell
   * owns the grid the rail is a column of: {@code .amb-shell--rail} on that grid
   * is what actually animates the width, and the sidebar only restyles its own
   * contents to match.</p>
   *
   * <p>Restored synchronously so the first paint is already the right width — a
   * rail that expands a beat after load looks like a bug, not an animation.</p>
   */
  readonly navCollapsed = signal(
    readPreference(AMBIENT_PREFERENCE_KEYS.navCollapsed) === 'true'
  );

  /** Names both account triggers, neither of which has a visible label. */
  readonly accountMenuLabel = computed(() =>
    this.i18n.t('account.menu', {
      name: this.user()?.displayName ?? this.i18n.t('account.yours')
    })
  );

  /** Account menu. Recomputed so the header always shows the current account. */
  readonly accountMenu = computed<MenuItem[]>(() => {
    const current = this.user();
    return [
      {
        label: current ? current.displayName : this.i18n.t('account.label'),
        items: [
          {
            label: current ? current.email : '',
            disabled: true,
            styleClass: 'app-account__email-item'
          },
          { separator: true },
          {
            label: this.i18n.t('account.signOut'),
            icon: 'pi pi-sign-out',
            command: () => this.signOut()
          }
        ]
      }
    ];
  });

  constructor() {
    this.resetScrollOnNavigation();
  }

  /** Collapses or expands the rail, and remembers which. */
  setNavCollapsed(collapsed: boolean): void {
    this.navCollapsed.set(collapsed);
    writePreference(AMBIENT_PREFERENCE_KEYS.navCollapsed, String(collapsed));
  }

  /**
   * Sends the content area back to the top when the route changes, and closes
   * the mobile drawer.
   *
   * <p>Angular's own {@code withInMemoryScrolling} cannot do the first part. It
   * drives {@code ViewportScroller}, which scrolls the window — and the window
   * no longer scrolls, so it silently does nothing and each screen opens at the
   * offset the last one was left at. Scrolling the container directly is the
   * equivalent.</p>
   */
  private resetScrollOnNavigation(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.scrollArea()?.nativeElement.scrollTo({ top: 0 });
        this.navOpen.set(false);
      });
  }

  private signOut(): void {
    // Clear the cached tags before leaving: they belong to the account signing out.
    this.tagService.clear();
    this.auth.logout();
  }
}
