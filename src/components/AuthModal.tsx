import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Shield,
  AlertCircle,
  Calendar,
  Users,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    requestSignupOtp,
    verifySignupOtpAndRegister,
    requestLoginOtp,
    loginWithOtp,
    requestPasswordResetOtp,
    resetPasswordWithOtp,
  } = useApp();

  // Mode: login, register, forgot_password
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  // Login type: standard password or passwordless OTP
  const [loginType, setLoginType] = useState<'password' | 'otp'>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'مرد' | 'زن' | 'سایر'>('مرد');

  // OTP Verification Step
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpAction, setOtpAction] = useState<'register' | 'login' | 'reset_password'>('register');
  const [otpCode, setOtpCode] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(120);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Timer countdown effect
  useEffect(() => {
    let interval: any;
    if (isOtpStep && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpStep, timerSeconds]);

  if (!isAuthModalOpen) return null;

  const handleSendOtpOrLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('لطفاً یک آدرس ایمیل معتبر وارد نمایید.');
      return;
    }

    // 1. Passwordless Login Request
    if (mode === 'login' && loginType === 'otp') {
      setIsLoading(true);
      try {
        const res = await requestLoginOtp(cleanEmail);
        if (res.success) {
          setOtpAction('login');
          setIsOtpStep(true);
          setTimerSeconds(120);
        } else {
          setError(res.error || 'خطا در ارسال کد یکبارمصرف به ایمیل.');
        }
      } catch (err: any) {
        setError(err?.message || 'خطا در ارسال کد تایید.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. Standard Password Login
    if (mode === 'login' && loginType === 'password') {
      if (!password) {
        setError('لطفاً رمز عبور را وارد نمایید.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await login(cleanEmail, password);
        if (!res.success) {
          setError(res.error || 'ورود ناموفق بود.');
        } else {
          setIsAuthModalOpen(false);
        }
      } catch (err: any) {
        setError(err?.message || 'خطای غیرمنتظره رخ داد.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. Forgot Password Request
    if (mode === 'forgot_password') {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);
      try {
        const res = await requestPasswordResetOtp(cleanEmail);
        if (res.success) {
          setSuccessMsg('اگر این ایمیل در سامانه ثبت شده باشد، کد ۶ تا ۸ رقمی بازیابی برای آن ارسال می‌شود.');
          setOtpAction('reset_password');
          setIsOtpStep(true);
          setTimerSeconds(120);
        } else {
          setError(res.error || 'ارسال کد بازیابی ناموفق بود.');
        }
      } catch (err: any) {
        setError(err?.message || 'خطا در ارتباط با سرور جهت بازیابی رمز عبور.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 4. Registration Flow with Duplicate Email Verification
    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('نام و نام خانوادگی الزامی است.');
        return;
      }
      const numericAge = age ? parseInt(age, 10) : undefined;
      if (numericAge !== undefined && (numericAge < 10 || numericAge > 110)) {
        setError('لطفاً سن معتبر وارد نمایید.');
        return;
      }
      if (!password || password.length < 6) {
        setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
        return;
      }

      setIsLoading(true);
      try {
        const numericAge = age ? parseInt(age, 10) : undefined;
        const res = await requestSignupOtp(cleanEmail, password, fullName.trim(), numericAge, gender);
        if (res.isDuplicate || (res.error && res.error.includes('قبلاً ثبت شده'))) {
          // Strict duplicate registration prevention:
          setError('این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید.');
          setMode('login');
          setLoginType('password');
          return;
        }

        if (res.success) {
          setOtpAction('register');
          setIsOtpStep(true);
          setTimerSeconds(120);
          setError(null);
        } else {
          setError(res.error || 'خطا در ارسال کد تایید به ایمیل.');
        }
      } catch (err: any) {
        setError(err?.message || 'خطای ارتباط با سرور.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!/^\d{6,8}$/.test(cleanCode)) {
      setError('لطفاً کد تأیید دریافتی را کامل وارد کنید (۶ تا ۸ رقم).');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Passwordless OTP Login
      if (otpAction === 'login') {
        const res = await loginWithOtp(cleanEmail, cleanCode);
        if (!res.success) {
          setError(res.error || 'کد تأیید اشتباه است یا اعتبار آن تمام شده است.');
        } else {
          setIsAuthModalOpen(false);
          setIsOtpStep(false);
          setOtpCode('');
        }
        return;
      }

      // 2. Forgot Password Reset
      if (otpAction === 'reset_password') {
        if (!newPassword || newPassword.length < 8) {
          setError('رمز عبور جدید باید حداقل ۸ کاراکتر باشد.');
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('تکرار رمز عبور جدید با رمز عبور مطابقت ندارد.');
          return;
        }

        const res = await resetPasswordWithOtp(cleanEmail, cleanCode, newPassword);
        if (!res.success) {
          setError(res.error || 'کد تایید نامعتبر است.');
        } else {
          setSuccessMsg('رمز عبور شما با موفقیت بازنشانی شد. لطفاً وارد شوید.');
          setIsOtpStep(false);
          setOtpCode('');
          setMode('login');
          setLoginType('password');
          setPassword(newPassword);
        }
        return;
      }

      // 3. Registration verification
      const numericAge = age ? parseInt(age, 10) : undefined;
      const res = await verifySignupOtpAndRegister(
        cleanEmail,
        cleanCode,
        password,
        fullName.trim(),
        numericAge,
        gender
      );

      if (!res.success) {
        setError(res.error || 'کد تأیید اشتباه است یا اعتبار آن تمام شده است.');
      } else {
        setIsAuthModalOpen(false);
        setIsOtpStep(false);
        setOtpCode('');
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در بررسی کد امنیتی.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timerSeconds > 0) return;
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      let res;
      if (otpAction === 'login') {
        res = await requestLoginOtp(cleanEmail);
      } else if (otpAction === 'reset_password') {
        res = await requestPasswordResetOtp(cleanEmail);
      } else {
        res = await requestSignupOtp(cleanEmail, password, fullName.trim(), age ? parseInt(age, 10) : undefined, gender);
      }

      if (res.success) {
        setTimerSeconds(120);
        setError(null);
      } else {
        setError(res.error || 'خطا در ارسال مجدد کد.');
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در ارسال مجدد.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs font-cairo">
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-white dark:bg-[#0F1512] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1A2621] overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8E4] dark:border-[#1A2621] pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-[#15271E] dark:text-emerald-300">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {isOtpStep
                ? otpAction === 'login'
                  ? 'ورود با کد یکبارمصرف (OTP)'
                  : otpAction === 'reset_password'
                  ? 'بازیابی رمز عبور'
                  : 'تایید کد امنیتی ثبت‌نام'
                : mode === 'forgot_password'
                ? 'فراموشی رمز عبور'
                : mode === 'login'
                ? 'ورود به سامانه چندبوم'
                : 'ثبت‌نام در سامانه چندبوم'}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              setIsOtpStep(false);
            }}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between Login and Register (when not in OTP step & not in forgot password) */}
        {!isOtpStep && mode !== 'forgot_password' && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-[#141F1A] rounded-2xl text-xs font-cairo font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-xl transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#0F1512] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              ورود به سیستم
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2 rounded-xl transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#0F1512] text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              حساب کاربری جدید
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 2: Interactive OTP Input Screen */}
        {isOtpStep ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center space-y-1">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                کد تأیید عددی امنیتی به آدرس ایمیل زیر ارسال گردید:
              </p>
              <p className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400" dir="ltr">
                {email}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-center space-y-1">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold block flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                کد تایید به صندوق ایمیل شما ارسال شد
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                لطفاً اینباکس یا پوشه Spam ایمیل خود را بررسی نمایید.
              </p>
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 text-center">
                کد تأیید دریافتی (۶ تا ۸ رقم):
              </label>
              <input
                type="text"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="کد تأیید"
                required
                autoFocus
                className="w-full py-2.5 bg-zinc-50 dark:bg-[#141E1A] border-2 border-[#E2E8E4] dark:border-[#1F2E27] rounded-2xl text-center text-2xl font-mono tracking-widest text-zinc-900 dark:text-white outline-none focus:border-emerald-600 transition"
              />
            </div>

            {/* If Reset Password, prompt for new password */}
            {otpAction === 'reset_password' && (
              <div className="space-y-3 pt-1 border-t border-[#E2E8E4] dark:border-[#1A2621]">
                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    رمز عبور جدید *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="حداقل ۸ کاراکتر"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    تکرار رمز عبور جدید *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="تکرار رمز عبور"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={timerSeconds > 0 || isLoading}
                className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold disabled:text-zinc-400 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>ارسال مجدد کد</span>
              </button>

              <span className="font-mono">
                {timerSeconds > 0
                  ? `مهلت: ۰${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}`
                  : 'کد منقضی شد'}
              </span>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isLoading || !/^\d{6,8}$/.test(otpCode.trim())}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isLoading
                    ? 'در حال تایید...'
                    : otpAction === 'reset_password'
                    ? 'ثبت رمز عبور جدید'
                    : 'تایید کد و ورود'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsOtpStep(false);
                  setOtpCode('');
                }}
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                ویرایش اطلاعات یا ایمیل
              </button>
            </div>
          </form>
        ) : mode === 'forgot_password' ? (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleSendOtpOrLogin} className="space-y-4">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              آدرس ایمیل حساب کاربری خود را وارد نمایید تا کد ۶ تا ۸ رقمی بازیابی رمز عبور برای شما ارسال گردد.
            </div>

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                آدرس ایمیل ثبت‌شده *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isLoading ? 'در حال ارسال کد...' : 'ارسال کد بازیابی به ایمیل'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                بازگشت به صفحه ورود
              </button>
            </div>
          </form>
        ) : (
          /* STEP 1: Registration or Login Form */
          <form onSubmit={handleSendOtpOrLogin} className="space-y-3.5">
            {/* If Login mode, choose between Password and Passwordless OTP */}
            {mode === 'login' && (
              <div className="flex items-center justify-between p-1 bg-zinc-50 dark:bg-[#141E1A] rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLoginType('password')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    loginType === 'password'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  ورود با رمز عبور
                </button>
                <button
                  type="button"
                  onClick={() => setLoginType('otp')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                    loginType === 'otp'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <span>ورود با کد یکبارمصرف (OTP)</span>
                </button>
              </div>
            )}

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثلاً سارا احمدی یا سبحان"
                      required
                      className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      سن (سال)
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        min={10}
                        max={110}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="مثلاً ۲۸"
                        className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      جنسیت
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
                      >
                        <option value="مرد">مرد</option>
                        <option value="زن">زن</option>
                        <option value="سایر">سایر</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                آدرس ایمیل *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password input shown if registering OR logging in with password */}
            {(mode === 'register' || (mode === 'login' && loginType === 'password')) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300">
                    رمز عبور *
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      فراموشی رمز عبور؟
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۸ کاراکتر"
                    required
                    minLength={6}
                    className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isLoading
                ? 'در حال پردازش...'
                : mode === 'login'
                ? loginType === 'otp'
                  ? 'ارسال کد یکبارمصرف به ایمیل'
                  : 'ورود به حساب کاربری'
                : 'ادامه و دریافت کد تایید ایمیل'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
