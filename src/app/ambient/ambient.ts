/**
 * The Ambient UI component layer.
 *
 * <h2>The architecture, in one line</h2>
 *
 * <pre>
 *   PrimeNG  →  Ambient theme + components  →  application screens
 * </pre>
 *
 * <p>Nothing in this layer reimplements a PrimeNG component. Each piece either
 * wraps one — {@code amb-card} is {@code p-card}, {@code amb-dialog} is
 * {@code p-dialog}, {@code amb-badge} is {@code p-tag} — or is a small
 * composition PrimeNG has no equivalent for, such as the page scaffolding and
 * the empty state. That is what keeps the application compatible with PrimeNG's
 * behaviour, its accessibility and its upgrades while looking like one product.</p>
 *
 * <h2>Where a change belongs</h2>
 *
 * <table>
 *   <tr><td>A colour, radius, shadow, spacing or duration</td>
 *       <td>{@code src/styles/ambient/_ambient-tokens.scss}</td></tr>
 *   <tr><td>How a PrimeNG component looks</td>
 *       <td>{@code ambient.preset.ts}, then {@code _ambient-components.scss}</td></tr>
 *   <tr><td>A reusable surface or layout</td>
 *       <td>{@code _ambient-glass.scss} / {@code _ambient-layout.scss}</td></tr>
 *   <tr><td>A reusable piece of UI with behaviour</td>
 *       <td>a component in this folder</td></tr>
 *   <tr><td>Anything that is true of one screen only</td>
 *       <td>that screen's own component</td></tr>
 * </table>
 *
 * <p>The rule of thumb: if two screens would write it the same way, it belongs
 * here; if the second screen would want it slightly different, it does not.</p>
 *
 * <h2>Importing</h2>
 *
 * <p>Screens import the pieces they use by name. {@code AMBIENT_UI} exists for
 * the shell and for screens that use most of the layer, and is a convenience
 * rather than the default — a component that imports fifteen things it does not
 * use is harder to read, not easier.</p>
 *
 * @example
 * imports: [AmbientPageComponent, AmbientCardComponent, AmbientEmptyStateComponent]
 */

import { AmbientAvatarComponent } from './ambient-avatar.component';
import { AmbientBackgroundComponent } from './ambient-background.component';
import { AmbientBadgeComponent } from './ambient-badge.component';
import { AmbientButtonDirective } from './ambient-button.directive';
import { AmbientActionsDirective, AmbientCardComponent } from './ambient-card.component';
import { AmbientDialogComponent } from './ambient-dialog.component';
import { AmbientDropdownComponent } from './ambient-dropdown.component';
import { AmbientEmptyStateComponent } from './ambient-empty-state.component';
import { AmbientFormFieldComponent } from './ambient-form-field.component';
import { AmbientInputDirective } from './ambient-input.directive';
import { AmbientMenuComponent } from './ambient-menu.component';
import { AmbientPageComponent, AmbientPageHeaderComponent } from './ambient-page.component';
import { AmbientPanelComponent } from './ambient-panel.component';
import { AmbientSelectDirective } from './ambient-select.directive';
import { AmbientSidebarComponent } from './ambient-sidebar.component';
import { AmbientStatCardComponent } from './ambient-stat-card.component';
import { AmbientTableComponent } from './ambient-table.component';
import { AmbientTabsComponent } from './ambient-tabs.component';
import { AmbientThemeSwitcherComponent } from './ambient-theme-switcher.component';
import { AmbientToolbarComponent } from './ambient-toolbar.component';

export { AmbientAvatarComponent } from './ambient-avatar.component';
export { AmbientBackgroundComponent } from './ambient-background.component';
export { AmbientBadgeComponent } from './ambient-badge.component';
export type { AmbientBadgeSeverity } from './ambient-badge.component';
export { AmbientButtonDirective } from './ambient-button.directive';
export type { AmbientButtonVariant } from './ambient-button.directive';
export { AmbientActionsDirective, AmbientCardComponent } from './ambient-card.component';
export { AmbientDialogComponent } from './ambient-dialog.component';
export { AmbientDropdownComponent } from './ambient-dropdown.component';
export { AmbientEmptyStateComponent } from './ambient-empty-state.component';
export { AmbientFormFieldComponent } from './ambient-form-field.component';
export { AmbientInputDirective } from './ambient-input.directive';
export { AmbientMenuComponent } from './ambient-menu.component';
export { AmbientPageComponent, AmbientPageHeaderComponent } from './ambient-page.component';
export { AmbientPanelComponent } from './ambient-panel.component';
export {
  AMBIENT_PREFERENCE_KEYS,
  readPreference,
  writePreference
} from './ambient-preferences';
export type { AmbientPreferenceKey } from './ambient-preferences';
export { AmbientPreset } from './ambient.preset';
export { AmbientSelectDirective } from './ambient-select.directive';
export { AmbientSidebarComponent } from './ambient-sidebar.component';
export type { AmbientBrand, AmbientNavLink } from './ambient-sidebar.component';
export { AmbientStatCardComponent } from './ambient-stat-card.component';
export { AmbientTableComponent } from './ambient-table.component';
export { AmbientTabsComponent } from './ambient-tabs.component';
export type { AmbientTab } from './ambient-tabs.component';
export { AmbientThemeSwitcherComponent } from './ambient-theme-switcher.component';
export {
  AMBIENT_ACCENTS,
  AmbientThemeService
} from './ambient-theme.service';
export type {
  AmbientAccent,
  AmbientResolvedScheme,
  AmbientScheme
} from './ambient-theme.service';
export { AmbientToolbarComponent } from './ambient-toolbar.component';

/**
 * Every piece of the layer, for a component that genuinely uses most of it.
 *
 * <p>Angular tree-shakes unused standalone imports, so this costs nothing in the
 * bundle. It costs something in readability, which is why screens should still
 * import what they use.</p>
 */
export const AMBIENT_UI = [
  AmbientActionsDirective,
  AmbientAvatarComponent,
  AmbientBackgroundComponent,
  AmbientBadgeComponent,
  AmbientButtonDirective,
  AmbientCardComponent,
  AmbientDialogComponent,
  AmbientDropdownComponent,
  AmbientEmptyStateComponent,
  AmbientFormFieldComponent,
  AmbientInputDirective,
  AmbientMenuComponent,
  AmbientPageComponent,
  AmbientPageHeaderComponent,
  AmbientPanelComponent,
  AmbientSelectDirective,
  AmbientSidebarComponent,
  AmbientStatCardComponent,
  AmbientTableComponent,
  AmbientTabsComponent,
  AmbientThemeSwitcherComponent,
  AmbientToolbarComponent
] as const;
