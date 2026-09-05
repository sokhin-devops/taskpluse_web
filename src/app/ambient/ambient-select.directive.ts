import { Directive } from '@angular/core';

/**
 * Makes a PrimeNG chooser fill the width it is given.
 *
 * <p>The same job as {@code ambInput}, for the components that render a control
 * rather than an {@code <input>}: {@code p-select}, {@code p-multiselect},
 * {@code p-datepicker}, {@code p-treeselect}, {@code p-cascadeselect}.</p>
 *
 * <p>PrimeNG's own {@code [fluid]} does part of this, but only for the inner
 * layout — the host element still sizes to content. Setting the host width is
 * what actually makes a select line up with the input above it in a form.</p>
 *
 * <p>The overlay panel these open is styled globally in
 * {@code _ambient-components.scss}, because PrimeNG renders it into
 * {@code <body>} through {@code appendTo} where a scoped style cannot reach it.
 * That is also why this directive carries no styling of its own: there would be
 * nowhere consistent to put half of it.</p>
 *
 * @example
 * <p-select ambSelect formControlName="status" [options]="statusChoices" appendTo="body" />
 */
@Directive({
  selector:
    'p-select[ambSelect], p-multiselect[ambSelect], p-datepicker[ambSelect], p-treeselect[ambSelect], p-cascadeselect[ambSelect]',
  host: {
    class: 'amb-select'
  }
})
export class AmbientSelectDirective {}
