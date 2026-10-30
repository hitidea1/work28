/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import type { RollingWindowViolation, Shift } from '../types/shift';

interface ViolationBannerProps {
  dailyViolations: { date: string; totalHours: number; shifts: Shift[] }[];
  rollingViolations: RollingWindowViolation[];
  onSelectDate: (date: string) => void;
}

export const ViolationBanner: React.FC<ViolationBannerProps> = ({
  dailyViolations,
  rollingViolations,
  onSelectDate,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const totalCount = dailyViolations.length + rollingViolations.length;

  if (totalCount === 0) return null;

  return (
    <div className="mb-6 bg-rose-50 border border-rose-300 rounded-2xl p-4 text-rose-950 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-rose-900 flex items-center gap-2">
              <span>⚠️ 근무 규정 위반 경고 발생 (총 {totalCount}건)</span>
            </div>
            <p className="text-xs text-rose-800 mt-0.5">
              일본 유학생 자격외활동(주 28시간) 또는 1일 8시간 미만 한도를 초과한 구간이 있습니다.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1 text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
        >
          <span>{isExpanded ? '간략히' : '상세 보기'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-rose-200 space-y-3">
          {/* Daily Violations */}
          {dailyViolations.length > 0 && (
            <div>
              <div className="text-xs font-bold text-rose-900 mb-1.5">
                • 하루 8시간 이상 근무 위반 일자:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {dailyViolations.map((v) => (
                  <button
                    key={v.date}
                    type="button"
                    onClick={() => onSelectDate(v.date)}
                    className="p-2.5 bg-white rounded-xl border border-rose-200 text-left text-xs hover:border-rose-400 transition-colors"
                  >
                    <div className="font-bold text-rose-950">{v.date}</div>
                    <div className="text-rose-700 font-semibold tabular-nums mt-0.5">
                      총 {v.totalHours.toFixed(1)}시간 (8h 미만 규정 위반)
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rolling 7-day Violations */}
          {rollingViolations.length > 0 && (
            <div>
              <div className="text-xs font-bold text-rose-900 mb-1.5">
                • 연속 7일 누적 28시간 초과 구간:
              </div>
              <div className="space-y-1.5">
                {rollingViolations.map((v, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-white rounded-xl border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      <span className="font-semibold text-rose-950">
                        {v.startDate} ~ {v.endDate} (연속 7일)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-800 tabular-nums font-medium">
                      <span>총 근무: <strong>{v.totalHours.toFixed(1)}h</strong></span>
                      <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                        +{v.exceededHours.toFixed(1)}h 초과
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
