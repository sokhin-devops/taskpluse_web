import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { TabsModule } from 'primeng/tabs';

/** One tab: the value it selects, what it says, and an optional icon and count. */
export interface AmbientTab {
  value: string;
  label: string;
  icon?: string;
  /** A count shown after the label — open items, unread, matches. */
  badge?: number;
}

/**
 * A row of tabs that selects a value.
 *
 * <p>PrimeNG's {@code p-tabs} underneath, using its tab list only: the panel
 * content stays with the page, projected under the strip. That is deliberate. A
 * component that owned the panels would have to take them as templates, and
 * every page using it would end up expressing its own layout through this
 * component's API instead of its own template.</p>
 *
 * <p>Because the panels are not PrimeNG's, the page is responsible for the one
 * thing that buys: the container showing the selected panel should carry
 * {@code role="tabpanel"} and be labelled by the tab. For a strip that is really
 * navigation — where each tab changes the route — prefer links; tabs that are
 * links are not tabs.</p>
 *
 * @example
 * <amb-tabs [tabs]="views" [(value)]="view" />
 * <div [attr.role]="'tabpanel'"> ... </div>
 */
@Component({
  selector: 'amb-tabs',
  imports: [TabsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-tabs [value]="value()" (valueChange)="onValueChange($event)" styleClass="amb-tabs">
      <p-tablist>
        @for (tab of tabs(); track tab.value) {
          <p-tab [value]="tab.value">
            @if (tab.icon) {
              <i [class]="tab.icon" aria-hidden="true"></i>
            }
            <span class="amb-tabs__label">{{ tab.label }}</span>
            @if (tab.badge !== undefined) {
              <span class="amb-tabs__badge">{{ tab.badge }}</span>
            }
          </p-tab>
        }
      </p-tablist>
    </p-tabs>

    <ng-content />
  `,
  styles: `
    :host {
      display: block;
    }

    .amb-tabs__label {
      white-space: nowrap;
    }

    // The count is a well, matching the sidebar's own count chip, so the two
    // read as the same kind of thing in two places.
    .amb-tabs__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.375rem;
      padding: 0 0.375rem;
      border-radius: var(--amb-radius-pill);
      background: var(--amb-surface-active);
      font-size: var(--amb-text-2xs);
      font-weight: var(--amb-weight-semibold);
      font-variant-numeric: tabular-nums;
      color: var(--amb-text-muted);
    }
  `
})
export class AmbientTabsComponent {
  readonly tabs = input.required<AmbientTab[]>();

  /** Two-way: the `value` of the selected tab. */
  readonly value = model.required<string>();

  /**
   * PrimeNG types the tab value as `string | number`, so it is narrowed back
   * here rather than widening this component's own contract to match.
   */
  protected onValueChange(next: string | number): void {
    this.value.set(String(next));
  }
}
