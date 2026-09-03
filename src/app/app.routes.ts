import { Routes } from '@angular/router';

import { TaskListComponent } from './tasks/task-list.component';

export const routes: Routes = [
  { path: 'tasks', component: TaskListComponent, title: 'Tasks - TaskPulse' },
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  { path: '**', redirectTo: 'tasks' }
];
