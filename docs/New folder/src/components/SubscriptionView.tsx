import React, { useState } from 'react';
import {
  Crown,
  CheckCircle2,
  Award,
  Zap,
  Shield,
  CreditCard,
  Clock,
  ArrowRight,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUBSCRIPTION_PLANS, BANK_CARD_CONFIG } from '../data/initialData';
import { SubscriptionPlan } from '../types';
import { formatToman, formatShamsiDate } from '../utils/formatters';
import { calculateRemainingProDays } from '../utils/security';
import { CheckoutModal } from './CheckoutModal';

export const SubscriptionView: React.FC = () => {
  const { user, isProUser, manualPayments, isAuthenticated, openAuthGuard } = useApp();
  const [selectedDuration, setSelectedDuration] = useState<1 | 3>(1);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlan | null>(null);
  const [activePlanId, setActivePlanId] = useState<string>('pro-1m');

  // Check user pending payment or pending_approval status
  const pendingPayment = manualPayments.find(
    (p) => (p.user_id === user.id || p.user_email === user.email) && p.status === 'pending'
  );
  const isPendingReview = user.subscription_status === 'pending_approval' || Boolean(pendingPayment);

  const remainingPro = calculateRemainingProDays(user.subscription_expires_at);

  // Filter plans by selected duration: 1 month or 3 months
  const plansForDuration = SUBSCRIPTION_PLANS.filter(
    (p) => p.price > 0 && p.durationMonths === selectedDuration
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200 font-cairo pb-12" dir="rtl">
      {/* Top Banner - Luxurious Golden & Dark Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1505] via-[#241D09] to-[#0A0D0B] border-2 border-amber-500/40 p-6 sm:p-10 text-white shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-cairo font-bold">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>پلن‌های اشتراک ۱ ماهه و ۳ ماهه (برنزی • طلایی • VIP)</span>
          </div>

          <h2 className="font-cairo text-2xl sm:text-4xl font-extrabold text-white leading-tight">
            پلن‌های ارتقای حساب <span className="text-amber-400 font-brand">چندبوم هوشمند</span>
          </h2>

          <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-2xl">
            پلن متناسب با نیاز مالی خود را در دوره‌های ۱ ماهه یا ۳ ماهه (همراه با تخفیف ویژه) انتخاب کنید. با فعال‌سازی اشتراک، به دستیار هوشمند ثبت خودکار تراکنش‌ها، تحلیل بودجه، یادآورها و مدیریت دنگ دسترسی خواهید داشت.
          </p>

          {isProUser && remainingPro.isActive ? (
            <div className="inline-flex items-center gap-3.5 p-3.5 rounded-2xl bg-amber-500/15 backdrop-blur-xs border border-amber-400/50 text-xs">
              <Crown className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <p className="font-cairo font-bold text-amber-200">
                  اشتراک فعال شما: {user.tier === 'vip' ? 'وی‌آی‌پی (VIP)' : user.tier === 'bronze' ? 'برنزی' : 'طلایی (پرو)'}
                </p>
                <p className="text-white font-cairo text-[11px] font-bold mt-0.5">
                  اعتبار باقی‌مانده: {remainingPro.humanText} (تا {remainingPro.formattedDate || formatShamsiDate(user.subscription_expires_at || '')})
                </p>
              </div>
            </div>
          ) : isPendingReview ? (
            <div className="inline-flex items-center gap-3 p-4 rounded-2xl bg-amber-500/25 backdrop-blur-xs border-2 border-amber-400 text-xs text-amber-200 shadow-lg">
              <Clock className="w-6 h-6 text-amber-300 shrink-0 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-cairo font-black text-sm text-amber-300">
                    فیش واریزی شما در حال بررسی است
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-zinc-950 font-bold">
                    در صف تایید مدیریت
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 mt-1">
                  {pendingPayment?.tracking_code
                    ? `کد پیگیری: ${pendingPayment.tracking_code} • فیش شما در حال راستی‌آزمایی با صورتحساب بانکی است.`
                    : 'درخواست ارتقای حساب شما ثبت شده و ظرف حداکثر ۱۵ دقیقه فعال خواهد شد.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-amber-200/90">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> کارت به کارت مستقیم به بانک سامان
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> ثبت امن فیش و صدور کد پیگیری اختصاصی
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> فعال‌سازی فوری هوش مصنوعی تحلیلی
              </span>
            </div>
          )}
        </div>

        {/* Golden glow decorations */}
        <div className="absolute left-[-10%] top-[-30%] w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-[-10%] bottom-[-30%] w-96 h-96 rounded-full bg-yellow-500/15 blur-3xl pointer-events-none" />
      </div>

      {/* Duration Cycle Selector (1 Month vs 3 Months) */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="inline-flex p-1.5 bg-zinc-100 dark:bg-[#121B17] rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26] shadow-inner">
          <button
            type="button"
            id="cycle-tab-1m"
            onClick={() => {
              setSelectedDuration(1);
              setActivePlanId('pro-1m');
            }}
            className={`px-6 py-2.5 rounded-xl font-cairo font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              selectedDuration === 1
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>اشتراک ۱ ماهه</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600/30 text-emerald-100 border border-emerald-400/30">
              ۳ پلن
            </span>
          </button>

          <button
            type="button"
            id="cycle-tab-3m"
            onClick={() => {
              setSelectedDuration(3);
              setActivePlanId('pro-3m');
            }}
            className={`px-6 py-2.5 rounded-xl font-cairo font-bold text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer ${
              selectedDuration === 3
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 font-black shadow-md'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <span>اشتراک ۳ ماهه</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500 text-white font-black animate-pulse">
              تخفیف ویژه 🎉
            </span>
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {selectedDuration === 1
            ? 'نمایش پلن‌های ۱ ماهه برنزی، طلایی و VIP'
            : 'نمایش پلن‌های ۳ ماهه برنزی، طلایی و VIP (با صرفه‌جویی تا ۶۰,۰۰۰ تومان)'}
        </p>
      </div>

      {/* Pricing Cards Grid (3 Columns: Bronze, Gold/Pro, VIP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-6xl mx-auto">
        {plansForDuration.map((plan) => {
          const isSelected = activePlanId === plan.id;
          const isVip = plan.tier === 'vip';
          const isBronze = plan.tier === 'bronze';
          const isPro = plan.tier === 'pro';

          return (
            <div
              key={plan.id}
              onClick={() => setActivePlanId(plan.id)}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                isSelected
                  ? isVip
                    ? 'bg-gradient-to-b from-[#1E1609] via-[#2A1F0B] to-[#140F05] border-2 border-yellow-400 shadow-2xl shadow-yellow-950/40 -translate-y-1.5 ring-2 ring-yellow-400/40 text-white'
                    : isBronze
                    ? 'bg-gradient-to-b from-[#1C1713] via-[#261E18] to-[#120F0D] border-2 border-amber-700 shadow-2xl shadow-amber-950/40 -translate-y-1.5 ring-2 ring-amber-600/40 text-white'
                    : 'bg-gradient-to-b from-[#1C170A] via-[#241D09] to-[#120F06] border-2 border-amber-500 shadow-2xl shadow-amber-950/40 -translate-y-1.5 ring-2 ring-amber-400/40 text-white'
                  : 'bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-sm hover:border-amber-400/60 text-zinc-900 dark:text-zinc-100 hover:-translate-y-1'
              }`}
            >
              {plan.badge && (
                <div
                  className={`absolute -top-3.5 right-6 px-3 py-1 rounded-full font-cairo font-bold text-[10px] sm:text-[11px] shadow-sm flex items-center gap-1 ${
                    isVip
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-black'
                      : isBronze
                      ? 'bg-amber-800 text-amber-100'
                      : 'bg-emerald-700 text-white'
                  }`}
                >
                  <Crown className="w-3 h-3" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isVip
                          ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                          : isBronze
                          ? 'bg-amber-700/20 text-amber-300 border border-amber-700/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isVip ? 'سطح VIP' : isBronze ? 'سطح برنزی' : 'سطح طلایی'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {plan.durationMonths === 1 ? 'دوره ۱ ماهه' : 'دوره ۳ ماهه'}
                    </span>
                  </div>

                  <h3
                    className={`font-cairo text-lg sm:text-xl font-bold flex items-center gap-2 mt-2 ${
                      isSelected ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    <span>{plan.nameFa}</span>
                    <Crown className="w-4 h-4 text-amber-500" />
                  </h3>
                  <p
                    className={`text-xs mt-1.5 leading-relaxed min-h-[38px] ${
                      isSelected ? 'text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  className={`py-3.5 border-y ${
                    isSelected ? 'border-amber-500/30' : 'border-[#E2E8E4] dark:border-[#22332B]'
                  }`}
                >
                  {plan.originalPrice && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="line-through text-zinc-400 text-xs font-mono font-bold">
                        {formatToman(plan.originalPrice)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500 text-white">
                        {plan.durationMonths === 3 ? 'تخفیف ویژه ۳ ماهه' : 'تخفیف ویژه'}
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-cairo text-2xl sm:text-3xl font-black text-amber-400">
                      {formatToman(plan.price)}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isSelected ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                    >
                      / {plan.durationMonths === 1 ? 'یک‌ماهه' : 'سه‌ماهه'}
                    </span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Zap className="w-3 h-3" />
                    <span>سهمیه: {plan.monthlyAiLimit} پرسش و ثبت ماهانه هوش مصنوعی</span>
                  </div>
                </div>

                {/* Features List */}
                <ul
                  className={`space-y-2.5 text-xs ${
                    isSelected ? 'text-zinc-200' : 'text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={`pt-5 mt-5 border-t ${
                  isSelected ? 'border-amber-500/30' : 'border-[#E2E8E4] dark:border-[#22332B]'
                }`}
              >
                {isPendingReview ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 rounded-2xl font-cairo font-bold text-xs sm:text-sm bg-amber-500/15 border-2 border-amber-400/60 text-amber-300 flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-sm"
                  >
                    <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>در حال بررسی فیش</span>
                  </button>
                ) : (
                  <button
                    id={`select-plan-${plan.id}-btn`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isAuthenticated) {
                        openAuthGuard(
                          'برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.'
                        );
                        return;
                      }
                      setActivePlanId(plan.id);
                      setSelectedPlanForCheckout(plan);
                    }}
                    className={`w-full py-3.5 rounded-2xl font-cairo font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                      isSelected
                        ? isVip
                          ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-zinc-950 font-black shadow-amber-950/20'
                          : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-zinc-950 font-black shadow-amber-950/20'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{isSelected ? 'تایید و پرداخت کارت به کارت' : 'انتخاب این پلن'}</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Free Plan Baseline Card */}
      <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-[#0C1410] border border-[#E2E8E4] dark:border-[#1F2E26] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-900 dark:text-white font-cairo text-sm sm:text-base">
              طرح پایه و پیش‌فرض (رایگان)
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              بدون هوش مصنوعی
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
            شامل ثبت دستی درآمد و هزینه، نمودار تراز، ۲ گروه دنگ و ۲ یادآور مالی به صورت نامحدود و رایگان برای همیشه. امکانات هوش مصنوعی نیازمند اشتراک‌های برنزی، طلایی یا وی‌آی‌پی می‌باشد.
          </p>
        </div>
        <div className="shrink-0">
          <span className="px-4 py-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold font-cairo">
            {(!user.tier || user.tier === 'free') ? '✓ فعال برای حساب شما' : 'طرح همیشگی'}
          </span>
        </div>
      </div>

      {/* Comprehensive Comparison Table: Free vs Bronze vs Gold (Pro) vs VIP */}
      <div className="bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-cairo font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300">
            مقایسه شفاف سطوح اشتراک
          </span>
          <h3 className="font-cairo text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            جدول تفاوت‌های پلن رایگان، برنزی، طلایی و وی‌آی‌پی
          </h3>
          <p className="text-xs text-zinc-500">
            تمام پلن‌های پولی در دو بازه زمانی ۱ ماهه و ۳ ماهه (با تخفیف ویژه) قابل تهیه هستند
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26]">
          <table className="w-full text-xs text-right">
            <thead className="bg-zinc-100/80 dark:bg-[#121B17] text-zinc-700 dark:text-zinc-300 font-cairo font-bold">
              <tr>
                <th className="p-3.5 sm:p-4">قابلیت و امکانات</th>
                <th className="p-3.5 sm:p-4 text-center">طرح پایه (رایگان)</th>
                <th className="p-3.5 sm:p-4 text-center text-amber-600 dark:text-amber-400">
                  پلن برنزی
                </th>
                <th className="p-3.5 sm:p-4 text-center text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                  پلن طلایی (پرو)
                </th>
                <th className="p-3.5 sm:p-4 text-center text-yellow-500 font-black">
                  پلن وی‌آی‌پی (VIP)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E4] dark:divide-[#1F2E26]">
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  سهمیه ماهانه پرسش و ثبت با هوش مصنوعی چندبوم
                </td>
                <td className="p-3.5 text-center text-rose-500 font-bold">فاقد دسترسی (۰)</td>
                <td className="p-3.5 text-center font-bold text-zinc-700 dark:text-zinc-300">
                  ۳۰ پرسش در ماه
                </td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  ۱۰۰ پرسش در ماه
                </td>
                <td className="p-3.5 text-center font-bold text-yellow-500">۲۵۰ تا ۵۰۰ پرسش (نامحدود)</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  ثبت هوشمند صوتی و پیامک بانکی
                </td>
                <td className="p-3.5 text-center text-zinc-400">فقط پیش‌نمایش</td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400">
                  دارد
                </td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  نامحدود
                </td>
                <td className="p-3.5 text-center font-bold text-yellow-500">نامحدود با سرعت بالا</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  تحلیل مالی پیشرفته و پیش‌بینی چندماهه
                </td>
                <td className="p-3.5 text-center text-zinc-400">فقط آمار ماه جاری</td>
                <td className="p-3.5 text-center text-zinc-600 dark:text-zinc-300">
                  تحلیل ماه جاری
                </td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  پیش‌بینی ۳ ماهه
                </td>
                <td className="p-3.5 text-center font-bold text-yellow-500">پیش‌بینی جامع ۶ ماهه</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  مدیریت دنگ گروهی و سررسیدها
                </td>
                <td className="p-3.5 text-center text-zinc-400">تا ۲ گروه و یادآور</td>
                <td className="p-3.5 text-center text-zinc-600 dark:text-zinc-300">
                  تا ۵ گروه و یادآور
                </td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  نامحدود
                </td>
                <td className="p-3.5 text-center font-bold text-yellow-500">نامحدود با حالت خانوادگی</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  استخراج اکسل رسمی با تراز حسابداری
                </td>
                <td className="p-3.5 text-center text-zinc-400">ساده</td>
                <td className="p-3.5 text-center text-zinc-600 dark:text-zinc-300">
                  استاندارد
                </td>
                <td className="p-3.5 text-center font-bold text-emerald-700 dark:text-emerald-400 bg-amber-50/20 dark:bg-amber-950/10">
                  فرمت رسمی ارزی
                </td>
                <td className="p-3.5 text-center font-bold text-yellow-500">گزارش کامل اختصاصی</td>
              </tr>
              <tr>
                <td className="p-3.5 font-bold text-zinc-800 dark:text-zinc-200">
                  اولویت تایید فیش کارت‌به‌کارت
                </td>
                <td className="p-3.5 text-center text-zinc-400">-</td>
                <td className="p-3.5 text-center text-zinc-600 dark:text-zinc-300">عادی</td>
                <td className="p-3.5 text-center font-bold text-amber-700 dark:text-amber-400 bg-amber-50/20 dark:bg-amber-950/10">
                  زیر ۱۵ دقیقه
                </td>
                <td className="p-3.5 text-center font-bold text-yellow-500">فوری زیر ۵ دقیقه</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pros & Cons Section (Honest Evaluation) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros Card */}
        <div className="p-6 rounded-3xl bg-emerald-50/60 dark:bg-[#0D1C14] border border-emerald-200 dark:border-emerald-800/60 space-y-4">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            </div>
            <h4 className="font-cairo text-base font-bold">
              مزایای اصلی اشتراک‌های ارتقایافته چندبوم
            </h4>
          </div>

          <ul className="space-y-2.5 text-xs text-emerald-900 dark:text-emerald-200/90 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>صرفه‌جویی چشمگیر در زمان:</strong> بدون نیاز به پر کردن فرم‌های طولانی، فقط با یک جمله کوتاه در هوش مصنوعی چندبوم تراکنش‌ها را ثبت کنید.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>پیش‌بینی بحران‌های بودجه:</strong> الگوریتم‌های هوش مصنوعی ۳ تا ۶ ماه آینده را تحلیل کرده و قبل از اتمام پول به شما هشدار می‌دهند.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>جلوگیری از جریمه دیرکرد:</strong> ثبت نامحدود یادآورهای چک و اقساط مانع فراموشی موعدهای مالی می‌شود.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">•</span>
              <span><strong>تسویه راحت و شفاف دنگ‌ها:</strong> مناسب خانواده‌ها، مسافرت‌ها و زندگی‌های اشتراکی با تسویه خودکار.</span>
            </li>
          </ul>
        </div>

        {/* Considerations / Cons Card */}
        <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E27] space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-800 dark:text-zinc-200">
            <div className="p-2 rounded-xl bg-zinc-200/80 dark:bg-zinc-800">
              <HelpCircle className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h4 className="font-cairo text-base font-bold">
              معایب و نکات قابل توجه (بررسی شفاف)
            </h4>
          </div>

          <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="font-bold text-zinc-400">•</span>
              <span><strong>پرداخت هزینه دوره‌ای:</strong> برای دسترسی مداوم به اشتراک هوش مصنوعی نیاز به تمدید ۱ ماهه یا ۳ ماهه دارید.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-zinc-400">•</span>
              <span><strong>عدم توجیه برای افراد کم‌فعالیت:</strong> اگر در ماه تنها ۲ یا ۳ تراکنش ساده ثبت می‌کنید، امکانات اشتراک رایگان برای شما کاملاً کافی است و نیازی به ارتقا ندارید.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-zinc-400">•</span>
              <span><strong>وابستگی هوش مصنوعی به داده‌های ورودی:</strong> هرچه تراکنش‌ها را دقیق‌تر ثبت کنید، پیش‌بینی‌های چندماهه هوش مصنوعی چندبوم اثربخش‌تر خواهد بود.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Manual Payment Explanation Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-cairo font-bold text-base">
            <Shield className="w-5 h-5" />
            <span>فرآیند تسویه شفاف و بدون واسطه</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            مبالغ مستقیماً به کارت بانک سامان به شماره <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200" dir="ltr">{BANK_CARD_CONFIG.cardNumber}</span> به نام <span className="font-bold text-zinc-800 dark:text-zinc-200">{BANK_CARD_CONFIG.accountHolder}</span> واریز شده و با آپلود فیش، رسید فوراً در جدول <span className="font-mono text-emerald-600 dark:text-emerald-400">subscription_orders</span> سوپابیس ذخیره می‌گردد.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-left text-xs font-cairo">
            <span className="text-zinc-400 block">پشتیبانی و تایید واریزی:</span>
            <span className="font-bold text-amber-700 dark:text-amber-400">سید ماهان هجرتی (مدیریت چندبوم)</span>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <CheckoutModal
          isOpen={!!selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          selectedPlan={selectedPlanForCheckout}
        />
      )}
    </div>
  );
};
