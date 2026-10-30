import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Users,
  Bell,
  Crown,
  LifeBuoy,
  Settings,
  Target,
  MoreHorizontal,
  X,
  ChevronLeft,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavTab } from '../types';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, reminders, isProUser } = useApp();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const unpaidRemindersCount = reminders.filter((r) => !r.is_paid).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'dashboard',
      label: 'داشبورد',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'transactions',
      label: 'تراکنش‌ها',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'goals',
      label: 'اهداف مالی',
      icon: <Target className="w-4 h-4" />,
    },
    {
      id: 'dong',
      label: 'محاسبه دنگ',
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'analytics',
      label: 'تحلیل مالی',
      icon: <PieChart className="w-4 h-4" />,
    },
    {
      id: 'reminders',
      label: 'یادآورها',
      icon: <Bell className="w-4 h-4" />,
      badge: unpaidRemindersCount > 0 ? unpaidRemindersCount : undefined,
    },
    {
      id: 'support',
      label: 'پشتیبانی',
      icon: <LifeBuoy className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'تنظیمات',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  // Primary 4 items shown on mobile bottom bar
  const mobilePrimaryItems = navItems.slice(0, 4);

  // Secondary items in the "بیشتر" sheet
  const secondaryItems: { id: NavTab; label: string; desc: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'analytics',
      label: 'تحلیل مالی و نمودارها',
      desc: 'بررسی بصری دخل‌وخرج و دسته‌بندی‌ها',
      icon: <PieChart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    },
    {
      id: 'reminders',
      label: 'یادآورها و سررسید اقساط',
      desc: 'پیگیری چک‌ها، قبوض و اقساط ماهانه',
      icon: <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      badge: unpaidRemindersCount > 0 ? unpaidRemindersCount : undefined,
    },
    {
      id: 'support',
      label: 'پشتیبانی و ثبت تیکت',
      desc: 'ارتباط مستقیم با کارشناسان چندبوم',
      icon: <LifeBuoy className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
    },
    {
      id: 'settings',
      label: 'تنظیمات حساب کاربری',
      desc: 'شخصی‌سازی، بودجه ماهانه و نمایه',
      icon: <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />,
    },
    {
      id: 'subscription',
      label: isProUser ? 'وضعیت اشتراک طلایی' : 'خرید اشتراک و پلن‌ها',
      desc: isProUser ? 'مدیریت و تمدید اشتراک فعال شما' : 'پلن‌های برنزی، طلایی و سازمانی',
      icon: <Crown className="w-5 h-5 text-amber-500" />,
    },
  ];

  const isMoreActive = ['analytics', 'reminders', 'support', 'settings', 'subscription'].includes(activeTab);

  return (
    <>
      {/* Desktop Horizontal Tabs Under Header */}
      <nav
        id="desktop-navigation-bar"
        className="hidden md:block bg-white dark:bg-[#0A100D] border-b border-[#E2E8E4] dark:border-[#1A2621] font-cairo relative z-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-cairo font-bold transition whitespace-nowrap cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#141F1A]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-navigation-bar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A100D]/95 backdrop-blur-md border-t border-[#E2E8E4] dark:border-[#1A2621] px-2 py-1.5 font-cairo shadow-lg"
      >
        <div className="flex items-center justify-around">
          {mobilePrimaryItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMoreOpen(false);
                }}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] justify-center ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-cairo leading-none">{item.label}</span>
              </button>
            );
          })}

          {/* 5th Mobile Item: "بیشتر" */}
          <button
            onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition cursor-pointer min-w-[56px] min-h-[44px] justify-center relative ${
              isMoreActive || isMobileMoreOpen
                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            <div className="relative">
              <MoreHorizontal className="w-4 h-4" />
              {unpaidRemindersCount > 0 && (
                <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-mono">
                  {unpaidRemindersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-cairo leading-none">بیشتر</span>
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Up Drawer for Secondary Features */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMoreOpen(false)}
          />

          {/* Sheet */}
          <div className="relative bg-white dark:bg-[#0E1511] rounded-t-3xl border-t border-[#E2E8E4] dark:border-[#1F2E27] p-5 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#1A2621]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 rounded-full bg-emerald-600" />
                <h3 className="font-cairo font-bold text-sm text-zinc-900 dark:text-white">
                  سایر امکانات و بخش‌های چندبوم
                </h3>
              </div>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of Secondary Sections */}
            <div className="space-y-1.5">
              {secondaryItems.map((sec) => {
                const isSelected = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setActiveTab(sec.id);
                      setIsMobileMoreOpen(false);
                    }}
                    className={`w-full text-right p-3 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-[#15231C] border border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                        : 'hover:bg-zinc-50 dark:hover:bg-[#121B17] text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-zinc-100 dark:bg-[#182620] shrink-0">
                        {sec.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-cairo font-bold text-xs truncate">
                            {sec.label}
                          </span>
                          {sec.badge && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-mono">
                              {sec.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                          {sec.desc}
                        </p>
                      </div>
                    </div>

                    <ChevronLeft className="w-4 h-4 text-zinc-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
