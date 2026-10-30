/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, List, HelpCircle, ShieldAlert, Sparkles, RotateCcw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'calendar' | 'list';
  onTabChange: (tab: 'calendar' | 'list') => void;
  onOpenGuide: () => void;
  onLoadStandardDemo: () => void;
  onLoadViolationDemo: () => void;
  onResetData: () => void;
  totalViolationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenGuide,
  onLoadStandardDemo,
  onLoadViolationDemo,
  onResetData,
  totalViolationsCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs tracking-tight">
              28h
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                유학생 바이토 근무시간 관리기
              </span>
              <span className="hidden md:inline text-xs text-slate-500 ml-2">
                주 28h 엄수 · 일 8h 미만 실시간 검증
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links / View Switcher */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => onTabChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-slate-100 text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>달력 뷰</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'list'
                  ? 'bg-slate-100 text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
              <span>목록 뷰</span>
              {totalViolationsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded text-[11px] font-bold bg-rose-100 text-rose-700">
                  {totalViolationsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenGuide}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">규칙 안내</span>
            </button>
          </nav>

          {/* Zone 3: Quick Preset Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">샘플 시나리오</span>
                <span className="sm:hidden">샘플</span>
              </button>
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover:block z-50">
                <button
                  type="button"
                  onClick={onLoadStandardDemo}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>정상 근무 샘플</span>
                  <span className="text-[10px] text-slate-400">규정 준수</span>
                </button>
                <button
                  type="button"
                  onClick={onLoadViolationDemo}
                  className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center justify-between"
                >
                  <span className="font-medium">위반 테스트 샘플</span>
                  <span className="text-[10px] text-rose-600">28h 초과</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  type="button"
                  onClick={onResetData}
                  className="w-full text-left px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>모든 데이터 초기화</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
