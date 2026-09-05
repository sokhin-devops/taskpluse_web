import { Directive } from '@angular/core';

/**
 * Makes a text input fill the width it is given.
 *
 * <p>PrimeNG's text inputs size to their content unless told otherwise, which
 * means every form in a codebase ends up carrying {@code class="w-full"} — and
 * the one that forgets is the field that looks broken. This says the same thing
 * by name.</p>
 *
 * <p>The appearance of an input is not here: it comes from the theme preset and
 * from {@code _ambient-components.scss}, which style {@code .p-inputtext} once
 * for every input in the product. This directive is a layout affordance and a
 * styling hook, nothing more.</p>
 *
 * <p>Inside {@code <amb-form-field>} it is optional — the field already
 * stretches its control. It matters outside one: a search box in a filter bar, a
 * field in a toolbar.</p>
 *
 * @example
 * <input pInputText ambInput type="search" placeholder="Search tasks" />
 */
@Directive({
  selector: 'input[ambInput], textarea[ambInput]',
  host: {
    class: 'amb-input'
  }
})
export class AmbientInputDirective {}
