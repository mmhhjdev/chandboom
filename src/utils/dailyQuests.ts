/**
 * 60-day personalized financial quests for Chandboom.
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
,
  { day: 32, title: 'مرور هزینه‌های ثابت', description: 'اجاره، قبوض، اینترنت و هزینه‌های ثابت را فهرست کنید.', category: 'آگاهی مالی', rewardPoints: 20, badge: '📋 هزینه‌های ثابت' },
  { day: 33, title: 'تعیین سقف خریدهای تفریحی', description: 'برای تفریح و سرگرمی این هفته یک سقف واقع‌بینانه تعیین کنید.', category: 'کنترل مخارج', rewardPoints: 20, badge: '🎈 تفریح متعادل' },
  { day: 34, title: 'بررسی کارمزدها', description: 'کارمزدهای بانکی و خدماتی اخیر را بررسی کنید و موارد قابل‌کاهش را بشناسید.', category: 'آگاهی مالی', rewardPoints: 25, badge: '🔎 دیده‌بان کارمزد' },
  { day: 35, title: 'مرور هدف پس‌انداز', description: 'میزان پیشرفت هدف پس‌اندازتان را بررسی و در صورت نیاز مبلغ ماهانه را تنظیم کنید.', category: 'پس‌انداز', rewardPoints: 30, badge: '🎯 هدف روشن' },
  { day: 36, title: 'برنامه‌ریزی خرید هفتگی', description: 'خریدهای ضروری هفته را فهرست کنید و موارد غیرضروری را جدا نگه دارید.', category: 'کنترل مخارج', rewardPoints: 20, badge: '🛒 برنامه‌ریز خرید' },
  { day: 37, title: 'ثبت یک هزینه فراموش‌شده', description: 'تراکنش‌های اخیر را مرور کنید و اگر هزینه‌ای ثبت نشده، آن را وارد کنید.', category: 'آگاهی مالی', rewardPoints: 20, badge: '🧾 ثبت دقیق' },
  { day: 38, title: 'ساخت عادت پس‌انداز کوچک', description: 'یک مبلغ کوچک و قابل‌تداوم برای پس‌انداز انتخاب کنید.', category: 'پس‌انداز', rewardPoints: 25, badge: '🪙 قدم کوچک' },
  { day: 39, title: 'مقایسه نیاز و خواسته', description: 'سه خرید اخیر را بررسی کنید و نیازها را از خواسته‌ها جدا کنید.', category: 'کنترل مخارج', rewardPoints: 25, badge: '⚖️ انتخاب آگاهانه' },
  { day: 40, title: 'مرور صورت‌حساب بانکی', description: 'تراکنش‌های بانکی اخیر را با ثبت‌های خود مقایسه کنید.', category: 'آگاهی مالی', rewardPoints: 25, badge: '🏦 تطبیق حساب' },
  { day: 41, title: 'برنامه‌ریزی برای قبض بعدی', description: 'موعد قبض‌ها و پرداخت‌های نزدیک را یادداشت یا یادآوری کنید.', category: 'آگاهی مالی', rewardPoints: 20, badge: '⏰ پرداخت به‌موقع' },
  { day: 42, title: 'یک روز خرید با فهرست', description: 'امروز پیش از خرید فهرست تهیه کنید و تا جای ممکن به آن پایبند بمانید.', category: 'کنترل مخارج', rewardPoints: 25, badge: '📝 فهرست‌محور' },
  { day: 43, title: 'ارزیابی هزینه حمل‌ونقل', description: 'هزینه‌های رفت‌وآمد این هفته را جمع‌بندی و گزینه‌های مناسب‌تر را بررسی کنید.', category: 'کنترل مخارج', rewardPoints: 20, badge: '🚍 مسیر اقتصادی' },
  { day: 44, title: 'آموزش یک مفهوم مالی', description: 'ده دقیقه درباره بودجه، تورم، بهره یا پس‌انداز مطالعه کنید.', category: 'آگاهی مالی', rewardPoints: 25, badge: '📚 دانش مالی' },
  { day: 45, title: 'بررسی صندوق اضطراری', description: 'بررسی کنید برای هزینه‌های پیش‌بینی‌نشده چه مقدار پس‌انداز در دسترس دارید.', category: 'پس‌انداز', rewardPoints: 30, badge: '🛟 پشتوانه' },
  { day: 46, title: 'مرور هزینه خوراک', description: 'هزینه خوراک و خرید مواد غذایی را مرور و یک راه کاهش اتلاف پیدا کنید.', category: 'کنترل مخارج', rewardPoints: 20, badge: '🥦 مدیریت خوراک' },
  { day: 47, title: 'تنظیم یادآور مالی', description: 'برای یک پرداخت یا هدف مهم، یادآور مناسب ثبت کنید.', category: 'آگاهی مالی', rewardPoints: 20, badge: '🔔 یادآور هوشمند' },
  { day: 48, title: 'بررسی خریدهای تکراری', description: 'پرداخت‌های تکرارشونده را بررسی کنید و موارد غیرضروری را مشخص کنید.', category: 'کنترل مخارج', rewardPoints: 25, badge: '🔁 پرداخت‌های تکراری' },
  { day: 49, title: 'تعیین هدف مالی سه‌ماهه', description: 'یک هدف مالی سه‌ماهه با مبلغ و زمان‌بندی مشخص بنویسید.', category: 'سرمایه‌گذاری', rewardPoints: 30, badge: '🗓️ هدف سه‌ماهه' },
  { day: 50, title: 'مرور پیشرفت چالش', description: 'تسک‌های انجام‌شده را مرور کنید و یک عادتی را که بهتر شده مشخص کنید.', category: 'آگاهی مالی', rewardPoints: 30, badge: '🏅 مرور پیشرفت' },
  { day: 51, title: 'بررسی درآمدهای جانبی', description: 'راه‌های واقع‌بینانه و ایمن افزایش درآمد یا کسب مهارت را یادداشت کنید.', category: 'سرمایه‌گذاری', rewardPoints: 25, badge: '💡 فرصت درآمد' },
  { day: 52, title: 'برنامه‌ریزی برای هزینه بزرگ', description: 'اگر هزینه بزرگی پیش رو دارید، مبلغ و زمان لازم برای آماده‌شدن را محاسبه کنید.', category: 'پس‌انداز', rewardPoints: 30, badge: '🧮 آمادگی مالی' },
  { day: 53, title: 'مقایسه قیمت خدمات', description: 'یک سرویس یا خدمت موردنیاز را از نظر قیمت و شرایط با گزینه‌های دیگر مقایسه کنید.', category: 'کنترل مخارج', rewardPoints: 25, badge: '🔍 مقایسه هوشمند' },
  { day: 54, title: 'پاک‌سازی دسته‌بندی‌ها', description: 'تراکنش‌های ثبت‌شده را بررسی کنید و دسته‌بندی‌های اشتباه را اصلاح کنید.', category: 'آگاهی مالی', rewardPoints: 20, badge: '🗂️ داده‌های مرتب' },
  { day: 55, title: 'بازبینی هدف خرید', description: 'برای یک خرید مهم، هزینه نهایی و زمان مناسب خرید را دوباره ارزیابی کنید.', category: 'کنترل مخارج', rewardPoints: 25, badge: '🛍️ خرید سنجیده' },
  { day: 56, title: 'تقویت پس‌انداز هفتگی', description: 'اگر در توانتان است، مبلغ کوچکی به پس‌انداز اضافه کنید یا برنامه آن را مشخص کنید.', category: 'پس‌انداز', rewardPoints: 30, badge: '🌱 رشد پس‌انداز' },
  { day: 57, title: 'مرور ریسک تصمیم مالی', description: 'پیش از یک تصمیم مالی، هزینه‌ها، ریسک‌ها و گزینه جایگزین را بنویسید.', category: 'سرمایه‌گذاری', rewardPoints: 30, badge: '🧠 تصمیم سنجیده' },
  { day: 58, title: 'آماده‌سازی گزارش شخصی', description: 'درآمد، مخارج و پس‌انداز اخیر را در یک خلاصه کوتاه ثبت کنید.', category: 'آگاهی مالی', rewardPoints: 25, badge: '📊 گزارش شخصی' },
  { day: 59, title: 'انتخاب یک عادت پایدار', description: 'یک عادت مالی مفید از این چالش انتخاب کنید که می‌خواهید ادامه دهید.', category: 'پس‌انداز', rewardPoints: 25, badge: '🌿 عادت پایدار' },
  { day: 60, title: 'جمع‌بندی ۶۰ روز مدیریت مالی', description: 'پیشرفت دو ماه گذشته را مرور کنید و سه اقدام مشخص برای ماه آینده تعیین کنید.', category: 'سرمایه‌گذاری', rewardPoints: 60, badge: '🏆 قهرمان ۶۰ روزه' },
];

const STORAGE_PREFIX = 'chandboom_completed_quests_v2';

function storageKey(userId?: string): string {
  return `${STORAGE_PREFIX}:${userId?.trim() || 'guest'}`;
}

/** Day 1 is the user's signup date; each local calendar date advances the program by one day. */
export function getAccountQuestDay(createdAt?: string | null, now = new Date()): number {
  if (!createdAt) return 1;
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) return 1;
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsed = Math.floor((today.getTime() - startDate.getTime()) / 86400000) + 1;
  return Math.min(60, Math.max(1, elapsed));
}

export function getCompletedQuests(userId?: string): number[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((value): value is number => Number.isInteger(value) && value >= 1 && value <= 60))];
  } catch {
    return [];
  }
}

export function toggleQuestCompletion(dayNumber: number, userId?: string): { completed: boolean; allDays: number[] } {
  try {
    if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 60) {
      return { completed: false, allDays: getCompletedQuests(userId) };
    }
    const current = getCompletedQuests(userId);
    const isNowCompleted = !current.includes(dayNumber);
    const updated = isNowCompleted ? [...current, dayNumber].sort((a, b) => a - b) : current.filter((d) => d !== dayNumber);
    localStorage.setItem(storageKey(userId), JSON.stringify(updated));
    return { completed: isNowCompleted, allDays: updated };
  } catch {
    return { completed: false, allDays: [] };
  }
}

export function calculateStreak(completedDays: number[], currentDay: number): number {
  if (!completedDays || completedDays.length === 0) return 0;
  let streak = 0;
  for (let d = currentDay; d >= 1; d--) {
    if (completedDays.includes(d)) streak++;
    else break;
  }
  return streak;
}
