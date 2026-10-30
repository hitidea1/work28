/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const KOREAN_DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const;

/**
 * Format a Date object to "YYYY-MM-DD"
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse "YYYY-MM-DD" into a local Date
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Add or subtract days from a "YYYY-MM-DD" string
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

/**
 * Get Korean day name for a "YYYY-MM-DD"
 */
export function getDayOfWeekKorean(dateStr: string): string {
  const d = parseDate(dateStr);
  return KOREAN_DAY_NAMES[d.getDay()];
}

/**
 * Get day of week index (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeekIndex(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

/**
 * Format minutes into "X시간 Y분" and decimal "X.Xh"
 */
export function formatMinutesKorean(minutes: number): string {
  if (minutes <= 0) return '0분 (0h)';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  const decimal = (minutes / 60).toFixed(1);
  if (h === 0) {
    return `${m}분 (${decimal}h)`;
  }
  if (m === 0) {
    return `${h}시간 (${decimal}h)`;
  }
  return `${h}시간 ${m}분 (${decimal}h)`;
}

/**
 * Format minutes to short string like "7h" or "7h 30m"
 */
export function formatMinutesShort(minutes: number): string {
  if (minutes <= 0) return '0h';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Generate all date strings in the range [startDate, endDate] inclusive
 */
export function getDatesRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let curr = startDate;
  while (curr <= endDate) {
    dates.push(curr);
    curr = addDays(curr, 1);
  }
  return dates;
}

/**
 * Get month info for calendar view:
 * returns matrix of weeks (each week has 7 days as YYYY-MM-DD or null if outside month)
 */
export function getMonthCalendarDays(year: number, month: number): {
  date: string;
  isCurrentMonth: boolean;
}[] {
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  const days: { date: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 2, d);
    days.push({
      date: formatDate(prevDate),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const currDate = new Date(year, month - 1, d);
    days.push({
      date: formatDate(currDate),
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete full grid rows (multiple of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month, d);
    days.push({
      date: formatDate(nextDate),
      isCurrentMonth: false,
    });
  }

  return days;
}

/**
 * Get today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return formatDate(new Date());
}
