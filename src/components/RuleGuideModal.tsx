/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, Clock, Calendar, AlertCircle } from 'lucide-react';

interface RuleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleGuideModal: React.FC<RuleGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-900" />
            <h3 className="text-base font-bold text-slate-900">
              일본 유학생 바이토 법정 근무 규칙 안내
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 py-4 text-xs text-slate-600 leading-relaxed">
          {/* Rule 1: Student Visa 28h Rule */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
              <Calendar className="w-4 h-4 text-rose-600" />
              <span>핵심 1. 어느 연속된 7일(Rolling 7 Days)도 총 28시간 이하</span>
            </div>
            <p className="text-slate-700">
              일본 입국관리국 규정상 유학생(자격외활동허가)은 단순한 월~일 캘린더 주 단위뿐만 아니라, <strong>달력상의 어떤 임의의 연속 7일을 골라도 28시간을 초과해서는 안 됩니다.</strong>
            </p>
            <p className="text-slate-500 mt-1">
              • 28시간을 초과하면 비자 갱신 불허 및 강제 출국 사유가 될 수 있으므로 엄격하게 관리해야 합니다.
            </p>
          </div>

          {/* Rule 2: Daily < 8h */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
              <Clock className="w-4 h-4 text-rose-600" />
              <span>핵심 2. 하루 노동시간은 8시간 미만이어야 함</span>
            </div>
            <p className="text-slate-700">
              일본 노동기준법상 하루 <strong>8시간 이상</strong> 근무 시 경고가 발생하며, 하루 최대 7.9시간 이하로 일해야 합니다.
            </p>
          </div>

          {/* Rule 3: Direct Time Input */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
              <AlertCircle className="w-4 h-4 text-slate-700" />
              <span>핵심 3. 휴게시간 계산 없는 순수 근무시간 직접 입력</span>
            </div>
            <p className="text-slate-700">
              복잡한 휴게시간 공제 없이, 본인이 실제로 일한 시간(예: 4시간, 5.5시간 등)을 그대로 인정하여 계산합니다.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
};
