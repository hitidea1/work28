/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addDays, getTodayDateString, parseDate, getDatesRange } from './dateUtils';
import type {
  DateCapacityAnalysis,
  FormValidationResult,
  RangeSummary,
  RollingWindowViolation,
  Shift,
  TodaySummary,
  WindowInfo,
} from '../types/shift';

export const DAILY_LIMIT_HOURS = 8.0; // Strictly < 8 hours required
export const MAX_SAFE_DAILY_HOURS = 7.9; // Representation of strictly less than 8h
export const ROLLING_7DAYS_LIMIT_HOURS = 28.0;
export const ROLLING_7DAYS_WARNING_HOURS = 24.0;

/**
 * Round to 1 decimal place to prevent floating point inaccuracies
 */
export function round1(num: number): number {
  return Math.round((num + Number.EPSILON) * 10) / 10;
}

/**
 * Group shifts and calculate daily total hours map: date -> totalHours
 */
export function getDailyHoursMap(
  shifts: Shift[],
  excludeShiftId?: string
): Map<string, number> {
  const map = new Map<string, number>();
  for (const shift of shifts) {
    if (excludeShiftId && shift.id === excludeShiftId) continue;
    const current = map.get(shift.date) || 0;
    map.set(shift.date, round1(current + shift.hours));
  }
  return map;
}

/**
 * Breakdown daily map by status
 */
export function getDailyStatusHoursMap(
  shifts: Shift[],
  excludeShiftId?: string
): Map<string, { total: number; confirmed: number; pending: number }> {
  const map = new Map<string, { total: number; confirmed: number; pending: number }>();
  for (const shift of shifts) {
    if (excludeShiftId && shift.id === excludeShiftId) continue;
    const current = map.get(shift.date) || { total: 0, confirmed: 0, pending: 0 };
    if (shift.status === 'confirmed') {
      current.confirmed = round1(current.confirmed + shift.hours);
    } else {
      current.pending = round1(current.pending + shift.hours);
    }
    current.total = round1(current.confirmed + current.pending);
    map.set(shift.date, current);
  }
  return map;
}

/**
 * Get total work hours for a specific 7-day window [startDate, startDate + 6 days]
 */
export function getWindowTotalHours(
  dailyMap: Map<string, number>,
  startDate: string,
  shifts?: Shift[]
): {
  totalHours: number;
  confirmedHours: number;
  pendingHours: number;
  involvedDates: string[];
} {
  let total = 0;
  let confirmed = 0;
  let pending = 0;
  const involvedDates: string[] = [];

  const endDate = addDays(startDate, 6);

  if (shifts) {
    for (const s of shifts) {
      if (s.date >= startDate && s.date <= endDate) {
        if (s.status === 'confirmed') {
          confirmed = round1(confirmed + s.hours);
        } else {
          pending = round1(pending + s.hours);
        }
      }
    }
  }

  for (let i = 0; i < 7; i++) {
    const d = addDays(startDate, i);
    const hrs = dailyMap.get(d) || 0;
    if (hrs > 0) {
      total = round1(total + hrs);
      involvedDates.push(d);
    }
  }

  return {
    totalHours: total,
    confirmedHours: confirmed,
    pendingHours: pending,
    involvedDates,
  };
}

/**
 * Calculates Today's Summary Card data:
 * Window [Today - 6 days ~ Today] (total 7 days)
 */
export function getTodaySummary(shifts: Shift[], targetToday?: string): TodaySummary {
  const todayDate = targetToday || getTodayDateString();
  const windowStartDate = addDays(todayDate, -6);
  const dailyMap = getDailyHoursMap(shifts);

  const { totalHours, confirmedHours, pendingHours } = getWindowTotalHours(
    dailyMap,
    windowStartDate,
    shifts
  );
  const remainingHours = round1(Math.max(0, ROLLING_7DAYS_LIMIT_HOURS - totalHours));
  const isOverLimit = totalHours > ROLLING_7DAYS_LIMIT_HOURS;
  const isNearLimit = totalHours >= ROLLING_7DAYS_WARNING_HOURS && !isOverLimit;
  const percentUsed = Math.min(100, Math.round((totalHours / ROLLING_7DAYS_LIMIT_HOURS) * 100));

  return {
    todayDate,
    windowStartDate,
    windowEndDate: todayDate,
    past7DaysTotalHours: totalHours,
    confirmedHours,
    pendingHours,
    remainingHours,
    isOverLimit,
    isNearLimit,
    percentUsed,
  };
}

/**
 * Calculates Range Summary for any arbitrary [startDate, endDate]
 */
