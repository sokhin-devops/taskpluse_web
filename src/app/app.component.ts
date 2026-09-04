import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';

import { initialsOf } from './core/auth/auth.model';
import { AuthService } from './core/auth/auth.service';
import { TagService } from './core/tag.service';

/** One entry in the main navigation. */
interface NavLink {
  label: string;
  icon: string;
  path: string;
}

/**
 * Application shell: a top bar with the wordmark, the main navigation and the account
 * menu, above whichever screen the router has matched.
 *
 * <p>The bar hides itself while signed out. The login screen is the only route reachable
 * then, and showing navigation to places that would immediately bounce back would be
 * worse than showing none.</p>
 */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, MenuModule, TooltipModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly auth = inject(AuthService);
  private readonly tagService = inject(TagService);

  readonly appName = 'TaskPulse';

  readonly user = this.auth.user;
  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly initials = computed(() => initialsOf(this.user()));

  readonly navLinks: NavLink[] = [
    { label: 'Dashboard', icon: 'pi pi-chart-bar', path: '/dashboard' },
    { label: 'Tasks', icon: 'pi pi-list', path: '/tasks' },
    { label: 'Board', icon: 'pi pi-th-large', path: '/board' },
    { label: 'Tags', icon: 'pi pi-tags', path: '/tags' }
  ];

  /** Account menu. Recomputed so the header always shows the current account. */
  readonly accountMenu = computed<MenuItem[]>(() => {
    const current = this.user();
    return [
      {
        label: current ? current.displayName : 'Account',
        items: [
          {
            label: current ? current.email : '',
            disabled: true,
            styleClass: 'tp-account__email'
          },
          { separator: true },
          {
            label: 'Sign out',
            icon: 'pi pi-sign-out',
            command: () => this.signOut()
          }
        ]
      }
    ];
  });

  private signOut(): void {
    // Clear the cached tags before leaving: they belong to the account signing out.
    this.tagService.clear();
    this.auth.logout();
  }
}
