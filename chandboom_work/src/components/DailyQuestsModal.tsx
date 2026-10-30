import React, { useState } from 'react';
import {
  X,
  Trophy,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Target,
  Shield,
  Coins,
} from 'lucide-react';
import {
  MONTHLY_QUESTS,
  DailyQuest,
  getCompletedQuests,
  toggleQuestCompletion,
  calculateStreak,
} from '../utils/dailyQuests';
import { toPersianDigits } from '../utils/formatters';

interface DailyQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDayOfMonth: number;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({
  isOpen,
  onClose,
  currentDayOfMonth,
}) => {
  const [completedDays, setCompletedDays] = useState<number[]>(() => getCompletedQuests());
  const [celebrationDay, setCelebrationDay] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentStreak = calculateStreak(completedDays, currentDayOfMonth);
  const completionPercent = Math.round((completedDays.length / 30) * 100);

  const handleToggle = (day: number) => {
    const result = toggleQuestCompletion(day);
    setCompletedDays(result.allDays);
    if (result.completed) {
      setCelebrationDay(day);
      setTimeout(() => setCelebrationDay(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs font-cairo">
      <div
        id="daily-quests-modal-card"
        className="w-full max-w-4xl bg-white dark:bg-[#0D1410] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E26] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1F2E26] bg-zinc-50/70 dark:bg-[#111A15]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-zinc-950 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cairo text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                  چالش ۳۰ روزه مدیریت هوشمند پول و پس‌انداز
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
                  ماه جاری
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                هر روز یک گام کوچک برای ساختن عادات مالی میلیاردی در سبک زندگی شما
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gamified Summary Stats Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-amber-500/10 border-b border-[#E2E8E4] dark:border-[#1F2E26] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E26]">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">زنجیره تداوم روزانه (Streak)</span>
              <span className="font-cairo text-base font-black text-orange-600 dark:text-orange-400">
                {toPersianDigits(currentStreak)} روز پیوسته 🔥
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E26]">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">تسک‌های انجام شده</span>
              <span className="font-cairo text-base font-black text-emerald-700 dark:text-emerald-400">
                {toPersianDigits(completedDays.length)} از ۳۰ روز ({toPersianDigits(completionPercent)}٪)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E26]">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 block">موقعیت فعلی در ماه</span>
              <span className="font-cairo text-base font-black text-zinc-900 dark:text-white">
                روز {toPersianDigits(currentDayOfMonth)} از ماه
              </span>
            </div>
          </div>
        </div>

        {/* Celebration Toast */}
        {celebrationDay && (
          <div className="mx-6 mt-3 p-3 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center justify-between animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-bold">
                آفرین! تسک روز {toPersianDigits(celebrationDay)} با موفقیت انجام شد و به زنجیره تداوم افزوده گردید!
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 font-bold">
              + امتیاز مالی
            </span>
          </div>
        )}

        {/* Scrollable Quests Grid (1 to 31) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MONTHLY_QUESTS.map((quest) => {
              const isDone = completedDays.includes(quest.day);
              const isToday = quest.day === currentDayOfMonth;

              return (
                <div
                  key={quest.day}
                  className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between space-y-3 ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80 shadow-xs'
                      : isToday
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-400/40'
                      : 'bg-zinc-50/60 dark:bg-[#121B17] border-[#E2E8E4] dark:border-[#1F2E26] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Top Row: Day Number & Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isDone
                              ? 'bg-emerald-700 text-white'
                              : isToday
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {toPersianDigits(quest.day)}
                        </span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200 text-[9px] font-bold">
                            تسک امروز
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                        {quest.badge}
                      </span>
                    </div>

                    {/* Quest Title */}
                    <h4
                      className={`font-cairo font-bold text-xs sm:text-sm ${
                        isDone
                          ? 'line-through text-emerald-800 dark:text-emerald-300 opacity-80'
                          : 'text-zinc-900 dark:text-white'
                      }`}
                    >
                      {quest.title}
                    </h4>

                    {/* Description */}
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {quest.description}
                    </p>
                  </div>

                  {/* Action Toggle */}
                  <div className="pt-2 border-t border-[#E2E8E4]/60 dark:border-[#1F2E26]/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400">
                      {quest.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleToggle(quest.day)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        isDone
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : isToday
                          ? 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black shadow-xs'
                          : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-emerald-600 hover:text-white text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isDone ? 'انجام شد ✓' : 'انجام دادم'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
