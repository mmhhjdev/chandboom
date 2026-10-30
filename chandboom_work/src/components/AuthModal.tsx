import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Coins,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatToman } from '../utils/formatters';
import { sanitizeVerificationCode } from '../lib/supabase';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    registerWithEmail,
    requestSignupOtp,
    verifySignupOtpAndRegister,
    requestLoginOtp,
    loginWithOtp,
    requestPasswordResetOtp,
    resetPasswordWithOtp,
  } = useApp();

  // Mode: login | register | forgot_password
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  
  // Login type: password vs otp
  const [loginType, setLoginType] = useState<'password' | 'otp'>('password');
  
  // Register type: direct vs otp
  const [registerType, setRegisterType] = useState<'direct' | 'otp'>('direct');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('26');
  const [gender, setGender] = useState<'مرد' | 'زن' | 'سایر'>('مرد');
  const [budgetCap, setBudgetCap] = useState<number>(20000000);

  // For Forgot Password mode
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // OTP Verification Step - Updated to 8 digits
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpAction, setOtpAction] = useState<'register' | 'login' | 'reset_password'>('register');
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(8).fill(''));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timerSeconds, setTimerSeconds] = useState(120);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) || /[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return Math.min(score, 4);
  }, [password]);

  const strengthLabels = ['خیلی کوتاه', 'ضعیف', 'متوسط', 'خوب و ایمن', 'فوق‌العاده قوی'];
  const strengthColors = [
    'bg-zinc-200 dark:bg-zinc-800',
    'bg-rose-500',
    'bg-amber-500',
    'bg-teal-500',
    'bg-emerald-500',
  ];

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (isOtpStep && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOtpStep, timerSeconds]);

  // Reset inputs when modal opens or closes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setIsOtpStep(false);
      setOtpDigits(Array(8).fill(''));
      setError(null);
      setSuccessMsg(null);
      setIsLoading(false);
    }
  }, [isAuthModalOpen]);

  // Focus first OTP input on step change
  useEffect(() => {
    if (isOtpStep) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 120);
    }
  }, [isOtpStep]);

  if (!isAuthModalOpen) return null;

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleaned = sanitizeVerificationCode(value);
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 8).split('');
      for (let i = 0; i < 8; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 7);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    if (cleaned && index < 7) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const rawData = e.clipboardData.getData('text');
    const pasteData = sanitizeVerificationCode(rawData).slice(0, 8);
    if (!pasteData) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 8; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setOtpDigits(newDigits);
    const focusTarget = Math.min(pasteData.length, 7);
    otpInputRefs.current[focusTarget]?.focus();
  };

  const combinedOtp = sanitizeVerificationCode(otpDigits.join(''));

  // Primary Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('لطفاً یک آدرس ایمیل معتبر و کامل وارد نمایید.');
      return;
    }

    // 1. Passwordless OTP Login
    if (mode === 'login' && loginType === 'otp') {
      setIsLoading(true);
      try {
        const res = await requestLoginOtp(cleanEmail);
        if (res.success) {
          setOtpAction('login');
          setOtpDigits(Array(8).fill(''));
          setIsOtpStep(true);
          setTimerSeconds(120);
          setSuccessMsg('کد ۸ رقمی ورود به آدرس ایمیل شما ارسال شد.');
        } else {
          setError(res.error || 'خطا در ارسال کد یکبارمصرف به ایمیل.');
        }
      } catch (err: any) {
        setError(err?.message || 'خطا در برقراری ارتباط جهت ارسال کد ورود.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. Standard Password Login
    if (mode === 'login' && loginType === 'password') {
      if (!password) {
        setError('لطفاً رمز عبور خود را وارد نمایید.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await login(cleanEmail, password);
        if (!res.success) {
          setError(res.error || 'اطلاعات ورود نادرست است.');
        } else {
          setIsAuthModalOpen(false);
        }
      } catch (err: any) {
        setError(err?.message || 'خطای غیرمنتظره در ورود رخ داد.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. Forgot Password Request
    if (mode === 'forgot_password') {
      setIsLoading(true);
      try {
        const res = await requestPasswordResetOtp(cleanEmail);
        if (res.success) {
          setSuccessMsg('کد ۸ رقمی بازیابی رمز عبور با موفقیت به ایمیل شما ارسال شد.');
          setOtpAction('reset_password');
          setOtpDigits(Array(8).fill(''));
          setIsOtpStep(true);
          setTimerSeconds(120);
        } else {
          setError(res.error || 'خطا در ارسال کد بازیابی به ایمیل.');
        }
      } catch (err: any) {
        setError(err?.message || 'خطا در اتصال به سرور جهت بازیابی رمز عبور.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 4. Registration Flow
    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
        return;
      }
      const numericAge = age ? parseInt(age, 10) : undefined;
      if (numericAge !== undefined && (numericAge < 10 || numericAge > 115)) {
        setError('لطفاً یک سن معتبر (بین ۱۰ تا ۱۱۵ سال) وارد کنید.');
        return;
      }
      if (!password || password.length < 6) {
        setError('رمز عبور باید حداقل شامل ۶ کاراکتر باشد.');
        return;
      }
      if (confirmPassword && password !== confirmPassword) {
        setError('رمز عبور و تکرار آن یکسان نیستند.');
        return;
      }

      setIsLoading(true);

      // Method A: Direct Instant Registration (Default & Recommended)
      if (registerType === 'direct') {
        try {
          const res = await registerWithEmail(
            cleanEmail,
            fullName.trim(),
            password,
            undefined,
            numericAge,
            gender,
            budgetCap
          );

          if (!res.success) {
            setError(res.error || 'خطایی در ثبت‌نام رخ داد.');
          } else if (res.requiresEmailConfirmation) {
            setSuccessMsg('حساب شما ایجاد شد! کد تایید ارسال شده به ایمیل را وارد فرمایید.');
            setOtpAction('register');
            setOtpDigits(Array(8).fill(''));
            setIsOtpStep(true);
            setTimerSeconds(120);
          } else {
            setIsAuthModalOpen(false);
          }
        } catch (err: any) {
          setError(err?.message || 'خطا در ارتباط با سرور پایگاه داده.');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Method B: OTP Registration
      try {
        const res = await requestSignupOtp(cleanEmail);
        if (res.isDuplicate || (res.error && res.error.includes('قبلاً ثبت شده'))) {
          setError('این نشانی ایمیل قبلاً ثبت نام شده است. لطفاً وارد شوید.');
          setMode('login');
          setLoginType('password');
          return;
        }

        if (res.success) {
          setOtpAction('register');
          setOtpDigits(Array(8).fill(''));
          setIsOtpStep(true);
          setTimerSeconds(120);
          setError(null);
        } else {
          setError(res.error || 'خطا در ارسال کد تایید به ایمیل.');
        }
      } catch (err: any) {
        setError(err?.message || 'خطای اتصال به سرور احراز هویت.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (combinedOtp.length !== 8) {
      setError('لطفاً کد ۸ رقمی تایید را به طور کامل وارد نمایید.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setError(null);
    setIsLoading(true);

    try {
      // 1. Passwordless OTP Login
      if (otpAction === 'login') {
        const res = await loginWithOtp(cleanEmail, combinedOtp);
        if (!res.success) {
          setError(res.error || 'کد تایید اشتباه است یا زمان آن منقضی شده است.');
        } else {
          setIsAuthModalOpen(false);
          setIsOtpStep(false);
          setOtpDigits(Array(8).fill(''));
        }
        return;
      }

      // 2. Forgot Password Reset
      if (otpAction === 'reset_password') {
        if (!newPassword || newPassword.length < 6) {
          setError('رمز عبور جدید باید حداقل ۶ کاراکتر باشد.');
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('تکرار رمز عبور با رمز عبور جدید یکسان نیست.');
          return;
        }

        const res = await resetPasswordWithOtp(cleanEmail, combinedOtp, newPassword);
        if (!res.success) {
          setError(res.error || 'کد تایید واردشده نامعتبر است.');
        } else {
          setSuccessMsg('رمز عبور شما با موفقیت تغییر یافت. اکنون وارد شوید.');
          setIsOtpStep(false);
          setOtpDigits(Array(8).fill(''));
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
        combinedOtp,
        password,
        fullName.trim(),
        numericAge,
        gender,
        budgetCap
      );

      if (!res.success) {
        setError(res.error || 'کد تایید نامعتبر یا منقضی شده است.');
      } else {
        setIsAuthModalOpen(false);
        setIsOtpStep(false);
        setOtpDigits(Array(8).fill(''));
      }
    } catch (err: any) {
      setError(err?.message || 'خطا در اعتبارسنجی کد امنیتی.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timerSeconds > 0 || isLoading) return;
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    try {
      let res;
      if (otpAction === 'login') {
        res = await requestLoginOtp(cleanEmail);
      } else if (otpAction === 'reset_password') {
        res = await requestPasswordResetOtp(cleanEmail);
      } else {
        res = await requestSignupOtp(cleanEmail);
      }

      if (res.success) {
        setTimerSeconds(120);
        setError(null);
        setSuccessMsg('کد جدید با موفقیت به صندوق ایمیل شما ارسال شد.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md font-cairo overflow-y-auto">
      <div
        id="auth-modal-card"
        className="w-full max-w-lg bg-white dark:bg-[#0B120E] rounded-3xl shadow-2xl border border-zinc-200 dark:border-emerald-950/80 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-emerald-500/10 via-teal-900/10 to-transparent p-5 sm:p-6 border-b border-zinc-100 dark:border-emerald-950/60">
          <button
            onClick={() => {
              setIsAuthModalOpen(false);
              setIsOtpStep(false);
            }}
            className="absolute top-4 left-4 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition cursor-pointer"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 p-0.5 shadow-md shadow-emerald-950/40 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-[#08100C] rounded-[14px] flex items-center justify-center overflow-hidden">
                <img
                  src="./logo.png"
                  alt="چندبوم"
                  onError={(e) => {
                    e.currentTarget.src = './assets/logo.png';
                  }}
                  className="w-8 h-8 object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-brand text-2xl text-emerald-800 dark:text-emerald-400 font-black">
                  چندبوم
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                  سامانه ابری
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isOtpStep
                  ? 'تایید هویت امن و اتصال به پایگاه داده'
                  : mode === 'forgot_password'
                  ? 'بازیابی رمز عبور از طریق کد ۸ رقمی امنیتی'
                  : mode === 'login'
                  ? 'ورود به پنل جامع مدیریت دخل، خرج و دنگ گروهی'
                  : 'عضویت آنی و اتصال امن به پایگاه داده ابری'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          {/* Top Segmented Mode Switcher */}
          {!isOtpStep && (
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-100 dark:bg-zinc-900/90 rounded-2xl text-xs font-bold border border-zinc-200/80 dark:border-emerald-950/40">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#121B16] text-emerald-800 dark:text-emerald-300 shadow-sm border border-zinc-200/50 dark:border-emerald-800/40'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>ورود</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#121B16] text-emerald-800 dark:text-emerald-300 shadow-sm border border-zinc-200/50 dark:border-emerald-800/40'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>ثبت‌نام جدید</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('forgot_password');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'forgot_password'
                    ? 'bg-white dark:bg-[#121B16] text-emerald-800 dark:text-emerald-300 shadow-sm border border-zinc-200/50 dark:border-emerald-800/40'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>بازیابی رمز</span>
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* OTP Screen */}
          {isOtpStep ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  کد ۸ رقمی ارسال‌شده به نشانی ایمیل زیر را وارد نمایید:
                </p>
                <p className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400" dir="ltr">
                  {email}
                </p>
              </div>

              {/* 8 Digit Inputs */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 text-center">
                  کد تایید ۸ رقمی
                </label>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2" dir="ltr">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-8 h-11 sm:w-10 sm:h-12 text-center font-mono text-lg sm:text-xl font-black bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl text-zinc-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-[#0E1712] transition-all shadow-xs p-0"
                    />
                  ))}
                </div>
              </div>

              {/* If Reset Password, prompt for new password */}
              {otpAction === 'reset_password' && (
                <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      رمز عبور جدید (حداقل ۶ کاراکتر) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-9 pl-9 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                      تکرار رمز عبور جدید *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pr-9 pl-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timerSeconds > 0 || isLoading}
                  className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold disabled:text-zinc-400 cursor-pointer disabled:cursor-not-allowed hover:underline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>ارسال مجدد کد تایید</span>
                </button>

                <span className="font-mono font-bold text-zinc-600 dark:text-zinc-400">
                  {timerSeconds > 0
                    ? `۰${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}`
                    : 'کد منقضی شد'}
                </span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading || combinedOtp.length !== 8}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال اعتبارسنجی امن...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {otpAction === 'reset_password'
                          ? 'ذخیره رمز جدید و ورود'
                          : 'تایید کد و ورود به سامانه'}
                      </span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOtpStep(false);
                    setOtpDigits(Array(8).fill(''));
                    setError(null);
                  }}
                  className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                >
                  ویرایش اطلاعات یا تغییر ایمیل
                </button>
              </div>
            </form>
          ) : mode === 'forgot_password' ? (
            /* Forgot Password */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                آدرس ایمیل ثبت‌شده در حساب کاربری خود را وارد فرمایید تا کد ۸ رقمی امنیتی جهت بازنشانی کلمه عبور برای شما ارسال شود.
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  آدرس ایمیل ثبت‌شده *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    autoFocus
                    className="w-full pr-9 pl-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال ارسال کد...</span>
                    </>
                  ) : (
                    <span>ارسال کد ۸ رقمی به ایمیل</span>
                  )}
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
          ) : mode === 'login' ? (
            /* Login Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login Sub-Type (Password vs OTP) */}
              <div className="flex items-center justify-between p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLoginType('password')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    loginType === 'password'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
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
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  <KeyRound className="w-3 h-3" />
                  <span>کد یکبارمصرف ایمیلی</span>
                </button>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  آدرس ایمیل معتبر *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pr-9 pl-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password field (if password login) */}
              {loginType === 'password' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      کلمه عبور *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setError(null);
                        setSuccessMsg(null);
                      }}
                      className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                    >
                      رمز عبور را فراموش کردید؟
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pr-9 pl-9 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                id="auth-login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ورود...</span>
                  </>
                ) : loginType === 'otp' ? (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>ارسال کد یکبارمصرف به ایمیل</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به حساب کاربری</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Advanced Registration Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Registration Mode Selector */}
              <div className="flex items-center justify-between p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setRegisterType('direct')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
                    registerType === 'direct'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>ثبت‌نام مستقیم با گذرواژه (پیشنهادی)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRegisterType('otp')}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    registerType === 'otp'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                  }`}
                >
                  تایید ایمیل با کد ۸ رقمی
                </button>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  نام و نام خانوادگی *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثلاً علی محمدی"
                    required
                    className="w-full pr-9 pl-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-cairo"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  پست الکترونیکی معتبر *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pr-9 pl-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    کلمه عبور *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      required
                      minLength={6}
                      className="w-full pr-9 pl-8 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    تکرار کلمه عبور *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="تکرار رمز عبور"
                      required
                      minLength={6}
                      className="w-full pr-9 pl-8 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-left"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Meter */}
              {password && (
                <div className="space-y-1.5 p-2 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-500">قدرت کلمه عبور:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {strengthLabels[passwordStrength]}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 h-1.5">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`rounded-full transition-all duration-300 ${
                          passwordStrength >= step
                            ? strengthColors[passwordStrength]
                            : 'bg-zinc-200 dark:bg-zinc-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Demographics for users table */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سن شما (سال)
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={10}
                      max={115}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="۲۶"
                      className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-cairo"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    جنسیت
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-cairo cursor-pointer"
                    >
                      <option value="مرد">مرد</option>
                      <option value="زن">زن</option>
                      <option value="سایر">سایر</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Initial Monthly Budget Cap for users table */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    سقف بودجه ماهانه پیش‌فرض
                  </label>
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    {formatToman(budgetCap)}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                  {[10000000, 20000000, 30000000, 50000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBudgetCap(val)}
                      className={`py-1 rounded-lg border transition cursor-pointer ${
                        budgetCap === val
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {val / 1000000} م.ت
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                id="auth-register-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال ساخت حساب و ذخیره در پایگاه داده...</span>
                  </>
                ) : registerType === 'direct' ? (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>افتتاح حساب و ورود مستقیم</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>دریافت کد تایید ۸ رقمی ایمیلی</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Trust Security Footer */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>پایگاه داده ابری فعال</span>
            </span>
            <span>رمزنگاری ۲۵۶ بیتی داده‌ها</span>
          </div>
        </div>
      </div>
    </div>
  );
};