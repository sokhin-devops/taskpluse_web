import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TooltipModule } from 'primeng/tooltip';

import {
  AmbientActionsDirective,
  AmbientBadgeComponent,
  AmbientCardComponent,
  AmbientEmptyStateComponent,
  AmbientPageComponent,
  AmbientPageHeaderComponent,
  AmbientStatCardComponent
} from '../ambient/ambient';
import { toErrorMessage } from '../core/api-error';
import { readableTextOn } from '../core/tag.model';
import { TaskStats, priorityKey, toDate } from '../core/task.model';
import { TaskService } from '../core/task.service';
import { LocaleService } from '../i18n/locale.service';
import { TranslatePipe } from '../i18n/translate.pipe';

/** One tile in the KPI row. */
interface Tile {
  label: string;
  value: number;
  icon: string;
  /** Route and query the tile links to, so a number is a way in rather than a dead end. */
  link: string;
  query: Record<string, string>;
  /** Set when the figure is something to act on, e.g. overdue work. */
  emphasis?: 'attention';
}

/** A point on the trend chart, in SVG user units plus the values behind it. */
interface TrendPointGeometry {
  x: number;
  yCreated: number;
  yCompleted: number;
  date: string;
  created: number;
  completed: number;
}

/** Everything the trend SVG needs, computed once per data change. */
interface TrendChart {
  points: TrendPointGeometry[];
  createdPath: string;
  completedPath: string;
  gridLines: { y: number; label: string }[];
  xLabels: { x: number; label: string }[];
  hasData: boolean;
  totalCreated: number;
  totalCompleted: number;
}

/** A row of the priority or tag breakdown. */
interface BarRow {
  label: string;
  value: number;
  /** Width as a percentage of the widest row, so bars are comparable. */
  percent: number;
  color?: string;
  textColor?: string;
}

/*
 * Chart geometry, in SVG user units. The SVG scales to its container while strokes
 * stay at their specified width (vector-effect="non-scaling-stroke"), so these are
 * layout coordinates rather than pixels.
 *
 * The right-hand padding is wider than the left: it holds the direct end-labels for
 * the two lines, which would otherwise be clipped by the viewBox.
 */
const CHART = {
  width: 760,
  height: 220,
  padTop: 16,
  padRight: 64,
  padBottom: 28,
  padLeft: 34
} as const;

const PLOT_WIDTH = CHART.width - CHART.padLeft - CHART.padRight;
const PLOT_HEIGHT = CHART.height - CHART.padTop - CHART.padBottom;

/** How many horizontal gridlines, including the baseline. */
const GRID_STEPS = 4;

/** Roughly how many date labels fit along the x-axis without colliding. */
const MAX_X_LABELS = 7;

/**
 * Dashboard: the figures that answer "where does my work stand", in one screen.
 *
 * <h2>Why these forms</h2>
 * The completion rate is a single ratio against a limit, so it is a hero figure with a
 * meter rather than a two-slice pie. The five counts are headline numbers, so they are
 * stat tiles rather than a bar chart of five bars. Only two things here are genuinely
 * chart-shaped: change over time (a two-series line) and magnitude across a few
 * categories (horizontal bars).
 *
 * <h2>Charts without a chart library</h2>
 * The trend is hand-written SVG. The alternative was adding a charting dependency for
 * one line chart, which is a lot of bundle for a shape that is a hundred lines of
 * geometry — and hand-rolling it is what makes the mark specs (2px lines, ringed
 * end-dots, hairline gridlines, selective labels) available at all.
 *
 * <h2>Colour</h2>
 * The two series hues are a validated categorical pair, not a taste call: checked for
 * perceptual separation under simulated colour blindness as well as for contrast against
 * the card surface. Blue is the headline measure everywhere on this page; orange is the
 * single comparison series. The bar charts are one series each, so they need no
 * categorical palette and carry no legend.
 */
