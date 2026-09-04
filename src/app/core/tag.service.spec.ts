import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Tag } from './tag.model';
import { TagService } from './tag.service';

const WORK: Tag = { id: 1, name: 'Work', color: '#2a78d6', taskCount: 5 };
const HOME: Tag = { id: 2, name: 'Home', color: '#1baf7a', taskCount: 2 };

/**
 * Unit tests for TagService.
 *
 * <p>The cache is the point: three screens read the tag list at once, and it changes only
 * when this service changes it. These tests pin down that a mutation refreshes the cache
 * and that a failed refresh does not undo a successful save.</p>
 */
describe('TagService', () => {
  let service: TagService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TagService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => TestBed.resetTestingModule());

  it('starts with an empty cache', () => {
    expect(service.tags()).toEqual([]);
  });

  it('fills the cache from the API', () => {
    service.load().subscribe();
    http.expectOne('/api/tags').flush([WORK, HOME]);

    expect(service.tags()).toEqual([WORK, HOME]);
    http.verify();
  });

  it('refreshes the cache after a create, so the other screens see the new tag', () => {
    service.create({ name: 'Ideas', color: '#4a3aa7' }).subscribe();
    http.expectOne('/api/tags').flush({ id: 3, name: 'Ideas', color: '#4a3aa7', taskCount: 0 });

    // The follow-up read is what the other screens are watching.
    http.expectOne('/api/tags').flush([WORK, HOME]);
    expect(service.tags().length).toBe(2);
    http.verify();
  });

  it('refreshes the cache after an update', () => {
    service.update(1, { name: 'Job', color: '#2a78d6' }).subscribe();
    // The update itself goes to the tag's own URL; the refresh reads the collection.
    http.expectOne('/api/tags/1').flush({ ...WORK, name: 'Job' });
    http.expectOne('/api/tags').flush([{ ...WORK, name: 'Job' }]);

    expect(service.tags()[0].name).toBe('Job');
    http.verify();
  });

  it('drops a deleted tag immediately, without waiting for the refetch', () => {
    service.load().subscribe();
    http.expectOne('/api/tags').flush([WORK, HOME]);

    service.remove(1).subscribe();
    http.expectOne('/api/tags/1').flush(null);

    // Removed locally already: a filter chip for a deleted tag should not linger.
    expect(service.tags().map((tag) => tag.id)).toEqual([2]);

    http.expectOne('/api/tags').flush([HOME]);
    http.verify();
  });

  it('keeps a successful save even when the background refresh fails', () => {
    service.load().subscribe();
    http.expectOne('/api/tags').flush([WORK]);

    let created: Tag | undefined;
    service.create({ name: 'Ideas', color: null }).subscribe((tag) => (created = tag));
    http.expectOne('/api/tags').flush({ id: 3, name: 'Ideas', color: '#2a78d6', taskCount: 0 });

    http.expectOne('/api/tags').flush(null, { status: 500, statusText: 'Server Error' });

    // The save itself succeeded; only the usage counts are now stale.
    expect(created?.name).toBe('Ideas');
    expect(service.tags()).toEqual([WORK]);
    http.verify();
  });

  it('empties the cache on clear, so a different account never sees the previous tags', () => {
    service.load().subscribe();
    http.expectOne('/api/tags').flush([WORK, HOME]);

    service.clear();

    expect(service.tags()).toEqual([]);
    http.verify();
  });
});
