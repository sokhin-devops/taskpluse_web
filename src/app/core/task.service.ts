import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Board,
  PageResponse,
  Task,
  TaskMoveRequest,
  TaskQuery,
  TaskRequest,
  TaskStats
} from './task.model';

/**
 * Thin HTTP client for the TaskPulse task API.
 *
 * Deliberately free of error handling: failures propagate to the components,
 * which own the user-facing p-toast messages. The bearer token is added by
 * `authInterceptor`, so nothing here deals with authentication.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/tasks';

  /**
   * Fetches one page of tasks.
   *
   * @param query filters, paging and sorting; unset fields are omitted from the request
   *              so the server applies its own defaults
   */
  list(query: TaskQuery = {}): Observable<PageResponse<Task>> {
    return this.http.get<PageResponse<Task>>(this.baseUrl, { params: toParams(query) });
  }

  /** The whole kanban board in one call, columns already in workflow order. */
  board(): Observable<Board> {
    return this.http.get<Board>(`${this.baseUrl}/board`);
  }

  /**
   * Aggregate figures for the dashboard.
   *
   * @param days width of the trend window; the server clamps it to 1..90
   */
  stats(days = 14): Observable<TaskStats> {
    return this.http.get<TaskStats>(`${this.baseUrl}/stats`, {
      params: new HttpParams().set('days', days)
    });
  }

  get(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.baseUrl}/${id}`);
  }

  create(req: TaskRequest): Observable<Task> {
    return this.http.post<Task>(this.baseUrl, req);
  }

  update(id: number, req: TaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.baseUrl}/${id}`, req);
  }

  toggleComplete(id: number): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}/complete`, {});
  }

  /** Applies a board drag: target column plus index within it. */
  move(id: number, req: TaskMoveRequest): Observable<Task> {
    return this.http.patch<Task>(`${this.baseUrl}/${id}/move`, req);
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

/**
 * Turns a query object into HTTP parameters.
 *
 * <p>Only fields that were actually set are sent. That matters for more than tidiness:
 * `overdue=false` and `untagged=false` are real filters on the server, so serialising
 * every default would narrow the results rather than leaving them unfiltered. Array
 * values are repeated (`status=TODO&status=DONE`), which is the form Spring binds to a
 * collection parameter.</p>
 */
function toParams(query: TaskQuery): HttpParams {
  let params = new HttpParams();

  if (query.q && query.q.trim().length > 0) {
    params = params.set('q', query.q.trim());
  }
  for (const status of query.status ?? []) {
    params = params.append('status', status);
  }
  for (const priority of query.priority ?? []) {
    params = params.append('priority', priority);
  }
  for (const tagId of query.tagIds ?? []) {
    params = params.append('tagIds', tagId);
  }
  if (query.untagged) {
    params = params.set('untagged', true);
  }
  if (query.dueFrom) {
    params = params.set('dueFrom', query.dueFrom);
  }
  if (query.dueTo) {
    params = params.set('dueTo', query.dueTo);
  }
  if (query.overdue) {
    params = params.set('overdue', true);
  }
  if (query.hasDueDate !== null && query.hasDueDate !== undefined) {
    params = params.set('hasDueDate', query.hasDueDate);
  }
  if (query.page !== undefined) {
    params = params.set('page', query.page);
  }
  if (query.size !== undefined) {
    params = params.set('size', query.size);
  }
  if (query.sort) {
    params = params.set('sort', query.sort);
  }
  if (query.direction) {
    params = params.set('direction', query.direction);
  }

  return params;
}
