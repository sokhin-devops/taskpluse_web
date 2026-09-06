import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';

import {
  AmbientBadgeComponent,
  AmbientCardComponent,
  AmbientEmptyStateComponent,
  AmbientPageComponent,
  AmbientPageHeaderComponent
} from '../ambient/ambient';
import { toErrorMessage } from '../core/api-error';
import { Tag, readableTextOn } from '../core/tag.model';
import { TagService } from '../core/tag.service';
import {
  BoardColumn,
  TASK_STATUSES,
  Task,
  TaskStatus,
  priorityIcon,
  priorityKey,
  prioritySeverity,
  statusKey,
  toDate
} from '../core/task.model';
import { TaskService } from '../core/task.service';
import { LocaleService } from '../i18n/locale.service';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TaskFormComponent } from '../tasks/task-form.component';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/**
 * Kanban board: one column per workflow status, with cards dragged between them.
 *
 * <h2>Optimistic moves</h2>
 * A drop rearranges the local columns immediately and then tells the server. Waiting for
 * the round trip would make the card snap back to where it started and jump forward a
 * moment later, which reads as a bug. If the request fails the previous arrangement is
 * restored and a toast explains why, so the optimism is never silently wrong.
 */
@Component({
  selector: 'app-task-board',
  imports: [
    CdkDropList,
    CdkDrag,
    CdkDragPlaceholder,
    DatePipe,
    ButtonModule,
    ConfirmDialogModule,
    SkeletonModule,
    ToastModule,
    TooltipModule,
    TaskFormComponent,
    AmbientBadgeComponent,
    AmbientCardComponent,
    AmbientEmptyStateComponent,
    AmbientPageComponent,
    AmbientPageHeaderComponent,
    TranslatePipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './task-board.component.html',
  styleUrl: './task-board.component.scss'
})
export class TaskBoardComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly tagService = inject(TagService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(LocaleService);

  /** Handed to the `date` pipe on each card's due-date chip. */
  protected readonly dateLocale = this.i18n.dateLocale;

  readonly columns = signal<BoardColumn[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  /** Ids of every drop list, so each column accepts cards from all the others. */
  readonly columnIds = TASK_STATUSES.map((status) => `board-${status}`);

  readonly skeletonCards: number[] = [0, 1, 2];

  readonly skeletonColumns = computed(() =>
    TASK_STATUSES.map((status) => ({
      status,
      label: this.i18n.t(statusKey(status))
    }))
  );

  readonly totalTasks = computed(() =>
    this.columns().reduce((sum, column) => sum + column.tasks.length, 0)
  );

  readonly isEmpty = computed(() => !this.loading() && this.totalTasks() === 0);

  readonly summary = computed(() => {
    if (this.loading()) {
      return this.i18n.t('board.summary.loading');
    }
    const total = this.totalTasks();
    if (total === 0) {
      return this.i18n.t('board.summary.none');
    }
    const done = this.columns().find((column) => column.status === 'DONE')?.tasks.length ?? 0;
    return this.i18n.t('board.summary', { open: total - done, done });
  });

  // --- dialog state ------------------------------------------------------

  formVisible = false;
  selectedTask: Task | null = null;

  /** Column a card created from a column header should land in. */
  createInStatus: TaskStatus = 'TODO';

  ngOnInit(): void {
    this.tagService.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => undefined
    });
    this.reload();
  }

  reload(showSkeleton = true): void {
    if (showSkeleton) {
      this.loading.set(true);
    }
    this.loadFailed.set(false);

    this.taskService
      .board()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (board) => {
          this.columns.set(board.columns);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadFailed.set(true);
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.t('board.error.toast'),
            detail: toErrorMessage(error, this.i18n, 'common.error.apiDownRetry'),
            life: 5000
          });
        }
      });
  }

  columnId(status: TaskStatus): string {
    return `board-${status}`;
  }

  /**
   * Applies a drop: reorders locally, then persists.
   *
   * @param event    the CDK drop, carrying source and target lists and indices
   * @param toStatus the column the card was dropped into
   */
  onDrop(event: CdkDragDrop<Task[]>, toStatus: TaskStatus): void {
    const sameColumn = event.previousContainer === event.container;
    if (sameColumn && event.previousIndex === event.currentIndex) {
      return;
    }

    const task = event.item.data as Task;
    // Snapshot before mutating: this is what a failed request rolls back to.
    const snapshot = this.columns();

    const next = snapshot.map((column) => ({ ...column, tasks: [...column.tasks] }));
    const target = next.find((column) => column.status === toStatus);
    if (!target) {
      return;
    }

    if (sameColumn) {
      moveItemInArray(target.tasks, event.previousIndex, event.currentIndex);
    } else {
      const source = next.find((column) => column.tasks.some((item) => item.id === task.id));
      if (!source) {
        return;
      }
      const fromIndex = source.tasks.findIndex((item) => item.id === task.id);
      transferArrayItem(source.tasks, target.tasks, fromIndex, event.currentIndex);
      source.total = source.tasks.length;
    }
    target.total = target.tasks.length;
    this.columns.set(this.withCountsRefreshed(next));

    this.taskService
      .move(task.id, { status: toStatus, position: event.currentIndex })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (moved) => {
          // Replace the card with the server's version: dropping into Done sets the
          // completion flag and timestamp, which the local copy does not know about.
          this.replaceCard(moved);
        },
        error: (error: unknown) => {
          this.columns.set(snapshot);
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.t('board.error.move'),
            detail: toErrorMessage(error, this.i18n, 'board.error.moveDetail', {
              title: task.title
            }),
            life: 5000
          });
        }
      });
  }

  openCreate(status: TaskStatus = 'TODO'): void {
    this.createInStatus = status;
    this.selectedTask = null;
    this.formVisible = true;
  }

  openEdit(task: Task): void {
    this.selectedTask = task;
    this.formVisible = true;
  }

  /** A saved task may have changed column, so the whole board is refetched. */
  onSaved(): void {
    this.reload(false);
  }

  onDelete(task: Task): void {
    this.confirmationService.confirm({
      header: this.i18n.t('tasks.confirm.header'),
      message: this.i18n.t('tasks.confirm.message', { title: task.title }),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.i18n.t('common.delete'),
      rejectLabel: this.i18n.t('common.cancel'),
      accept: () => this.deleteTask(task)
    });
  }

  // --- presentation ------------------------------------------------------

  /** The API's own column `label` is English-only; the status enum drives this. */
  columnLabel(status: TaskStatus): string {
    return this.i18n.t(statusKey(status));
  }

  priorityLabel(task: Task): string {
    return this.i18n.t(priorityKey(task.priority));
  }

  columnIcon(status: TaskStatus): string {
    switch (status) {
      case 'DONE':
        return 'pi pi-check-circle';
      case 'IN_PROGRESS':
        return 'pi pi-sync';
      default:
        return 'pi pi-inbox';
    }
  }

  prioritySeverityOf(task: Task): TagSeverity {
    return prioritySeverity(task.priority);
  }

  priorityIconOf(task: Task): string {
    return priorityIcon(task.priority);
  }

  tagTextColor(tag: Tag): string {
    return readableTextOn(tag.color);
  }

  asDate(value: string | null): Date | null {
    return toDate(value);
  }

  /** Danger when overdue, warn when due today, otherwise no emphasis. */
  dueClass(task: Task): string {
    if (task.completed || !task.dueDate) {
      return '';
    }
    if (task.overdue) {
      return 'board-card__due--overdue';
    }
    return this.isDueToday(task) ? 'board-card__due--today' : '';
  }

  dueTooltip(task: Task): string {
    if (task.overdue) {
      return this.i18n.t('tasks.due.overdue');
    }
    return this.i18n.t(this.isDueToday(task) ? 'tasks.due.today' : 'board.due');
  }

  // --- internals ---------------------------------------------------------

  private isDueToday(task: Task): boolean {
    const due = toDate(task.dueDate);
    if (!due) {
      return false;
    }
    const today = new Date();
    return (
      due.getFullYear() === today.getFullYear() &&
      due.getMonth() === today.getMonth() &&
      due.getDate() === today.getDate()
    );
  }

  private replaceCard(updated: Task): void {
    this.columns.update((columns) =>
      columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) => (task.id === updated.id ? updated : task))
      }))
    );
  }

  private withCountsRefreshed(columns: BoardColumn[]): BoardColumn[] {
    return columns.map((column) => ({ ...column, total: column.tasks.length }));
  }

  private deleteTask(task: Task): void {
    const snapshot = this.columns();
    // Removed straight away: leaving a card in place while the request runs invites a
    // second click on a task that is already gone.
    this.columns.set(
      this.withCountsRefreshed(
        snapshot.map((column) => ({
          ...column,
          tasks: column.tasks.filter((item) => item.id !== task.id)
        }))
      )
    );

    this.taskService
      .remove(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: this.i18n.t('tasks.toast.deleted'),
            detail: task.title,
            life: 3000
          });
        },
        error: (error: unknown) => {
          this.columns.set(snapshot);
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.t('tasks.toast.deleteFailed'),
            detail: toErrorMessage(error, this.i18n, 'tasks.toast.deleteFailedDetail', {
              title: task.title
            }),
            life: 5000
          });
        }
      });
  }
}
