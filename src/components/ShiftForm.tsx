/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useId } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Save,
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Check,
  Send,
} from 'lucide-react';
import { getTodayDateString, addDays, getDayOfWeekKorean } from '../utils/dateUtils';
import { validateCandidateShift, DAILY_LIMIT_HOURS } from '../utils/compliance';
import type { Shift, ShiftStatus, FormValidationResult } from '../types/shift';

interface ShiftFormProps {
  allShifts: Shift[];
  editingShift: Shift | null;
  selectedDate: string;
  onSaveShift: (data: {
    date: string;
    hours: number;
    status: ShiftStatus;
    memo?: string;
  }) => void;
  onCancelEdit: () => void;
  onDateChange: (date: string) => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  allShifts,
  editingShift,
  selectedDate,
  onSaveShift,
  onCancelEdit,
  onDateChange,
}) => {
  const formId = useId();
  const [date, setDate] = useState<string>(selectedDate || getTodayDateString());
  const [hours, setHours] = useState<string>('4.5');
  const [status, setStatus] = useState<ShiftStatus>('confirmed');
  const [memo, setMemo] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

  // Sync if editing
  useEffect(() => {
    if (editingShift) {
      setDate(editingShift.date);
      setHours(String(editingShift.hours));
      setStatus(editingShift.status || 'confirmed');
      setMemo(editingShift.memo || '');
    }
  }, [editingShift]);

  // Sync date when external selectedDate changes
  useEffect(() => {
    if (!editingShift && selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate, editingShift]);

  const numHours = parseFloat(hours) || 0;

  // Real-time compliance check for candidate shift
  const validation: FormValidationResult = validateCandidateShift(
    date,
    numHours,
    allShifts,
    editingShift ? editingShift.id : undefined
  );

  const dayOfWeek = getDayOfWeekKorean(date);

  const handleQuickAddHours = (delta: number) => {
    const next = Math.max(0.5, Math.min(24, Math.round((numHours + delta) * 10) / 10));
    setHours(String(next));
  };

  const handleSetHoursPreset = (h: number) => {
    setHours(String(h));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    if (numHours <= 0) {
      return;
    }

    if (!validation.isValid) {
      return;
    }

    onSaveShift({
      date,
      hours: numHours,
      status,
      memo: memo.trim() || undefined,
    });

    if (!editingShift) {
      setMemo('');
      setHasAttemptedSubmit(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {editingShift ? '근무 기록 수정' : '근무 시간 & 시프트 입력'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            확정된 근무 또는 제출한 미확정 시프트를 등록합니다.
          </p>
        </div>
        {editingShift && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>수정 취소</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Status Selector: Confirmed (Blue) vs Pending (Amber) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            근무 상태 선택 (확정 vs 미확정 시프트)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStatus('confirmed')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                status === 'confirmed'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs ring-1 ring-emerald-500'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  status === 'confirmed' ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                }`}
              >
                {status === 'confirmed' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>확정된 노동시간 (확정·초록)</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('pending')}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                status === 'pending'
                  ? 'bg-slate-100 border-slate-400 text-slate-800 shadow-xs ring-1 ring-slate-400'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  status === 'pending' ? 'bg-slate-500 text-white' : 'border border-slate-300'
                }`}
              >
                {status === 'pending' && <Send className="w-2.5 h-2.5 stroke-[3]" />}
              </div>
              <span>미확정 시프트 (제출·회색)</span>
            </button>
          </div>
        </div>

        {/* Date input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor={`${formId}-date`} className="block text-xs font-semibold text-slate-700">
              근무 날짜
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  const d = addDays(getTodayDateString(), -1);
                  setDate(d);
                  onDateChange(d);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-900 px-1.5 py-0.5 rounded hover:bg-slate-100"
              >
                어제
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = getTodayDateString();
                  setDate(d);
                  onDateChange(d);
                }}
                className="text-[11px] text-slate-900 font-semibold px-1.5 py-0.5 rounded hover:bg-slate-100"
              >
                오늘
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = addDays(getTodayDateString(), 1);
                  setDate(d);
                  onDateChange(d);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-900 px-1.5 py-0.5 rounded hover:bg-slate-100"
              >
                내일
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              id={`${formId}-date`}
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                onDateChange(e.target.value);
              }}
              required
              className="w-full text-sm font-medium px-3 py-2 pl-9 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            선택일: {date} ({dayOfWeek}요일)
          </div>
        </div>

        {/* Work Hours input & Quick Presets */}
        <div>
          <label htmlFor={`${formId}-hours`} className="block text-xs font-semibold text-slate-700 mb-1">
            근무 시간 (시간 단위, 숫자 입력)
          </label>
          <div className="relative">
            <input
              id={`${formId}-hours`}
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="예: 4 또는 5.5"
              required
              className={`w-full text-lg font-bold tabular-nums px-3 py-2 pl-9 rounded-xl border transition-colors focus:outline-hidden focus:ring-2 ${
                numHours >= DAILY_LIMIT_HOURS
                  ? 'border-rose-400 text-rose-700 focus:ring-rose-500'
                  : 'border-slate-300 text-slate-900 focus:ring-slate-900 focus:border-slate-900'
              }`}
            />
            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
            <div className="absolute right-3 top-2.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickAddHours(-0.5)}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center transition-colors"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddHours(0.5)}
                className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Quick Hours Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 mr-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              자주 쓰는 시간:
            </span>
            {[3.0, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => handleSetHoursPreset(h)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  numHours === h
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        {/* Memo Input */}
        <div>
          <label htmlFor={`${formId}-memo`} className="block text-xs font-semibold text-slate-700 mb-1">
            메모 / 알바처 (선택)
          </label>
          <input
            id={`${formId}-memo`}
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 편의점 로손, 식당 홀 서빙 등"
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
          />
        </div>

        {/* Real-time Warnings & Compliance Messages */}
        <div className="space-y-2 pt-1">
          {/* 1. Daily 8-hour rule error */}
          {validation.dailyViolation && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-rose-900">
                    [경고] 하루 노동시간은 8시간 미만이어야 합니다.
                  </div>
                  <div className="mt-1 text-rose-700 leading-relaxed">
                    입력된 시간: <strong>{numHours}시간</strong> (일본 근로기준법상 하루 8시간 이상 근무는 허용되지 않습니다.)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Rolling 7-day 28-hour rule error */}
          {validation.rollingViolations.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-950">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs w-full">
                  <div className="font-bold text-rose-900">
                    [경고] 연속된 7일(Rolling 7 Days) 누적 28시간 초과!
                  </div>
                  <div className="mt-1 text-rose-700">
                    이 근무를 등록하면 총 {validation.rollingViolations.length}개 연속 7일 구간에서 28시간 한도를 초과합니다:
                  </div>
                  <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto">
                    {validation.rollingViolations.map((v, i) => (
                      <div
                        key={i}
                        className="p-2 bg-white rounded-lg border border-rose-200 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-medium text-slate-800">
                          {v.startDate} ~ {v.endDate} (7일간)
                        </span>
                        <span className="font-bold text-rose-700 tabular-nums">
                          총 {v.totalHours.toFixed(1)}h (+{v.exceededHours.toFixed(1)}h 초과)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Approaching limit warning */}
          {!validation.dailyViolation &&
            validation.rollingViolations.length === 0 &&
            validation.warningNotice && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">{validation.warningNotice}</span>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      남은 여유 버퍼: {(28.0 - validation.maxRollingTotalHours).toFixed(1)}시간
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* 4. Safe state */}
          {validation.isValid && numHours > 0 && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-900">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  규정 준수 정상 (일일 {numHours}h &lt; 8h, 7일 최대 누계 {validation.maxRollingTotalHours.toFixed(1)}h / 28h)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!validation.isValid || numHours <= 0}
            className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              validation.isValid && numHours > 0
                ? status === 'confirmed'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'
                  : 'bg-slate-700 hover:bg-slate-800 text-white shadow-sm cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {editingShift ? (
              <>
                <Save className="w-4 h-4" />
                <span>수정 내용 저장</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{status === 'confirmed' ? '확정 근무 추가' : '미확정 시프트 추가'}</span>
              </>
            )}
          </button>
          {!validation.isValid && hasAttemptedSubmit && (
            <p className="text-[11px] text-rose-600 text-center mt-1.5 font-semibold">
              규정 위반 항목(8시간 이상 또는 7일 28시간 초과)을 수정한 후 추가해주세요.
            </p>
          )}
        </div>
      </form>
    </div>
  );
};
