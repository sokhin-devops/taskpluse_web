/**
 * Task types mirroring the TaskPulse API contract.
 *
 * `dueDate` is a plain calendar date string ('yyyy-MM-dd');
 * `createdAt` / `updatedAt` / `completedAt` are ISO local date-times ('yyyy-MM-ddTHH:mm:ss').
 */

import { MessageKey } from '../i18n/messages.en';
import { Tag } from './tag.model';

/** Workflow column a task sits in. Matches the API enum exactly. */
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

/** Urgency of a task. Matches the API enum exactly. */
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

/** Workflow order. Used wherever columns or options are rendered in sequence. */
export const TASK_STATUSES: readonly TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

/** Most urgent first, which is the order the pickers and legends use. */
export const TASK_PRIORITIES: readonly TaskPriority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: TaskStatus;
  statusLabel: string;
  priority: TaskPriority;
  priorityLabel: string;
  /** Rank within the board column, counting from 0. */
  position: number;
  completed: boolean;
  completedAt: string | null;
  /**
   * Whether the task is open and past its due date. Computed by the server so a tab
   * left open overnight cannot disagree with it.
   */
  overdue: boolean;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for create (POST) and update (PUT).
 *
 * An omitted field leaves the current value untouched, which is what makes a partial
 * update safe. Note the difference for tags: `undefined` means "leave them alone",
 * while `[]` means "remove every tag".
 */
export interface TaskRequest {
  title: string;
  description: string | null;
  dueDate: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  tagIds?: number[];
  completed?: boolean;
}

/** Payload for a board drag: target column, and index within it. */
export interface TaskMoveRequest {
  status: TaskStatus;
  /** Zero-based index in the target column; omit to append. */
  position?: number;
}

/** One page of results, as returned by every paged endpoint. */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Fields the list endpoint accepts as a sort key. */
export type TaskSortField =
  | 'title'
  | 'dueDate'
  | 'priority'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'position';

/**
 * Query for the task list. Every field is optional; the service leaves unset ones out
 * of the request entirely so the server applies its own defaults.
 */
export interface TaskQuery {
  q?: string | null;
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tagIds?: number[];
  untagged?: boolean;
  dueFrom?: string | null;
  dueTo?: string | null;
  overdue?: boolean;
  hasDueDate?: boolean | null;
  page?: number;
  size?: number;
  sort?: TaskSortField;
  direction?: 'asc' | 'desc';
}

/** One column of the kanban board. */
export interface BoardColumn {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  total: number;
}

export interface Board {
  columns: BoardColumn[];
}

export interface StatusCount {
  status: TaskStatus;
  label: string;
  count: number;
}

export interface PriorityCount {
  priority: TaskPriority;
  label: string;
  count: number;
}

export interface TrendPoint {
  /** 'yyyy-MM-dd'. */
  date: string;
  created: number;
  completed: number;
}

/** Everything the dashboard renders, measured server-side at one instant. */
export interface TaskStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueNext7Days: number;
  noDueDate: number;
  completionRate: number;
  byStatus: StatusCount[];
  openByPriority: PriorityCount[];
  trend: TrendPoint[];
  topTags: Tag[];
}

/**
 * Converts a Date picked in p-datepicker to the API's 'yyyy-MM-dd' string.
 *
 * Uses LOCAL date parts on purpose: `toISOString()` converts to UTC first and
 * silently shifts the due date by a day for anyone east/west of Greenwich.
 */
export function toDateString(d: Date | null): string | null {
  if (!d) {
    return null;
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses the API's 'yyyy-MM-dd' string into a Date at LOCAL midnight,
 * ready to bind to p-datepicker.
 *
 * `new Date('2026-09-10')` would be parsed as UTC midnight and can render as
 * the previous day, so the parts are passed to the Date constructor instead.
 */
export function toDate(s: string | null): Date | null {
  if (!s) {
    return null;
  }
  const [year, month, day] = s.split('-').map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  return new Date(year, month - 1, day);
}

/**
 * The catalogue key naming each status, in the reader's language.
 *
 * <h2>Why the API's own label is not used</h2>
 *
 * <p>Every task arrives with `statusLabel` and `priorityLabel` already
 * rendered — in English, because the server has no idea what language this
 * browser is in and no mechanism to be told. Those fields are ignored
 * everywhere in this application in favour of translating the enum beside
 * them, which is the field that actually carries the meaning.</p>
 *
 * <h2>Why a map and not a template literal</h2>
 *
 * <p>Building the key as {@code `status.${status}`} and asserting it back to
 * {@link MessageKey} compiles, and then quietly stops checking the one thing
 * worth checking. Written out, a status added to the API with no catalogue
 * entry is a build error at the point the enum changes, which is the point
 * someone can still do something about it.</p>
 */
export function statusKey(status: TaskStatus): MessageKey {
  const keys: Record<TaskStatus, MessageKey> = {
    TODO: 'status.TODO',
    IN_PROGRESS: 'status.IN_PROGRESS',
    DONE: 'status.DONE'
  };
  return keys[status];
}

/** The catalogue key naming each priority. See {@link statusKey}. */
export function priorityKey(priority: TaskPriority): MessageKey {
  const keys: Record<TaskPriority, MessageKey> = {
    URGENT: 'priority.URGENT',
    HIGH: 'priority.HIGH',
    MEDIUM: 'priority.MEDIUM',
    LOW: 'priority.LOW'
  };
  return keys[priority];
}

/** PrimeNG `p-tag` severity used for each priority, so the mapping lives in one place. */
export function prioritySeverity(priority: TaskPriority): 'danger' | 'warn' | 'info' | 'secondary' {
  switch (priority) {
    case 'URGENT':
      return 'danger';
    case 'HIGH':
      return 'warn';
    case 'MEDIUM':
      return 'info';
    default:
      return 'secondary';
  }
}

/** PrimeIcon shown alongside each priority. */
export function priorityIcon(priority: TaskPriority): string {
  switch (priority) {
    case 'URGENT':
      return 'pi pi-arrow-up';
    case 'HIGH':
      return 'pi pi-angle-double-up';
    case 'MEDIUM':
      return 'pi pi-minus';
    default:
      return 'pi pi-angle-double-down';
  }
}

export function statusSeverity(status: TaskStatus): 'success' | 'info' | 'secondary' {
  switch (status) {
    case 'DONE':
      return 'success';
    case 'IN_PROGRESS':
      return 'info';
    default:
      return 'secondary';
  }
}

export function statusIcon(status: TaskStatus): string {
  switch (status) {
    case 'DONE':
      return 'pi pi-check';
    case 'IN_PROGRESS':
      return 'pi pi-spinner';
    default:
      return 'pi pi-circle';
  }
}
