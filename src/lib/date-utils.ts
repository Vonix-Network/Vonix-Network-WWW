import { formatDistanceToNow } from 'date-fns';

/**
 * Safely formats a timestamp to relative time string
 * Handles both Unix timestamps (numbers) and Date objects/strings
 */
export function formatTimeAgo(timestamp: any): string {
  try {
    // Handle null/undefined
    if (timestamp == null) {
      return 'Unknown time';
    }
    
    let date: Date;
    
    if (timestamp instanceof Date) {
      // Already a Date object
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      // Handle Unix timestamp - check if it's in seconds or milliseconds
      if (timestamp === 0) {
        return 'Unknown time';
      }
      
      // If number is greater than 10 billion, it's milliseconds, otherwise seconds
      date = timestamp > 10000000000 
        ? new Date(timestamp)           // Already in milliseconds (> year 2286)
        : new Date(timestamp * 1000);   // Convert from seconds to milliseconds
    } else if (typeof timestamp === 'string') {
      // Handle ISO string or other date strings
      date = new Date(timestamp);
    } else if (typeof timestamp === 'object' && timestamp !== null) {
      // Handle objects that might have timestamp properties
      if ('getTime' in timestamp && typeof timestamp.getTime === 'function') {
        date = timestamp as Date;
      } else {
        return 'Unknown time';
      }
    } else {
      return 'Unknown time';
    }
    
    // Validate the date
    const time = date.getTime();
    if (isNaN(time) || time < 0) {
      return 'Unknown time';
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return 'Unknown time';
  }
}

/**
 * Safely converts any timestamp format to a Date object
 */
export function toDate(timestamp: number | string | Date): Date {
  try {
    if (typeof timestamp === 'number') {
      return timestamp > 1000000000000 
        ? new Date(timestamp)           // Already in milliseconds
        : new Date(timestamp * 1000);   // Convert from seconds
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp);
    } else if (timestamp instanceof Date) {
      return timestamp;
    }
    
    return new Date(); // Fallback to current time
  } catch {
    return new Date(); // Fallback to current time
  }
}

/**
 * Checks if a timestamp is valid
 */
export function isValidTimestamp(timestamp: any): boolean {
  try {
    const date = toDate(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Strips BBCode tags from text for previews
 */
export function stripBBCode(text: string): string {
  if (!text) return '';
  return text.replace(/\[\/?\w+(?:=[^\]]+)?\]/g, '');
}
