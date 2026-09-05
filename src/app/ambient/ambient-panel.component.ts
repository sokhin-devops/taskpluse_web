import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  model
} from '@angular/core';
import { PanelModule } from 'primeng/panel';

/**
 * A level-1 glass panel: the surface for a large region of a page, one step
 * calmer than a card.
 *
 * <p>Card or panel is a hierarchy decision, not a styling one. A card is a
 * discrete object — one task, one figure, one row of a list. A panel is a
 * region that groups them. Using the same surface for both is what makes a
 * screen read as an undifferentiated field of boxes.</p>
 *
 * <p>PrimeNG's {@code p-panel} underneath, so {@code toggleable} keeps its
 * accessible disclosure behaviour — the toggle button, {@code aria-expanded} and
 * the animation are all PrimeNG's, not a reimplementation.</p>
 *
 * @example
 * <amb-panel title="Filters" toggleable [(collapsed)]="filtersCollapsed">
 *   ...
 * </amb-panel>
 */
@Component({
  selector: 'amb-panel',
  imports: [PanelModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-panel
      [toggleable]="toggleable()"
      [collapsed]="collapsed()"
      (collapsedChange)="collapsed.set($event)"
      [styleClass]="panelClass()"
    >
      <ng-template #header>
        <div class="amb-panel__titles">
          @if (eyebrow()) {
            <span class="amb-eyebrow">{{ eyebrow() }}</span>
          }
          <h2 class="amb-section-title">{{ title() }}</h2>
          @if (subtitle()) {
            <p class="amb-section-subtitle">{{ subtitle() }}</p>
          }
        </div>
      </ng-template>

      <ng-template #icons>
        <div class="amb-panel__actions">
          <ng-content select="[ambActions]" />
        </div>
      </ng-template>

      <ng-content />
    </p-panel>
  `,
  styles: `
    :host {
      display: block;
    }

    .amb-panel__titles {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-1);
      min-width: 0;
    }

    .amb-panel__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--amb-gap-tight);
    }
  `
})
export class AmbientPanelComponent {
  readonly title = input.required<string>();

  readonly subtitle = input<string>();

  readonly eyebrow = input<string>();

  /** Lets the panel collapse to its header. PrimeNG owns the disclosure. */
  readonly toggleable = input(false, { transform: booleanAttribute });

  /** Two-way, so a page can remember the state across a reload if it wants to. */
  readonly collapsed = model(false);

  readonly styleClass = input<string>('');

  protected readonly panelClass = computed(() =>
    ['amb-panel', this.styleClass()].filter(Boolean).join(' ')
  );
}
