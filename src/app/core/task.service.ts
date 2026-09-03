import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Task, TaskRequest } from './task.model';

/**
 * Thin HTTP client for the TaskPulse task API.
 *
 * Deliberately free of error handling: failures propagate to the components,
 * which own the user-facing p-toast messages.
 */
@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private readonly baseUrl = '/api/tasks';

  list(): Observable<Task[]> {
    return this.http.get<Task[]>(this.baseUrl);
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

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