@Component({
  selector: 'app-dashboard',
  imports: [
    DatePipe,
    DecimalPipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectButtonModule,
    SkeletonModule,
    ToastModule,
    ToggleButtonModule,
    TooltipModule,
    AmbientActionsDirective,
    AmbientBadgeComponent,
    AmbientCardComponent,
    AmbientEmptyStateComponent,
    AmbientPageComponent,
    AmbientPageHeaderComponent,
    AmbientStatCardComponent,
    TranslatePipe
  ],
  providers: [MessageService],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly messageService = inject(MessageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(LocaleService);

  /**
   * Handed to every `date` and `number` binding on this screen.
   *
   * <p>Those pipes take a locale as their last argument, which is the only way
   * to change their output at runtime — `LOCALE_ID` is fixed at bootstrap. The
   * axis ticks and the tooltip date go through {@link shortDate} instead, which
   * reads the same value.</p>
   */
  protected readonly dateLocale = this.i18n.dateLocale;

  readonly stats = signal<TaskStats | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);

  /** Width of the trend window, in days. */
  readonly days = signal(14);

  /** The trend as a table instead of a chart: the accessible route to the same data. */
  readonly showTable = signal(false);

  /** Index of the day under the cursor, or null. Drives the crosshair and tooltip. */
  readonly hoverIndex = signal<number | null>(null);

  readonly chartGeometry = CHART;
  readonly plotWidth = PLOT_WIDTH;
  readonly plotHeight = PLOT_HEIGHT;

  readonly rangeOptions = computed(() =>
    [7, 14, 30].map((days) => ({
      label: this.i18n.t('dashboard.trend.days', { days }),
      value: days
    }))
  );

  readonly skeletonTiles = [0, 1, 2, 3, 4];

  // --- headline figures --------------------------------------------------

  readonly completionRate = computed(() => this.stats()?.completionRate ?? 0);

  readonly completionCaption = computed(() => {
    const stats = this.stats();
    if (!stats || stats.total === 0) {
      return this.i18n.t('dashboard.noTasks');
    }
    return this.i18n.t('dashboard.completionCaption', {
      completed: stats.completed,
      total: stats.total
    });
  });

  /** The trend card's subtitle: two totals and the window they cover. */
  readonly trendSubtitle = computed(() =>
    this.i18n.t('dashboard.trend.subtitle', {
      created: this.chart().totalCreated,
      completed: this.chart().totalCompleted,
      days: this.days()
    })
  );

  readonly tiles = computed<Tile[]>(() => {
    const stats = this.stats();
    if (!stats) {
      return [];
    }
    // Annotated rather than inferred: without it TypeScript builds a union of the five
    // literal shapes (only one of which carries `emphasis`) and then reports that the
    // union does not match Tile[].
    const tiles: Tile[] = [
      {
        label: this.i18n.t('dashboard.tile.open'),
        value: stats.open,
        icon: 'pi pi-inbox',
        link: '/tasks',
        query: { scope: 'open' }
      },
      {
        label: this.i18n.t('dashboard.tile.inProgress'),
        value: stats.inProgress,
        icon: 'pi pi-sync',
        link: '/board',
        query: {}
      },
      {
        label: this.i18n.t('dashboard.tile.overdue'),
        value: stats.overdue,
        icon: 'pi pi-exclamation-triangle',
        link: '/tasks',
        query: { scope: 'overdue' },
        // Overdue work is the one figure on this page that asks to be acted on.
        emphasis: stats.overdue > 0 ? 'attention' : undefined
      },
      {
        label: this.i18n.t('dashboard.tile.dueToday'),
        value: stats.dueToday,
        icon: 'pi pi-calendar',
        link: '/tasks',
        query: { scope: 'open' }
      },
      {
        label: this.i18n.t('dashboard.tile.next7'),
        value: stats.dueNext7Days,
        icon: 'pi pi-calendar-clock',
        link: '/tasks',
        query: { scope: 'open' }
      }
    ];
    return tiles;
  });

  // --- trend chart -------------------------------------------------------

  /** The clean upper bound of the y-axis, so ticks land on round numbers. */
  readonly maxY = computed(() => {
    const trend = this.stats()?.trend ?? [];
    const peak = trend.reduce(
      (highest, point) => Math.max(highest, point.created, point.completed),
      0
    );
    return niceCeiling(peak);
  });

  readonly chart = computed<TrendChart>(() => {
    const trend = this.stats()?.trend ?? [];
    const maxY = this.maxY();

    if (trend.length === 0) {
      return {
        points: [],
        createdPath: '',
        completedPath: '',
        gridLines: [],
        xLabels: [],
        hasData: false,
        totalCreated: 0,
        totalCompleted: 0
      };
    }

    // A single-point window would divide by zero; place it at the left edge instead.
    const step = trend.length > 1 ? PLOT_WIDTH / (trend.length - 1) : 0;

    const points: TrendPointGeometry[] = trend.map((point, index) => ({
      x: CHART.padLeft + index * step,
      yCreated: valueToY(point.created, maxY),
      yCompleted: valueToY(point.completed, maxY),
      date: point.date,
      created: point.created,
      completed: point.completed
    }));

    const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, index) => {
      const value = (maxY / GRID_STEPS) * index;
      return { y: valueToY(value, maxY), label: formatTick(value) };
    });

    // Only every nth date is labelled: 30 of them along this axis would overlap into
    // an unreadable smear, and the tooltip carries the exact day anyway.
    const every = Math.max(1, Math.ceil(trend.length / MAX_X_LABELS));
    const xLabels = points
      .filter((_, index) => index % every === 0 || index === points.length - 1)
      .map((point) => ({ x: point.x, label: shortDate(point.date, this.dateLocale()) }));

    return {
      points,
      createdPath: toPath(points, (point) => point.yCreated),
      completedPath: toPath(points, (point) => point.yCompleted),
      gridLines,
      xLabels,
      hasData: trend.some((point) => point.created > 0 || point.completed > 0),
      totalCreated: trend.reduce((sum, point) => sum + point.created, 0),
      totalCompleted: trend.reduce((sum, point) => sum + point.completed, 0)
    };
  });

  /** The hovered point, for the crosshair and tooltip. */
  readonly hoveredPoint = computed(() => {
    const index = this.hoverIndex();
    if (index === null) {
      return null;
    }
    return this.chart().points[index] ?? null;
  });

  /**
   * Keeps the tooltip inside the plot: past the halfway mark it flips to the left of
   * the crosshair rather than running off the right edge.
   */
  readonly tooltipAnchor = computed(() => {
    const point = this.hoveredPoint();
    if (!point) {
      return { x: 0, flip: false };
    }
    return { x: point.x, flip: point.x > CHART.padLeft + PLOT_WIDTH * 0.6 };
  });

  // --- breakdowns --------------------------------------------------------

  /**
   * The priority breakdown.
   *
   * <p>The API sends a rendered `label` alongside each count. It is ignored in
   * favour of translating the `priority` enum beside it, because the server has
   * no idea what language this browser is in — the same reason the task list
   * ignores `statusLabel`.</p>
   */
  readonly priorityRows = computed<BarRow[]>(() => {
    const counts = this.stats()?.openByPriority ?? [];
    const peak = counts.reduce((highest, row) => Math.max(highest, row.count), 0);
    return counts.map((row) => ({
      label: this.i18n.t(priorityKey(row.priority)),
      value: row.count,
      percent: peak > 0 ? (row.count / peak) * 100 : 0
    }));
  });

  readonly tagRows = computed<BarRow[]>(() => {
    const tags = this.stats()?.topTags ?? [];
    const peak = tags.reduce((highest, tag) => Math.max(highest, tag.taskCount ?? 0), 0);
    return tags.map((tag) => ({
      label: tag.name,
      value: tag.taskCount ?? 0,
      percent: peak > 0 ? ((tag.taskCount ?? 0) / peak) * 100 : 0,
      color: tag.color,
      textColor: readableTextOn(tag.color)
    }));
  });

  readonly hasOpenTasks = computed(() => (this.stats()?.open ?? 0) > 0);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.hoverIndex.set(null);

    this.taskService
      .stats(this.days())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stats) => {
          this.stats.set(stats);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.loadFailed.set(true);
          this.messageService.add({
            severity: 'error',
            summary: this.i18n.t('dashboard.error.toast'),
            detail: toErrorMessage(error, this.i18n, 'common.error.apiDownRetry'),
            life: 5000
          });
        }
      });
  }

  onRangeChange(days: number): void {
    this.days.set(days ?? 14);
    this.reload();
  }

  toggleTable(): void {
    this.showTable.update((shown) => !shown);
  }

  onPointEnter(index: number): void {
    this.hoverIndex.set(index);
  }

  onPlotLeave(): void {
    this.hoverIndex.set(null);
  }

  /**
   * The invisible hover strip for one day.
   *
   * <p>Hovering has to target the whole vertical band, not the 8px dot: asking someone
   * to land on the marker itself makes the tooltip feel broken. Each strip is centred on
   * its point and clipped to the plot, so the bands tile the chart with no dead gaps.</p>
   */
  hitStrip(index: number): { x: number; width: number } {
    const points = this.chart().points;
    const band = points.length > 1 ? PLOT_WIDTH / (points.length - 1) : PLOT_WIDTH;
    const centre = points[index]?.x ?? CHART.padLeft;

    const left = Math.max(CHART.padLeft, centre - band / 2);
    const right = Math.min(CHART.padLeft + PLOT_WIDTH, centre + band / 2);
    return { x: left, width: Math.max(0, right - left) };
  }

  asDate(value: string): Date | null {
    return toDate(value);
  }

  trackByDate(_index: number, point: { date: string }): string {
    return point.date;
  }
}