export function calculateRangeSummary(
  startDate: string,
  endDate: string,
  shifts: Shift[]
): RangeSummary {
  // Ensure start <= end
  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;

  const dates = getDatesRange(start, end);
  const dayCount = dates.length;

  let totalHours = 0;
  let confirmedHours = 0;
  let pendingHours = 0;
  let shiftsCount = 0;

  for (const s of shifts) {
    if (s.date >= start && s.date <= end) {
      shiftsCount++;
      totalHours = round1(totalHours + s.hours);
      if (s.status === 'confirmed') {
        confirmedHours = round1(confirmedHours + s.hours);
      } else {
        pendingHours = round1(pendingHours + s.hours);
      }
    }
  }

  const averageHoursPerDay = dayCount > 0 ? round1(totalHours / dayCount) : 0;
  const is7DayWindow = dayCount === 7;
  const isOver28Hours = totalHours > ROLLING_7DAYS_LIMIT_HOURS;

  return {
    startDate: start,
    endDate: end,
    dayCount,
    totalHours,
    confirmedHours,
    pendingHours,
    averageHoursPerDay,
    shiftsCount,
    is7DayWindow,
    isOver28Hours,
  };
}

/**
 * Evaluate all compliance across the entire schedule history
 */
export function evaluateAllCompliance(shifts: Shift[]): {
  dailyViolations: { date: string; totalHours: number; shifts: Shift[] }[];
  rollingViolations: RollingWindowViolation[];
  violatingDatesSet: Set<string>;
  warningDatesSet: Set<string>;
  maxRollingForDateMap: Map<string, number>;
} {
  const dailyMap = getDailyHoursMap(shifts);
  const dailyViolations: { date: string; totalHours: number; shifts: Shift[] }[] = [];
  const violatingDatesSet = new Set<string>();
  const warningDatesSet = new Set<string>();
  const maxRollingForDateMap = new Map<string, number>();

  const shiftsByDate = new Map<string, Shift[]>();
  for (const s of shifts) {
    const list = shiftsByDate.get(s.date) || [];
    list.push(s);
    shiftsByDate.set(s.date, list);
  }

  // 1. Daily 8h rule check (< 8.0h)
  for (const [date, hrs] of dailyMap.entries()) {
    if (hrs >= DAILY_LIMIT_HOURS) {
      dailyViolations.push({
        date,
        totalHours: hrs,
        shifts: shiftsByDate.get(date) || [],
      });
      violatingDatesSet.add(date);
    }
  }

  // 2. Rolling 7-day windows check (<= 28.0h)
  const activeDates = Array.from(dailyMap.keys()).sort();
  const rollingViolations: RollingWindowViolation[] = [];

  if (activeDates.length > 0) {
    const minDate = activeDates[0];
    const maxDate = activeDates[activeDates.length - 1];

    let checkStart = addDays(minDate, -6);
    const checkEnd = maxDate;

    while (checkStart <= checkEnd) {
      const { totalHours, confirmedHours, pendingHours, involvedDates } = getWindowTotalHours(
        dailyMap,
        checkStart,
        shifts
      );
      const endDate = addDays(checkStart, 6);

      if (totalHours > ROLLING_7DAYS_LIMIT_HOURS) {
        rollingViolations.push({
          startDate: checkStart,
          endDate,
          totalHours,
          confirmedHours,
          pendingHours,
          exceededHours: round1(totalHours - ROLLING_7DAYS_LIMIT_HOURS),
          involvedDates,
        });

        for (const d of involvedDates) {
          violatingDatesSet.add(d);
        }
      } else if (totalHours >= ROLLING_7DAYS_WARNING_HOURS) {
        for (const d of involvedDates) {
          if (!violatingDatesSet.has(d)) {
            warningDatesSet.add(d);
          }
        }
      }

      // Record max rolling total for each involved date
      for (let i = 0; i < 7; i++) {
        const d = addDays(checkStart, i);
        if (dailyMap.has(d)) {
          const prev = maxRollingForDateMap.get(d) || 0;
          if (totalHours > prev) {
            maxRollingForDateMap.set(d, totalHours);
          }
        }
      }

      checkStart = addDays(checkStart, 1);
    }
  }

  return {
    dailyViolations,
    rollingViolations,
    violatingDatesSet,
    warningDatesSet,
    maxRollingForDateMap,
  };
}

/**
 * Validate candidate shift before saving:
 * Checks daily limit (< 8h) and all 7 affected rolling 7-day windows.
 */
