/**
 * Safe date utilities to handle invalid or edge case dates
 */

import { formatDistanceToNow } from "date-fns";

/**
 * Safely format a date as relative time (e.g., "3 minutes ago")
 * Returns fallback string if date is invalid
 */
export function safeFormatDistanceToNow(
  date: Date | string | number,
  options?: { addSuffix?: boolean },
): string {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn("Invalid date passed to safeFormatDistanceToNow:", date);
      return "unknown time";
    }
    
    // Check if date is in far future (> 1 year from now) - likely corrupted data
    const now = Date.now();
    const oneYearFromNow = now + 365 * 24 * 60 * 60 * 1000;
    if (dateObj.getTime() > oneYearFromNow) {
      console.warn("Date in far future detected:", dateObj);
      return "future date (corrupted?)";
    }
    
    // Check if date is ancient (before 2020) - likely corrupted
    const year2020 = new Date("2020-01-01").getTime();
    if (dateObj.getTime() < year2020) {
      console.warn("Ancient date detected:", dateObj);
      return "long ago (corrupted?)";
    }
    
    return formatDistanceToNow(dateObj, options);
  } catch (err) {
    console.error("Error formatting date:", err, date);
    return "unknown time";
  }
}

/**
 * Check if a date value is valid
 */
export function isValidDate(date: Date | string | number | undefined | null): boolean {
  if (date == null) return false;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}
