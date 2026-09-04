import { Routes } from '@angular/router';

import { authGuard, guestGuard } from './core/auth/auth.guard';

/**
 * Application routes.
 *
 * <p>Every screen is lazy-loaded. The dashboard and the board each pull in a fair amount
 * of markup that a user who only ever opens the task list never needs, so splitting them
 * keeps the initial bundle to the shell plus one screen.</p>
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
    title: 'Dashboard - TaskPulse'
  },
  {
    path: 'tasks',
    canActivate: [authGuard],
    loadComponent: () => import('./tasks/task-list.component').then((m) => m.TaskListComponent),
    title: 'Tasks - TaskPulse'
  },
  {
    path: 'board',
    canActivate: [authGuard],
    loadComponent: () => import('./board/task-board.component').then((m) => m.TaskBoardComponent),
    title: 'Board - TaskPulse'
  },
  {
    path: 'tags',
    canActivate: [authGuard],
    loadComponent: () => import('./tags/tag-manager.component').then((m) => m.TagManagerComponent),
    title: 'Tags - TaskPulse'
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
