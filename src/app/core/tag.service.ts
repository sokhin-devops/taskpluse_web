import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Tag, TagRequest } from './tag.model';

/**
 * HTTP client for the TaskPulse tag API, plus a cache of the caller's tags.
 *
 * <p>The cache exists because the tag list is needed by three screens at once — the
 * filter bar, the task form's picker and the board's chips — and it changes only when
 * this service is the one changing it. Every mutation refreshes the signal, so those
 * screens stay in step without each polling the endpoint.</p>
 */
@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/tags';

  private readonly cache = signal<Tag[]>([]);

  /** The caller's tags, alphabetical, as last returned by the API. */
  readonly tags = this.cache.asReadonly();

  /** Fetches the tag list and updates the cache. */
  load(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.baseUrl).pipe(tap((tags) => this.cache.set(tags)));
  }

  create(req: TagRequest): Observable<Tag> {
    return this.http.post<Tag>(this.baseUrl, req).pipe(tap(() => this.refresh()));
  }

  update(id: number, req: TagRequest): Observable<Tag> {
    return this.http.put<Tag>(`${this.baseUrl}/${id}`, req).pipe(tap(() => this.refresh()));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        // Drop it locally straight away so a filter chip for a deleted tag disappears
        // without waiting for the refetch to come back.
        this.cache.update((tags) => tags.filter((tag) => tag.id !== id));
        this.refresh();
      })
    );
  }

  /** Empties the cache, so a different account never sees the previous one's tags. */
  clear(): void {
    this.cache.set([]);
  }

  /**
   * Re-reads the list in the background after a mutation.
   *
   * <p>Fire-and-forget on purpose: the caller already has the authoritative response for
   * the row it just changed, and this only brings the other rows' task counts up to date.
   * An error here is not worth interrupting a successful save for, so it is swallowed and
   * the stale counts stand until the next load.</p>
   */
  private refresh(): void {
    this.load().subscribe({ error: () => undefined });
  }
}
