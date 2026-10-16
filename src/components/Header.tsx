import React, { useState } from 'react';
import {
  Wallet,
  Shield,
  Crown,
  Gem,
  LogIn,
  LogOut,
  Bell,
  ChevronDown,
  User,
  LifeBuoy,
  Receipt,
  Camera,
  Target,
  Settings,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman } from '../utils/formatters';

interface HeaderProps {
  onOpenAdminModal: () => void;
  onOpenAvatarModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAdminModal,
  onOpenAvatarModal,
}) => {
  const {
    user,
    isAuthenticated,
    setIsAuthModalOpen,
    logout,
    requestSubscription,
    isAdmin,
    metrics,
    reminders,
    setActiveTab,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const unpaidRemindersCount = reminders.filter((r) => !r.is_paid).length;
  const tierIsActive = user.subscription_status === 'active' && (!user.subscription_expires_at || new Date(user.subscription_expires_at).getTime() > Date.now());
  const tierLabel = user.tier === 'vip' ? 'اشتراک VIP' : user.tier === 'pro' ? 'اشتراک پرو' : user.tier === 'bronze' ? 'اشتراک برنزی' : 'اشتراک پایه';
  const tierShortLabel = user.tier === 'vip' ? 'VIP' : user.tier === 'pro' ? 'پرو' : user.tier === 'bronze' ? 'برنزی' : 'پایه';
  const tierBadgeClass = user.tier === 'vip' ? 'bg-gradient-to-r from-amber-300/25 via-yellow-400/20 to-amber-500/25 text-amber-800 dark:text-amber-200 border-amber-400/70 shadow-[0_0_12px_rgba(234,179,8,0.18)]' : user.tier === 'pro' ? 'bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-400/50' : user.tier === 'bronze' ? 'bg-orange-500/15 text-orange-900 dark:text-orange-200 border-orange-400/50' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700';

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#0A100D]/95 backdrop-blur-md border-b border-[#E2E8E4] dark:border-[#1A2621] transition-colors font-cairo w-full">
      <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-3 py-2 sm:px-6 sm:py-3 h-16 sm:h-18 flex-nowrap">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group text-right"
            title="مشاهده داشبورد چندبوم"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-md group-hover:scale-105 transition flex items-center justify-center bg-white dark:bg-[#0E1512] border border-emerald-500/40 p-1 shrink-0">
              <img
                src="./logo.png"
                alt="لوگوی رسمی چندبوم"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = './assets/logo.png';
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-brand font-bold text-xl sm:text-2xl text-black dark:text-white tracking-tight select-none whitespace-nowrap">
                چندبوم
              </span>
              <span className="hidden sm:block text-[10px] font-cairo font-bold text-emerald-700 dark:text-emerald-400 -mt-1 select-none whitespace-nowrap">
                سامانه هوشمند مالی و بودجه
              </span>
            </div>
          </button>
        </div>

        {/* Center Quick Balance Capsule (Desktop) */}
        <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-zinc-100/80 dark:bg-[#111A16] border border-[#E2E8E4] dark:border-[#1E2C25] text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">موجودی خالص:</span>
            <span
              className={`font-cairo font-bold ${
                metrics.balance >= 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatToman(metrics.balance)}
            </span>
          </div>

          <span className="text-zinc-300 dark:text-zinc-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">هزینه‌های ماه:</span>
            <span className="font-cairo font-bold text-zinc-900 dark:text-white">
              {formatToman(metrics.totalExpense)}
            </span>
          </div>
        </div>

        {/* Actions: Leftmost side in RTL */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-nowrap">
          {!isAuthenticated ? (
            /* 1. GUEST STATE (کاربر مهمان):
               - دکمه «اشتراک طلایی» مخفی است
               - در گوشه‌ترین سمت چپ هدر دکمه واضح و شیک «ورود / ثبت‌نام» قرار دارد
            */
            <button
              id="open-auth-modal-header-btn"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs hover:shadow-md transition active:scale-95 cursor-pointer shrink-0"
              title="ورود یا ثبت‌نام در سامانه چندبوم"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">ورود / ثبت‌نام</span>
            </button>
          ) : (
            /* 2. LOGGED-IN STATE (کاربر لاگین کرده):
               - دکمه «ورود / ثبت‌نام» مخفی است
               - دکمه «اشتراک طلایی»، آیکون اعلان‌ها و تصویر پروفایل کاربر مرتب قرار دارند
            */
            <>
              {/* Admin Panel Button (sm+ screens if admin) */}
              {isAdmin && (
                <button
                  id="open-admin-dashboard-btn"
                  onClick={onOpenAdminModal}
                  title="ورود به پنل مدیریت ارشد"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-[#20152B] text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 font-cairo font-bold text-xs hover:bg-purple-100 dark:hover:bg-[#2C1C3D] transition cursor-pointer shadow-xs shrink-0"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>پنل مدیریت</span>
                </button>
              )}

              {/* Golden Pro Subscription Button / Active Badge */}
              {tierIsActive && user.tier !== 'free' ? (
                <div title={`${tierLabel} فعال`} className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-cairo font-bold shadow-xs shrink-0 ${tierBadgeClass}`}>
                  {user.tier === 'vip' ? <Shield className="w-3.5 h-3.5 shrink-0" /> : user.tier === 'bronze' ? <Gem className="w-3.5 h-3.5 shrink-0" /> : <Crown className="w-3.5 h-3.5 shrink-0" />}
                  <span className="hidden sm:inline whitespace-nowrap">{tierLabel} فعال</span>
                  <span className="sm:hidden whitespace-nowrap">{tierShortLabel}</span>
                </div>
              ) : (
                <button
                  id="header-buy-pro-btn"
                  onClick={requestSubscription}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-zinc-950 font-cairo font-black text-[11px] sm:text-xs transition cursor-pointer shadow-md hover:shadow-lg active:scale-95 shrink-0"
                  title="خرید اشتراک طلایی"
                >
                  <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">خرید اشتراک طلایی</span>
                  <span className="sm:hidden whitespace-nowrap">اشتراک طلایی</span>
                </button>
              )}

              {/* Reminders / Notice Bell with Badge */}
              <button
                onClick={() => setActiveTab('reminders')}
                title="یادآورها و اعلان‌ها"
                className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#141F1A] transition cursor-pointer shrink-0"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {unpaidRemindersCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-600 ring-2 ring-white dark:ring-[#0A100D]" />
                )}
              </button>

              {/* User Profile Avatar & Dropdown Menu */}
              <div className="relative shrink-0 z-50">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1 pl-1.5 sm:pl-2 rounded-2xl hover:bg-zinc-100 dark:hover:bg-[#141F1A] transition cursor-pointer"
                  title="منوی حساب کاربری"
                >
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-emerald-600 shadow-xs shrink-0"
                  />
                  <span className="text-xs font-cairo font-bold text-zinc-800 dark:text-zinc-200 hidden lg:inline max-w-[100px] truncate">
                    {user.full_name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                </button>

                {isUserMenuOpen && (
                  <>
                    {/* Backdrop to dismiss menu when tapping outside */}
                    <div
                      className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                      onClick={() => setIsUserMenuOpen(false)}
                    />

                    {/* Dropdown Menu */}
                    <div
                      className="absolute top-full left-0 mt-2 w-60 sm:w-64 bg-white dark:bg-[#0F1512] rounded-2xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] p-2 text-xs font-cairo font-bold space-y-1 z-50 animate-in fade-in zoom-in-95"
                    >
                      {/* User Info Header Card */}
                      <div className="px-3 py-2.5 border-b border-[#E2E8E4] dark:border-[#1A2621] bg-zinc-50/80 dark:bg-[#141E1A]/80 rounded-xl mb-1">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={user.avatar_url}
                            alt={user.full_name}
                            className="w-8 h-8 rounded-lg object-cover border border-emerald-500 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-zinc-900 dark:text-white truncate font-bold text-xs">{user.full_name}</p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">{user.email}</p>
                          </div>
                        </div>
                        {tierIsActive && user.tier !== 'free' ? (
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${user.tier === 'vip' ? 'text-amber-600 dark:text-amber-300' : user.tier === 'bronze' ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {user.tier === 'vip' ? <Shield className="w-3 h-3" /> : user.tier === 'bronze' ? <Gem className="w-3 h-3" /> : <Crown className="w-3 h-3" />} {tierLabel} فعال
                          </span>
                        ) : (
                          <span className="inline-block text-[10px] text-zinc-500">اشتراک پایه / غیرفعال</span>
                        )}
                      </div>

                      {/* 1. مدیریت پروفایل */}
                      <div className="py-1">
                        <div className="px-2 pb-1 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                          مدیریت حساب
                        </div>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setActiveTab('settings');
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-[#16261E] hover:text-emerald-700 dark:hover:text-emerald-400 transition flex items-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>مدیریت پروفایل</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenAvatarModal();
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-[#16261E] hover:text-emerald-700 dark:hover:text-emerald-400 transition flex items-center gap-2 cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>تغییر تصویر نمایه</span>
                        </button>
                      </div>

                      {/* 2. بخش پشتیبانی */}
                      <div className="py-1 border-t border-[#E2E8E4] dark:border-[#1A2621]">
                        <div className="px-2 pb-1 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                          ارتباط و راهنما
                        </div>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setActiveTab('support');
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-[#16261E] hover:text-emerald-700 dark:hover:text-emerald-400 transition flex items-center gap-2 cursor-pointer"
                        >
                          <LifeBuoy className="w-4 h-4 text-cyan-600 shrink-0" />
                          <span>بخش پشتیبانی</span>
                        </button>
                      </div>

                      {/* 3. سایر دسترسی‌های اصلی */}
                      <div className="py-1 border-t border-[#E2E8E4] dark:border-[#1A2621]">
                        <div className="px-2 pb-1 text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
                          سایر دسترسی‌های اصلی
                        </div>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setActiveTab('transactions');
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition flex items-center gap-2 cursor-pointer"
                        >
                          <Receipt className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>تراکنش‌ها و اسناد مالی</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setActiveTab('goals');
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition flex items-center gap-2 cursor-pointer"
                        >
                          <Target className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>اهداف پس‌انداز</span>
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              onOpenAdminModal();
                            }}
                            className="w-full text-right px-2.5 py-2 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-[#20152B] transition flex items-center gap-2 cursor-pointer"
                          >
                            <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>پنل مدیریت ارشد</span>
                          </button>
                        )}
                      </div>

                      {/* خروج از حساب */}
                      <div className="pt-1 border-t border-[#E2E8E4] dark:border-[#1A2621]">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-right px-2.5 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex items-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 shrink-0" />
                          <span>خروج از حساب</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
