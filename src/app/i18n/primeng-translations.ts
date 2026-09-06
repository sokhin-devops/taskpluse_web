import {
  FormStyle,
  TranslationWidth,
  getLocaleDayNames,
  getLocaleFirstDayOfWeek,
  getLocaleMonthNames
} from '@angular/common';
import { Translation } from 'primeng/api';

import { AMBIENT_LOCALE_INFO, AmbientLocale } from './locale';
import { EN_MESSAGES, MessageKey } from './messages.en';
import { KM_MESSAGES } from './messages.km';

/**
 * PrimeNG's own strings, for one language.
 *
 * <h2>Why this is separate from the pipe</h2>
 *
 * <p>PrimeNG renders a month grid, a paginator, an empty-list message and
 * around thirty aria labels from a single configuration object rather than from
 * anything a template can reach. {@code PrimeNG.setTranslation()} is the only
 * way in. {@link LocaleService} calls this in an effect, so the datepicker
 * changes month names at the same moment the rest of the screen changes.</p>
 *
 * <h2>Where the month and day names come from</h2>
 *
 * <p>Angular's CLDR data, not this file. The locale registered in
 * {@code app.config.ts} already carries a maintained, correct set of Khmer
 * month and day names in three widths; typing a second copy of them here would
 * be a list to keep in step with nothing checking that it is. The lookup only
 * works for a locale that has actually been registered, which is the same
 * constraint {@code AmbientLocaleInfo.dateLocale} documents.</p>
 */
export function primeNgTranslation(locale: AmbientLocale): Translation {
  const catalogue = locale === 'km' ? KM_MESSAGES : EN_MESSAGES;
  const dateLocale = AMBIENT_LOCALE_INFO[locale].dateLocale;

  const t = (key: MessageKey): string => catalogue[key];

  return {
    // -- Datepicker ------------------------------------------------------
    //
    // Standalone rather than Format: these names head a column and label a
    // button, they are not embedded in a formatted date. The distinction is
    // real in the languages that inflect; in these two the forms coincide, and
    // asking for the right one costs nothing.
    dayNames: [...getLocaleDayNames(dateLocale, FormStyle.Standalone, TranslationWidth.Wide)],
    dayNamesShort: [
      ...getLocaleDayNames(dateLocale, FormStyle.Standalone, TranslationWidth.Abbreviated)
    ],
    dayNamesMin: [
      ...getLocaleDayNames(dateLocale, FormStyle.Standalone, TranslationWidth.Short)
    ],
    monthNames: [...getLocaleMonthNames(dateLocale, FormStyle.Standalone, TranslationWidth.Wide)],
    monthNamesShort: [
      ...getLocaleMonthNames(dateLocale, FormStyle.Standalone, TranslationWidth.Abbreviated)
    ],
    firstDayOfWeek: getLocaleFirstDayOfWeek(dateLocale),

    today: t('primeng.today'),
    clear: t('primeng.clear'),
    weekHeader: t('primeng.weekHeader'),
    chooseDate: t('primeng.chooseDate'),
    chooseMonth: t('primeng.chooseMonth'),
    chooseYear: t('primeng.chooseYear'),
    prevMonth: t('primeng.prevMonth'),
    nextMonth: t('primeng.nextMonth'),
    prevYear: t('primeng.prevYear'),
    nextYear: t('primeng.nextYear'),
    prevDecade: t('primeng.prevDecade'),
    nextDecade: t('primeng.nextDecade'),

    // The form binds `dateFormat="yy-mm-dd"` explicitly, so the calendar's
    // typed input stays ISO in both languages. That is on purpose: the field
    // round-trips to an API that only accepts that shape, and a locale-shaped
    // input would have to be reformatted on every keystroke.

    // -- Confirmation dialogs, pickers, password -------------------------

    accept: t('primeng.accept'),
    reject: t('primeng.reject'),
    emptyMessage: t('primeng.emptyMessage'),
    emptyFilterMessage: t('primeng.emptyMessage'),
    emptySearchMessage: t('primeng.emptyMessage'),
    emptySelectionMessage: t('primeng.emptySelectionMessage'),
    selectionMessage: t('primeng.selectionMessage'),
    passwordPrompt: t('primeng.passwordPrompt'),
    weak: t('primeng.weak'),
    medium: t('primeng.medium'),
    strong: t('primeng.strong'),

    // -- Screen-reader only ----------------------------------------------
    //
    // Never visible, and therefore the first thing to be left in English by
    // accident. The table's paginator is built almost entirely out of these.
    aria: {
      close: t('primeng.aria.close'),
      previous: t('primeng.aria.previous'),
      next: t('primeng.aria.next'),
      rowsPerPageLabel: t('primeng.aria.rowsPerPage'),
      firstPageLabel: t('primeng.aria.firstPage'),
      lastPageLabel: t('primeng.aria.lastPage'),
      nextPageLabel: t('primeng.aria.nextPage'),
      prevPageLabel: t('primeng.aria.prevPage'),
      previousPageLabel: t('primeng.aria.prevPage'),
      selectAll: t('primeng.aria.selectAll'),
      unselectAll: t('primeng.aria.unselectAll')
    }
  };
}
