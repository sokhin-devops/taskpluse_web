import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import { toErrorMessage } from '../core/api-error';
import { Tag, readableTextOn } from '../core/tag.model';
import { TagService } from '../core/tag.service';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  Task,
  TaskPriority,
  TaskQuery,
  TaskSortField,
  TaskStatus,
  priorityIcon,
  prioritySeverity,
  statusIcon,
  statusSeverity,
  toDate
} from '../core/task.model';
import { TaskService } from '../core/task.service';
import { TaskFormComponent } from './task-form.component';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** The quick-filter segmented control above the table. */
type Scope = 'all' | 'open' | 'overdue' | 'done';

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done'
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  URGENT: 'Urgent',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

/** How long to wait after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 300;

const DEFAULT_PAGE_SIZE = 10;

/**
 * The task list: a filterable, sortable, paged table.
 *
 * <p>All three of those happen on the server. The original screen fetched every task and
 * filtered in the browser, which is fine for a demo and wrong as soon as an account has a
 * few hundred tasks — the payload grows without bound and the paginator reports a total
 * that only describes what was already downloaded.</p>
 */
@Component({
  selector: 'app-task-list',
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MultiSelectModule,
    SelectButtonModule,
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
  private readonly tagService = inject(TagService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tasks = signal<Task[]>([]);
  readonly totalRecords = signal(0);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  /** Ids of rows with an in-flight mutation; their action buttons are disabled. */
  private readonly busyIds = signal<ReadonlySet<number>>(new Set<number>());

  /** Placeholder rows that shape the skeleton table while the first page loads. */
  readonly skeletonRows: number[] = [0, 1, 2, 3, 4];

  readonly tags = this.tagService.tags;

  // --- filter state ------------------------------------------------------

  readonly search = signal('');
  readonly scope = signal<Scope>('all');
  readonly selectedStatuses = signal<TaskStatus[]>([]);
  readonly selectedPriorities = signal<TaskPriority[]>([]);
  readonly selectedTagIds = signal<number[]>([]);

  /** Paginator position, kept here so changing a filter can reset it to page 1. */
  readonly first = signal(0);
  readonly rows = signal(DEFAULT_PAGE_SIZE);

  private sortField: TaskSortField = 'dueDate';
  private sortDirection: 'asc' | 'desc' = 'asc';

  private readonly searchInput = new Subject<string>();

  readonly scopeOptions = [
    { label: 'All', value: 'all' as Scope },
    { label: 'Open', value: 'open' as Scope },
    { label: 'Overdue', value: 'overdue' as Scope },
    { label: 'Done', value: 'done' as Scope }
  ];

  readonly statusOptions = TASK_STATUSES.map((status) => ({
    label: STATUS_LABELS[status],
    value: status
  }));

  readonly priorityOptions = TASK_PRIORITIES.map((priority) => ({
    label: PRIORITY_LABELS[priority],
    value: priority
  }));

  /** How many filters are narrowing the list, shown on the Clear button. */
  readonly activeFilterCount = computed(() => {
    let count = 0;
    if (this.search().trim().length > 0) {
      count++;
    }
    if (this.scope() !== 'all') {
      count++;
    }
    count += this.selectedStatuses().length > 0 ? 1 : 0;
    count += this.selectedPriorities().length > 0 ? 1 : 0;
    count += this.selectedTagIds().length > 0 ? 1 : 0;
    return count;
  });

  readonly hasFilters = computed(() => this.activeFilterCount() > 0);

  readonly summary = computed(() => {
    if (this.loading()) {
      return 'Loading your tasks...';
    }
    const total = this.totalRecords();
    if (total === 0) {
      return this.hasFilters() ? 'No tasks match these filters.' : 'Nothing on the list right now.';
    }
    const noun = total === 1 ? 'task' : 'tasks';
    return this.hasFilters() ? `${total} matching ${noun}.` : `${total} ${noun} in total.`;
  });

  // --- dialog state ------------------------------------------------------

  formVisible = false;
  selectedTask: Task | null = null;

  ngOnInit(): void {
    // The tag list feeds the filter picker and the form's picker.
    this.tagService.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => undefined
    });

    this.searchInput
      .pipe(debounceTime(SEARCH_DEBOUNCE_MS), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.search.set(value);
        this.resetToFirstPage();
        this.reload();
      });
  }

  /**
   * Driven by the table's own paginator and sort headers.
   *
   * <p>Also fires once on first render, which is what performs the initial load — so
   * there is no fetch in {@code ngOnInit} that would race with it and paint twice.</p>
   */
  onLazyLoad(event: TableLazyLoadEvent): void {
    this.first.set(event.first ?? 0);
    this.rows.set(event.rows ?? DEFAULT_PAGE_SIZE);

    const field = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
    if (field) {
      this.sortField = field as TaskSortField;
      this.sortDirection = event.sortOrder === -1 ? 'desc' : 'asc';
    }
    this.reload();
  }

  reload(showSkeleton = true): void {
    if (showSkeleton) {
      this.loading.set(true);
    }
    this.loadFailed.set(false);

    this.taskService
      .list(this.buildQuery())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.tasks.set(page.content);
          this.totalRecords.set(page.totalElements);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadFailed.set(true);
          this.messageService.add({
            severity: 'error',
            summary: 'Could not load tasks',
            detail: toErrorMessage(error, 'The TaskPulse API did not respond. Please try again.'),
            life: 5000
          });
        }
      });
  }

  // --- filter handlers ---------------------------------------------------

  onSearchInput(event: Event): void {
    this.searchInput.next((event.target as HTMLInputElement).value);
  }

  onScopeChange(scope: Scope): void {
    this.scope.set(scope ?? 'all');
    this.applyFilterChange();
  }

  onStatusChange(statuses: TaskStatus[]): void {
    this.selectedStatuses.set(statuses ?? []);
    this.applyFilterChange();
  }

  onPriorityChange(priorities: TaskPriority[]): void {
    this.selectedPriorities.set(priorities ?? []);
    this.applyFilterChange();
  }

  onTagChange(tagIds: number[]): void {
    this.selectedTagIds.set(tagIds ?? []);
    this.applyFilterChange();
  }

  clearFilters(): void {
    this.search.set('');
    this.searchInput.next('');
    this.scope.set('all');
    this.selectedStatuses.set([]);
    this.selectedPriorities.set([]);
    this.selectedTagIds.set([]);
    this.applyFilterChange();
  }

  // --- row actions -------------------------------------------------------

  openCreate(): void {
    this.selectedTask = null;
    this.formVisible = true;
  }

  openEdit(task: Task): void {
    this.selectedTask = task;
    this.formVisible = true;
  }

  /**
   * After a save, reload rather than patching the row in place: the task may no longer
   * match the active filters or belong on this page of the sort order.
   */
  onSaved(): void {
    this.reload(false);
  }

  onToggleComplete(task: Task): void {
    this.setBusy(task.id, true);
    this.taskService
      .toggleComplete(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.setBusy(task.id, false);
          this.messageService.add({
            severity: 'success',
            summary: updated.completed ? 'Task completed' : 'Task reopened',
            detail: updated.title,
            life: 3000
          });
          // Completing a task can move it out of the current filter or page, so the
          // page is refetched instead of the single row being swapped in.
          this.reload(false);
        },
        error: (error: unknown) => {
          this.setBusy(task.id, false);
          this.messageService.add({
            severity: 'error',
            summary: 'Update failed',
            detail: toErrorMessage(error, `"${task.title}" could not be updated.`),
            life: 5000
          });
        }
      });
  }

  onDelete(task: Task): void {
    this.confirmationService.confirm({
      header: 'Delete task',
      message: `Delete "${task.title}"? This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.deleteTask(task)
    });
  }

  isBusy(id: number): boolean {
    return this.busyIds().has(id);
  }

  // --- presentation ------------------------------------------------------

  /** Parses a 'yyyy-MM-dd' payload into a LOCAL date so the day never shifts. */
  asDate(value: string | null): Date | null {
    return toDate(value);
  }

  /** Danger when overdue, warn when due today, null when the plain date should show. */
  dueSeverity(task: Task): TagSeverity | null {
    if (!task.dueDate || task.completed) {
      return null;
    }
    if (task.overdue) {
      return 'danger';
    }
    return this.isDueToday(task) ? 'warn' : null;
  }

  dueLabel(task: Task): string {
    return task.overdue ? 'Overdue' : 'Due today';
  }

  dueIcon(task: Task): string {
    return task.overdue ? 'pi pi-exclamation-triangle' : 'pi pi-clock';
  }

  statusSeverityOf(task: Task): TagSeverity {
    return statusSeverity(task.status);
  }

  statusIconOf(task: Task): string {
    return statusIcon(task.status);
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

  toggleTooltip(task: Task): string {
    return task.completed ? 'Mark as pending' : 'Mark as completed';
  }

  toggleSeverity(task: Task): TagSeverity {
    return task.completed ? 'secondary' : 'success';
  }

  // --- internals ---------------------------------------------------------

  /**
   * Turns the filter signals into an API query.
   *
   * <p>The quick-filter scope and the status picker both narrow status, so they are
   * reconciled here: an explicit picker selection wins, since it is the more specific
   * instruction, and the scope only contributes when the picker is empty.</p>
   */
  private buildQuery(): TaskQuery {
    const statuses = this.selectedStatuses();
    const scope = this.scope();

    const query: TaskQuery = {
      q: this.search(),
      priority: this.selectedPriorities(),
      tagIds: this.selectedTagIds(),
      page: Math.floor(this.first() / this.rows()),
      size: this.rows(),
      sort: this.sortField,
      direction: this.sortDirection
    };

    if (statuses.length > 0) {
      query.status = statuses;
    } else if (scope === 'open') {
      query.status = ['TODO', 'IN_PROGRESS'];
    } else if (scope === 'done') {
      query.status = ['DONE'];
    }

    if (scope === 'overdue') {
      query.overdue = true;
    }

    return query;
  }

  private applyFilterChange(): void {
    this.resetToFirstPage();
    this.reload();
  }

  /** A narrowed result set may not have the page the user was on. */
  private resetToFirstPage(): void {
    this.first.set(0);
  }

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

  private deleteTask(task: Task): void {
    this.setBusy(task.id, true);
    this.taskService
      .remove(task.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setBusy(task.id, false);
          this.messageService.add({
            severity: 'success',
            summary: 'Task deleted',
            detail: task.title,
            life: 3000
          });
          // Deleting the last row of a page would otherwise leave an empty table.
          if (this.tasks().length === 1 && this.first() > 0) {
            this.first.update((value) => Math.max(0, value - this.rows()));
          }
          this.reload(false);
        },
        error: (error: unknown) => {
          this.setBusy(task.id, false);
          this.messageService.add({
            severity: 'error',
            summary: 'Delete failed',
            detail: toErrorMessage(error, `"${task.title}" could not be deleted.`),
            life: 5000
          });
        }
      });
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
