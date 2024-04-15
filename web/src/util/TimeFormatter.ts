import { DateTime } from "luxon";
import * as d3 from "d3";

/**
 * Convert a Date object to a short date string.
 * @param date Date object to convert
 */
export function formatShortDateTime(date: Date | string): string {
    const dateTime = date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date);
    return dateTime.toLocaleString(DateTime.DATETIME_SHORT);
}

/**
 * Convert a Date object to a long date string.
 * @param date Date object to convert
 */
export function formatLongDateTime(date: Date | string): string {
  const dateTime = date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date);
  return dateTime.toLocaleString({
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Convert a Date object to milliseconds part for D3.
 * @param date Date object to convert
 */
export function formatMillisecondPart(date: Date): string {
  return `.${DateTime.fromJSDate(date).toFormat("SSS")}`;
}

/**
 * Covert a Date object to seconds part for D3.
 * @param date Date object to convert
 */
export function formatSecondPart(date: Date): string {
  return `:${DateTime.fromJSDate(date).toFormat("ss")}`;
}

/**
 * Convert a Date object to minutes part for D3.
 * @param date Date object to convert
 */
export function formatMinutePart(date: Date): string {
  const minuteParts = DateTime.fromJSDate(date).toLocaleParts({
    hour: "numeric",
    minute: "2-digit",
  });

  return minuteParts
    .map((p) => p.value)
    .join("")
    .trim();
}

/**
 * Convert a Date object to hours part.
 * @param date Date object to convert
 */
export function formatHourPart(date: Date): string {
  const hourParts = DateTime.fromJSDate(date).toLocaleParts({
    hour: "2-digit",
    minute: "2-digit",
  });

  return hourParts
    .map((p) => p.value)
    .join("")
    .trim();
}

/**
 * Convert a Date object to days part for D3.
 * @param date Date object to convert
 */
export function formatDayPart(date: Date): string {
  return DateTime.fromJSDate(date).toLocaleString({
    day: "numeric",
    month: "short",
  });
}

/**
 * Convert a Date object to months part for D3.
 * @param date Date object to convert
 */
export function formatMonthPart(date: Date): string {
  return DateTime.fromJSDate(date).toLocaleString({
    month: "short",
  });
}

/**
 * Convert a Date object to years part for D3.
 * @param date Date object to convert
 */
export function formatYearPart(date: Date): string {
  return DateTime.fromJSDate(date).toLocaleString({
    year: "numeric",
  });
}

/**
 * D3 Multiformatter
 * @param value Value
 */
export function multiformat(value: Date | d3.NumberValue): string {
  let date: Date | null = null;

  // When a date is provided.
  if (value instanceof Date) {
    date = value;
  }

  // Convert the number value to a date if necessary.
  if (typeof value === "number") {
    date = new Date(value);
  }

  // If the date is invalid, return an empty string.
  if (!date || isNaN(date.getTime())) {
    return "";
  }

  if (d3.timeSecond(date) < date) {
    return formatMillisecondPart(date);
  } else if (d3.timeMinute(date) < date) {
    return formatSecondPart(date);
  } else if (d3.timeHour(date) < date) {
    return formatMinutePart(date);
  } else if (d3.timeDay(date) < date) {
    return formatHourPart(date);
  } else if (d3.timeMonth(date) < date) {
    return formatDayPart(date);
  } else if (d3.timeYear(date) < date) {
    return formatMonthPart(date);
  } else if (d3.timeYear(date) >= date) {
    return formatYearPart(date);
  }

  return "";
}
