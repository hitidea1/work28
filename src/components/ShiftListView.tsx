/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Trash2,
  Edit2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  Check,
  Send,
  ArrowRightLeft,
} from 'lucide-react';
import { getDayOfWeekKorean, getTodayDateString } from '../utils/dateUtils';
import { DAILY_LIMIT_HOURS } from '../utils/compliance';
import type { Shift, ShiftStatus } from '../types/shift';

interface ShiftListViewProps {
  shifts: Shift[];
  onEditShift: (shift: Shift) => void;
  onDeleteShift: (shiftId: string) => void;
  onToggleStatus: (shiftId: string) => void;
  onSelectDate: (date: string) => void;
  violatingDatesSet: Set<string>;
  warningDatesSet: Set<string>;
  maxRollingForDateMap: Map<string, number>;
}

export const ShiftListView: React.FC<ShiftListViewProps> = ({
  shifts,
  onEditShift,
  onDeleteShift,
  onToggleStatus,
  onSelectDate,
  violatingDatesSet,
  warningDatesSet,
  maxRollingForDateMap,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'confirmed' | 'pending' | 'violations'>('all');

  const sortedShifts = [...shifts].sort((a, b) => b.date.localeCompare(a.date));

  const filteredShifts = sortedShifts.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDate = s.date.includes(q);
      const matchMemo = s.memo?.toLowerCase().includes(q) ?? false;
      if (!matchDate && !matchMemo) return false;
    }

    if (filterMode === 'confirmed') return s.status === 'confirmed';
    if (filterMode === 'pending') return s.status === 'pending';
    if (filterMode === 'violations') {
      return violatingDatesSet.has(s.date) || s.hours >= DAILY_LIMIT_HOURS;
    }

    return true;
  });

  const totalConfirmed = shifts.filter((s) => s.status === 'confirmed').reduce((a, b) => a + b.hours, 0);
  const totalPending = shifts.filter((s) => s.status === 'pending').reduce((a, b) => a + b.hours, 0);
  const totalAll = totalConfirmed + totalPending;

  const handleExportCSV = () => {
    if (shifts.length === 0) return;
    const headers = ['날짜', '요일', '근무시간(h)', '상태', '메모', '위반여부'];
    const rows = sortedShifts.map((s) => {
      const dow = getDayOfWeekKorean(s.date);
      const isViolating = violatingDatesSet.has(s.date) || s.hours >= DAILY_LIMIT_HOURS;
      return [
        s.date,
        dow,
        s.hours,
        s.status === 'confirmed' ? '확정' : '미확정(제출)',
        `"${(s.memo || '').replace(/"/g, '""')}"`,
        isViolating ? '규정위반' : '정상',
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `baito_shifts_${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>근무 기록 및 시프트 목록</span>
            <span className="text-xs font-normal text-slate-500">
              (총 {shifts.length}건 · 총 {totalAll.toFixed(1)}h)
            </span>
          </h3>
          {/* Quick breakdown text */}
          <div className="flex items-center gap-3 text-xs mt-1">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>확정: {totalConfirmed.toFixed(1)}h</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-slate-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>미확정: {totalPending.toFixed(1)}h</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {shifts.length > 0 && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV 저장</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 my-4">
        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap ${
              filterMode === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            전체 ({shifts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('confirmed')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'confirmed'
                ? 'bg-white text-emerald-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span>확정만</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'pending'
                ? 'bg-white text-slate-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>미확정만</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('violations')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
              filterMode === 'violations'
                ? 'bg-white text-rose-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>위반만</span>
          </button>
        </div>

        <div className="relative w-full sm:w-56">
          <input
            type="text"
            placeholder="날짜 또는 메모 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs px-3 py-1.5 pl-8 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
        </div>
      </div>

      {/* List / Cards */}
      {filteredShifts.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200">
          <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <div className="text-sm font-semibold text-slate-700">해당하는 근무 기록이 없습니다</div>
          <p className="text-xs text-slate-400 mt-1">
            필터를 변경하거나 상단의 근무 시간 입력 폼에서 새로운 기록을 등록하세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredShifts.map((shift) => {
            const dow = getDayOfWeekKorean(shift.date);
            const isDailyOver = shift.hours >= DAILY_LIMIT_HOURS;
            const isRollingViolating = violatingDatesSet.has(shift.date);
            const isViolating = isDailyOver || isRollingViolating;
            const isWarning = warningDatesSet.has(shift.date) && !isViolating;
            const max7DaySum = maxRollingForDateMap.get(shift.date) || 0;
            const isConfirmed = shift.status === 'confirmed';

            return (
              <div
                key={shift.id}
                className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isViolating
                    ? 'bg-rose-50/70 border-rose-300 text-rose-950 shadow-xs'
                    : isConfirmed
                    ? 'bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300'
                    : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Left info: Date & Status Badge & Details */}
                <div className="flex items-center gap-3">
                  {/* Status Indicator Icon Block */}
                  <div
                    className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0 font-bold ${
                      isViolating
                        ? 'bg-rose-600 text-white'
                        : isConfirmed
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-500 text-white shadow-xs'
                    }`}
                  >
                    <span className="text-[11px] leading-none uppercase">
                      {shift.date.slice(5)}
                    </span>
                    <span className="text-[10px] leading-tight opacity-90">{dow}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onSelectDate(shift.date)}
                        className="font-bold text-sm text-slate-900 hover:underline"
                      >
                        {shift.date} ({dow}요일)
                      </button>

                      {/* Status Tag: Confirmed (Green) vs Pending (Gray) */}
                      {isConfirmed ? (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(shift.id)}
                          title="클릭하여 미확정 상태로 변경"
                          className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>확정</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(shift.id)}
                          title="클릭하여 확정 상태로 변경"
                          className="text-[11px] font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>미확정 (시프트 제출)</span>
                        </button>
                      )}

                      {/* Violation Alerts */}
                      {isDailyOver && (
                        <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>1일 8h 초과!</span>
                        </span>
                      )}
                      {isRollingViolating && !isDailyOver && (
                        <span className="text-[11px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>7일 28h 초과!</span>
                        </span>
                      )}
                      {isWarning && !isViolating && (
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>7일 누적 24h 이상</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      {shift.memo && (
                        <>
                          <span className="font-semibold text-slate-700">{shift.memo}</span>
                          <span aria-hidden="true">·</span>
                        </>
                      )}
                      {max7DaySum > 0 && (
                        <span>
                          해당일 7일 최대 합계:{' '}
                          <strong
                            className={
                              max7DaySum > 28.0
                                ? 'text-rose-600 font-bold'
                                : max7DaySum >= 24.0
                                ? 'text-amber-600 font-bold'
                                : 'text-slate-800'
                            }
                          >
                            {max7DaySum.toFixed(1)}h
                          </strong>{' '}
                          / 28h
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right info: Work hours value & Action buttons */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <span
                      className={`text-2xl font-extrabold tabular-nums tracking-tight ${
                        isDailyOver
                          ? 'text-rose-600'
                          : isConfirmed
                          ? 'text-emerald-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {shift.hours.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 ml-1">시간</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(shift.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title={isConfirmed ? '미확정으로 전환' : '확정으로 승인 전환'}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditShift(shift)}
                      className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="근무 수정"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteShift(shift.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition-colors"
                      title="근무 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
