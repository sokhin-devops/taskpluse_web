import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';

/**
 * A label, the control it names, and whatever the control has to say about
 * itself.
 *
 * <p>The accessibility of a form is mostly decided here, and it is decided by
 * one attribute: {@code for}. It must be the {@code id} of the control projected
 * inside — {@code inputId} on a PrimeNG component, {@code id} on a plain input.
 * Without it the label is decorative text and a screen reader announces the
 * field as unlabelled.</p>
 *
 * <h2>Error before hint</h2>
 *
 * <p>Only one of the two is ever shown. A hint that stays on screen underneath an
 * error competes with it for the same line of attention, and the error is the
 * one the user needs. The error is also {@code role="alert"}, so it is announced
 * when it appears rather than only when the field is next visited.</p>
 *
 * <h2>Required</h2>
 *
 * <p>The marker is decorative — {@code aria-hidden} — because the control itself
 * carries {@code required}, and an asterisk read aloud as "star" tells nobody
 * anything.</p>
 *
 * @example
 * <amb-form-field label="Title" for="task-title" [error]="titleError()">
 *   <input id="task-title" pInputText formControlName="title" ambInput />
 * </amb-form-field>
 */
@Component({
  selector: 'amb-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (for()) {
      <label class="amb-field__label" [attr.for]="for()">
        {{ label() }}@if (required()) {<span class="amb-field__required" aria-hidden="true">*</span>}
      </label>
    } @else {
      <!-- No control to point at: a group of radios or swatches, where the
           grouping element carries aria-labelledby instead. -->
      <span class="amb-field__label" [attr.id]="labelId()">
        {{ label() }}@if (required()) {<span class="amb-field__required" aria-hidden="true">*</span>}
      </span>
    }

    <div class="amb-field__control">
      <ng-content />
    </div>

    @if (error()) {
      <small class="amb-field__error" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
        {{ error() }}
      </small>
    } @else if (hint()) {
      <small class="amb-field__hint">{{ hint() }}</small>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--amb-space-2);
      min-width: 0;
    }

    .amb-field__label {
      font-size: var(--amb-text-sm);
      font-weight: var(--amb-weight-medium);
      line-height: var(--amb-leading-snug);
      color: var(--amb-text-muted);
    }

    .amb-field__required {
      margin-left: 0.125rem;
      color: var(--amb-danger);
    }

    // The control is stretched, so a PrimeNG component that is not fluid
    // still fills the field rather than sitting at its intrinsic width.
    .amb-field__control {
      display: flex;
      flex-direction: column;
      min-width: 0;

      > * {
        width: 100%;
      }
    }

    .amb-field__error {
      display: flex;
      align-items: center;
      gap: var(--amb-space-1);
      font-size: var(--amb-text-sm);
      line-height: var(--amb-leading-snug);
      color: var(--amb-danger);

      i {
        font-size: var(--amb-text-xs);
      }
    }

    .amb-field__hint {
      font-size: var(--amb-text-sm);
      line-height: var(--amb-leading-snug);
      color: var(--amb-text-subtle);
    }
  `
})
export class AmbientFormFieldComponent {
  readonly label = input.required<string>();

  /**
   * The `id` of the control this labels. Required for a real form control;
   * omit only for a group that labels itself through `aria-labelledby`.
   */
  readonly for = input<string>();

  /** Used as the label's own `id` when there is no single control to point at. */
  readonly labelId = input<string>();

  /** Shown instead of the hint, and announced when it appears. */
  readonly error = input<string>();

  /** Shown only while there is no error. */
  readonly hint = input<string>();

  readonly required = input(false, { transform: booleanAttribute });
}
