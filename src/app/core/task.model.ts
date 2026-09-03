/**
 * Shape of a task as returned by the API (GET/POST/PUT/PATCH /api/tasks).
 * `dueDate` is a plain calendar date string ('yyyy-MM-dd');
 * `createdAt` / `updatedAt` are ISO local date-times ('yyyy-MM-ddTHH:mm:ss').
 */
export interface Task {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload accepted by the API for create (POST) and update (PUT). */
export interface TaskRequest {
  title: string;
  description: string | null;
  dueDate: string | null;
  completed?: boolean;
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
