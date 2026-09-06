import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

import {
  AmbientBadgeComponent,
  AmbientEmptyStateComponent,
  AmbientInputDirective,
  AmbientPageComponent,
  AmbientPageHeaderComponent,
  AmbientTableComponent,
  AmbientToolbarComponent
} from '../ambient/ambient';
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
  priorityKey,
  prioritySeverity,
  statusIcon,
  statusKey,
  statusSeverity,
  toDate
} from '../core/task.model';
import { TaskService } from '../core/task.service';
import { LocaleService } from '../i18n/locale.service';
import { TranslatePipe } from '../i18n/translate.pipe';
import { TaskFormComponent } from './task-form.component';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary';

/** The quick-filter segmented control above the table. */
type Scope = 'all' | 'open' | 'overdue' | 'done';

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
    ConfirmDialogModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MultiSelectModule,
    SelectButtonModule,
    SkeletonModule,
    TableModule,
    ToastModule,
    TooltipModule,
    TaskFormComponent,
    AmbientBadgeComponent,
    AmbientEmptyStateComponent,
    AmbientInputDirective,
    AmbientPageComponent,
    AmbientPageHeaderComponent,
    AmbientTableComponent,
    AmbientToolbarComponent,
    TranslatePipe
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
  private readonly i18n = inject(LocaleService);

  /** Handed to the `date` pipe on the due-date column. */
  protected readonly dateLocale = this.i18n.dateLocale;

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

  // Every option list on this screen is a `computed`, not a field. Reading the
  // catalogue inside the computation is what makes it rebuild when the language
  // changes; a list built once in a field initialiser would keep the language it
  // was born in until the component was destroyed.

  readonly scopeOptions = computed(() => [
    { label: this.i18n.t('tasks.scope.all'), value: 'all' as Scope },
    { label: this.i18n.t('tasks.scope.open'), value: 'open' as Scope },
    { label: this.i18n.t('tasks.scope.overdue'), value: 'overdue' as Scope },
    { label: this.i18n.t('tasks.scope.done'), value: 'done' as Scope }
  ]);

  readonly statusOptions = computed(() =>
    TASK_STATUSES.map((status) => ({
      label: this.i18n.t(statusKey(status)),
      value: status
    }))
  );

  readonly priorityOptions = computed(() =>
    TASK_PRIORITIES.map((priority) => ({
      label: this.i18n.t(priorityKey(priority)),
      value: priority
    }))
  );

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

  /**
   * The line under the heading: how many tasks, and whether they are filtered.
   *
   * <p>The singular and plural are separate keys rather than a noun swapped
   * into one sentence. English can get away with the latter; most languages
   * cannot, because the number agrees with more of the sentence than the noun.
   * Khmer has no plural at all and simply uses the same string for both, which
   * this shape allows and a hard-coded `+ 's'` would not.</p>
   */
  readonly summary = computed(() => {
    if (this.loading()) {
      return this.i18n.t('tasks.summary.loading');
    }

    const count = this.totalRecords();
    if (count === 0) {
      return this.i18n.t(
        this.hasFilters() ? 'tasks.summary.noMatches' : 'tasks.summary.none'
      );
    }

    const one = count === 1;
    if (this.hasFilters()) {
      return this.i18n.t(
        one ? 'tasks.summary.matching.one' : 'tasks.summary.matching.other',
        { count }
      );
    }
    return this.i18n.t(one ? 'tasks.summary.total.one' : 'tasks.summary.total.other', {
      count
    });
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
            summary: this.i18n.t('tasks.error.toast'),
            detail: toErrorMessage(error, this.i18n, 'common.error.apiDownRetry'),
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
            summary: this.i18n.t(
              updated.completed ? 'tasks.toast.completed' : 'tasks.toast.reopened'
            ),
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
            summary: this.i18n.t('tasks.toast.updateFailed'),
            // The sentence around the title is translated; the title itself is
            // the user's own words and is substituted in untouched.
            detail: toErrorMessage(error, this.i18n, 'tasks.toast.updateFailedDetail', {
              title: task.title
            }),
            life: 5000
          });
        }
      });
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
    return this.i18n.t(task.overdue ? 'tasks.due.overdue' : 'tasks.due.today');
  }

  /** The API's own `statusLabel` is English-only; the enum is translated instead. */
  statusLabel(task: Task): string {
    return this.i18n.t(statusKey(task.status));
  }

  priorityLabel(task: Task): string {
    return this.i18n.t(priorityKey(task.priority));
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
    return this.i18n.t(task.completed ? 'tasks.markPending' : 'tasks.markDone');
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
            summary: this.i18n.t('tasks.toast.deleted'),
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
            summary: this.i18n.t('tasks.toast.deleteFailed'),
            detail: toErrorMessage(error, this.i18n, 'tasks.toast.deleteFailedDetail', {
              title: task.title
            }),
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
