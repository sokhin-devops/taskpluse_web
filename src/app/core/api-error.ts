import { HttpErrorResponse } from '@angular/common/http';

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
 * @param error    the value handed to an RxJS error callback
 * @param fallback message to use when the response carries nothing usable
 */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'Cannot reach the server. Check that the API is running.';
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

  return fallback;
}
