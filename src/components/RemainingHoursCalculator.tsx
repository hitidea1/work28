/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  Calendar,
  Clock,
  ArrowRight,
  Info,
  Sparkles,
  ShieldCheck,
  Send,
  Check,
} from 'lucide-react';
import {
  getDayOfWeekKorean,
  getTodayDateString,
} from '../utils/dateUtils';
import {
  analyzeDateCapacity,
  ROLLING_7DAYS_LIMIT_HOURS,
} from '../utils/compliance';
import type { Shift, DateCapacityAnalysis, ShiftStatus } from '../types/shift';

interface RemainingHoursCalculatorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  shifts: Shift[];
  onApplyCalculatedHours: (date: string, hours: number, status: ShiftStatus) => void;
}

export const RemainingHoursCalculator: React.FC<RemainingHoursCalculatorProps> = ({
  selectedDate,
  onSelectDate,
  shifts,
  onApplyCalculatedHours,
}) => {
  const targetDate = selectedDate || getTodayDateString();
  const [includePending, setIncludePending] = useState<boolean>(true);

  const analysis: DateCapacityAnalysis = analyzeDateCapacity(
    targetDate,
    shifts,
    undefined,
    includePending
  );

  const dayOfWeek = getDayOfWeekKorean(targetDate);
  const maxSafeHours = analysis.maxTotalAllowed;
  const existingHours = analysis.existingDayHours;
  const additionalPossible = analysis.additionalAvailableHours;

  const isDailyCapped = analysis.maxDailyHours <= analysis.maxAllowedBy7DayRule;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              스마트 시프트 추천 (최대 노동시간 계산기)
            </h3>
            <p className="text-xs text-slate-500">
              특정 날짜에 28h 규정을 위반하지 않고 최대로 일할 수 있는 시간을 역산합니다.
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="calc-target-date" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            추천 대상일:
          </label>
          <input
            id="calc-target-date"
            type="date"
            value={targetDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Include Pending Filter Toggle */}
      <div className="flex items-center justify-between my-3 p-2 bg-slate-50 rounded-xl text-xs text-slate-600">
        <span>미확정 제출 시프트도 계산에 포함:</span>
        <button
          type="button"
          onClick={() => setIncludePending((prev) => !prev)}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            includePending
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {includePending ? '포함 (안전 권장)' : '미포함 (확정만 반영)'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* KPI 1: Max Total Work on this day */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">
            그날 총 최대 가능 시간
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            {maxSafeHours.toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-1">시간</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isDailyCapped ? '1일 8h 미만 기준' : '연속 7일 28h 기준'}
          </div>
        </div>

        {/* KPI 2: Currently Logged */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-semibold text-slate-500">
            현재 등록된 근무 / 시프트
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
            {existingHours.toFixed(1)}
            <span className="text-xs font-normal text-slate-500 ml-1">시간</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            {analysis.existingConfirmedHours > 0 && (
              <span className="text-emerald-700 font-semibold">확정 {analysis.existingConfirmedHours}h</span>
            )}
            {analysis.existingPendingHours > 0 && (
              <span className="text-slate-600 font-semibold">미확정 {analysis.existingPendingHours}h</span>
            )}
            {existingHours === 0 && <span>등록 없음</span>}
          </div>
        </div>

        {/* KPI 3: Additional Work Available */}
        <div
          className={`p-3.5 rounded-xl border ${
            additionalPossible > 0
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="text-[11px] font-semibold">
            추가 제출 가능 잔여치
          </div>
          <div
            className={`text-2xl font-extrabold tabular-nums mt-1 ${
              additionalPossible > 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {additionalPossible.toFixed(1)}
            <span className="text-xs font-semibold ml-1">시간</span>
          </div>
          <div className="text-[11px] mt-1 font-medium">
            {additionalPossible > 0 ? (
              <span className="text-emerald-700">시프트 제출 가능</span>
            ) : (
              <span className="text-rose-700">한도 도달 / 추가 불가</span>
            )}
          </div>
        </div>
      </div>

      {/* Bottleneck Constraint Explanation */}
      <div className="p-3 bg-slate-100/70 rounded-xl text-xs text-slate-700 mb-4 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-900">제약 원인 분석: </span>
          {isDailyCapped ? (
            <span>
              <strong>하루 8시간 미만 근로기준법 원칙</strong> (하루 최대 7.9시간까지 가능)
            </span>
          ) : analysis.bottleneckWindow ? (
            <span>
              <strong>
                {analysis.bottleneckWindow.startDate} ~ {analysis.bottleneckWindow.endDate} (7일간)
              </strong>
              구간의 다른 날짜 누적 근무가{' '}
              <strong>{analysis.bottleneckWindow.otherDaysHours.toFixed(1)}시간</strong>이므로,
              28시간을 넘지 않으려면 이 날은 최대{' '}
              <strong>{analysis.bottleneckWindow.maxHoursAllowedOnTarget.toFixed(1)}시간</strong>까지만
              가능합니다.
            </span>
          ) : (
            <span>제약 없음</span>
          )}
        </div>
      </div>

      {/* Breakdown list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-slate-800">
            {targetDate}를 포함하는 7개 연속 7일 구간별 현황
          </h4>
          <span className="text-[11px] text-slate-400">기준: 구간 누계 ≤ 28.0h</span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {analysis.windows.map((win, idx) => {
            const isBottleneck = analysis.bottleneckWindow?.startDate === win.startDate;
            const percent = Math.min(100, Math.round((win.totalHours / ROLLING_7DAYS_LIMIT_HOURS) * 100));

            return (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs ${
                  win.isViolation
                    ? 'bg-rose-50/60 border-rose-300'
                    : win.isWarning
                    ? 'bg-amber-50/50 border-amber-300'
                    : isBottleneck
                    ? 'bg-slate-50 border-slate-300'
                    : 'bg-white border-slate-200/70'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span className="text-slate-800 font-semibold">
                    {win.startDate} ~ {win.endDate}
                    {isBottleneck && (
                      <span className="ml-2 text-[10px] text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded font-semibold">
                        최대 제약구간
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums font-bold">
                    <span
                      className={
                        win.isViolation
                          ? 'text-rose-600'
                          : win.isWarning
                          ? 'text-amber-600'
                          : 'text-slate-900'
                      }
                    >
                      {win.totalHours.toFixed(1)}h
                    </span>
                    <span className="text-slate-400 font-normal"> / 28.0h</span>
                  </span>
                </div>

                <div className="mt-1 w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      win.isViolation
                        ? 'bg-rose-500'
                        : win.isWarning
                        ? 'bg-amber-500'
                        : 'bg-slate-800'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons to Apply Hours */}
      {additionalPossible > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs text-slate-500">
            추천 시간({additionalPossible.toFixed(1)}h)을 입력 폼에 넣기:
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onApplyCalculatedHours(targetDate, additionalPossible, 'pending')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-200 hover:bg-slate-300 rounded-xl transition-colors whitespace-nowrap"
            >
              <Send className="w-3 h-3" />
              <span>미확정 시프트로 적용 (회색)</span>
            </button>
            <button
              type="button"
              onClick={() => onApplyCalculatedHours(targetDate, additionalPossible, 'confirmed')}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors whitespace-nowrap"
            >
              <Check className="w-3 h-3" />
              <span>확정 근무로 적용 (초록)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
