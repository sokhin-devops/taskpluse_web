import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { Table, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import { Task } from '../core/task.model';
import { TaskService } from '../core/task.service';
import { TaskFormComponent } from './task-form.component';

/** Severities accepted by p-tag, narrowed to the ones this screen uses. */
type TagSeverity = 'success' | 'warn' | 'danger' | 'secondary';

const MILLIS_PER_DAY = 86400000;

@Component({
  selector: 'app-task-list',
  imports: [
    DatePipe,
    NgTemplateOutlet,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SkeletonModule,
    TableModule,
    TagModule,
    ToastModule,
    TooltipModule,
    TaskFormComponent
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss'
})
export class TaskListComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);

  @ViewChild('dt') private table?: Table;

  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  /** Ids of rows with an in-flight mutation; their action buttons are disabled. */
  private readonly busyIds = signal<ReadonlySet<number>>(new Set<number>());

  /** Placeholder rows that shape the skeleton table while the list loads. */
  readonly skeletonRows: number[] = [0, 1, 2, 3, 4];
  readonly globalFilterFields: string[] = ['title', 'description'];

  formVisible = false;
  selectedTask: Task | null = null;

  readonly summary = computed(() => {
    if (this.loading()) {
      return 'Loading your tasks...';
    }
    const total = this.tasks().length;
    if (total === 0) {
      return 'Nothing on the list right now.';
    }
    const open = this.tasks().filter((task) => !task.completed).length;
    if (open === 0) {
      return total === 1 ? 'The only task is done.' : 'All ' + total + ' tasks are done.';
    }
    return open + ' of ' + total + ' still open.';
  });

  ngOnInit(): void {
    this.reload();
  }

  /**
   * Fetches the list. `showSkeleton` is false for post-mutation refreshes so the
   * table does not flash back to placeholders.
   */
  reload(showSkeleton = true): void {
    if (showSkeleton) {
      this.loading.set(true);
    }
    this.loadFailed.set(false);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(this.tasks().length === 0);
        this.messageService.add({
          severity: 'error',
          summary: 'Could not load tasks',
          detail: 'The TaskPulse API did not respond. Please try again.',
          life: 5000
        });
      }
    });
  }

  openCreate(): void {
    this.selectedTask = null;
    this.formVisible = true;
  }

  openEdit(task: Task): void {
    this.selectedTask = task;
    this.formVisible = true;
  }

  onSaved(): void {
    this.reload(false);
  }

  onToggleComplete(task: Task): void {
    this.setBusy(task.id, true);
    this.taskService.toggleComplete(task.id).subscribe({
      next: (updated) => {
        this.setBusy(task.id, false);
        this.tasks.update((list) => list.map((item) => (item.id === updated.id ? updated : item)));
        this.messageService.add({
          severity: 'success',
          summary: updated.completed ? 'Task completed' : 'Task reopened',
          detail: updated.title,
          life: 3000
        });
      },
      error: () => {
        this.setBusy(task.id, false);
        this.messageService.add({
          severity: 'error',
          summary: 'Update failed',
          detail: '"' + task.title + '" could not be updated.',
          life: 5000
        });
      }
    });
  }

  onDelete(task: Task): void {
    this.confirmationService.confirm({
      header: 'Delete task',
      message: 'Delete "' + task.title + '"? This cannot be undone.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.deleteTask(task)
    });
  }

  applyGlobalFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.table?.filterGlobal(value, 'contains');
  }

  isBusy(id: number): boolean {
    return this.busyIds().has(id);
  }

  /** Parses a 'yyyy-MM-dd' payload into a LOCAL date so the day never shifts. */
  asDate(value: string | null): Date | null {
    if (!value) {
      return null;
    }
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /** Danger when overdue, warn when due today, null when the plain date should show. */
  dueSeverity(task: Task): TagSeverity | null {
    if (!task.dueDate || task.completed) {
      return null;
    }
    const days = this.daysUntilDue(task.dueDate);
    if (days < 0) {
      return 'danger';
    }
    return days === 0 ? 'warn' : null;
  }

  dueLabel(task: Task): string {
    return this.dueSeverity(task) === 'danger' ? 'Overdue' : 'Due today';
  }

  dueIcon(task: Task): string {
    return this.dueSeverity(task) === 'danger' ? 'pi pi-exclamation-triangle' : 'pi pi-clock';
  }

  statusSeverity(task: Task): TagSeverity {
    return task.completed ? 'success' : 'secondary';
  }

  statusLabel(task: Task): string {
    return task.completed ? 'Completed' : 'Pending';
  }

  statusIcon(task: Task): string {
    return task.completed ? 'pi pi-check' : 'pi pi-hourglass';
  }

  toggleTooltip(task: Task): string {
    return task.completed ? 'Mark as pending' : 'Mark as completed';
  }

  toggleSeverity(task: Task): TagSeverity {
    return task.completed ? 'secondary' : 'success';
  }

  private deleteTask(task: Task): void {
    this.setBusy(task.id, true);
    this.taskService.remove(task.id).subscribe({
      next: () => {
        this.setBusy(task.id, false);
        this.tasks.update((list) => list.filter((item) => item.id !== task.id));
        this.messageService.add({
          severity: 'success',
          summary: 'Task deleted',
          detail: task.title,
          life: 3000
        });
      },
      error: () => {
        this.setBusy(task.id, false);
        this.messageService.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: '"' + task.title + '" could not be deleted.',
          life: 5000
        });
      }
    });
  }

  private daysUntilDue(dueDate: string): number {
    const due = this.asDate(dueDate);
    if (!due) {
      return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((due.getTime() - today.getTime()) / MILLIS_PER_DAY);
  }

  private setBusy(id: number, busy: boolean): void {
    this.busyIds.update((current) => {
      const next = new Set(current);
      if (busy) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