export function validateCandidateShift(
  date: string,
  hours: number,
  allShifts: Shift[],
  editingShiftId?: string
): FormValidationResult {
  const candidateHours = round1(hours || 0);
  const dailyMap = getDailyHoursMap(allShifts, editingShiftId);
  const existingOnDate = dailyMap.get(date) || 0;
  const newDayTotalHours = round1(existingOnDate + candidateHours);

  // 1. Daily rule: strictly < 8 hours
  const dailyViolation = newDayTotalHours >= DAILY_LIMIT_HOURS;
  let dailyErrorMessage: string | undefined;

  if (dailyViolation) {
    dailyErrorMessage = `하루 노동시간은 8시간 미만이어야 합니다. (입력 시 해당 일자 총 근무: ${newDayTotalHours}시간)`;
  }

  // Set simulated day total
  dailyMap.set(date, newDayTotalHours);

  // 2. Check 7 rolling windows
  const rollingViolations: RollingWindowViolation[] = [];
  let maxRollingTotalHours = 0;

  for (let offset = 0; offset <= 6; offset++) {
    const windowStart = addDays(date, -offset);
    const windowEnd = addDays(windowStart, 6);
    const { totalHours, confirmedHours, pendingHours, involvedDates } = getWindowTotalHours(
      dailyMap,
      windowStart,
      allShifts
    );

    if (totalHours > maxRollingTotalHours) {
      maxRollingTotalHours = totalHours;
    }

    if (totalHours > ROLLING_7DAYS_LIMIT_HOURS) {
      rollingViolations.push({
        startDate: windowStart,
        endDate: windowEnd,
        totalHours,
        confirmedHours,
        pendingHours,
        exceededHours: round1(totalHours - ROLLING_7DAYS_LIMIT_HOURS),
        involvedDates,
      });
    }
  }

  const isValid = !dailyViolation && rollingViolations.length === 0;

  let warningNotice: string | undefined;
  if (isValid && maxRollingTotalHours >= ROLLING_7DAYS_WARNING_HOURS) {
    warningNotice = `주의: 이 근무를 추가하면 해당 구간의 연속 7일 누적 근무가 ${maxRollingTotalHours}시간으로 28시간 한도에 근접합니다.`;
  }

  return {
    isValid,
    hours: candidateHours,
    dailyViolation,
    dailyErrorMessage,
    rollingViolations,
    maxRollingTotalHours,
    warningNotice,
  };
}

/**
 * Smart Shift Recommendation / Capacity Analysis for a specific target date
 */
export function analyzeDateCapacity(
  targetDate: string,
  shifts: Shift[],
  excludeShiftId?: string,
  includePending: boolean = true
): DateCapacityAnalysis {
  const filteredShifts = includePending
    ? shifts
    : shifts.filter((s) => s.status === 'confirmed');

  const dailyMap = getDailyHoursMap(filteredShifts, excludeShiftId);
  const statusMap = getDailyStatusHoursMap(shifts, excludeShiftId);

  const existingStatus = statusMap.get(targetDate) || { total: 0, confirmed: 0, pending: 0 };
  const existingDayHours = includePending ? existingStatus.total : existingStatus.confirmed;

  const maxDailyHours = MAX_SAFE_DAILY_HOURS; // 7.9h

  const windows: WindowInfo[] = [];
  let minAllowedByAnyWindow = Infinity;
  let bottleneckWindow: WindowInfo | null = null;

  for (let offset = 6; offset >= 0; offset--) {
    const windowStart = addDays(targetDate, -offset);
    const windowEnd = addDays(windowStart, 6);

    let otherDaysHours = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(windowStart, i);
      if (d !== targetDate) {
        otherDaysHours = round1(otherDaysHours + (dailyMap.get(d) || 0));
      }
    }

    const maxAllowedOnTarget = round1(Math.max(0, ROLLING_7DAYS_LIMIT_HOURS - otherDaysHours));
    const totalHours = round1(otherDaysHours + existingDayHours);
    const isViolation = totalHours > ROLLING_7DAYS_LIMIT_HOURS;
    const isWarning = totalHours >= ROLLING_7DAYS_WARNING_HOURS && !isViolation;

    const windowInfo: WindowInfo = {
      startDate: windowStart,
      endDate: windowEnd,
      otherDaysHours,
      currentDayHours: existingDayHours,
      totalHours,
      maxHoursAllowedOnTarget: maxAllowedOnTarget,
      isViolation,
      isWarning,
    };

    windows.push(windowInfo);

    if (maxAllowedOnTarget < minAllowedByAnyWindow) {
      minAllowedByAnyWindow = maxAllowedOnTarget;
      bottleneckWindow = windowInfo;
    }
  }

  const maxAllowedBy7DayRule = Number.isFinite(minAllowedByAnyWindow)
    ? minAllowedByAnyWindow
    : ROLLING_7DAYS_LIMIT_HOURS;

  const maxTotalAllowed = round1(Math.min(maxDailyHours, maxAllowedBy7DayRule));
  const additionalAvailableHours = round1(Math.max(0, maxTotalAllowed - existingDayHours));

  return {
    targetDate,
    existingDayHours,
    existingConfirmedHours: existingStatus.confirmed,
    existingPendingHours: existingStatus.pending,
    maxAllowedBy7DayRule,
    maxDailyHours,
    maxTotalAllowed,
    additionalAvailableHours,
    bottleneckWindow,
    windows,
  };
}
