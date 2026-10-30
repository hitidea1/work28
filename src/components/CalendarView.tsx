/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Edit2,
  Clock,
  Check,
  Send,
  CalendarRange,
} from 'lucide-react';
import {
  getMonthCalendarDays,
  getTodayDateString,
  getDayOfWeekKorean,
} from '../utils/dateUtils';
import { DAILY_LIMIT_HOURS } from '../utils/compliance';
import type { Shift, ShiftStatus } from '../types/shift';

interface CalendarViewProps {
  shifts: Shift[];
  selectedDate: string;
  rangeStartDate?: string;
  rangeEndDate?: string;
  onSelectDate: (date: string) => void;
  onSelectRange?: (start: string, end: string) => void;
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onToggleStatus: (shiftId: string) => void;
  violatingDatesSet: Set<string>;
  warningDatesSet: Set<string>;
  maxRollingForDateMap: Map<string, number>;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  shifts,
  selectedDate,
  rangeStartDate,
  rangeEndDate,
  onSelectDate,
  onSelectRange,
  onEditShift,
  onDeleteShift,
  onToggleStatus,
  violatingDatesSet,
  warningDatesSet,
  maxRollingForDateMap,
}) => {
  const today = getTodayDateString();
  const initialYear = parseInt(today.split('-')[0], 10);
  const initialMonth = parseInt(today.split('-')[1], 10);

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);

  const daysGrid = getMonthCalendarDays(currentYear, currentMonth);

  // Group shifts by date and status
  const shiftsByDate = new Map<string, Shift[]>();
  const totalHoursByDate = new Map<string, { total: number; confirmed: number; pending: number }>();

  for (const shift of shifts) {
    const list = shiftsByDate.get(shift.date) || [];
    list.push(shift);
    shiftsByDate.set(shift.date, list);

    const prev = totalHoursByDate.get(shift.date) || { total: 0, confirmed: 0, pending: 0 };
    if (shift.status === 'confirmed') {
      prev.confirmed = Math.round((prev.confirmed + shift.hours) * 10) / 10;
    } else {
      prev.pending = Math.round((prev.pending + shift.hours) * 10) / 10;
    }
    prev.total = Math.round((prev.confirmed + prev.pending) * 10) / 10;
    totalHoursByDate.set(shift.date, prev);
  }

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth() + 1);
    onSelectDate(getTodayDateString());
  };

  const selectedDayShifts = shiftsByDate.get(selectedDate) || [];
  const selectedDayTotals = totalHoursByDate.get(selectedDate) || { total: 0, confirmed: 0, pending: 0 };
  const isSelectedDateViolating = violatingDatesSet.has(selectedDate);
  const isSelectedDateWarning = warningDatesSet.has(selectedDate);

  const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const currentMonthShifts = shifts.filter((s) => s.date.startsWith(currentMonthPrefix));
  const currentMonthTotal = currentMonthShifts.reduce((acc, s) => acc + s.hours, 0);
  const currentMonthConfirmed = currentMonthShifts
    .filter((s) => s.status === 'confirmed')
    .reduce((acc, s) => acc + s.hours, 0);
  const currentMonthPending = currentMonthShifts
    .filter((s) => s.status === 'pending')
    .reduce((acc, s) => acc + s.hours, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      {/* Month Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {currentYear}년 {currentMonth}월
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Totals with Green (Confirmed) & Gray (Pending) */}
        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
          <span>
            이번 달 총:{' '}
            <strong className="text-slate-900 tabular-nums font-bold">
              {currentMonthTotal.toFixed(1)}h
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 font-semibold">
            확정: {currentMonthConfirmed.toFixed(1)}h
          </span>
          <span aria-hidden="true">·</span>
          <span className="text-slate-600 font-semibold">
            미확정: {currentMonthPending.toFixed(1)}h
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 py-2.5 text-[11px] text-slate-500 border-b border-slate-100 overflow-x-auto">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          <span className="font-medium text-slate-700">확정된 노동시간 (초록색)</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
          <span className="font-medium text-slate-700">미확정 시프트 (회색)</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span className="font-medium text-slate-700">규정 위반 (빨간색)</span>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
        <span className="text-rose-500">일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span className="text-blue-500">토</span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 pt-2">
        {daysGrid.map(({ date, isCurrentMonth }) => {
          const dayNumber = parseInt(date.split('-')[2], 10);
          const isToday = date === today;
          const isSelected = date === selectedDate;
          const dayStatus = totalHoursByDate.get(date) || { total: 0, confirmed: 0, pending: 0 };
          const isViolating = violatingDatesSet.has(date) || dayStatus.total >= DAILY_LIMIT_HOURS;
          const isWarning = warningDatesSet.has(date) && !isViolating;

          const isInSelectedRange =
            rangeStartDate && rangeEndDate && date >= rangeStartDate && date <= rangeEndDate;

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`min-h-[74px] sm:min-h-[82px] p-1.5 rounded-xl text-left flex flex-col justify-between transition-all relative border ${
                isSelected
                  ? 'ring-2 ring-slate-900 border-slate-900 z-10'
                  : isInSelectedRange
                  ? 'bg-slate-100/80 border-slate-400'
                  : 'hover:border-slate-300'
              } ${
                isViolating
                  ? 'bg-rose-50/70 border-rose-300 text-rose-950'
                  : isWarning
                  ? 'bg-amber-50/50 border-amber-200 text-amber-950'
                  : !isCurrentMonth
                  ? 'bg-slate-50/60 border-slate-100 text-slate-300'
                  : 'bg-white border-slate-200/80 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]'
                      : !isCurrentMonth
                      ? 'text-slate-300'
                      : 'text-slate-700'
                  }`}
                >
                  {dayNumber}
                </span>

                {isViolating ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                ) : isWarning ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                ) : null}
              </div>

              {/* Status Pills: Blue (Confirmed) & Amber (Pending) */}
              <div className="mt-auto w-full space-y-0.5">
                {dayStatus.confirmed > 0 && (
                  <div className="rounded px-1 py-0.2 text-[9px] font-bold tabular-nums bg-emerald-600 text-white truncate">
                    확정 {dayStatus.confirmed.toFixed(1)}h
                  </div>
                )}
                {dayStatus.pending > 0 && (
                  <div className="rounded px-1 py-0.2 text-[9px] font-bold tabular-nums bg-slate-500 text-white truncate">
                    미확정 {dayStatus.pending.toFixed(1)}h
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Day Info */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              {selectedDate} ({getDayOfWeekKorean(selectedDate)}요일)
            </span>
            {isSelectedDateViolating && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                위반 일자
              </span>
            )}
          </div>
          <div className="text-xs text-slate-600">
            총 근무:{' '}
            <strong className="text-slate-900">{selectedDayTotals.total.toFixed(1)}시간</strong>
            {selectedDayTotals.confirmed > 0 && (
              <span className="text-emerald-700 ml-1 font-semibold">
                (확정 {selectedDayTotals.confirmed.toFixed(1)}h)
              </span>
            )}
            {selectedDayTotals.pending > 0 && (
              <span className="text-slate-600 ml-1 font-semibold">
                (미확정 {selectedDayTotals.pending.toFixed(1)}h)
              </span>
            )}
          </div>
        </div>

        {selectedDayShifts.length === 0 ? (
          <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
            등록된 근무 기록이나 시프트가 없습니다.
          </div>
        ) : (
          <div className="space-y-1.5">
            {selectedDayShifts.map((shift) => (
              <div
                key={shift.id}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  shift.status === 'confirmed'
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      shift.status === 'confirmed'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-500 text-white'
                    }`}
                  >
                    {shift.status === 'confirmed' ? '확정' : '미확정'}
                  </span>
                  <span className="font-bold tabular-nums">{shift.hours.toFixed(1)}시간</span>
                  {shift.memo && <span className="opacity-80">{shift.memo}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(shift.id)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                    title={shift.status === 'confirmed' ? '미확정으로 전환' : '확정으로 전환'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEditShift(shift)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteShift(shift.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
