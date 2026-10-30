/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Clock, Calendar } from 'lucide-react';
import type { TodaySummary } from '../types/shift';

interface TodaySummaryCardProps {
  summary: TodaySummary;
  onSelectToday: () => void;
}

export const TodaySummaryCard: React.FC<TodaySummaryCardProps> = ({ summary, onSelectToday }) => {
  const {
    todayDate,
    windowStartDate,
    windowEndDate,
    past7DaysTotalHours,
    remainingHours,
    isOverLimit,
    isNearLimit,
    percentUsed,
  } = summary;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition-all">
      {/* Top Header of the Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
              isOverLimit ? 'bg-rose-600' : isNearLimit ? 'bg-amber-500' : 'bg-slate-900'
            }`}
          >
            28h
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                오늘 기준 최근 7일 근무 현황
              </h2>
              {isOverLimit ? (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>28시간 초과 위반!</span>
                </span>
              ) : isNearLimit ? (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>한도 임박</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>규정 준수 정상</span>
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                구간: {windowStartDate} ~ {windowEndDate} (최근 7일간)
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSelectToday}
          className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors self-start sm:self-auto"
        >
          오늘 날짜 선택
        </button>
      </div>

      {/* Main 2 Highlight Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
        {/* Metric 1: Past 7 days total */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>최근 7일간 총 근무시간</span>
            <span className="text-[11px] text-slate-400">한도 28.0h</span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                isOverLimit
                  ? 'text-rose-600'
                  : isNearLimit
                  ? 'text-amber-600'
                  : 'text-slate-900'
              }`}
            >
              {past7DaysTotalHours.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-500">시간</span>
            <span className="text-xs text-slate-400 ml-auto">
              ({percentUsed}% 소진)
            </span>
          </div>
          {/* Confirmed vs Pending Breakdown Chips */}
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>확정: {summary.confirmedHours.toFixed(1)}h</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 font-semibold text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span>미확정: {summary.pendingHours.toFixed(1)}h</span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverLimit
                  ? 'bg-rose-500'
                  : isNearLimit
                  ? 'bg-amber-500'
                  : 'bg-slate-900'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Remaining Hours */}
        <div
          className={`p-4 rounded-xl border ${
            remainingHours > 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="text-xs font-semibold flex items-center justify-between">
            <span className={remainingHours > 0 ? 'text-emerald-800' : 'text-rose-800'}>
              남은 근무 가능 시간 (28h - 현재)
            </span>
            <Clock className="w-4 h-4 opacity-70" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-3xl font-extrabold tabular-nums tracking-tight ${
                remainingHours > 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {remainingHours.toFixed(1)}
            </span>
            <span
              className={`text-sm font-semibold ${
                remainingHours > 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              시간
            </span>
            <span className="text-xs ml-auto font-medium">
              {remainingHours > 0 ? '추가 근무 가능' : '근무 불가(한도 도달)'}
            </span>
          </div>
          <div className="mt-3 text-xs opacity-80">
            {remainingHours > 0
              ? `* 최근 7일 기준 최대 ${remainingHours}시간까지 바이토 가능 (일 8h 미만 준수 필요)`
              : '* 주의: 이미 28시간을 모두 채웠거나 초과하여 추가 근무 시 비자 규정 위반이 됩니다.'}
          </div>
        </div>
      </div>

      {/* Student Visa Note Banner */}
      <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 flex-wrap gap-1">
        <span>🇯🇵 일본 출입국재류관리청 자격외활동허가: 주 28시간 이내 규정 엄수</span>
        <span className="text-slate-400">※ 방학 중(별도 기간) 외 통상 학기 중 적용</span>
      </div>
    </div>
  );
};
