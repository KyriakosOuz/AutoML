
import { format, formatISO } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";

// Set Greece timezone (Eastern European Time)
export const GREECE_TIMEZONE = "Europe/Athens";

/**
 * Format a date in Greece timezone
 * @param date Date to format
 * @param formatStr Optional date-fns format string (default: 'PPpp' - locale date & time)
 * @returns Formatted date string in Greece timezone
 */
export function formatDateForGreece(
  date: Date | string | number | null | undefined,
  formatStr: string = "PPpp"
): string {
  if (!date) return "N/A";
  
  const dateObj = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;
    
  if (!dateObj) return "N/A";
  
  try {
    // Convert to Greece timezone then format
    const zonedDate = toZonedTime(dateObj, GREECE_TIMEZONE);
    return formatInTimeZone(zonedDate, GREECE_TIMEZONE, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
}

/**
 * Format a date in ISO format with timezone information
 * @param date Date to format 
 * @returns ISO formatted date string
 */
export function formatToISOWithTimezone(date: Date | null | undefined): string {
  if (!date) return "";
  return formatISO(date);
}

/**
 * Get current date in Greece timezone
 * @returns Date object representing current time in Greece timezone
 */
export function getCurrentGreeceDatetime(): Date {
  return toZonedTime(new Date(), GREECE_TIMEZONE);
}
