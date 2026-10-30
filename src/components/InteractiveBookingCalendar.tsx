/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import {
  getMonthCalendarDays,
  getTodayDateString,
  getDayOfWeekKorean,
  addDays,
} from '../utils/dateUtils';
import {
  calculateRangeSummary,
  DAILY_LIMIT_HOURS,
  ROLLING_7DAYS_LIMIT_HOURS,
} from '../utils/compliance';
import type { Shift, RangeSummary } from '../types/shift';

interface InteractiveBookingCalendarProps {
  shifts: Shift[];
  selectedDate: string;
  rangeStart: string;
  rangeEnd: string;
  onSelectDate: (date: string) => void;
  onRangeChange: (start: string, end: string) => void;
  violatingDatesSet: Set<string>;
  warningDatesSet: Set<string>;
  maxRollingForDateMap: Map<string, number>;
}

export const InteractiveBookingCalendar: React.FC<InteractiveBookingCalendarProps> = ({
  shifts,
  selectedDate,
  rangeStart,
  rangeEnd,
  onSelectDate,
  onRangeChange,
  violatingDatesSet,
  warningDatesSet,
  maxRollingForDateMap,
}) => {
  const today = getTodayDateString();
  const initialYear = parseInt(today.split('-')[0], 10);
  const initialMonth = parseInt(today.split('-')[1], 10);

  const [currentYear, setCurrentYear] = useState<number>(initialYear);
  const [currentMonth, setCurrentMonth] = useState<number>(initialMonth);

  // For flight/hotel style interactive click & hover range selection
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [isPickingRange, setIsPickingRange] = useState<boolean>(false);

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

  // Active range calculation
  const activeStart = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
  const activeEnd = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
  const rangeSummary: RangeSummary = calculateRangeSummary(activeStart, activeEnd, shifts);

  // Flight/hotel click handler
  const handleDateClick = (clickedDate: string) => {
    onSelectDate(clickedDate);

    if (!isPickingRange) {
      // First click: sets start date, waiting for second date
      onRangeChange(clickedDate, clickedDate);
      setIsPickingRange(true);
    } else {
      // Second click: completes range
      if (clickedDate < rangeStart) {
        onRangeChange(clickedDate, rangeStart);
      } else {
        onRangeChange(rangeStart, clickedDate);
      }
      setIsPickingRange(false);
      setHoverDate(null);
    }
  };

  const handleApplyNext7Days = () => {
    onRangeChange(today, addDays(today, 6));
    onSelectDate(today);
    setIsPickingRange(false);
  };

  const handleApplyPast7Days = () => {
    onRangeChange(addDays(today, -6), today);
    onSelectDate(today);
    setIsPickingRange(false);
  };

  const handleResetRange = () => {
    onRangeChange(today, today);
    onSelectDate(today);
    setIsPickingRange(false);
  };

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

  // Preview effective range while hovering
  let effectiveStart = activeStart;
  let effectiveEnd = activeEnd;
  if (isPickingRange && hoverDate) {
    effectiveStart = hoverDate < rangeStart ? hoverDate : rangeStart;
    effectiveEnd = hoverDate < rangeStart ? rangeStart : hoverDate;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-6 transition-all">
      {/* 1. Airline / Hotel Style Range Banner & Stats Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-md">
                인터랙티브 기간 선택
              </span>
              {isPickingRange ? (
                <span className="text-xs text-amber-400 font-semibold animate-pulse">
                  종료일을 달력에서 클릭하세요
                </span>
              ) : (
                <span className="text-xs text-slate-400">
                  달력에서 날짜를 2번 클릭하여 기간을 지정하세요
                </span>
              )}
            </div>

            {/* Flight Booking Style Range Route Display */}
            <div className="flex items-center gap-2.5 sm:gap-4 mt-2">
              <div className="text-left">
                <div className="text-[11px] text-slate-400 font-medium">시작일</div>
                <div className="text-base sm:text-xl font-bold tracking-tight text-white tabular-nums">
                  {activeStart}
                  <span className="text-xs text-blue-300 font-semibold ml-1.5">
                    ({getDayOfWeekKorean(activeStart)})
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center px-1">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {rangeSummary.dayCount}일간
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 my-0.5" />
              </div>

              <div className="text-left">
                <div className="text-[11px] text-slate-400 font-medium">종료일</div>
                <div className="text-base sm:text-xl font-bold tracking-tight text-white tabular-nums">
                  {activeEnd}
                  <span className="text-xs text-blue-300 font-semibold ml-1.5">
                    ({getDayOfWeekKorean(activeEnd)})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleApplyNext7Days}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeStart === today && activeEnd === addDays(today, 6)
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              오늘부터 7일간
            </button>
            <button
              type="button"
              onClick={handleApplyPast7Days}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                activeStart === addDays(today, -6) && activeEnd === today
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              최근 7일간
            </button>
            <button
              type="button"
              onClick={handleResetRange}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="선택 초기화"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calculated Stats Strip for Selected Range */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">선택 기간 총 노동시간</div>
            <div className="text-xl sm:text-2xl font-extrabold text-white tabular-nums tracking-tight mt-0.5">
              {rangeSummary.totalHours.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">시간</span>
            </div>
          </div>

          <div>
            <div className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>확정된 시간</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums tracking-tight mt-0.5">
              {rangeSummary.confirmedHours.toFixed(1)}
              <span className="text-xs font-normal text-emerald-400/70 ml-1">시간</span>
            </div>
          </div>

          <div>
            <div className="text-slate-300 text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span>미확정 시프트</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-300 tabular-nums tracking-tight mt-0.5">
              {rangeSummary.pendingHours.toFixed(1)}
              <span className="text-xs font-normal text-slate-400 ml-1">시간</span>
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px]">
              {rangeSummary.is7DayWindow ? '연속 7일 규정 진단' : '일평균 노동시간'}
            </div>
            <div className="text-sm sm:text-base font-bold text-white tabular-nums mt-1">
              {rangeSummary.is7DayWindow ? (
                rangeSummary.totalHours > ROLLING_7DAYS_LIMIT_HOURS ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>28h 초과! (+{(rangeSummary.totalHours - 28).toFixed(1)}h)</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>정상 (버퍼 {(28 - rangeSummary.totalHours).toFixed(1)}h)</span>
                  </span>
                )
              ) : (
                <span>{rangeSummary.averageHoursPerDay.toFixed(1)}h / 일</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Month Navigation Toolbar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
            {currentYear}년 {currentMonth}월
          </h2>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              오늘
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="다음 달"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="font-semibold text-slate-700">확정 (초록)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            <span className="font-semibold text-slate-700">미확정 (회색)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="font-semibold text-slate-700">위반</span>
          </div>
        </div>
      </div>

      {/* 3. Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 text-center py-2 text-xs font-bold text-slate-500">
        <span className="text-rose-500">일</span>
        <span>월</span>
        <span>화</span>
        <span>수</span>
        <span>목</span>
        <span>금</span>
        <span className="text-blue-500">토</span>
      </div>

      {/* 4. Large Interactive Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-1.5 gap-x-1 pt-1">
        {daysGrid.map(({ date, isCurrentMonth }) => {
          const dayNumber = parseInt(date.split('-')[2], 10);
          const isToday = date === today;
          const isSelectedTarget = date === selectedDate;
          const dayStatus = totalHoursByDate.get(date) || { total: 0, confirmed: 0, pending: 0 };
          const isViolating = violatingDatesSet.has(date) || dayStatus.total >= DAILY_LIMIT_HOURS;
          const isWarning = warningDatesSet.has(date) && !isViolating;

          // Flight/Hotel Range Geometry
          const isRangeStart = date === effectiveStart;
          const isRangeEnd = date === effectiveEnd;
          const isSingleDayRange = isRangeStart && isRangeEnd;
          const isInsideRange = date >= effectiveStart && date <= effectiveEnd;

          // Styling logic for flight/hotel range bands
          let cellBackground = 'bg-white hover:bg-slate-50';
          let textColor = isCurrentMonth ? 'text-slate-800' : 'text-slate-300';
          let borderStyle = 'border border-slate-200/70';

          if (isInsideRange) {
            cellBackground = 'bg-blue-50/90 text-blue-950';
            borderStyle = 'border-y border-blue-200/80';
          }

          if (isRangeStart) {
            borderStyle = 'border-y border-l border-blue-600';
          }
          if (isRangeEnd) {
            borderStyle = 'border-y border-r border-blue-600';
          }

          if (isViolating) {
            cellBackground = 'bg-rose-50/80 text-rose-950 border border-rose-300';
          }

          return (
            <div
              key={date}
              onMouseEnter={() => {
                if (isPickingRange) {
                  setHoverDate(date);
                }
              }}
              className={`relative py-0.5 ${
                isRangeStart && isRangeEnd
                  ? 'rounded-2xl'
                  : isRangeStart
                  ? 'rounded-l-2xl'
                  : isRangeEnd
                  ? 'rounded-r-2xl'
                  : ''
              } ${isInsideRange ? 'bg-blue-100/70' : ''}`}
            >
              <button
                type="button"
                onClick={() => handleDateClick(date)}
                className={`w-full min-h-[78px] sm:min-h-[88px] p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all relative ${
                  isRangeStart && isRangeEnd
                    ? 'rounded-2xl bg-blue-600 text-white shadow-md z-20 ring-2 ring-blue-700'
                    : isRangeStart
                    ? 'rounded-l-2xl bg-blue-600 text-white shadow-sm z-10'
                    : isRangeEnd
                    ? 'rounded-r-2xl bg-blue-600 text-white shadow-sm z-10'
                    : isInsideRange
                    ? 'bg-blue-100/90 text-blue-950 font-semibold hover:bg-blue-200/90'
                    : cellBackground
                } ${
                  isSelectedTarget && !isRangeStart && !isRangeEnd
                    ? 'ring-2 ring-slate-900 border-slate-900 z-10'
                    : !isInsideRange
                    ? borderStyle
                    : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-bold tabular-nums ${
                      isRangeStart || isRangeEnd
                        ? 'text-white'
                        : isToday
                        ? 'w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px]'
                        : textColor
                    }`}
                  >
                    {dayNumber}
                  </span>

                  {/* Violation Alert Icons */}
                  {isViolating ? (
                    <AlertCircle
                      className={`w-3.5 h-3.5 ${
                        isRangeStart || isRangeEnd ? 'text-white' : 'text-rose-600'
                      } shrink-0`}
                    />
                  ) : isWarning ? (
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${
                        isRangeStart || isRangeEnd ? 'text-amber-200' : 'text-amber-500'
                      } shrink-0`}
                    />
                  ) : null}
                </div>

                {/* Hours Badges: Emerald Green (Confirmed) & Slate Gray (Pending) */}
                <div className="mt-auto w-full space-y-1">
                  {dayStatus.confirmed > 0 && (
                    <div
                      className={`rounded-md px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tabular-nums truncate flex items-center justify-between ${
                        isRangeStart || isRangeEnd
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'bg-emerald-600 text-white shadow-xs'
                      }`}
                    >
                      <span>확정</span>
                      <span>{dayStatus.confirmed.toFixed(1)}h</span>
                    </div>
                  )}

                  {dayStatus.pending > 0 && (
                    <div
                      className={`rounded-md px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tabular-nums truncate flex items-center justify-between ${
                        isRangeStart || isRangeEnd
                          ? 'bg-slate-200 text-slate-900 font-bold'
                          : 'bg-slate-500 text-white shadow-xs'
                      }`}
                    >
                      <span>미확정</span>
                      <span>{dayStatus.pending.toFixed(1)}h</span>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
