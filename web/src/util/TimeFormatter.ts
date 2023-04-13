import { DateTime } from "luxon";

/**
 * Convert a Date object to a short date string.
 * @param date Date object to convert
 */
export function formatShortDateTime(date: Date): string {
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATETIME_SHORT);
}

/**
 * Convert a Date object to a long date string.
 * @param date Date object to convert
 */
export function formatLongDateTime(date: Date): string {
  return DateTime.fromJSDate(date).toLocaleString(DateTime.DATETIME_MED);
}
