import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';

/**
 * Application routes.
 *
 * <p>Every screen is lazy-loaded. The dashboard and the board each pull in a fair amount
 * of markup that a user who only ever opens the task list never needs, so splitting them
 * keeps the initial bundle to the shell plus one screen.</p>
 *
 * <p>Each screen carries two names. {@code title} is the browser tab's, so it ends in the
 * product name; {@code data.navKey} is a message key the shell's topbar resolves through
 * the catalogue, so the bar is renamed when the language changes rather than only when the
 * route does. Neither can do the other's job — "Tasks - TaskPulse" is wrong inside the
 * product, and a translated title would leave the tab reading differently per language for
 * no benefit to anyone scanning their tabs.</p>
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login.component').then((m) => m.LoginComponent),
    title: 'Sign in - TaskPulse'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
    title: 'Dashboard - TaskPulse',
    data: { navKey: 'nav.dashboard' }
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./tasks/task-list.component').then((m) => m.TaskListComponent),
    title: 'Tasks - TaskPulse',
    data: { navKey: 'nav.tasks' }
  },
  {
    path: 'board',
    canActivate: [authGuard],
    loadComponent: () => import('./board/task-board.component').then((m) => m.TaskBoardComponent),
    title: 'Board - TaskPulse',
    data: { navKey: 'nav.board' }
  },
  {
    path: 'tags',
    canActivate: [authGuard],
    loadComponent: () => import('./tags/tag-manager.component').then((m) => m.TagManagerComponent),
    title: 'Tags - TaskPulse',
    data: { navKey: 'nav.tags' }
  },
  {
    path: 'appearance',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./appearance/appearance.component').then((m) => m.AppearanceComponent),
    title: 'Appearance - TaskPulse',
    data: { navKey: 'nav.appearance' }
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
