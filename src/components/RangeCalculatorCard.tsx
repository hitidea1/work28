/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CalendarRange,
  Calendar,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  getTodayDateString,
  addDays,
  getDayOfWeekIndex,
  getDayOfWeekKorean,
} from '../utils/dateUtils';
import { calculateRangeSummary, ROLLING_7DAYS_LIMIT_HOURS } from '../utils/compliance';
import type { Shift, RangeSummary } from '../types/shift';

interface RangeCalculatorCardProps {
  shifts: Shift[];
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
}

export const RangeCalculatorCard: React.FC<RangeCalculatorCardProps> = ({
  shifts,
  startDate,
  endDate,
  onRangeChange,
}) => {
  const today = getTodayDateString();

  // Summary for selected range
  const summary: RangeSummary = calculateRangeSummary(startDate, endDate, shifts);

  // Quick preset helper
  const handleApplyPreset = (preset: 'next7' | 'past7' | 'thisWeek' | 'nextWeek' | 'thisMonth') => {
    if (preset === 'next7') {
      // 오늘부터 7일간 (Today ~ Today + 6)
      onRangeChange(today, addDays(today, 6));
    } else if (preset === 'past7') {
      // 최근 7일간 (Today - 6 ~ Today)
      onRangeChange(addDays(today, -6), today);
    } else if (preset === 'thisWeek') {
      // Monday to Sunday of current week
      const dayIndex = getDayOfWeekIndex(today); // 0=Sun, 1=Mon, ..., 6=Sat
      const diffToMon = dayIndex === 0 ? -6 : 1 - dayIndex;
      const mon = addDays(today, diffToMon);
      const sun = addDays(mon, 6);
      onRangeChange(mon, sun);
    } else if (preset === 'nextWeek') {
      const dayIndex = getDayOfWeekIndex(today);
      const diffToMon = dayIndex === 0 ? -6 : 1 - dayIndex;
      const nextMon = addDays(today, diffToMon + 7);
      const nextSun = addDays(nextMon, 6);
      onRangeChange(nextMon, nextSun);
    } else if (preset === 'thisMonth') {
      const [y, m] = today.split('-');
      const startOfMonth = `${y}-${m}-01`;
      const lastDay = new Date(parseInt(y, 10), parseInt(m, 10), 0).getDate();
      const endOfMonth = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
      onRangeChange(startOfMonth, endOfMonth);
    }
  };

  const isNext7 = startDate === today && endDate === addDays(today, 6);
  const isPast7 = startDate === addDays(today, -6) && endDate === today;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <CalendarRange className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              기간별 합계 계산기 (Range Selector)
            </h3>
            <p className="text-xs text-slate-500">
              시작일과 종료일을 지정하여 해당 기간의 노동시간 합계를 계산합니다.
            </p>
          </div>
        </div>

        {summary.is7DayWindow && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
            <span>연속 7일 구간 선택됨</span>
          </div>
        )}
      </div>

      {/* Quick Range Presets */}
      <div className="my-3.5">
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>빠른 기간 선택:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('next7')}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${
              isNext7
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            오늘부터 7일간
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('past7')}
            className={`px-2.5 py-1 text-xs rounded-lg font-bold border transition-colors ${
              isPast7
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            최근 7일간
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('thisWeek')}
            className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            이번 주 (월~일)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('nextWeek')}
            className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            다음 주 시프트
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('thisMonth')}
            className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            이번 달 전체
          </button>
        </div>
      </div>

      {/* Date Pickers: Start & End */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label htmlFor="range-start-date" className="block text-xs font-semibold text-slate-600 mb-1">
            시작일
          </label>
          <div className="relative">
            <input
              id="range-start-date"
              type="date"
              value={startDate}
              onChange={(e) => onRangeChange(e.target.value, endDate)}
              className="w-full text-xs font-medium px-3 py-2 pl-8 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {startDate} ({getDayOfWeekKorean(startDate)}요일)
          </span>
        </div>

        <div>
          <label htmlFor="range-end-date" className="block text-xs font-semibold text-slate-600 mb-1">
            종료일
          </label>
          <div className="relative">
            <input
              id="range-end-date"
              type="date"
              value={endDate}
              onChange={(e) => onRangeChange(startDate, e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 pl-8 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {endDate} ({getDayOfWeekKorean(endDate)}요일)
          </span>
        </div>
      </div>

      {/* Range Result Metrics (4-Box Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Hours */}
        <div
          className={`p-3.5 rounded-xl border ${
            summary.isOver28Hours && summary.is7DayWindow
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : 'bg-slate-50 border-slate-200/80 text-slate-900'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500">기간 총 노동시간</div>
          <div
            className={`text-2xl font-extrabold tabular-nums tracking-tight mt-1 ${
              summary.isOver28Hours && summary.is7DayWindow ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {summary.totalHours.toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-1">시간</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            총 {summary.dayCount}일간 ({summary.shiftsCount}건)
          </div>
        </div>

        {/* Confirmed Hours (Emerald Green Theme) */}
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center justify-between">
            <span>확정된 시간</span>
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 tabular-nums tracking-tight mt-1">
            {summary.confirmedHours.toFixed(1)}
            <span className="text-xs font-normal text-emerald-600/70 ml-1">시간</span>
          </div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">
            확정 비율: {summary.totalHours > 0 ? Math.round((summary.confirmedHours / summary.totalHours) * 100) : 0}%
          </div>
        </div>

        {/* Pending Hours (Slate Gray Theme) */}
        <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-300 text-slate-900">
          <div className="text-[11px] font-semibold text-slate-700 flex items-center justify-between">
            <span>미확정 시프트</span>
            <span className="w-2 h-2 rounded-full bg-slate-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-700 tabular-nums tracking-tight mt-1">
            {summary.pendingHours.toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-1">시간</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            제출 중인 시프트
          </div>
        </div>

        {/* Average per day */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-900">
          <div className="text-[11px] font-semibold text-slate-500">일평균 노동시간</div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight mt-1">
            {summary.averageHoursPerDay.toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-1">h/일</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {summary.is7DayWindow ? '7일 기준 일평균' : `${summary.dayCount}일 기준`}
          </div>
        </div>
      </div>

      {/* 7-Day Window Status Note */}
      {summary.is7DayWindow && (
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          {summary.totalHours > ROLLING_7DAYS_LIMIT_HOURS ? (
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                [경고] 선택한 7일 구간({startDate} ~ {endDate})의 총합이 {summary.totalHours.toFixed(1)}시간으로 28시간 한도를 {(summary.totalHours - ROLLING_7DAYS_LIMIT_HOURS).toFixed(1)}시간 초과합니다!
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  선택한 7일 구간 총 {summary.totalHours.toFixed(1)}시간 (28시간 한도 내 정상)
                </span>
              </div>
              <span className="font-bold text-slate-900 tabular-nums">
                잔여 버퍼: {(ROLLING_7DAYS_LIMIT_HOURS - summary.totalHours).toFixed(1)}h
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
