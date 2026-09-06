import { HttpErrorResponse } from '@angular/common/http';

import { LocaleService, MessageParams } from '../i18n/locale.service';
import { MessageKey } from '../i18n/messages.en';

/**
 * The error body every non-2xx TaskPulse response uses.
 *
 * `fieldErrors` is a field -> message map, populated only on validation failures (400).
 */
export interface ApiError {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  fieldErrors?: Record<string, string> | null;
}

/**
 * Turns any HTTP failure into a sentence worth showing in a toast.
 *
 * <p>Prefers the server's own words — the field-level messages first, then the general
 * message — because those name the actual problem ("You already have a tag called
 * 'Work'"), which no generic client-side string can. Status 0 is singled out since it
 * means the request never arrived, and telling someone their task could not be saved is
 * less useful than telling them the API is not running.</p>
 *
 * <h2>What is and is not translated</h2>
 *
 * <p>The two strings this function chooses itself are: the unreachable-server line and
 * the fallback. The server's own message is passed through as it arrives, in whatever
 * language the API produced it — almost always English. Translating it here is not
 * possible: it is free text, not a key, and the only honest alternative would be to
 * throw it away in favour of a generic sentence that says less. A user is better served
 * by a precise message in the wrong language than by a vague one in the right one,
 * and the summary line above it in the toast is translated either way.</p>
 *
 * <p>If that trade ever stops being acceptable, the fix is on the server: have it
 * return a stable error code alongside the prose, and key a catalogue entry off that.</p>
 *
 * @param error          the value handed to an RxJS error callback
 * @param i18n           the locale service, for the strings this function chooses
 * @param fallbackKey    message to use when the response carries nothing usable
 * @param fallbackParams values for that message's placeholders — several of the
 *                       fallbacks name the record that failed, e.g.
 *                       {@code '"{title}" could not be deleted.'}
 */
export function toErrorMessage(
  error: unknown,
  i18n: LocaleService,
  fallbackKey: MessageKey = 'common.error.generic',
  fallbackParams?: MessageParams
): string {
  const fallback = (): string => i18n.t(fallbackKey, fallbackParams);

  if (!(error instanceof HttpErrorResponse)) {
    return fallback();
  }

  if (error.status === 0) {
    return i18n.t('common.error.unreachable');
  }

  const body = error.error as ApiError | string | null;
  if (body && typeof body === 'object') {
    const fieldErrors = body.fieldErrors;
    if (fieldErrors) {
      const messages = Object.values(fieldErrors);
      if (messages.length > 0) {
        return messages.join(' ');
      }
    }
    if (body.message) {
      return body.message;
    }
  }

  return fallback();
}
