/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { addDays, getTodayDateString } from './dateUtils';
import type { Shift, ShiftStatus } from '../types/shift';

export function createShift(
  date: string,
  hours: number,
  status: ShiftStatus = 'confirmed',
  memo?: string
): Shift {
  return {
    id: `shift_${date}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    date,
    hours: Math.round(hours * 10) / 10,
    status,
    memo,
    createdAt: Date.now(),
  };
}

/**
 * Standard realistic schedule with both:
 * - Confirmed shifts (파란색 계열)
 * - Pending shift submissions (주황/노란색 계열)
 */
export function getStandardSampleShifts(): Shift[] {
  const today = getTodayDateString();

  return [
    createShift(addDays(today, -6), 5.0, 'confirmed', '편의점 로손 (확정)'),
    createShift(addDays(today, -5), 4.5, 'confirmed', '이자카야 홀 서빙 (확정)'),
    createShift(addDays(today, -3), 5.0, 'confirmed', '마트 캐셔 (확정)'),
    createShift(addDays(today, -2), 4.0, 'confirmed', '카페 바리스타 (확정)'),
    createShift(addDays(today, 0), 4.0, 'confirmed', '오늘 마감 시프트 (확정)'),
    createShift(addDays(today, 1), 4.5, 'pending', '내일 제출 시프트 (미확정)'),
    createShift(addDays(today, 3), 4.0, 'pending', '주말 추가 시프트 (미확정)'),
  ];
}

/**
 * Schedule designed to test 28-hour limit warnings
 */
export function getViolationDemoShifts(): Shift[] {
  const today = getTodayDateString();

  return [
    createShift(addDays(today, -6), 6.5, 'confirmed', '식당 주방 (확정 6.5h)'),
    createShift(addDays(today, -5), 6.5, 'confirmed', '편의점 마감 (확정 6.5h)'),
    createShift(addDays(today, -4), 6.0, 'confirmed', '이자카야 (확정 6.0h)'),
    createShift(addDays(today, -3), 6.0, 'confirmed', '호텔 연회 (확정 6.0h)'),
    createShift(addDays(today, -1), 5.0, 'pending', '미확정 시프트 추가 -> 7일 누적 30시간 초과!'),
  ];
}
