import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';

import {
  AmbientAvatarComponent,
  AmbientBackgroundComponent,
  AmbientBrand,
  AmbientButtonDirective,
  AmbientMenuComponent,
  AmbientNavLink,
  AmbientSidebarComponent,
  AmbientThemeService,
  AmbientThemeSwitcherComponent,
  AmbientTopbarComponent,
  AMBIENT_PREFERENCE_KEYS,
  readPreference,
  writePreference
} from './ambient/ambient';
import { initialsOf } from './core/auth/auth.model';
import { AuthService } from './core/auth/auth.service';
import { TagService } from './core/tag.service';
import { AmbientLanguageSwitcherComponent } from './i18n/language-switcher.component';
import { LocaleService } from './i18n/locale.service';
import type { MessageKey } from './i18n/messages.en';
import { TranslatePipe } from './i18n/translate.pipe';

/**
 * Application shell.
 *
 * <h2>Layout</h2>
 *
 * <p>A topbar across the top at every width, and below it a docked navigation
 * rail beside one scrolling content column. The bar carries where you are, the
 * search, the language and the account; the rail carries the mark, the
 * destinations, and the control that collapses it.</p>
 *
 * <p>Each of those appears exactly once. The account used to sit at the foot of
 * the rail with an avatar-only copy in the bar for the widths where the rail is
 * a drawer, and the appearance control used to be in both places too — two
 * triggers for one menu are two entries in the accessibility tree for one
 * thing. The only control that is still duplicated in spirit is the drawer
 * button, and it is {@code display: none} above the nav breakpoint, where the
 * rail it opens is already on screen.</p>
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
    // Registers the scroll container with the CDK, so a card dragged on the
    // board can scroll the page under itself. See the template.
    CdkScrollable,
    ButtonModule,
    AmbientAvatarComponent,
    AmbientBackgroundComponent,
    AmbientButtonDirective,
    AmbientMenuComponent,
    AmbientSidebarComponent,
    AmbientThemeSwitcherComponent,
    AmbientTopbarComponent,
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

  /**
   * Injected for its constructor, and deliberately never read.
   *
   * <p>{@link AmbientThemeService} is {@code providedIn: 'root'}, so it is only
   * constructed when something asks for it — and the effects that keep
   * {@code <html>} in step with the stored theme, plus the media-query watcher
   * that makes "System" follow the OS at sunset, all live in that constructor.
   * The shell used to get this for free because the topbar rendered
   * {@code <amb-theme-switcher>}; with the appearance control moved to its own
   * screen, nothing on a signed-in route injects it any more.</p>
   *
   * <p>Without this, the bootstrap script in {@code index.html} would still
   * apply the stored theme at first paint, so the fault would be invisible
   * until someone's machine flipped to dark while the tab was open and the app
   * stayed light — the kind of bug nobody reproduces on purpose.</p>
   */
  private readonly theme = inject(AmbientThemeService);

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
    { label: this.i18n.t('nav.tags'), icon: 'pi pi-tags', path: '/tags' },
    // Appearance is navigation rather than a hidden preference: it is where the
    // five styles, the colour scheme and the accent live, and none of that is
    // discoverable behind an icon alone. The topbar keeps its shortcut.
    { label: this.i18n.t('nav.appearance'), icon: 'pi pi-palette', path: '/appearance' }
  ]);

  /**
   * Which section the topbar is naming.
   *
   * <p>The message key rather than the translated word, so switching language
   * renames the bar without a navigation. The route supplies the key through
   * its {@code data}; the route's own {@code title} cannot be reused for this,
   * because that is the browser tab's text and carries the product name with
   * it — "Tasks - TaskPulse" is wrong inside the product.</p>
   */
  private readonly sectionKey = signal<MessageKey>('nav.dashboard');

  readonly pageTitle = computed(() => this.i18n.t(this.sectionKey()));

  /**
   * The line under the section name.
   *
   * <p>Only a first name: the bar is 60px tall and "Welcome back, Sokha
   * Chan" wraps or truncates on a laptop where "Welcome back, Sokha" does
   * not. Falls back to the whole display name when there is nothing to split
   * on, which is most of the world.</p>
   */
  readonly greeting = computed(() => {
    const name = this.user()?.displayName?.trim();
    if (!name) {
      return '';
    }
    return this.i18n.t('shell.greeting', { name: name.split(/\s+/)[0] });
  });

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
    this.followNavigation();
  }

  /** Collapses or expands the rail, and remembers which. */
  setNavCollapsed(collapsed: boolean): void {
    this.navCollapsed.set(collapsed);
    writePreference(AMBIENT_PREFERENCE_KEYS.navCollapsed, String(collapsed));
  }


  /**
   * The three things the shell does on every navigation: rename the topbar,
   * send the content area back to the top, and close the mobile drawer.
   *
   * <p>Angular's own {@code withInMemoryScrolling} cannot do the scrolling
   * part. It drives {@code ViewportScroller}, which scrolls the window — and
   * the window no longer scrolls, so it silently does nothing and each screen
   * opens at the offset the last one was left at. Scrolling the container
   * directly is the equivalent.</p>
   */
  private followNavigation(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.sectionKey.set(this.activeSectionKey());
        this.scrollArea()?.nativeElement.scrollTo({ top: 0 });
        this.navOpen.set(false);
      });
  }

  /**
   * The `navKey` of the route that actually rendered, found by walking to the
   * deepest activated child.
   *
   * <p>Deepest rather than first, because a screen nested under a layout route
   * would otherwise be named after its parent. There is no such route today and
   * the walk costs nothing; the alternative is a bug waiting for the first one.</p>
   */
  private activeSectionKey(): MessageKey {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return (route.data['navKey'] as MessageKey | undefined) ?? 'nav.dashboard';
  }

  private signOut(): void {
    // Clear the cached tags before leaving: they belong to the account signing out.
    this.tagService.clear();
    this.auth.logout();
  }
}
