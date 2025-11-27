/**
 * Dubai Timezone Utilities
 * Ensures all dates are displayed in Dubai (UAE) time
 */

const DUBAI_TIMEZONE = 'Asia/Dubai';

/**
 * Format date to Dubai timezone
 * @param date Date string, Date object, or timestamp
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string in Dubai time
 */
export function formatDubaiDate(
  date: string | Date | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    ...options,
    timeZone: DUBAI_TIMEZONE
  }).format(dateObj);
}

/**
 * Format date for display (Dubai time)
 */
export function formatDate(date: string | Date | number): string {
  return formatDubaiDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format datetime for display (Dubai time)
 */
export function formatDateTime(date: string | Date | number): string {
  return formatDubaiDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get current Dubai time as Date object
 */
export function getDubaiNow(): Date {
  const now = new Date();
  const dubaiTime = new Date(now.toLocaleString('en-US', { timeZone: DUBAI_TIMEZONE }));
  return dubaiTime;
}

/**
 * Convert any date to Dubai timezone ISO string
 */
export function toDubaiISO(date: string | Date | number): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  const dubaiDate = new Date(dateObj.toLocaleString('en-US', { timeZone: DUBAI_TIMEZONE }));
  return dubaiDate.toISOString();
}

/**
 * Format for MySQL datetime (in Dubai time)
 * Returns: YYYY-MM-DD HH:mm:ss
 */
export function toMySQLDateTime(date: string | Date | number = new Date()): string {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
  const dubaiDate = new Date(dateObj.toLocaleString('en-US', { timeZone: DUBAI_TIMEZONE }));
  
  const year = dubaiDate.getFullYear();
  const month = String(dubaiDate.getMonth() + 1).padStart(2, '0');
  const day = String(dubaiDate.getDate()).padStart(2, '0');
  const hours = String(dubaiDate.getHours()).padStart(2, '0');
  const minutes = String(dubaiDate.getMinutes()).padStart(2, '0');
  const seconds = String(dubaiDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default {
  formatDate,
  formatDateTime,
  formatDubaiDate,
  getDubaiNow,
  toDubaiISO,
  toMySQLDateTime,
  DUBAI_TIMEZONE
};

