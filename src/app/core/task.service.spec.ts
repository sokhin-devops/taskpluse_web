import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PageResponse, Task } from './task.model';
import { TaskService } from './task.service';

/**
 * Unit tests for TaskService.
 *
 * <p>Most of these are about the query string. Getting it wrong is quiet rather than
 * loud: sending `overdue=false` narrows the results on the server instead of leaving
 * them unfiltered, and a comma-joined array binds to nothing at all. Both would look
 * like "the filter is broken" from the UI with no error anywhere.</p>
 */
describe('TaskService', () => {
  let service: TaskService;
  let http: HttpTestingController;

  const emptyPage: PageResponse<Task> = {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TaskService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Runs a list() call and hands back the request it produced. */
  function listWith(query: Parameters<TaskService['list']>[0]) {
    service.list(query).subscribe();
    const request = http.expectOne((candidate) => candidate.url === '/api/tasks');
    request.flush(emptyPage);
    return request;
  }

  describe('list', () => {
    it('sends no parameters at all when given no filters', () => {
      const request = listWith({});

      expect(request.request.params.keys()).toEqual([]);
      expect(request.request.method).toBe('GET');
    });

    it('omits filters that are merely false, rather than sending them', () => {
      // overdue=false and untagged=false are real filters server-side; sending the
      // defaults would silently narrow an unfiltered list.
      const request = listWith({ overdue: false, untagged: false });

      expect(request.request.params.has('overdue')).toBeFalse();
      expect(request.request.params.has('untagged')).toBeFalse();
    });

    it('sends the boolean filters when they are actually on', () => {
      const request = listWith({ overdue: true, untagged: true });

      expect(request.request.params.get('overdue')).toBe('true');
      expect(request.request.params.get('untagged')).toBe('true');
    });

    it('repeats multi-value parameters instead of joining them with commas', () => {
      const request = listWith({ status: ['TODO', 'DONE'], tagIds: [3, 4] });

      expect(request.request.params.getAll('status')).toEqual(['TODO', 'DONE']);
      expect(request.request.params.getAll('tagIds')).toEqual(['3', '4']);
    });

    it('trims the search term and drops it when it is only whitespace', () => {
      expect(listWith({ q: '  report  ' }).request.params.get('q')).toBe('report');
      expect(listWith({ q: '   ' }).request.params.has('q')).toBeFalse();
      expect(listWith({ q: null }).request.params.has('q')).toBeFalse();
    });

    it('distinguishes hasDueDate=false from hasDueDate being unset', () => {
      expect(listWith({ hasDueDate: false }).request.params.get('hasDueDate')).toBe('false');
      expect(listWith({ hasDueDate: true }).request.params.get('hasDueDate')).toBe('true');
      expect(listWith({ hasDueDate: null }).request.params.has('hasDueDate')).toBeFalse();
      expect(listWith({}).request.params.has('hasDueDate')).toBeFalse();
    });

    it('sends page 0 rather than treating it as absent', () => {
      // page=0 is falsy; an `if (query.page)` guard would drop the first page.
      expect(listWith({ page: 0 }).request.params.get('page')).toBe('0');
    });

    it('passes paging and sorting through', () => {
      const request = listWith({ page: 2, size: 25, sort: 'priority', direction: 'desc' });

      expect(request.request.params.get('page')).toBe('2');
      expect(request.request.params.get('size')).toBe('25');
      expect(request.request.params.get('sort')).toBe('priority');
      expect(request.request.params.get('direction')).toBe('desc');
    });

    it('passes the due-date window through as plain calendar dates', () => {
      const request = listWith({ dueFrom: '2026-09-01', dueTo: '2026-09-30' });

      expect(request.request.params.get('dueFrom')).toBe('2026-09-01');
      expect(request.request.params.get('dueTo')).toBe('2026-09-30');
    });

    it('returns the page envelope unchanged', () => {
      let received: PageResponse<Task> | undefined;
      service.list().subscribe((page) => (received = page));

      http.expectOne((candidate) => candidate.url === '/api/tasks').flush({
        ...emptyPage,
        totalElements: 42
      });

      expect(received?.totalElements).toBe(42);
    });
  });

  describe('endpoints', () => {
    it('reads the board', () => {
      service.board().subscribe();
      const request = http.expectOne('/api/tasks/board');

      expect(request.request.method).toBe('GET');
      request.flush({ columns: [] });
    });

    it('reads stats with the requested window', () => {
      service.stats(30).subscribe();
      const request = http.expectOne((candidate) => candidate.url === '/api/tasks/stats');

      expect(request.request.params.get('days')).toBe('30');
      request.flush({});
    });

    it('defaults the stats window to a fortnight', () => {
      service.stats().subscribe();
      const request = http.expectOne((candidate) => candidate.url === '/api/tasks/stats');

      expect(request.request.params.get('days')).toBe('14');
      request.flush({});
    });

    it('creates with POST', () => {
      const payload = { title: 'Write the report', description: null, dueDate: null };
      service.create(payload).subscribe();
      const request = http.expectOne('/api/tasks');

      expect(request.request.method).toBe('POST');
      expect(request.request.body).toEqual(payload);
      request.flush({});
    });

    it('updates with PUT on the task id', () => {
      service.update(7, { title: 'Renamed', description: null, dueDate: null }).subscribe();
      const request = http.expectOne('/api/tasks/7');

      expect(request.request.method).toBe('PUT');
      request.flush({});
    });

    it('toggles completion with an empty PATCH body', () => {
      service.toggleComplete(7).subscribe();
      const request = http.expectOne('/api/tasks/7/complete');

      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({});
      request.flush({});
    });

    it('moves a task with its target column and index', () => {
      service.move(7, { status: 'DONE', position: 2 }).subscribe();
      const request = http.expectOne('/api/tasks/7/move');

      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ status: 'DONE', position: 2 });
      request.flush({});
    });

    it('deletes with DELETE', () => {
      service.remove(7).subscribe();
      const request = http.expectOne('/api/tasks/7');

      expect(request.request.method).toBe('DELETE');
      request.flush(null);
    });
  });
});
