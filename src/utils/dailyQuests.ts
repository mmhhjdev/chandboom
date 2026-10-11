/**
 * 30-Day Financial Quests & Gamified Micro-Goals for Chandboom (chandboon.ir)
 */

export interface DailyQuest {
  day: number;
  title: string;
  description: string;
  category: 'پس‌انداز' | 'آگاهی مالی' | 'کنترل مخارج' | 'سرمایه‌گذاری';
  rewardPoints: number;
  badge: string;
}

export const MONTHLY_QUESTS: DailyQuest[] = [
  {
    day: 1,
    title: 'بررسی دخل و خرج ماه پیش',
    description: 'نگاهی به مجموع درآمدهای ماه گذشته بیندازید و سقف بودجه این ماه را مشخص کنید.',
    category: 'آگاهی مالی',
    rewardPoints: 20,
    badge: '📊 آغازگر ماه',
  },
  {
    day: 2,
    title: 'امروز فست‌فود نخور',
    description: 'به جای سفارش غذای رستوران، یک وعده خانگی سالم و کم‌هزینه آماده کنید.',
    category: 'کنترل مخارج',
    rewardPoints: 25,
    badge: '🥗 غذای خانگی',
  },
  {
    day: 3,
    title: 'ثبت دقیق اولین تراکنش',
    description: 'کوچک‌ترین خرید امروز (حتی نان یا کرایه تاکسی) را در جدول تراکنش‌های چندبوم ثبت کنید.',
    category: 'آگاهی مالی',
    rewardPoints: 15,
    badge: '✍️ نظم ثبت',
  },
  {
    day: 4,
    title: 'روز بدون هزینه غیرضروری',
    description: 'امروز فقط برای اقلام ۱۰۰٪ حیاتی پول پرداخت کنید و از تنقلات و خریدهای هوسی بپرهیزید.',
    category: 'پس‌انداز',
    rewardPoints: 30,
    badge: '🛡️ سپر مخارج',
  },
  {
    day: 5,
    title: 'لغو اشتراک‌های بی‌استفاده',
    description: 'اشتراک‌های آنلاین و خدماتی که ماه گذشته استفاده نکرده‌اید را بررسی و لغو کنید.',
    category: 'کنترل مخارج',
    rewardPoints: 35,
    badge: '✂️ حذف زائد',
  },
  {
    day: 6,
    title: 'انتقال ۵۰ هزار تومان به پس‌انداز',
    description: 'مبلغی اندک (حتی ۵۰ هزار تومان) را به حساب پس‌انداز یا هدف مالی واریز کنید.',
    category: 'پس‌انداز',
    rewardPoints: 25,
    badge: '🪙 قطره قطره',
  },
  {
    day: 7,
    title: 'بررسی وضعیت چک و اقساط',
    description: 'موعد سررسید اقساط و قبوض دو هفته آینده را در بخش یادآورهای چندبوم چک کنید.',
    category: 'آگاهی مالی',
    rewardPoints: 20,
    badge: '⏰ زمان‌سنج',
  },
  {
    day: 8,
    title: 'قهوه و چای خانگی',
    description: 'به جای کافه، امروز چای یا قهوه خانگی میل کنید و مابه‌التفاوت آن را بسنجید.',
    category: 'کنترل مخارج',
    rewardPoints: 20,
    badge: '☕ فنجان آرامش',
  },
  {
    day: 9,
    title: 'تنظیم یک هدف مالی جدید',
    description: 'یک هدف مشخص (مثلاً سفر، خرید لپ‌تاپ یا صندوق اضطراری) در بخش اهداف مالی ثبت کنید.',
    category: 'سرمایه‌گذاری',
    rewardPoints: 30,
    badge: '🎯 هدف‌گذار',
  },
  {
    day: 10,
    title: 'چک‌لیست خرید قبل از فروشگاه',
    description: 'پیش از رفتن به سوپرمارکت، یک لیست خرید کاغذی یا دیجیتال بنویسید و مو به مو به آن پایبند بمانید.',
    category: 'کنترل مخارج',
    rewardPoints: 25,
    badge: '📝 خریدار هوشمند',
  },
  {
    day: 11,
    title: 'تسویه دنگ‌های مانده',
    description: 'دنگ دورهمی‌ها یا بدهی‌های کوچک به دوستان را بررسی کرده و در بخش دنگ تسویه کنید.',
    category: 'آگاهی مالی',
    rewardPoints: 20,
    badge: '🤝 حساب پاک',
  },
  {
    day: 12,
    title: 'بررسی سبد سرمایه‌گذاری یا طلا',
    description: 'ارزش دارایی‌ها و راهکارهای حفظ ارزش پول در برابر تورم را در چندبوم ارزیابی کنید.',
    category: 'سرمایه‌گذاری',
    rewardPoints: 30,
    badge: '📈 دیدگاه ثروت',
  },
  {
    day: 13,
    title: 'روز حمل و نقل اقتصادی',
    description: 'به جای تاکسی اختصاصی، از مترو، اتوبوس یا پیاده‌روی استفاده کنید.',
    category: 'کنترل مخارج',
    rewardPoints: 25,
    badge: '🚶 گام اقتصادی',
  },
  {
    day: 14,
    title: 'محاسبه درآمد ساعتی خود',
    description: 'درآمد ماهانه خود را بر ۱۶۰ تقسیم کرده و ببینید هر ساعت کار چقدر ارزش دارد.',
    category: 'آگاهی مالی',
    rewardPoints: 30,
    badge: '⏱️ ارزش زمان',
  },
  {
    day: 15,
    title: 'نصف ماه گذشت: بازبینی بودجه',
    description: 'بررسی کنید آیا بیش از ۵۰٪ سقف بودجه ماه را خرج کرده‌اید یا در مسیر درست هستید.',
    category: 'آگاهی مالی',
    rewardPoints: 35,
    badge: '⚖️ نقطه میانی',
  },
  {
    day: 16,
    title: 'قانون ۲۴ ساعت تأمل',
    description: 'اگر امروز چشمتان کالایی را گرفت، خرید را ۲۴ ساعت به تعویق بیندازید تا از هوس‌آلود نبودن آن مطمئن شوید.',
    category: 'کنترل مخارج',
    rewardPoints: 30,
    badge: '🛑 تأمل طلایی',
  },
  {
    day: 17,
    title: 'فروش یک وسیله مازاد خانگی',
    description: 'یک کالای بی‌استفاده در کمد را برای فروش بگذارید یا به فرد نیازمند ببخشید.',
    category: 'پس‌انداز',
    rewardPoints: 40,
    badge: '📦 بازیافت ارزش',
  },
  {
    day: 18,
    title: 'مطالعه یک مقاله هوش مالی',
    description: '۱۰ دقیقه درباره بودجه‌بندی هوشمند و جریان نقدینگی در بلاگ چندبوم مطالعه کنید.',
    category: 'آگاهی مالی',
    rewardPoints: 20,
    badge: '💡 دانش مالی',
  },
  {
    day: 19,
    title: 'مقایسه قیمت قبل از خرید',
    description: 'برای کالایی که نیاز دارید، قیمت حداقل ۳ فروشگاه را بررسی و ارزان‌ترین گزینه را بیابید.',
    category: 'کنترل مخارج',
    rewardPoints: 25,
    badge: '🔍 جستجوی هوشمند',
  },
  {
    day: 20,
    title: 'واریز ۱۰٪ از درآمد غیرمنتظره',
    description: 'هر درآمد فرعی یا پاداش کوچک را فوراً به صندوق پس‌انداز منتقل کنید.',
    category: 'پس‌انداز',
    rewardPoints: 30,
    badge: '💰 انباشت هوشمند',
  },
  {
    day: 21,
    title: 'پاکسازی پیامک‌های بانکی و تطبیق',
    description: 'پیامک‌های واریز و برداشت اخیر را با گزارش تراکنش‌های چندبوم تطبیق دهید.',
    category: 'آگاهی مالی',
    rewardPoints: 20,
    badge: '🧾 تطبیق مالی',
  },
  {
    day: 22,
    title: 'یک روز بدون سفارش اینترنتی',
    description: 'امروز هیچ اپلیکیشن خرید آنلاینی را باز نکنید و زمان خود را صرف مهارت‌آموزی کنید.',
    category: 'کنترل مخارج',
    rewardPoints: 30,
    badge: '📴 سکوت دیجیتال',
  },
  {
    day: 23,
    title: 'مشاوره با هوش مصنوعی چندبوم',
    description: 'یک سوال تحلیلی از دستیار هوشمند چندبوم بپرسید: «بهترین راه افزایش پس‌انداز من چیه؟»',
    category: 'آگاهی مالی',
    rewardPoints: 25,
    badge: '🤖 نبوغ هوش مصنوعی',
  },
  {
    day: 24,
    title: 'کاهش مصرف انرژی و قبوض',
    description: 'لامپ‌های اضافی را خاموش کرده و وسایل برقی کم‌مصرف را در خانه اولویت دهید.',
    category: 'کنترل مخارج',
    rewardPoints: 20,
    badge: '⚡ بهینه‌ساز',
  },
  {
    day: 25,
    title: 'بررسی و تقویت صندوق اضطراری',
    description: 'مطمئن شوید حداقل برای ۱ تا ۳ ماه هزینه‌های ضروری زندگی اندوخته پشتیبان دارید.',
    category: 'سرمایه‌گذاری',
    rewardPoints: 40,
    badge: '🏰 قلعه امن',
  },
  {
    day: 26,
    title: 'تعمیر به جای تعویض',
    description: 'اگر وسیله‌ای خراب شده، قبل از خرید وسیله جدید، امکان تعمیر ساده آن را بررسی کنید.',
    category: 'کنترل مخارج',
    rewardPoints: 30,
    badge: '🔧 احیای دارایی',
  },
  {
    day: 27,
    title: 'محاسبه نرخ پس‌انداز ماه',
    description: 'در بخش نمودارها بررسی کنید چند درصد از کل درآمدهای این ماه ذخیره شده است.',
    category: 'آگاهی مالی',
    rewardPoints: 25,
    badge: '📐 هندسه ثروت',
  },
  {
    day: 28,
    title: 'استخراج اکسل تراکنش‌ها',
    description: 'فایل اکسل جامع چندبوم را دانلود کرده و از خلاصه دسته‌بندی‌ها پرینت یا بکاپ بگیرید.',
    category: 'آگاهی مالی',
    rewardPoints: 30,
    badge: '📁 بایگانی مالی',
  },
  {
    day: 29,
    title: 'پاداش به خود بدون هزینه گزاف',
    description: 'برای موفقیت در کنترل مخارج، با یک تفریح کم‌هزینه (کتابخوانی، فیلم یا پیاده‌روی) به خود پاداش دهید.',
    category: 'آگاهی مالی',
    rewardPoints: 25,
    badge: '🎁 جشن پیروزی',
  },
  {
    day: 30,
    title: 'بستن پرونده مالی ماه',
    description: 'تراز نهایی ماه را بررسی کرده و اهداف ماه آینده را با اطمینان خاطر ترسیم کنید.',
    category: 'سرمایه‌گذاری',
    rewardPoints: 50,
    badge: '🏆 قهرمان ۳۰ روزه',
  },
  {
    day: 31,
    title: 'روز طلایی پاداش ماهانه',
    description: 'تبریک! شما چالش کامل ماه را به پایان رساندید. تسلط مالی اکنون بخشی از سبک زندگی شماست.',
    category: 'سرمایه‌گذاری',
    rewardPoints: 50,
    badge: '👑 استاد بودجه',
  },
];

const STORAGE_KEY = 'chandboom_completed_quests_v1';

export function getCompletedQuests(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function toggleQuestCompletion(dayNumber: number): { completed: boolean; allDays: number[] } {
  try {
    const current = getCompletedQuests();
    let updated: number[];
    let isNowCompleted: boolean;

    if (current.includes(dayNumber)) {
      updated = current.filter((d) => d !== dayNumber);
      isNowCompleted = false;
    } else {
      updated = [...current, dayNumber];
      isNowCompleted = true;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return { completed: isNowCompleted, allDays: updated };
  } catch {
    return { completed: false, allDays: [] };
  }
}

export function calculateStreak(completedDays: number[], currentDay: number): number {
  if (!completedDays || completedDays.length === 0) return 0;
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (completedDays.includes(d)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