// --- geometry helpers ----------------------------------------------------

/** Maps a value onto its y coordinate, with 0 sitting on the baseline. */
function valueToY(value: number, maxY: number): number {
  const ratio = maxY > 0 ? value / maxY : 0;
  return CHART.padTop + PLOT_HEIGHT * (1 - ratio);
}

function toPath(points: TrendPointGeometry[], y: (point: TrendPointGeometry) => number): string {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    // A one-day window has no line to draw; the end marker still renders.
    return `M ${points[0].x} ${y(points[0])}`;
  }
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${round(point.x)} ${round(y(point))}`)
    .join(' ');
}

/**
 * Rounds an axis maximum up to a clean number, so ticks read 0 / 2 / 4 rather than
 * 0 / 1.75 / 3.5. Counts are integers, so the ceiling is too, and it is never below
 * the number of gridlines — otherwise the ticks would repeat the same rounded label.
 */
function niceCeiling(peak: number): number {
  if (peak <= GRID_STEPS) {
    return GRID_STEPS;
  }
  const magnitude = Math.pow(10, Math.floor(Math.log10(peak)));
  for (const multiple of [1, 2, 2.5, 5, 10]) {
    const candidate = magnitude * multiple;
    if (candidate >= peak) {
      // Keep it divisible by the gridline count so every tick is a whole number.
      return Math.ceil(candidate / GRID_STEPS) * GRID_STEPS;
    }
  }
  return Math.ceil(peak / GRID_STEPS) * GRID_STEPS;
}

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(0);
}

/**
 * 'yyyy-MM-dd' to a short axis label, e.g. "4 Sep".
 *
 * <p>Takes the locale rather than reading it, so the whole function stays pure
 * and the caller — a `computed` that already depends on the locale signal — is
 * the single place the dependency is declared.</p>
 */
function shortDate(iso: string, locale: string): string {
  const date = toDate(iso);
  if (!date) {
    return iso;
  }
  return `${date.getDate()} ${date.toLocaleString(locale, { month: 'short' })}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
