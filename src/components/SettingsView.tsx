import React, { useState } from 'react';
import {
  User,
  Shield,
  Moon,
  Sun,
  DollarSign,
  Save,
  RotateCcw,
  CheckCircle2,
  Lock,
  Smartphone,
  Info,
  Crown,
  Clock,
  Sparkles,
  CreditCard,
  Copy,
  Check,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman, formatShamsiDate, formatShamsiDateTime, toPersianDigits } from '../utils/formatters';
import { calculateRemainingProDays } from '../utils/security';

interface SettingsViewProps {
  onOpenAvatarModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenAvatarModal }) => {
  const {
    user,
    updateUserProfile,
    theme,
    toggleTheme,
    resetToDefaults,
    manualPayments,
    setActiveTab,
    isAuthenticated,
    setIsAuthModalOpen,
  } = useApp();

  // ✅ اصلاح خطای toString با استفاده از Optional Chaining (?.) و مقدار پیش‌فرض
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [budgetCap, setBudgetCap] = useState(user?.monthly_budget_cap?.toString() || '0');
  const [age, setAge] = useState<string>(user?.age?.toString() || '');
  const [gender, setGender] = useState<'مرد' | 'زن' | 'سایر'>((user?.gender as any) || 'مرد');
  
  const [isSaved, setIsSaved] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<string | null>(null);

  // ✅ ایمن‌سازی فراخوانی تابع محاسبه روزهای باقی‌مانده
  const remainingPro = calculateRemainingProDays(user?.subscription_expires_at);
  const settingsTierIsActive = Boolean(user && user.subscription_status === 'active' && (!user.subscription_expires_at || new Date(user.subscription_expires_at).getTime() > Date.now()) && user.tier !== 'free');
  const settingsTierLabel = user?.tier === 'vip' ? 'VIP' : user?.tier === 'pro' ? 'پرو' : user?.tier === 'bronze' ? 'برنزی' : 'پایه / رایگان';
  const settingsTierDescription = user?.tier === 'vip' ? 'دسترسی کامل شامل قابلیت‌های صوتی دستیار هوشمند.' : user?.tier === 'pro' ? 'دسترسی به امکانات پلن پرو؛ قابلیت‌های صوتی فقط برای VIP فعال است.' : user?.tier === 'bronze' ? 'دسترسی پایه اشتراکی به امکانات مجاز پلن برنزی.' : 'برای استفاده از امکانات اشتراکی، یکی از پلن‌ها را انتخاب کنید.';

  // ✅ ایمن‌سازی فیلتر کردن پرداخت‌ها در صورت null بودن user
  const userPayments = manualPayments.filter(
    (p) => isAuthenticated && user && (p.user_id === user.id || p.user_email === user.email)
  );

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numCap = parseInt(budgetCap.replace(/,/g, ''), 10);
    const numAge = age ? parseInt(age, 10) : undefined;
    
    updateUserProfile({
      full_name: fullName.trim() || user?.full_name || 'کاربر چندبوم',
      monthly_budget_cap: isNaN(numCap) ? (user?.monthly_budget_cap || 0) : numCap,
      age: numAge !== undefined && !isNaN(numAge) ? numAge : user?.age,
      gender,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo max-w-4xl">
      <div>
        <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          پروفایل کاربری و وضعیت اشتراک
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          مشاهده مانده اعتبار اشتراک طلایی، سوابق فیش‌های ارتقا، مشخصات کاربری و تنظیمات سامانه
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>تنظیمات شما با موفقیت ذخیره گردید.</span>
        </div>
      )}

      {/* 1. Pro Subscription Days Remaining (Exact Calculation) */}
      {!isAuthenticated ? (
        <div className="p-6 rounded-3xl bg-zinc-900 border-2 border-zinc-700 shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-zinc-800 text-zinc-300 shadow-md">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-cairo font-bold text-lg text-white">
                  حساب کاربری (مهمان)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  شما در حال حاضر وارد حساب کاربری نشده‌اید. برای ثبت تراکنش، پیگیری فیش‌های واریز و فعال‌سازی اشتراک طلایی، وارد شوید.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-cairo font-bold text-xs transition cursor-pointer shadow-md"
              >
                ورود / ثبت‌نام
              </button>
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-zinc-950 font-cairo font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>مشاهده پلن‌های اشتراک</span>
              </button>
            </div>
          </div>
        </div>
      ) : !settingsTierIsActive ? (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#121B17] via-[#16221C] to-[#0D1512] border-2 border-emerald-600/40 shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-emerald-800/60 text-emerald-300 shadow-md">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cairo font-bold text-lg text-white">
                    وضعیت اشتراک: حساب پایه / غیرفعال
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">
                    بدون اشتراک فعال
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1">
                  {settingsTierDescription}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-cairo font-black text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>مشاهده پلن‌های اشتراک</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C170A] via-[#261E0A] to-[#120F05] border-2 border-amber-500/50 shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-500 text-zinc-950 shadow-md">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cairo font-bold text-lg text-white">
                    وضعیت اشتراک: پلن {settingsTierLabel} فعال
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-zinc-950 font-black">
                    {settingsTierLabel} فعال
                  </span>
                </div>

                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-amber-200 flex items-center gap-1.5 font-bold">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>زمان باقی‌مانده اشتراک:</span>
                    <span className="font-cairo font-black text-sm text-white">
                      {remainingPro.humanText}
                    </span>
                  </p>
                  {user?.subscription_expires_at && (
                    <p className="text-[11px] text-zinc-400">
                      تاریخ انقضای اشتراک: {formatShamsiDate(user.subscription_expires_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setActiveTab('subscription')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-cairo font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>مدیریت / تمدید اشتراک</span>
              </button>
            </div>
          </div>

          {/* Golden glow decoration */}
          <div className="absolute right-[-10%] bottom-[-40%] w-64 h-64 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        </div>
      )}

      {/* 2. User's Pro Upgrades & Manual Payment Submissions History */}
      <div className="p-6 bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E27]">
          <div>
            <h3 className="font-cairo font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>سوابق تراکنش‌ها و سفارش‌های ارتقا به پرو</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              پیگیری وضعیت تایید فیش‌های واریز کارت به کارت، کدهای پیگیری سیستمی و رسیدها
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-cairo font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {toPersianDigits(userPayments.length)} سفارش ثبت‌شده
          </span>
        </div>

        {userPayments.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400 space-y-2">
            <p>شما تاکنون سفارش ارتقای حسابی ثبت نکرده‌اید.</p>
            <button
              onClick={() => setActiveTab('subscription')}
              className="text-amber-600 dark:text-amber-400 hover:underline font-cairo font-bold"
            >
              مشاهده پلن‌های طلایی ۱، ۳ و ۶ ماهه
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {userPayments.map((pay) => (
              <div
                key={pay.id}
                className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E27] flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-cairo font-bold text-sm text-zinc-900 dark:text-white">
                      {pay.plan_name}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        pay.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : pay.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                      }`}
                    >
                      {pay.status === 'approved'
                        ? 'تأیید شده و فعال'
                        : pay.status === 'rejected'
                        ? 'رد شده توسط ادمین'
                        : 'در انتظار بررسی ادمین'}
                    </span>
                  </div>

                  {/* Tracking Code with copy button */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">کد پیگیری:</span>
                    <span className="font-mono font-bold text-amber-800 dark:text-amber-300 select-all" dir="ltr">
                      {pay.tracking_code}
                    </span>
                    <button
                      onClick={() => handleCopy(pay.tracking_code)}
                      className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
                      title="کپی کد پیگیری"
                    >
                      {copiedCode === pay.tracking_code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-zinc-400">•</span>
                    <span className="text-zinc-500 font-mono text-[11px]">
                      {formatShamsiDateTime(pay.created_at)}
                    </span>
                  </div>

                  {pay.admin_notes && (
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#0E1511] p-2 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27]">
                      <span className="font-bold">پیام مدیر:</span> {pay.admin_notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className="text-left font-mono font-bold text-sm text-zinc-900 dark:text-white">
                    {formatToman(pay.amount)}
                  </div>

                  {pay.receipt_url && (
                    <button
                      onClick={() => setSelectedReceiptForPreview(pay.receipt_url || null)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-xs font-cairo font-bold hover:bg-white dark:hover:bg-[#16241D] text-zinc-700 dark:text-zinc-300 transition cursor-pointer shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-600" />
                      <span>مشاهده فیش</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Profile & Budget Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-5"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8E4] dark:border-[#1F2E27]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenAvatarModal}
              className="relative group cursor-pointer"
            >
              <img
                src={user?.avatar_url || '/default-avatar.png'}
                alt={user?.full_name || 'کاربر'}
                className="w-14 h-14 rounded-2xl border-2 border-emerald-600 object-cover shadow-sm group-hover:opacity-80 transition"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl text-[10px] text-white opacity-0 group-hover:opacity-100 transition font-cairo">
                تغییر
              </span>
            </button>

            <div>
              <h4 className="font-cairo font-bold text-base text-zinc-900 dark:text-white">
                {user?.full_name || 'کاربر چندبوم'}
              </h4>
              <p className="text-xs text-zinc-400 font-mono">{user?.email || 'ثبت نشده'}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAvatarModal}
            className="px-3.5 py-1.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#16221D] transition cursor-pointer"
          >
            انتخاب آواتار
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              نام و نام‌خانوادگی
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300">
                آدرس ایمیل (غیرقابل تغییر)
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
                <Lock className="w-3 h-3" />
                قفل امنیتی
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                value={user?.email || 'ثبت نشده'}
                disabled
                readOnly
                title="تغییر آدرس ایمیل به دلیل امنیت حساب و تایید هویت مسدود است."
                className="w-full px-4 py-2.5 bg-zinc-100/80 dark:bg-[#111915] border border-zinc-200 dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-mono text-left cursor-not-allowed select-none opacity-80"
                dir="ltr"
              />
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">
              تغییر آدرس ایمیل به دلیل امنیت حساب و حفظ یکپارچگی هویتی مسدود است.
            </p>
          </div>

          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              سن (سال)
            </label>
            <input
              type="number"
              min={10}
              max={110}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="مثلاً ۲۸"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            />
          </div>

          <div>
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              جنسیت
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
            >
              <option value="مرد">مرد</option>
              <option value="زن">زن</option>
              <option value="سایر">سایر</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              سقف بودجه ماهانه (تومان)
            </label>
            <input
              type="text"
              value={budgetCap}
              onChange={(e) => setBudgetCap(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="مثلاً ۲۵,۰۰۰,۰۰۰"
              className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            id="save-profile-settings-btn"
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>ذخیره تغییرات مشخصات</span>
          </button>
        </div>
      </form>

      {/* 4. Theme & Appearance Settings */}
      <div className="p-6 bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E27]">
          <div>
            <h4 className="font-cairo font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-emerald-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span>تنظیمات ظاهر سامانه و تم رنگی (Theme Settings)</span>
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              تغییر حالت شب و روز رابط کاربری سامانه چندبوم متناسب با سلیقه و نور محیط
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-cairo font-bold bg-zinc-100 dark:bg-[#16231D] text-zinc-700 dark:text-zinc-300 border border-[#E2E8E4] dark:border-[#22332A] self-start sm:self-auto">
            تم فعلی: {theme === 'dark' ? 'حالت شب (تاریک)' : 'حالت روز (روشن)'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Light Mode Option Button */}
          <button
            type="button"
            onClick={() => {
              if (theme === 'dark') toggleTheme();
            }}
            className={`p-4 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
              theme === 'light'
                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400/80 ring-2 ring-amber-400/30'
                : 'bg-zinc-50 dark:bg-[#141E1A] border-[#E2E8E4] dark:border-[#1F2E27] hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'light' ? 'bg-amber-500 text-white shadow-md' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="font-cairo font-bold text-sm text-zinc-900 dark:text-white">
                  حالت روز (روشن)
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  رابط کاربری سفید و شفاف مناسب برای محیط‌های پرنور
                </p>
              </div>
            </div>
            {theme === 'light' && (
              <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" />
            )}
          </button>

          {/* Dark Mode Option Button */}
          <button
            type="button"
            onClick={() => {
              if (theme === 'light') toggleTheme();
            }}
            className={`p-4 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
              theme === 'dark'
                ? 'bg-emerald-950/30 border-emerald-500/80 ring-2 ring-emerald-500/30'
                : 'bg-zinc-50 dark:bg-[#141E1A] border-[#E2E8E4] dark:border-[#1F2E27] hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${theme === 'dark' ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-cairo font-bold text-sm text-zinc-900 dark:text-white">
                  حالت شب (تاریک)
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  رابط کاربری تیره و بهینه با مصرف باتری کمتر و کاهش خستگی چشم
                </p>
              </div>
            </div>
            {theme === 'dark' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Security Architecture Info */}
      <div className="p-6 bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-cairo font-bold text-sm">
          <Shield className="w-5 h-5" />
          <span>حفاظت حریم خصوصی و امنیت داده‌ها در چندبوم</span>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          داده‌های مالی شما در سطح کلاینت رمزنگاری شده و بر روی سشن‌های امن ذخیره می‌گردند. هیچ‌گونه شماره کارت حساس، رمز دوم یا اطلاعات شخصی بدون اجازه شما به سرورهای ثالث ارسال نخواهد شد.
        </p>

        <div className="pt-2">
          <button
            onClick={() => {
              if (confirm('آیا مایلید تمام داده‌های آزمایشی بازنشانی شوند؟')) {
                resetToDefaults();
              }
            }}
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-cairo font-bold cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>بازنشانی کلیه داده‌های محلی به حالت اولیه کارخانه</span>
          </button>
        </div>
      </div>

      {/* Receipt Image Preview Lightbox Modal */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-2xl w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 p-4 space-y-3">
            <div className="flex items-center justify-between text-white pb-2 border-b border-zinc-800">
              <span className="font-cairo font-bold text-xs sm:text-sm">تصویر فیش واریزی ارسالی</span>
              <button
                onClick={() => setSelectedReceiptForPreview(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-zinc-900/60 p-2">
              <img
                src={selectedReceiptForPreview}
                alt="فیش واریزی"
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};