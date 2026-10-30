/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { InteractiveBookingCalendar } from './components/InteractiveBookingCalendar';
import { ShiftForm } from './components/ShiftForm';
import { RemainingHoursCalculator } from './components/RemainingHoursCalculator';
import { ShiftListView } from './components/ShiftListView';
import { ViolationBanner } from './components/ViolationBanner';
import { RuleGuideModal } from './components/RuleGuideModal';
import {
  getStandardSampleShifts,
  getViolationDemoShifts,
  createShift,
} from './utils/sampleData';
import { evaluateAllCompliance } from './utils/compliance';
import { getTodayDateString, addDays } from './utils/dateUtils';
import type { Shift, ShiftStatus } from './types/shift';

const STORAGE_KEY = 'baito_work_shifts_v4';

export default function App() {
  const today = getTodayDateString();

  const [shifts, setShifts] = useState<Shift[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore parse error
    }
    return getStandardSampleShifts();
  });

  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [rangeStart, setRangeStart] = useState<string>(today);
  const [rangeEnd, setRangeEnd] = useState<string>(addDays(today, 6)); // Default: 오늘부터 7일간
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Sync shifts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
    } catch {
      // Ignore storage errors
    }
  }, [shifts]);

  // Compliance evaluation
  const compliance = evaluateAllCompliance(shifts);
  const totalViolationsCount =
    compliance.dailyViolations.length + compliance.rollingViolations.length;

  const handleSaveShift = (data: {
    date: string;
    hours: number;
    status: ShiftStatus;
    memo?: string;
  }) => {
    if (editingShift) {
      setShifts((prev) =>
        prev.map((s) =>
          s.id === editingShift.id
            ? {
                ...s,
                date: data.date,
                hours: data.hours,
                status: data.status,
                memo: data.memo,
              }
            : s
        )
      );
      setEditingShift(null);
    } else {
      const newShift = createShift(data.date, data.hours, data.status, data.memo);
      setShifts((prev) => [...prev, newShift]);
    }
    setSelectedDate(data.date);
  };

  const handleDeleteShift = (shiftId: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
    if (editingShift?.id === shiftId) {
      setEditingShift(null);
    }
  };

  const handleToggleStatus = (shiftId: string) => {
    setShifts((prev) =>
      prev.map((s) =>
        s.id === shiftId
          ? {
              ...s,
              status: s.status === 'confirmed' ? 'pending' : 'confirmed',
            }
          : s
      )
    );
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setSelectedDate(shift.date);
    // Smooth scroll down to the form
    const formElement = document.getElementById('shift-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingShift(null);
  };

  const handleLoadStandardDemo = () => {
    setShifts(getStandardSampleShifts());
    setEditingShift(null);
    setSelectedDate(today);
    setRangeStart(today);
    setRangeEnd(addDays(today, 6));
  };

  const handleLoadViolationDemo = () => {
    setShifts(getViolationDemoShifts());
    setEditingShift(null);
    setSelectedDate(today);
  };

  const handleResetData = () => {
    setShifts([]);
    setEditingShift(null);
  };

  const handleApplyCalculatedHours = (
    targetDate: string,
    hours: number,
    status: ShiftStatus
  ) => {
    setSelectedDate(targetDate);
    setEditingShift({
      id: `calc_auto_${Date.now()}`,
      date: targetDate,
      hours,
      status,
      memo: `추천 시프트 (${hours}h)`,
      createdAt: Date.now(),
    });

    const formElement = document.getElementById('shift-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRangeChange = (start: string, end: string) => {
    setRangeStart(start);
    setRangeEnd(end);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenGuide={() => setIsGuideOpen(true)}
        onLoadStandardDemo={handleLoadStandardDemo}
        onLoadViolationDemo={handleLoadViolationDemo}
        onResetData={handleResetData}
        totalViolationsCount={totalViolationsCount}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 1. Global Red Violation Banner (Shown whenever 8h or 28h violation is detected) */}
        <ViolationBanner
          dailyViolations={compliance.dailyViolations}
          rollingViolations={compliance.rollingViolations}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setRangeStart(date);
            setRangeEnd(date);
          }}
        />

        {/* 2. Primary Feature: Airline / Hotel Style Interactive Calendar */}
        <section aria-label="근무시간 달력 및 기간 선택">
          <InteractiveBookingCalendar
            shifts={shifts}
            selectedDate={selectedDate}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onSelectDate={setSelectedDate}
            onRangeChange={handleRangeChange}
            violatingDatesSet={compliance.violatingDatesSet}
            warningDatesSet={compliance.warningDatesSet}
            maxRollingForDateMap={compliance.maxRollingForDateMap}
          />
        </section>

        {/* 3. Middle Section: Shift Form + Smart Recommendation Recommender */}
        <section id="shift-form-section" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Shift Input Form (7 cols) */}
          <div className="lg:col-span-7">
            <ShiftForm
              allShifts={shifts}
              editingShift={editingShift}
              selectedDate={selectedDate}
              onSaveShift={handleSaveShift}
              onCancelEdit={handleCancelEdit}
              onDateChange={setSelectedDate}
            />
          </div>

          {/* Smart Shift Recommendation Calculator (5 cols) */}
          <div className="lg:col-span-5">
            <RemainingHoursCalculator
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              shifts={shifts}
              onApplyCalculatedHours={handleApplyCalculatedHours}
            />
          </div>
        </section>

        {/* 4. Bottom Section: Shifts List */}
        <section aria-label="근무 기록 목록">
          <ShiftListView
            shifts={shifts}
            onEditShift={handleEditShift}
            onDeleteShift={handleDeleteShift}
            onToggleStatus={handleToggleStatus}
            onSelectDate={setSelectedDate}
            violatingDatesSet={compliance.violatingDatesSet}
            warningDatesSet={compliance.warningDatesSet}
            maxRollingForDateMap={compliance.maxRollingForDateMap}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>일본 유학생 바이토 근무시간 관리기</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span className="text-emerald-700 font-semibold">초록색: 확정 노동시간</span>
            <span className="mx-1.5" aria-hidden="true">/</span>
            <span className="text-slate-600 font-semibold">회색: 미확정 시프트</span>
          </div>
          <div>
            <span>데이터는 브라우저 LocalStorage에 안전하게 자동 저장됩니다.</span>
          </div>
        </div>
      </footer>

      {/* Regulations Guide Modal */}
      <RuleGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
