import {
  UserProfile,
  Transaction,
  NotificationItem,
  Ticket,
  SubscriptionPlan,
  ManualPaymentSubmission,
  TransactionCategory,
  Reminder,
  FinancialGoal,
} from '../types';
import { MALE_AVATAR_SVG } from '../utils/avatars';

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'خوراک و غذا',
  'خرید و پوشاک',
  'حمل و نقل',
  'مسکن و قبوض',
  'سلامت و درمان',
  'آموزش و یادگیری',
  'تفریح و سرگرمی',
  'سایر',
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'حقوق و دستمزد',
  'سرمایه‌گذاری',
  'سایر',
];

export const BANK_CARD_CONFIG = {
  bankName: 'بانک سامان',
  cardNumber: '6219861959761510',
  accountHolder: 'سید محمد ماهان هجرتی',
  iban: 'IR240560611827016420069701',
  expiryDate: '06/07',
  description: 'لطفاً مبلغ پلن انتخابی را به شماره کارت بانک سامان فوق واریز نموده و عکس فیش واریزی را آپلود نمایید.',
};

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Basic',
    nameFa: 'طرح پایه (رایگان)',
    price: 0,
    durationMonths: 12,
    tier: 'free',
    aiAccess: false,
    monthlyAiLimit: 0,
    description: 'مدیریت و ثبت سنتی تراکنش‌ها بدون دسترسی به امکانات هوش مصنوعی',
    badge: 'همیشگی',
    features: [
      'ثبت نامحدود درآمدها و هزینه‌های روزانه',
      'دسته‌بندی خودکار بر اساس کلیدواژه‌های پایه',
      'مشاهده نمودارهای مالی و گزارش تراز پایه',
      'ایجاد تا ۲ هدف مالی و ۲ گروه دنگ',
      'فاقد دسترسی به دستیار و تحلیلگر هوش مصنوعی',
    ],
  },
  {
    id: 'bronze-1m',
    name: 'Bronze Starter',
    nameFa: 'اشتراک برنزی (شروع هوشمند)',
    price: 39000,
    durationMonths: 1,
    tier: 'bronze',
    aiAccess: true,
    monthlyAiLimit: 20,
    description: 'شروع ارتقای حساب با دسترسی کنترل‌شده و محدود به هوش مصنوعی',
    badge: 'اقتصادی',
    features: [
      'تمام امکانات طرح پایه رایگان',
      'سهمیه ماهانه ۲۰ پرسش و تحلیل هوش مصنوعی چندبوم',
      'ثبت صوتی تراکنش با هوش مصنوعی (تا ۲۰ بار در ماه)',
      'استخراج پیامک‌های بانکی با تایید سریع',
      'محاسبه نامحدود دنگ گروهی و یادآورهای اقساط',
    ],
  },
  {
    id: 'pro-1m',
    name: 'Pro 1 Month',
    nameFa: 'اشتراک ۱ ماهه طلایی (Pro)',
    price: 89000,
    durationMonths: 1,
    tier: 'pro',
    aiAccess: true,
    monthlyAiLimit: 100,
    description: 'مدیریت هوشمند ماهانه با هوش مصنوعی چندبوم و پیش‌بینی بودجه',
    badge: 'شروع سریع',
    features: [
      'تمام امکانات پلن برنزی',
      'سهمیه ماهانه ۱۰۰ پرسش و تحلیل تخصصی هوش مصنوعی',
      'پیش‌بینی هوشمند بودجه و جریان نقدینگی ۳ ماهه',
      'سپر ضد خرید تکانه‌ای و هیجانی',
      'پشتیبانی آنلاین و تایید سریع واریزی',
    ],
  },
  {
    id: 'pro-3m',
    name: 'Pro 3 Months',
    nameFa: 'اشتراک ۳ ماهه ویژه',
    price: 220000,
    durationMonths: 3,
    tier: 'pro',
    aiAccess: true,
    monthlyAiLimit: 150,
    description: 'بهترین انتخاب برای بودجه‌بندی هوشمند، پس‌انداز و پیش‌بینی چندماهه',
    isPopular: true,
    badge: 'محبوب‌ترین پلن',
    features: [
      'تمام امکانات اشتراک ۱ ماهه طلایی',
      'سهمیه ماهانه ۱۵۰ پرسش هوش مصنوعی',
      'سیستم آلارم پیش‌بینی اتمام سقف بودجه دسته‌ها',
      'امکان استخراج گزارش‌های اکسل با فرمت رسمی',
      'اولویت ویژه در تایید فیش کارت‌به‌کارت',
      'پشتیبانی VIP چندبوم',
    ],
  },
  {
    id: 'pro-6m',
    name: 'Pro 6 Months VIP',
    nameFa: 'اشتراک ۶ ماهه VIP طلایی',
    price: 390000,
    durationMonths: 6,
    tier: 'vip',
    aiAccess: true,
    monthlyAiLimit: 500,
    description: 'کامل‌ترین سطح دسترسی با بیشترین تخفیف و بیشترین سهمیه هوش مصنوعی',
    badge: 'بیشترین تخفیف (VIP)',
    features: [
      'تمام امکانات پلن‌های طلایی و ویژه',
      'سهمیه ماهانه ۵۰۰ پرسش و تحلیل نامحدود هوش مصنوعی',
      'پیش‌بینی جامع جریان نقدینگی و اهداف پس‌انداز بلندمدت',
      'دسترسی زودهنگام به تمام امکانات جدید چندبوم',
      'تایید فوری زیر ۱۰ دقیقه توسط مدیر سامانه',
      'مشاوره اختصاصی بهینه‌سازی پس‌انداز با هوش مصنوعی چندبوم',
    ],
  },
];

export const GUEST_USER: UserProfile = {
  id: 'guest',
  email: '',
  full_name: 'کاربر مهمان',
  avatar_url: MALE_AVATAR_SVG,
  role: 'user',
  tier: 'free',
  subscription_status: 'none',
  subscription_expires_at: null,
  monthly_budget_cap: 0,
  theme_preference: 'dark',
  currency: 'تومان',
  age: undefined,
  gender: undefined,
  created_at: new Date().toISOString(),
};

// Purged Production State: All initial data structures start completely empty
export const INITIAL_USER: UserProfile = GUEST_USER;

export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_REMINDERS: Reminder[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
export const INITIAL_TICKETS: Ticket[] = [];
export const INITIAL_MANUAL_PAYMENTS: ManualPaymentSubmission[] = [];
export const INITIAL_GOALS: FinancialGoal[] = [];
