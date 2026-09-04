import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { TestRequest } from '@angular/common/http/testing';

import { PageResponse, Task } from '../core/task.model';
import { TaskListComponent } from './task-list.component';

const EMPTY_PAGE: PageResponse<Task> = {
  content: [],
  page: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true
};

/**
 * Unit tests for TaskListComponent's filter-to-query mapping.
 *
 * <p>The reconciliation between the quick-filter scope and the status picker is the part
 * that repays testing: both narrow the same field, so getting the precedence wrong
 * produces a list that silently contradicts one of the two controls the user can see.</p>
 */
describe('TaskListComponent', () => {
  let fixture: ComponentFixture<TaskListComponent>;
  let component: TaskListComponent;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    });
    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => TestBed.resetTestingModule());

  /** Renders, answers the tag load and the initial lazy-load fetch. */
  function initialise(): void {
    fixture.detectChanges();
    http.match('/api/tags').forEach((request) => request.flush([]));
    flushTaskRequests();
  }

  /** Answers every outstanding task request and returns the last one. */
  function flushTaskRequests(): TestRequest | null {
    const requests = http.match((candidate) => candidate.url === '/api/tasks');
    requests.forEach((request) => request.flush(EMPTY_PAGE));
    return requests.length > 0 ? requests[requests.length - 1] : null;
  }

  it('fetches the first page on render, driven by the table lazy load', () => {
    fixture.detectChanges();
    http.match('/api/tags').forEach((request) => request.flush([]));

    const request = flushTaskRequests();

    expect(request).not.toBeNull();
    expect(request!.request.params.get('page')).toBe('0');
  });

  it('reports the total from the server rather than the row count', () => {
    fixture.detectChanges();
    http.match('/api/tags').forEach((request) => request.flush([]));
    http
      .match((candidate) => candidate.url === '/api/tasks')
      .forEach((request) => request.flush({ ...EMPTY_PAGE, totalElements: 137 }));

    expect(component.totalRecords()).toBe(137);
  });

  describe('scope and status reconciliation', () => {
    it('maps the Open scope onto the two open statuses', () => {
      initialise();

      component.onScopeChange('open');
      const request = flushTaskRequests();

      expect(request!.request.params.getAll('status')).toEqual(['TODO', 'IN_PROGRESS']);
      expect(request!.request.params.has('overdue')).toBeFalse();
    });

    it('maps the Done scope onto the DONE status', () => {
      initialise();

      component.onScopeChange('done');
      const request = flushTaskRequests();

      expect(request!.request.params.getAll('status')).toEqual(['DONE']);
    });

    it('maps the Overdue scope onto the overdue flag, not a status', () => {
      initialise();

      component.onScopeChange('overdue');
      const request = flushTaskRequests();

      expect(request!.request.params.get('overdue')).toBe('true');
      expect(request!.request.params.has('status')).toBeFalse();
    });

    it('lets an explicit status selection win over the scope', () => {
      initialise();
      component.onScopeChange('open');
      flushTaskRequests();

      component.onStatusChange(['DONE']);
      const request = flushTaskRequests();

      // The picker is the more specific instruction, so 'open' must not re-add TODO.
      expect(request!.request.params.getAll('status')).toEqual(['DONE']);
    });

    it('falls back to the scope once the status picker is emptied again', () => {
      initialise();
      component.onScopeChange('open');
      flushTaskRequests();
      component.onStatusChange(['DONE']);
      flushTaskRequests();

      component.onStatusChange([]);
      const request = flushTaskRequests();

      expect(request!.request.params.getAll('status')).toEqual(['TODO', 'IN_PROGRESS']);
    });

    it('keeps the overdue flag alongside an explicit status selection', () => {
      initialise();
      component.onScopeChange('overdue');
      flushTaskRequests();

      component.onStatusChange(['TODO']);
      const request = flushTaskRequests();

      expect(request!.request.params.get('overdue')).toBe('true');
      expect(request!.request.params.getAll('status')).toEqual(['TODO']);
    });
  });

  describe('paging', () => {
    it('returns to the first page when a filter narrows the list', () => {
      initialise();
      component.onLazyLoad({ first: 30, rows: 10 });
      flushTaskRequests();
      expect(component.first()).toBe(30);

      component.onPriorityChange(['URGENT']);
      const request = flushTaskRequests();

      // Page 4 of a narrower result set may not exist.
      expect(component.first()).toBe(0);
      expect(request!.request.params.get('page')).toBe('0');
    });

    it('derives the page index from the paginator offset and page size', () => {
      initialise();

      component.onLazyLoad({ first: 40, rows: 20 });
      const request = flushTaskRequests();

      expect(request!.request.params.get('page')).toBe('2');
      expect(request!.request.params.get('size')).toBe('20');
    });

    it('translates the table sort order into a direction', () => {
      initialise();

      component.onLazyLoad({ first: 0, rows: 10, sortField: 'title', sortOrder: -1 });
      const request = flushTaskRequests();

      expect(request!.request.params.get('sort')).toBe('title');
      expect(request!.request.params.get('direction')).toBe('desc');
    });
  });

  describe('search', () => {
    it('waits for typing to settle before querying', fakeAsync(() => {
      initialise();

      component.onSearchInput({ target: { value: 'rep' } } as unknown as Event);
      component.onSearchInput({ target: { value: 'repo' } } as unknown as Event);
      component.onSearchInput({ target: { value: 'report' } } as unknown as Event);

      // Nothing yet: three keystrokes must not be three round trips.
      expect(http.match((candidate) => candidate.url === '/api/tasks').length).toBe(0);

      tick(300);
      const request = flushTaskRequests();

      expect(request!.request.params.get('q')).toBe('report');
    }));
  });

  describe('active filter count', () => {
    it('counts nothing when the list is unfiltered', () => {
      initialise();

      expect(component.hasFilters()).toBeFalse();
      expect(component.activeFilterCount()).toBe(0);
    });

    it('counts each kind of filter once', () => {
      initialise();
      component.onScopeChange('open');
      flushTaskRequests();
      component.onPriorityChange(['URGENT', 'HIGH']);
      flushTaskRequests();
      component.onTagChange([1]);
      flushTaskRequests();

      // Scope, priority and tags: three, not four for the two priorities.
      expect(component.activeFilterCount()).toBe(3);
      expect(component.hasFilters()).toBeTrue();
    });

    it('clears everything at once', fakeAsync(() => {
      initialise();
      component.onScopeChange('done');
      flushTaskRequests();
      component.onPriorityChange(['LOW']);
      flushTaskRequests();

      component.clearFilters();
      flushTaskRequests();
      tick(300);
      flushTaskRequests();

      expect(component.activeFilterCount()).toBe(0);
      expect(component.scope()).toBe('all');
      expect(component.selectedPriorities()).toEqual([]);
    }));
  });

  it('surfaces a failure without leaving the table in a loading state', () => {
    fixture.detectChanges();
    http.match('/api/tags').forEach((request) => request.flush([]));
    http
      .match((candidate) => candidate.url === '/api/tasks')
      .forEach((request) => request.flush(null, { status: 500, statusText: 'Server Error' }));

    expect(component.loading()).toBeFalse();
    expect(component.loadFailed()).toBeTrue();
  });
});
