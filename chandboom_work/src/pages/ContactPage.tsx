import React, { useState } from 'react';
import { SEOLayout } from '../components/SEOLayout';
import { SEOHead } from '../components/SEOHead';
import { Mail, Clock, Send, CheckCircle2, MessageSquare, Headphones } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setIsSubmitted(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <SEOLayout>
      <SEOHead
        title="تماس با ما | پشتیبانی و ارتباط با تیم چندبوم"
        description="راه‌های ارتباطی با پشتیبانی چندبوم، ثبت درخواست پشتیبانی، ایمیل سازمانی و ساعات پاسخگویی تیم چندبوم."
        canonicalPath="/contact"
      />

      <div className="space-y-10 animate-in fade-in duration-200">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Headphones className="w-3.5 h-3.5" />
            <span>مرکز ارتباط با کاربران</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">
            همواره در کنار شما و پاسخگوی پرسش‌هایتان هستیم
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            تیم پشتیبانی چندبوم آماده دریافت بازخوردها، پیشنهادات و رسیدگی به سوالات شماست
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Contact Details & Info */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs space-y-4">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600" />
                <span>اطلاعات تماس سازمانی</span>
              </h2>

              <div className="space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-[#131F19] border border-[#E2E8E4] dark:border-[#1F2E26]">
                  <span className="text-zinc-500">ایمیل پشتیبانی:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                    support@chandboom.ir
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-[#131F19] border border-[#E2E8E4] dark:border-[#1F2E26]">
                  <span className="text-zinc-500">ایمیل اداری و تجاری:</span>
                  <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300" dir="ltr">
                    info@chandboom.ir
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs space-y-3">
              <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>ساعات کاری و زمان پاسخگویی</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                تیم پشتیبانی فنی در تمام روزهای هفته از ساعت ۸:۰۰ تا ۲۲:۰۰ پاسخگوی تیکت‌ها و پیام‌های شما می‌باشد. میانگین زمان پاسخگویی برای کاربران اشتراک طلایی کمتر از ۳۰ دقیقه است.
              </p>
            </div>
          </div>

          {/* Contact Message Form */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0F1713] border border-[#E2E8E4] dark:border-[#1E2E25] shadow-xs">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>ارسال پیام مستقیم به پشتیبانی</span>
            </h2>

            {isSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  پیام شما با موفقیت دریافت شد
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  کارشناسان پشتیبانی چندبوم پس از بررسی، از طریق ایمیل درج‌شده با شما ارتباط برقرار خواهند نمود.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    نام و نام‌خانوادگی
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً علی محمدی"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#14201A] border border-[#D5DDD7] dark:border-[#21352A] text-xs outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    آدرس ایمیل جهت پاسخ
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#14201A] border border-[#D5DDD7] dark:border-[#21352A] text-xs outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    متن پیام یا پرسش
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="پیام، نظر یا سوال خود را اینجا یادداشت کنید..."
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-[#14201A] border border-[#D5DDD7] dark:border-[#21352A] text-xs outline-none focus:border-emerald-500 text-zinc-900 dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال پیام به پشتیبانی</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </SEOLayout>
  );
};
