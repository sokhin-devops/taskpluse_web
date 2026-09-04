import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { TaskStats, TrendPoint } from '../core/task.model';
import { DashboardComponent } from './dashboard.component';

/** A stats payload with everything zeroed, so a test can vary one field at a time. */
function stats(overrides: Partial<TaskStats> = {}): TaskStats {
  return {
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
    dueNext7Days: 0,
    noDueDate: 0,
    completionRate: 0,
    byStatus: [],
    openByPriority: [],
    trend: [],
    topTags: [],
    ...overrides
  };
}

function trend(...counts: [string, number, number][]): TrendPoint[] {
  return counts.map(([date, created, completed]) => ({ date, created, completed }));
}

/**
 * Unit tests for DashboardComponent.
 *
 * <p>Mostly geometry. The chart is hand-written SVG, so the arithmetic that turns counts
 * into coordinates has no library behind it to be correct on its behalf — and a chart
 * that is silently wrong is worse than one that fails to render.</p>
 */
describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  let http: HttpTestingController;

  /** Whether the component has already been rendered, and so already fetched once. */
  let rendered = false;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations()
      ]
    });
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    rendered = false;
  });

  afterEach(() => TestBed.resetTestingModule());

  /**
   * Renders (or re-fetches) and answers the stats call with the given payload.
   *
   * <p>The first call relies on ngOnInit to issue the request; later calls have to ask
   * for a reload explicitly, since detectChanges on an already-initialised component
   * fetches nothing and the test would silently assert against the previous payload.</p>
   */
  function load(payload: TaskStats): void {
    if (rendered) {
      component.reload();
    } else {
      fixture.detectChanges();
      rendered = true;
    }
    http
      .match((candidate) => candidate.url === '/api/tasks/stats')
      .forEach((request) => request.flush(payload));
    fixture.detectChanges();
  }

  it('requests the default fortnight window', () => {
    fixture.detectChanges();
    const requests = http.match((candidate) => candidate.url === '/api/tasks/stats');

    expect(requests.length).toBe(1);
    expect(requests[0].request.params.get('days')).toBe('14');
    requests[0].flush(stats());
  });

  it('refetches when the window changes', () => {
    load(stats());

    component.onRangeChange(30);
    const requests = http.match((candidate) => candidate.url === '/api/tasks/stats');

    expect(requests[0].request.params.get('days')).toBe('30');
    requests[0].flush(stats());
  });

  describe('y-axis scaling', () => {
    it('never collapses to a zero-height axis on an empty window', () => {
      load(stats({ trend: trend(['2026-09-01', 0, 0], ['2026-09-02', 0, 0]) }));

      // A maximum of 0 would put every point on the baseline and divide by zero.
      expect(component.maxY()).toBeGreaterThan(0);
    });

    it('rounds the axis maximum up to a clean number', () => {
      load(stats({ trend: trend(['2026-09-01', 7, 3]) }));

      const maxY = component.maxY();
      expect(maxY).toBeGreaterThanOrEqual(7);
      // Divisible by the gridline count, so every tick label is a whole number.
      expect(maxY % 4).toBe(0);
    });

    it('scales to the larger of the two series', () => {
      load(stats({ trend: trend(['2026-09-01', 2, 40]) }));

      expect(component.maxY()).toBeGreaterThanOrEqual(40);
    });
  });

  describe('chart geometry', () => {
    it('spreads the points evenly across the plot, ending at its right edge', () => {
      load(
        stats({
          trend: trend(['2026-09-01', 1, 1], ['2026-09-02', 1, 1], ['2026-09-03', 1, 1])
        })
      );

      const points = component.chart().points;
      const left = component.chartGeometry.padLeft;

      expect(points.length).toBe(3);
      expect(points[0].x).toBeCloseTo(left, 5);
      expect(points[2].x).toBeCloseTo(left + component.plotWidth, 5);
      expect(points[1].x).toBeCloseTo(left + component.plotWidth / 2, 5);
    });

    it('puts a zero on the baseline and the maximum at the top of the plot', () => {
      load(stats({ trend: trend(['2026-09-01', 0, 4], ['2026-09-02', 0, 0]) }));

      const [first] = component.chart().points;
      const baseline = component.chartGeometry.padTop + component.plotHeight;

      expect(first.yCreated).toBeCloseTo(baseline, 5);
      // 4 out of a maximum of 4 sits on the top gridline.
      expect(first.yCompleted).toBeCloseTo(component.chartGeometry.padTop, 5);
    });

    it('builds a path that starts with a move and continues with lines', () => {
      load(stats({ trend: trend(['2026-09-01', 1, 2], ['2026-09-02', 3, 4]) }));

      expect(component.chart().createdPath).toMatch(/^M [\d.]+ [\d.]+ L [\d.]+ [\d.]+$/);
      expect(component.chart().completedPath).toMatch(/^M /);
    });

    it('survives a one-day window without dividing by zero', () => {
      load(stats({ trend: trend(['2026-09-01', 2, 1]) }));

      const points = component.chart().points;
      expect(points.length).toBe(1);
      expect(points[0].x).toBe(component.chartGeometry.padLeft);
      expect(component.chart().createdPath).toBe(`M ${points[0].x} ${points[0].yCreated}`);
    });

    it('emits one gridline per step plus the baseline', () => {
      load(stats({ trend: trend(['2026-09-01', 1, 1]) }));

      expect(component.chart().gridLines.length).toBe(5);
      expect(component.chart().gridLines.every((line) => /^\d+$/.test(line.label))).toBeTrue();
    });

    it('thins the date labels so a long window does not overlap', () => {
      const thirtyDays = Array.from({ length: 30 }, (_, index): [string, number, number] => [
        `2026-09-${String(index + 1).padStart(2, '0')}`,
        1,
        1
      ]);
      load(stats({ trend: trend(...thirtyDays) }));

      const labels = component.chart().xLabels;
      expect(labels.length).toBeLessThan(30);
      expect(labels.length).toBeGreaterThan(2);
      // The last day is always labelled, whatever the thinning interval.
      expect(labels[labels.length - 1].x).toBeCloseTo(
        component.chartGeometry.padLeft + component.plotWidth,
        5
      );
    });

    it('reports an empty window so the chart can say so instead of drawing a flat line', () => {
      load(stats({ trend: trend(['2026-09-01', 0, 0], ['2026-09-02', 0, 0]) }));
      expect(component.chart().hasData).toBeFalse();

      load(stats({ trend: trend(['2026-09-01', 0, 1]) }));
      expect(component.chart().hasData).toBeTrue();
    });

    it('totals each series across the window', () => {
      load(stats({ trend: trend(['2026-09-01', 2, 1], ['2026-09-02', 3, 4]) }));

      expect(component.chart().totalCreated).toBe(5);
      expect(component.chart().totalCompleted).toBe(5);
    });
  });

  describe('hover', () => {
    it('tiles the plot with hit strips that leave no dead gaps', () => {
      load(
        stats({
          trend: trend(['2026-09-01', 1, 1], ['2026-09-02', 1, 1], ['2026-09-03', 1, 1])
        })
      );

      const left = component.chartGeometry.padLeft;
      const first = component.hitStrip(0);
      const middle = component.hitStrip(1);
      const last = component.hitStrip(2);

      expect(first.x).toBe(left);
      expect(first.x + first.width).toBeCloseTo(middle.x, 5);
      expect(middle.x + middle.width).toBeCloseTo(last.x, 5);
      expect(last.x + last.width).toBeCloseTo(left + component.plotWidth, 5);
    });

    it('resolves the hovered index to its point, and clears on leave', () => {
      load(stats({ trend: trend(['2026-09-01', 2, 1], ['2026-09-02', 3, 4]) }));

      component.onPointEnter(1);
      expect(component.hoveredPoint()?.created).toBe(3);
      expect(component.hoveredPoint()?.completed).toBe(4);

      component.onPlotLeave();
      expect(component.hoveredPoint()).toBeNull();
    });

    it('flips the tooltip to the left once past the middle of the plot', () => {
      const days = Array.from({ length: 10 }, (_, index): [string, number, number] => [
        `2026-09-${String(index + 1).padStart(2, '0')}`,
        1,
        1
      ]);
      load(stats({ trend: trend(...days) }));

      component.onPointEnter(0);
      expect(component.tooltipAnchor().flip).toBeFalse();

      component.onPointEnter(9);
      expect(component.tooltipAnchor().flip).toBeTrue();
    });
  });

  describe('breakdowns', () => {
    it('scales the priority bars against the largest row, not against the total', () => {
      load(
        stats({
          open: 12,
          openByPriority: [
            { priority: 'URGENT', label: 'Urgent', count: 2 },
            { priority: 'HIGH', label: 'High', count: 8 },
            { priority: 'MEDIUM', label: 'Medium', count: 0 },
            { priority: 'LOW', label: 'Low', count: 4 }
          ]
        })
      );

      const rows = component.priorityRows();
      // The widest bar fills the track; the rest are relative to it.
      expect(rows[1].percent).toBe(100);
      expect(rows[0].percent).toBe(25);
      expect(rows[2].percent).toBe(0);
    });

    it('gives each tag row a label colour with contrast against its own colour', () => {
      load(
        stats({
          topTags: [
            { id: 1, name: 'Work', color: '#184f95', taskCount: 4 },
            { id: 2, name: 'Ideas', color: '#eda100', taskCount: 2 }
          ]
        })
      );

      const rows = component.tagRows();
      expect(rows[0].textColor).toBe('#ffffff');
      expect(rows[1].textColor).toBe('#111827');
      expect(rows[0].percent).toBe(100);
      expect(rows[1].percent).toBe(50);
    });

    it('does not divide by zero when nothing is open', () => {
      load(
        stats({
          openByPriority: [{ priority: 'LOW', label: 'Low', count: 0 }]
        })
      );

      expect(component.priorityRows()[0].percent).toBe(0);
      expect(component.hasOpenTasks()).toBeFalse();
    });
  });

  describe('headline figures', () => {
    it('describes progress in tasks, not just a percentage', () => {
      load(stats({ total: 10, completed: 4, completionRate: 40 }));

      expect(component.completionCaption()).toBe('4 of 10 tasks done');
      expect(component.completionRate()).toBe(40);
    });

    it('says there is nothing yet rather than claiming 0% done', () => {
      load(stats());

      expect(component.completionCaption()).toBe('No tasks yet');
    });

    it('marks overdue work for attention only when there is some', () => {
      load(stats({ overdue: 3 }));
      expect(component.tiles().find((tile) => tile.label === 'Overdue')?.emphasis).toBe('attention');

      load(stats({ overdue: 0 }));
      expect(component.tiles().find((tile) => tile.label === 'Overdue')?.emphasis).toBeUndefined();
    });

    it('links each tile somewhere, so a number is a way in', () => {
      load(stats({ total: 5, open: 3 }));

      expect(component.tiles().length).toBeGreaterThan(0);
      for (const tile of component.tiles()) {
        expect(tile.link).withContext(`link for ${tile.label}`).toMatch(/^\//);
      }
    });
  });

  it('offers the trend as a table as well as a chart', () => {
    load(stats({ trend: trend(['2026-09-01', 1, 2]) }));

    expect(component.showTable()).toBeFalse();
    component.toggleTable();
    expect(component.showTable()).toBeTrue();
  });

  it('surfaces a failure without staying in a loading state', () => {
    fixture.detectChanges();
    http
      .match((candidate) => candidate.url === '/api/tasks/stats')
      .forEach((request) => request.flush(null, { status: 500, statusText: 'Server Error' }));

    expect(component.loading()).toBeFalse();
    expect(component.loadFailed()).toBeTrue();
  });
});
