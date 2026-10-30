/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ShiftStatus = 'confirmed' | 'pending'; // 확정된 노동시간 vs 미확정 시프트(제출한 시간)

export interface Shift {
  id: string;
  date: string; // YYYY-MM-DD
  hours: number; // e.g. 4, 5.5 (directly entered work hours)
  status: ShiftStatus; // 'confirmed' (blue) | 'pending' (amber/orange)
  memo?: string;
  createdAt: number;
}

export interface RollingWindowViolation {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD (startDate + 6 days)
  totalHours: number;
  confirmedHours: number;
  pendingHours: number;
  exceededHours: number; // totalHours - 28.0
  involvedDates: string[]; // dates in this 7-day window with shifts
}

export interface WindowInfo {
  startDate: string;
  endDate: string;
  otherDaysHours: number;
  currentDayHours: number;
  totalHours: number;
  maxHoursAllowedOnTarget: number; // 28.0 - otherDaysHours
  isViolation: boolean; // > 28.0
  isWarning: boolean; // >= 24.0 and <= 28.0
}

export interface TodaySummary {
  todayDate: string;
  windowStartDate: string; // today - 6 days
  windowEndDate: string; // today
  past7DaysTotalHours: number;
  confirmedHours: number;
  pendingHours: number;
  remainingHours: number; // Math.max(0, 28.0 - past7DaysTotalHours)
  isOverLimit: boolean; // past7DaysTotalHours > 28.0
  isNearLimit: boolean; // past7DaysTotalHours >= 24.0 and <= 28.0
  percentUsed: number;
}

export interface RangeSummary {
  startDate: string;
  endDate: string;
  dayCount: number;
  totalHours: number;
  confirmedHours: number;
  pendingHours: number;
  averageHoursPerDay: number;
  shiftsCount: number;
  is7DayWindow: boolean;
  isOver28Hours: boolean; // if <= 7 days and > 28h, or high average
}

export interface DateCapacityAnalysis {
  targetDate: string;
  existingDayHours: number;
  existingConfirmedHours: number;
  existingPendingHours: number;
  maxAllowedBy7DayRule: number; // min(28.0 - otherDays) across all 7 windows
  maxDailyHours: number; // 7.9 (strictly < 8h)
  maxTotalAllowed: number; // min(maxDailyHours, maxAllowedBy7DayRule)
  additionalAvailableHours: number; // max(0, maxTotalAllowed - existingDayHours)
  bottleneckWindow: WindowInfo | null;
  windows: WindowInfo[];
}

export interface FormValidationResult {
  isValid: boolean;
  hours: number;
  dailyViolation: boolean; // >= 8.0 hours
  dailyErrorMessage?: string;
  rollingViolations: RollingWindowViolation[];
  maxRollingTotalHours: number;
  warningNotice?: string;
}
