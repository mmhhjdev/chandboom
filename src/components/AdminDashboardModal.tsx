import React, { useState } from 'react';
import {
  X,
  Shield,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  CreditCard,
  Lock,
  Activity,
  UserCheck,
  Search,
  Eye,
  LogOut,
  AlertTriangle,
  Crown,
  Calendar,
  MessageSquare,
  Send,
  Bell,
  Filter,
  Check,
  Loader2,
  Sparkles,
  RefreshCw,
  Zap,
  Gem,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  verifyAdminCredentials,
  getStoredAdminSession,
  setStoredAdminSession,
  clearStoredAdminSession,
  isStoredAdminSessionValid,
  isAdminEmail,
  getEnvAdminEmail,
} from '../utils/admin';
import { getSupabaseClient, getPaymentReceiptViewUrl, invokeAdminReviewOrderEdgeFunction } from '../lib/supabase';
import { formatToman, formatShamsiDateTime, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { calculateRemainingProDays } from '../utils/security';
import { UserRole, SubscriptionTier, UserProfile, ManualPaymentSubmission } from '../types';
import { MALE_AVATAR_SVG, FEMALE_AVATAR_SVG } from '../utils/avatars';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// نگاشت plan_id به نام فارسی و آیکون
const PLAN_INFO: Record<string, { nameFa: string; icon: any; color: string }> = {
  bronze: { nameFa: 'اشتراک برنزی', icon: Gem, color: 'text-amber-700 dark:text-amber-500' },
  pro: { nameFa: 'اشتراک طلایی (Pro)', icon: Crown, color: 'text-yellow-600 dark:text-yellow-400' },
  vip: { nameFa: 'اشتراک ویژه (VIP)', icon: Zap, color: 'text-purple-600 dark:text-purple-400' },
  'bronze-1m': { nameFa: 'اشتراک برنزی ۱ ماهه', icon: Gem, color: 'text-amber-700 dark:text-amber-500' },
  'pro-1m': { nameFa: 'اشتراک طلایی ۱ ماهه', icon: Crown, color: 'text-yellow-600 dark:text-yellow-400' },
  'pro-3m': { nameFa: 'اشتراک طلایی ۳ ماهه', icon: Crown, color: 'text-yellow-600 dark:text-yellow-400' },
  'pro-6m': { nameFa: 'اشتراک طلایی ۶ ماهه', icon: Crown, color: 'text-yellow-600 dark:text-yellow-400' },
  'vip-3m': { nameFa: 'اشتراک VIP ۳ ماهه', icon: Zap, color: 'text-purple-600 dark:text-purple-400' },
};

function getPlanInfo(planId: string | undefined) {
  if (!planId) return { nameFa: 'اشتراک نامشخص', icon: Crown, color: 'text-zinc-600' };
  const key = planId.toLowerCase().replace(/\s+/g, '-');
  // تطابق دقیق
  if (PLAN_INFO[key]) return PLAN_INFO[key];
  // تطابق بر اساس پیشوند
  if (key.startsWith('bronze')) return PLAN_INFO.bronze;
  if (key.startsWith('vip')) return PLAN_INFO.vip;
  if (key.startsWith('pro')) return PLAN_INFO.pro;
  return { nameFa: 'اشتراک طلایی', icon: Crown, color: 'text-yellow-600' };
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isAdmin2FAVerified,
    verifyAdmin2FA,
    requestAdminOtp,
    logoutAdmin2FA,
    manualPayments,
    allUsers,
    updateUserRoleAndTier,
    updateUserSubscriptionDays,
    sendDirectUserMessage,
    transactions,
    tickets,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'payments' | 'users' | 'security' | 'stats'>('payments');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return (
      (user && (user.role === 'admin' || isAdminEmail(user.email))) ||
      isAdmin2FAVerified ||
      isStoredAdminSessionValid(user?.email)
    );
  });
  const [adminEmailInput, setAdminEmailInput] = useState(() => user?.email || getEnvAdminEmail() || '');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');

  // Live Manual Payments from Supabase
  const [livePayments, setLivePayments] = useState<ManualPaymentSubmission[]>(manualPayments);
  const [isFetchingPayments, setIsFetchingPayments] = useState(false);
  const [twoFaInput, setTwoFaInput] = useState('');
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [statusMessageSent, setStatusMessageSent] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState('');
  const [pendingTierByUser, setPendingTierByUser] = useState<Record<string, SubscriptionTier>>({});
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<string | null>(null);
  const [receiptPreviewError, setReceiptPreviewError] = useState<string | null>(null);
  const [isReceiptPreviewLoading, setIsReceiptPreviewLoading] = useState(false);

  const openReceiptPreview = async (reference?: string | null) => {
    if (!reference) return;
    setReceiptPreviewError(null);
    setIsReceiptPreviewLoading(true);
    try {
      const result = await getPaymentReceiptViewUrl(reference);
      if (!result.url) { setReceiptPreviewError(result.error || 'نمایش تصویر فیش ناموفق بود.'); return; }
      setSelectedReceiptForPreview(result.url);
    } catch (error) {
      setReceiptPreviewError(error instanceof Error ? error.message : 'نمایش تصویر فیش ناموفق بود.');
    } finally { setIsReceiptPreviewLoading(false); }
  };

  // Sync session state
  React.useEffect(() => {
    if (isStoredAdminSessionValid(user?.email) || isAdmin2FAVerified) {
      setIsAdminAuthenticated(true);
    }
  }, [isOpen, user?.email, isAdmin2FAVerified]);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch live requests from BOTH subscription_orders and manual_payments
  const fetchLiveManualPayments = async () => {
    setIsFetchingPayments(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLivePayments(manualPayments || []);
        return;
      }

      const [ordersRes, paymentsRes] = await Promise.allSettled([
        supabase.from('subscription_orders').select('*').order('created_at', { ascending: false }),
        supabase.from('manual_payments').select('*').order('created_at', { ascending: false }),
      ]);

      const mergedMap = new Map<string, ManualPaymentSubmission>();

      // 1. Ingest manual_payments records
      if (paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value.data)) {
        for (const item of paymentsRes.value.data) {
          if (!item || !item.id) continue;
          mergedMap.set(item.id, {
            ...item,
            amount: item.amount || 0,
            status: item.status === 'approved' ? 'approved' : item.status === 'rejected' ? 'rejected' : 'pending',
          });
        }
      }

      // 2. Ingest & deduplicate subscription_orders records
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data)) {
        for (const order of ordersRes.value.data) {
          if (!order || !order.id) continue;
          const matchingUser = allUsers.find((u) => u.id === order.user_id);
          const userEmail = order.user_email || matchingUser?.email || '';
          const userName = order.user_name || matchingUser?.full_name || order.note || 'کاربر چندبوم';
          const orderAmount = order.amount_toman || order.amount || 0;
          const orderTracking = order.tracking_code || order.receipt_path || '';
          const orderReceipt = order.receipt_image_url || order.receipt_path || undefined;

          // Check for duplicate
          let duplicateKey: string | null = null;
          for (const [key, existing] of mergedMap.entries()) {
            if (key === order.id) { duplicateKey = key; break; }
            if (orderTracking && existing.tracking_code && existing.tracking_code === orderTracking) { duplicateKey = key; break; }
            if (
              existing.user_id === order.user_id &&
              existing.amount === orderAmount &&
              Math.abs(new Date(existing.created_at).getTime() - new Date(order.created_at || 0).getTime()) < 300000
            ) { duplicateKey = key; break; }
          }

          const mappedStatus = order.status === 'approved' ? 'approved' : order.status === 'rejected' ? 'rejected' : 'pending';
          const planInfo = getPlanInfo(order.plan_id);
          const mappedPlanName = order.plan_name || planInfo.nameFa;

          if (duplicateKey) {
            const existing = mergedMap.get(duplicateKey)!;
            mergedMap.set(duplicateKey, {
              ...existing,
              alt_id: order.id,
              user_email: existing.user_email || userEmail,
              user_name: existing.user_name || userName,
              plan_id: order.plan_id || existing.plan_id,
              plan_name: mappedPlanName,
              amount: orderAmount || existing.amount,
              receipt_url: existing.receipt_url || existing.receipt_image_url || orderReceipt,
              receipt_image_url: existing.receipt_image_url || orderReceipt,
              card_last4: existing.card_last4 || order.card_last4,
              status: existing.status === 'approved' || mappedStatus === 'approved' ? 'approved' : mappedStatus,
              reviewed_at: order.reviewed_at || existing.reviewed_at,
              reviewed_by: order.reviewed_by || existing.reviewed_by,
              admin_notes: order.admin_note || order.reject_reason || existing.admin_notes,
            } as any);
          } else {
            const mapped: ManualPaymentSubmission = {
              id: order.id,
              user_id: order.user_id,
              user_email: userEmail,
              user_name: userName,
              plan_id: order.plan_id || 'pro',
              plan_name: mappedPlanName,
              amount: orderAmount,
              tracking_code: orderTracking || order.id.slice(-6),
              card_last4: order.card_last4 || undefined,
              receipt_image_url: orderReceipt,
              receipt_url: orderReceipt,
              status: mappedStatus,
              created_at: order.created_at || new Date().toISOString(),
              reviewed_at: order.reviewed_at,
              reviewed_by: order.reviewed_by,
              admin_notes: order.admin_note || order.reject_reason || order.note,
              notes: order.note || undefined,
            };
            mergedMap.set(order.id, mapped);
          }
        }
      }

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      if (mergedList.length > 0) {
        setLivePayments(mergedList);
      } else {
        setLivePayments(manualPayments || []);
      }
    } catch (e) {
      console.warn('Error fetching unified admin subscription requests:', e);
      setLivePayments(manualPayments || []);
    } finally {
      setIsFetchingPayments(false);
    }
  };

  React.useEffect(() => {
    if (isOpen && isAdminAuthenticated) {
      fetchLiveManualPayments();
    }
  }, [isOpen, isAdminAuthenticated]);

  React.useEffect(() => {
    if (manualPayments && manualPayments.length > 0) {
      setLivePayments((prev) => {
        const map = new Map<string, ManualPaymentSubmission>();
        for (const item of manualPayments) map.set(item.id, item);
        for (const item of prev) map.set(item.id, item);
        return Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }
  }, [manualPayments]);

  // User Directory filter
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'pro' | 'free' | 'active' | 'expired'>('all');
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<UserProfile | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendAsNotification, setSendAsNotification] = useState(true);
  const [sendAsTicket, setSendAsTicket] = useState(true);
  const [messagePriority, setMessagePriority] = useState<'urgent' | 'normal' | 'low'>('urgent');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const quickTemplates = [
    {
      title: 'فعال‌سازی برنزی',
      subject: 'اشتراک برنزی برای شما فعال شد',
      body: 'کاربر گرامی، اشتراک برنزی حساب کاربری شما با موفقیت فعال شد. اکنون به دستیار هوشمند چندبوم با سهمیه ۱۰۰ پرسش در ماه دسترسی دارید.',
    },
    {
      title: 'فعال‌سازی پرو',
      subject: 'اشتراک طلایی (Pro) برای شما فعال شد',
      body: 'کاربر گرامی، اشتراک طلایی (Pro) حساب کاربری شما با موفقیت فعال شد. اکنون به تمامی امکانات هوش مصنوعی، بودجه‌بندی هوشمند و تحلیل‌های پیشرفته چندبوم با سهمیه ۱۰۰۰ پرسش در ماه دسترسی دارید.',
    },
    {
      title: 'فعال‌سازی VIP',
      subject: 'اشتراک ویژه (VIP) برای شما فعال شد',
      body: 'کاربر گرامی، اشتراک ویژه (VIP) حساب کاربری شما با موفقیت فعال شد. اکنون به تمامی امکانات چندبوم با پرسش نامحدود از هوش مصنوعی و پشتیبانی ۲۴/۷ اختصاصی دسترسی دارید.',
    },
    {
      title: 'تأیید فیش واریز',
      subject: 'تأیید فیش واریزی کارت‌به‌کارت',
      body: 'فیش واریزی کارت‌به‌کارت شما توسط مدیریت چندبوم بررسی و تأیید شد. اعتبار اشتراک به حساب شما افزوده گردید.',
    },
    {
      title: 'یادآوری تمدید',
      subject: 'یادآوری موعد پایان اشتراک',
      body: 'کاربر گرامی، مدت اعتبار اشتراک شما رو به پایان است. لطفاً جهت استمرار بهره‌مندی از خدمات اختصاصی، نسبت به تمدید اشتراک اقدام نمایید.',
    },
    {
      title: 'پشتیبانی عمومی',
      subject: 'پیام از طرف تیم مدیریت چندبوم',
      body: 'کاربر گرامی، در صورت وجود هرگونه سوال، ابهام یا نیاز به راهنمایی در بخش‌های مختلف سامانه چندبوم، می‌توانید از بخش پشتیبانی با ما در ارتباط باشید.',
    },
  ];

  const handleOpenMessageDialog = (targetUser: UserProfile) => {
    setSelectedUserForMessage(targetUser);
    setMessageSubject(`پیام مدیریت سامانه چندبوم به ${targetUser.full_name || 'کاربر'}`);
    setMessageContent('');
    setMessageSentSuccess(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForMessage || !messageContent.trim()) return;
    setIsSendingMessage(true);
    setMessageSentSuccess(null);
    try {
      const ok = await sendDirectUserMessage(
        selectedUserForMessage.id,
        selectedUserForMessage.full_name || 'کاربر گرامی',
        selectedUserForMessage.email,
        messageSubject.trim() || 'اطلاعیه مدیریت چندبوم',
        messageContent.trim(),
        sendAsNotification,
        sendAsTicket
      );
      if (ok) {
        setMessageSentSuccess(`پیام شما با موفقیت برای کاربر ${selectedUserForMessage.full_name || selectedUserForMessage.email} ارسال شد.`);
        setTimeout(() => {
          setSelectedUserForMessage(null);
          setMessageSentSuccess(null);
          setMessageContent('');
        }, 1800);
      }
    } catch (err: any) {
      alert(err?.message || 'خطا در ارسال پیام');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRequestCode = async () => {
    setIsOtpLoading(true);
    setTwoFaError(null);
    try {
      const res = await requestAdminOtp();
      if (res.success) {
        setStatusMessageSent('کد تایید امنیتی به ایمیل مدیریت ارسال شد. لطفاً صندوق ورودی خود را بررسی نمایید.');
      } else {
        setTwoFaError(res.error || 'خطا در ارسال کد تایید');
      }
    } catch (err: any) {
      setTwoFaError(err?.message || 'خطا در ارتباط با سرور');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsOtpLoading(true);
    setTwoFaError(null);
    try {
      const res = await verifyAdmin2FA(twoFaInput);
      if (!res.success) {
        setTwoFaError(res.error || 'کد تایید اشتباه است.');
      } else {
        setTwoFaError(null);
        setStatusMessageSent(null);
      }
    } catch (err: any) {
      setTwoFaError(err?.message || 'خطا در تایید کد امنیتی');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleAdminCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthSubmitting(true);
    setAdminAuthError(null);
    const cleanEmail = adminEmailInput.trim().toLowerCase();
    const cleanPassword = adminPasswordInput.trim();
    if (!cleanEmail || !cleanPassword) {
      setAdminAuthError('لطفاً ایمیل و رمز عبور ادمین را وارد نمایید.');
      setIsAuthSubmitting(false);
      return;
    }
    try {
      const res = await verifyAdminCredentials(cleanEmail, cleanPassword);
      if (res.success) {
        setIsAdminAuthenticated(true);
        setAdminAuthError(null);
        await fetchLiveManualPayments();
      } else {
        setAdminAuthError(res.error || 'اطلاعات کاربری ادمین در سیستم یافت نشد یا رمز عبور نامعتبر است.');
      }
    } catch (err: any) {
      setAdminAuthError(err?.message || 'خطا در برقراری ارتباط با سامانه احراز هویت');
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleAdminLogout = () => {
    clearStoredAdminSession();
    logoutAdmin2FA();
    setIsAdminAuthenticated(false);
  };

  // ✅ تایید سفارش با Edge Function جدید (اتوماسیون کامل)
  const handleApproveAction = async (pay: ManualPaymentSubmission) => {
    setActionLoadingId(pay.id);
    try {
      const result = await invokeAdminReviewOrderEdgeFunction({
        action: 'approve',
        paymentId: pay.id,
        adminNotes: adminNotes[pay.id] || '',
      });

      if (result.success) {
        const planInfo = getPlanInfo(pay.plan_id);
        const durationDays = pay.plan_id?.toLowerCase().includes('vip') ? 90 : 
                             pay.plan_id?.toLowerCase().includes('3m') ? 90 :
                             pay.plan_id?.toLowerCase().includes('6m') ? 180 : 30;
        
        alert(
          `✅ ${result.message || 'سفارش با موفقیت تایید شد'}\n\n` +
          `📋 جزئیات فعال‌سازی:\n` +
          `• پلن: ${planInfo.nameFa}\n` +
          `• مدت: ${durationDays} روز\n` +
          `• سهمیه AI: ${pay.plan_id?.toLowerCase().includes('vip') ? 'نامحدود' : pay.plan_id?.toLowerCase().includes('pro') ? '۱۰۰۰ پرسش' : '۱۰۰ پرسش'} در ماه\n` +
          `• وضعیت: فعال ✅\n\n` +
          `کاربر اکنون به تمام امکانات اشتراک دسترسی دارد.`
        );

        // اگر alt_id هم وجود دارد (duplicate record)
        if ((pay as any).alt_id && (pay as any).alt_id !== pay.id) {
          try {
            await invokeAdminReviewOrderEdgeFunction({
              action: 'approve',
              paymentId: (pay as any).alt_id,
              adminNotes: adminNotes[pay.id] || '',
            });
          } catch {
            // Non-fatal
          }
        }

        await fetchLiveManualPayments();
      } else {
        alert(`❌ خطا: ${result.error || 'خطای ناشناخته در تایید سفارش'}`);
      }
    } catch (err: any) {
      alert(err?.message || 'خطا در تایید سفارش اشتراک');
    } finally {
      setActionLoadingId(null);
    }
  };

  // ✅ رد سفارش با Edge Function جدید
  const handleRejectAction = async (pay: ManualPaymentSubmission) => {
    setActionLoadingId(pay.id);
    try {
      const result = await invokeAdminReviewOrderEdgeFunction({
        action: 'reject',
        paymentId: pay.id,
        adminNotes: adminNotes[pay.id] || '',
      });

      if (result.success) {
        alert(`✅ ${result.message || 'سفارش با موفقیت رد شد'}`);

        if ((pay as any).alt_id && (pay as any).alt_id !== pay.id) {
          try {
            await invokeAdminReviewOrderEdgeFunction({
              action: 'reject',
              paymentId: (pay as any).alt_id,
              adminNotes: adminNotes[pay.id] || '',
            });
          } catch {
            // Non-fatal
          }
        }

        await fetchLiveManualPayments();
      } else {
        alert(`❌ خطا: ${result.error || 'خطای ناشناخته در رد سفارش'}`);
      }
    } catch (err: any) {
      alert(err?.message || 'خطا در رد سفارش اشتراک');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    const search = userSearch.toLowerCase().trim();
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search) ||
      (u.full_name && u.full_name.toLowerCase().includes(search));
    if (!matchesSearch) return false;
    if (subscriptionFilter === 'all') return true;
    const proStatus = calculateRemainingProDays(u.subscription_expires_at);
    if (subscriptionFilter === 'pro') return u.tier === 'pro' || u.tier === 'vip' || u.tier === 'bronze';
    if (subscriptionFilter === 'free') return u.tier === 'free' || !u.tier;
    if (subscriptionFilter === 'active') return proStatus.isActive;
    if (subscriptionFilter === 'expired') return !proStatus.isActive && (u.tier === 'pro' || u.tier === 'vip' || u.tier === 'bronze');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs font-cairo">
      <div
        id="admin-dashboard-modal"
        className="w-full max-w-5xl bg-white dark:bg-[#0D1410] rounded-3xl shadow-2xl border border-[#E2E8E4] dark:border-[#1F2E26] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8E4] dark:border-[#1F2E26] bg-zinc-50/50 dark:bg-[#101914]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cairo text-lg font-bold text-zinc-900 dark:text-white">
                  پنل مدیریت ارشد و امنیت چندبوم (Chandboom Admin)
                </h3>
                {isAdminAuthenticated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    نشست مدیریت تایید‌شده
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                مدیریت پرداخت‌های کارت به کارت، اعضا، وضعیت اشتراک و نظارت امنیتی
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdminAuthenticated && (
              <button
                onClick={handleAdminLogout}
                title="خروج از نشست مدیریت"
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center gap-1 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Authentication Guard Wall */}
        {!isAdminAuthenticated ? (
          <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center space-y-5 max-w-md mx-auto w-full">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="font-cairo text-xl font-bold text-zinc-900 dark:text-zinc-100">
                احراز هویت مدیر سامانه چندبوم
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                اطلاعات ورود شما به‌صورت امن بررسی می‌شود تا نشست مدیریت فعال شود
              </p>
            </div>
            {/* Auth Mode Toggle */}
            <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-[#141F1A] border border-[#E2E8E4] dark:border-[#1F2E27] w-full text-xs font-bold">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  authMode === 'password'
                    ? 'bg-white dark:bg-[#1D2B24] text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                ورود با رمز عبور (جدول admins)
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('otp')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  authMode === 'otp'
                    ? 'bg-white dark:bg-[#1D2B24] text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                کد تایید پیامکی/ایمیلی (2FA)
              </button>
            </div>
            {authMode === 'password' ? (
              <form onSubmit={handleAdminCredentialsLogin} className="w-full space-y-3.5 text-right">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                    ایمیل مدیر ارشد (جدول admins):
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    placeholder={getEnvAdminEmail() || "admin@chandboom.ir"}
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141F19] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                    رمز عبور مدیر (password):
                  </label>
                  <input
                    type="password"
                    required
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141F19] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs font-mono text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                {adminAuthError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900">
                    {adminAuthError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isAuthSubmitting || !adminPasswordInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isAuthSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>در حال تطابق با جدول admins...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ورود و فعال‌سازی نشست در localStorage</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify2FA} className="w-full space-y-3">
                {statusMessageSent && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 w-full text-center space-y-1">
                    <span className="font-bold block flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      {statusMessageSent}
                    </span>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={twoFaInput}
                    onChange={(e) => setTwoFaInput(e.target.value)}
                    placeholder="کد ۶ رقمی..."
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-[#141F19] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-center text-lg font-mono tracking-widest text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                {twoFaError && <p className="text-xs text-rose-600 font-bold">{twoFaError}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRequestCode}
                    className="flex-1 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-xs font-cairo font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
                  >
                    دریافت کد جدید
                  </button>
                  <button
                    type="submit"
                    disabled={!twoFaInput.trim() || isOtpLoading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-cairo font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    تایید و ورود به پنل
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#E2E8E4] dark:border-[#1F2E26] overflow-x-auto text-xs font-cairo font-bold">
              <button
                onClick={() => setActiveTab('payments')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'payments'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>بررسی پرداخت‌های کارت به کارت ({toPersianDigits(livePayments.filter((p) => p.status === 'pending').length)})</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'users'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>مدیریت کاربران و سطح اشتراک ({toPersianDigits(allUsers.length)})</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'security'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>پروتکل‌های امنیتی و لاگ سیستم</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition cursor-pointer ${
                  activeTab === 'stats'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>آمار کلی پلتفرم</span>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tab 1: Manual Payments Review */}
              {activeTab === 'payments' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                          مدیریت سفارش‌ها و درخواست‌های اشتراک
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {toPersianDigits(livePayments.filter((p) => p.status === 'pending').length)} در انتظار بررسی
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        استعلام همزمان از جداول subscription_orders و manual_payments با فعال‌سازی خودکار اشتراک
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchLiveManualPayments}
                      disabled={isFetchingPayments}
                      className="px-3.5 py-1.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E27] text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPayments ? 'animate-spin text-emerald-600' : ''}`} />
                      <span>{isFetchingPayments ? 'در حال همگام‌سازی...' : 'بروزرسانی زنده'}</span>
                    </button>
                  </div>

                  {/* راهنمای سطوح اشتراک */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200/60 dark:border-amber-800/40">
                    <div className="flex items-center gap-2 text-xs">
                      <Gem className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">برنزی:</span>
                      <span className="text-zinc-600 dark:text-zinc-400">۱۰ پرسش AI • ۳۰ روز</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Crown className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">طلایی (Pro):</span>
                      <span className="text-zinc-600 dark:text-zinc-400">۰۰۰ پرسش AI • ۳۰ روز</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">VIP:</span>
                      <span className="text-zinc-600 dark:text-zinc-400">نامحدود • ۹۰ روز</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {livePayments.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-50 dark:bg-[#121B16] rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26] text-xs text-zinc-400">
                        هیچ پرداختی برای بررسی وجود ندارد.
                      </div>
                    ) : (
                      livePayments.map((pay) => {
                        const planInfo = getPlanInfo(pay.plan_id);
                        const PlanIcon = planInfo.icon;
                        return (
                          <div
                            key={pay.id}
                            className="p-5 rounded-2xl bg-zinc-50/70 dark:bg-[#121C17] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-4 shadow-xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8E4] dark:border-[#1F2E26] pb-3">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-cairo font-bold ${
                                    pay.status === 'pending'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : pay.status === 'approved'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}
                                >
                                  {pay.status === 'pending'
                                    ? 'در انتظار بررسی'
                                    : pay.status === 'approved'
                                    ? 'تایید شده'
                                    : 'رد شده'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <PlanIcon className={`w-4 h-4 ${planInfo.color}`} />
                                  <h5 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    {pay.plan_name}
                                  </h5>
                                </div>
                                <span className="text-xs text-zinc-500">({formatToman(pay.amount)})</span>
                              </div>
                              <span className="text-xs text-zinc-400">
                                {formatShamsiDateTime(pay.created_at)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-zinc-500 block">کاربر پرداخت‌کننده:</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200">
                                  {pay.user_name} ({pay.user_email})
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">کد پیگیری سیستمی:</span>
                                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 select-all" dir="ltr">
                                  {pay.tracking_code || pay.reference_code}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">کارت مبدا:</span>
                                <span className="font-mono text-zinc-800 dark:text-zinc-200" dir="ltr">
                                  {pay.card_sender_number || 'ثبت نشده'}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block">فیش واریزی:</span>
                                {pay.receipt_url ? (
                                  <button
                                    type="button"
                                    onClick={() => void openReceiptPreview(pay.receipt_url)}
                                    className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>مشاهده تصویر فیش</span>
                                  </button>
                                ) : (
                                  <span className="text-zinc-400">فیش پیوست نشده</span>
                                )}
                              </div>
                            </div>

                            {pay.notes && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#0E1511] p-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E26]">
                                <span className="font-bold">یادداشت کاربر:</span> {pay.notes}
                              </p>
                            )}

                            {pay.status === 'pending' && (
                              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                                <input
                                  type="text"
                                  value={adminNotes[pay.id] || ''}
                                  onChange={(e) =>
                                    setAdminNotes({ ...adminNotes, [pay.id]: e.target.value })
                                  }
                                  placeholder="یادداشت مدیر (اختیاری جهت اطلاع کاربر)..."
                                  className="w-full sm:w-80 px-3 py-1.5 rounded-xl bg-white dark:bg-[#0E1511] border border-[#E2E8E4] dark:border-[#1F2E26] text-xs outline-none focus:ring-1 focus:ring-emerald-600 font-cairo"
                                />
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    disabled={actionLoadingId === pay.id}
                                    onClick={() => handleRejectAction(pay)}
                                    className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 font-cairo font-bold text-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {actionLoadingId === pay.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5" />
                                    )}
                                    <span>{actionLoadingId === pay.id ? 'در حال ثبت...' : 'رد واریز'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionLoadingId === pay.id}
                                    onClick={() => handleApproveAction(pay)}
                                    className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {actionLoadingId === pay.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    )}
                                    <span>{actionLoadingId === pay.id ? 'در حال فعال‌سازی...' : 'تایید و فعال‌سازی اشتراک'}</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            {pay.status !== 'pending' && pay.admin_notes && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#0E1511] p-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1F2E26]">
                                <span className="font-bold">یادداشت مدیر:</span> {pay.admin_notes}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Users Management */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                          مدیریت کاربران و ارسال پیام مستقیم
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {toPersianDigits(allUsers.length)} کاربر کل
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        جستجوی کاربران بر اساس نام نمایشی، ایمیل و وضعیت اشتراک
                      </p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="جستجوی نام نمایشی یا ایمیل..."
                        className="w-full pr-9 pl-3 py-1.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-600 font-cairo"
                      />
                    </div>
                  </div>

                  {/* Subscription Filter Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-cairo">
                    <span className="text-[11px] text-zinc-500 ml-1 flex items-center gap-1">
                      <Filter className="w-3 h-3" />
                      فیلتر وضعیت:
                    </span>
                    {(
                      [
                        { id: 'all', label: `همه (${toPersianDigits(allUsers.length)})` },
                        { id: 'pro', label: 'اشتراک‌دار (برنزی/پرو/VIP)' },
                        { id: 'free', label: 'طرح پایه (رایگان)' },
                        { id: 'active', label: 'اشتراک‌های فعال' },
                        { id: 'expired', label: 'منقضی شده' },
                      ] as const
                    ).map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setSubscriptionFilter(filter.id)}
                        className={`px-2.5 py-1 rounded-xl font-bold transition text-[11px] cursor-pointer ${
                          subscriptionFilter === filter.id
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-zinc-100 dark:bg-[#121B16] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-[#1A2620]'
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26]">
                    <table className="w-full text-xs text-right">
                      <thead className="bg-zinc-100 dark:bg-[#121B17] text-zinc-600 dark:text-zinc-300 font-cairo font-bold">
                        <tr>
                          <th className="p-3">کاربر</th>
                          <th className="p-3">مشخصات</th>
                          <th className="p-3">نقش</th>
                          <th className="p-3">پلن اشتراک</th>
                          <th className="p-3">مانده اشتراک</th>
                          <th className="p-3">سقف بودجه</th>
                          <th className="p-3">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8E4] dark:divide-[#1F2E26]">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-zinc-400">
                              کاربری با مشخصات جستجو شده یافت نشد.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((u) => {
                            const proStatus = calculateRemainingProDays(u.subscription_expires_at);
                            const avatarSrc = u.avatar_url || (u.gender === 'زن' ? FEMALE_AVATAR_SVG : MALE_AVATAR_SVG);
                            const tierLabel = u.tier === 'vip' ? 'VIP' : u.tier === 'pro' ? 'طلایی (Pro)' : u.tier === 'bronze' ? 'برنزی' : 'پایه (رایگان)';
                            const tierColor = u.tier === 'vip' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' :
                                             u.tier === 'pro' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' :
                                             u.tier === 'bronze' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300' :
                                             'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
                            return (
                              <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-[#141E19] transition">
                                <td className="p-3">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={avatarSrc}
                                      alt={u.full_name || 'کاربر'}
                                      className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                                    />
                                    <div>
                                      <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                        {u.full_name || 'کاربر بدون نام'}
                                      </div>
                                      <div className="text-[11px] text-zinc-400 font-mono select-all">
                                        {u.email}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-3 text-[11px] text-zinc-600 dark:text-zinc-300">
                                  <div>{u.gender ? (u.gender === 'مرد' ? 'آقا' : 'خانم') : 'نامشخص'}</div>
                                  {u.age ? <div className="text-[10px] text-zinc-400">{toPersianDigits(u.age)} ساله</div> : null}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    u.role === 'admin'
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                  }`}>
                                    {u.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${tierColor}`}>
                                    {tierLabel}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {(u.tier === 'pro' || u.tier === 'vip' || u.tier === 'bronze') ? (
                                    <div className="space-y-0.5">
                                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                        proStatus.isActive
                                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                      }`}>
                                        <Clock className="w-3 h-3" />
                                        {proStatus.humanText}
                                      </span>
                                      {u.subscription_expires_at && (
                                        <div className="text-[10px] text-zinc-400 font-mono">
                                          تا {formatShamsiDate(u.subscription_expires_at)}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-zinc-400 text-[11px]">-</span>
                                  )}
                                </td>
                                <td className="p-3 font-mono">
                                  {formatToman(u.monthly_budget_cap)}
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-wrap items-center gap-1.5 font-cairo">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenMessageDialog(u)}
                                      title="ارسال پیام مستقیم"
                                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>پیام</span>
                                    </button>
                                    <button
                                      onClick={() => updateUserSubscriptionDays(u.id, 30, 'تمدید ۳۰ روزه توسط مدیر ارشد')}
                                      title="افزودن ۳۰ روز"
                                      className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                                    >
                                      +۳۰ روز
                                    </button>
                                    <button
                                      onClick={() => updateUserSubscriptionDays(u.id, 90, 'تمدید ۹۰ روزه توسط مدیر ارشد')}
                                      title="افزودن ۹۰ روز"
                                      className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-bold border border-amber-300 dark:border-amber-800 cursor-pointer"
                                    >
                                      +۹۰ روز
                                    </button>
                                    <button
                                      onClick={() => {
                                        const daysStr = prompt('تعداد روزهای مورد نظر:', '30');
                                        if (daysStr) {
                                          const days = parseInt(daysStr, 10);
                                          if (!isNaN(days) && days !== 0) {
                                            const reason = prompt('توضیحات مدیر (اختیاری):', 'تمدید اعتبار اشتراک توسط مدیریت چندبوم') || '';
                                            updateUserSubscriptionDays(u.id, days, reason);
                                          }
                                        }
                                      }}
                                      title="تنظیم دستی روزها"
                                      className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] text-[10px] font-bold cursor-pointer"
                                    >
                                      تنظیم روزها
                                    </button>
                                    <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 p-1.5 bg-white/70 dark:bg-zinc-900/50">
                                      <select
                                        aria-label={`انتخاب پلن برای ${u.full_name}`}
                                        value={pendingTierByUser[u.id] ?? u.tier ?? 'free'}
                                        onChange={(e) => setPendingTierByUser((prev) => ({ ...prev, [u.id]: e.target.value as SubscriptionTier }))}
                                        className="max-w-[125px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-[10px] font-bold"
                                      >
                                        <option value="free">پایه / رایگان</option>
                                        <option value="bronze">برنزی</option>
                                        <option value="pro">پرو</option>
                                        <option value="vip">VIP</option>
                                      </select>
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const tier = pendingTierByUser[u.id] ?? u.tier ?? 'free';
                                          if (tier !== 'free') {
                                            const daysText = window.prompt('مدت اشتراک از امروز چند روز باشد؟ (برای تمدید، روزهای جدید به اعتبار فعلی اضافه می‌شوند)', '30');
                                            if (daysText === null) return;
                                            const days = Number.parseInt(daysText, 10);
                                            if (!Number.isInteger(days) || days < 1 || days > 3650) {
                                              window.alert('لطفاً تعداد روز معتبر بین ۱ تا ۳۶۵۰ وارد کنید.');
                                              return;
                                            }
                                            const tierUpdated = await updateUserRoleAndTier(u.id, u.role, tier);
                                            if (!tierUpdated) return;
                                            await updateUserSubscriptionDays(u.id, days, `تنظیم پلن ${tier.toUpperCase()} به مدت ${days} روز توسط مدیر ارشد`);
                                          } else {
                                            const tierUpdated = await updateUserRoleAndTier(u.id, u.role, 'free');
                                            if (!tierUpdated) return;
                                          }
                                          setPendingTierByUser((prev) => { const next = { ...prev }; delete next[u.id]; return next; });
                                        }}
                                        className="px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold cursor-pointer whitespace-nowrap"
                                      >
                                        اعمال پلن
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Security & Protocols */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <h4 className="font-cairo text-base font-bold text-zinc-900 dark:text-zinc-100">
                    وضعیت سپرهای امنیتی و تنظیمات سخت‌گیرانه (Security Hardening)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Content Security Policy (CSP) & XSS Defenses</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        هدرهای ضد تزریق اسکریپت (XSS)، فیلتر کاراکترهای مخرب و مسدودسازی اجرای هرگونه کد ناامن در کل سرور و مرورگر فعال است.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>محافظت در برابر تزریق پرامپت (Prompt Injection)</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        پرامپت‌های صوتی و متنی ورودی به هوش مصنوعی توسط ماژول اعتبارسنجی ارزیابی شده و عبارات تلاش برای دور زدن محدودیت‌ها خنثی می‌شوند.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>محافظت در برابر کنسول خرابکار (Self-XSS Guard)</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        هشدارهای ویژه به کاربران جهت جلوگیری از اجرای اسکریپت‌های ناشناس در DevTools و حفاظت از کلیدها پیاده‌سازی شده است.
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>نشست‌های امن ۲ مرحله‌ای (Admin 2FA Active)</span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        دسترسی به داده‌های حساس و تایید پرداختی‌ها مستلزم تایید ۲ مرحله‌ای مدیر با زمان انقضای خودکار ۱ ساعته است.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Platform Statistics */}
              {activeTab === 'stats' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-1">
                    <span className="text-xs text-zinc-500">کل تراکنش‌های ثبت‌شده</span>
                    <div className="font-cairo text-2xl font-black text-zinc-900 dark:text-white">
                      {toPersianDigits(transactions.length)}
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-1">
                    <span className="text-xs text-zinc-500">تیکت‌های پشتیبانی</span>
                    <div className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {toPersianDigits(tickets.length)}
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#121B16] border border-[#E2E8E4] dark:border-[#1F2E26] space-y-1">
                    <span className="text-xs text-zinc-500">پرداخت‌های تایید شده</span>
                    <div className="font-cairo text-2xl font-black text-emerald-700 dark:text-emerald-400">
                      {toPersianDigits(manualPayments.filter((p) => p.status === 'approved').length)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {receiptPreviewError && (
        <div className="fixed bottom-5 right-5 z-[80] max-w-sm rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-xl">
          {receiptPreviewError}
          <button type="button" onClick={() => setReceiptPreviewError(null)} className="mr-3 underline">بستن</button>
        </div>
      )}
      {isReceiptPreviewLoading && (
        <div className="fixed bottom-5 right-5 z-[80] rounded-xl bg-zinc-900 px-4 py-3 text-sm font-bold text-white shadow-xl">در حال دریافت امن تصویر فیش…</div>
      )}

      {/* Admin Receipt Lightbox Preview Modal */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 p-5 space-y-3">
            <div className="flex items-center justify-between text-white pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="font-cairo font-bold text-sm">بررسی اصالت فیش واریزی کارت به کارت</span>
              </div>
              <button
                onClick={() => setSelectedReceiptForPreview(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center rounded-2xl bg-zinc-900/80 p-2">
              <img
                src={selectedReceiptForPreview}
                alt="فیش واریزی کاربر"
                className="max-h-[70vh] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Admin Direct User Notification & Messaging Modal */}
      {selectedUserForMessage && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-xl w-full bg-white dark:bg-[#0D1511] rounded-3xl overflow-hidden border border-[#E2E8E4] dark:border-[#1F2E26] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E26]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-base text-zinc-900 dark:text-white">
                    ارسال اعلان و پیام مستقیم به کاربر
                  </h4>
                  <p className="text-xs text-zinc-400">
                    ارسال آنی پیام به صندوق اعلان‌های داشبورد و ایجاد تیکت رسمی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForMessage(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Target User Banner */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121B17] border border-[#E2E8E4] dark:border-[#1F2E26] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForMessage.avatar_url || (selectedUserForMessage.gender === 'زن' ? FEMALE_AVATAR_SVG : MALE_AVATAR_SVG)}
                  alt={selectedUserForMessage.full_name}
                  className="w-10 h-10 rounded-full border border-emerald-500/40 object-cover"
                />
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">
                    {selectedUserForMessage.full_name || 'کاربر بدون نام'}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono" dir="ltr">
                    {selectedUserForMessage.email}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                selectedUserForMessage.tier === 'vip' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' :
                selectedUserForMessage.tier === 'pro' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300' :
                selectedUserForMessage.tier === 'bronze' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300' :
                'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}>
                {selectedUserForMessage.tier === 'vip' ? 'VIP' : selectedUserForMessage.tier === 'pro' ? 'طلایی' : selectedUserForMessage.tier === 'bronze' ? 'برنزی' : 'طرح پایه'}
              </span>
            </div>
            {messageSentSuccess ? (
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{messageSentSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-4">
                {/* Quick Templates */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block">
                    قالب‌های آماده پیام:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTemplates.map((tmpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setMessageSubject(tmpl.subject);
                          setMessageContent(tmpl.body);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-[#15221C] dark:hover:bg-[#1E2E27] text-zinc-700 dark:text-zinc-300 text-[10px] font-bold transition cursor-pointer border border-transparent hover:border-emerald-500/30 flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{tmpl.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Subject */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    عنوان پیام / اعلان:
                  </label>
                  <input
                    type="text"
                    required
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="مثلاً: اشتراک طلایی برای شما فعال شد"
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-600 font-cairo"
                  />
                </div>
                {/* Content */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    متن کامل پیام:
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="متن پیام اختصاصی..."
                    className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-600 font-cairo resize-none leading-relaxed"
                  />
                </div>
                {/* Delivery Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendAsNotification}
                      onChange={(e) => setSendAsNotification(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold">ارسال به اعلان‌های داشبورد</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendAsTicket}
                      onChange={(e) => setSendAsTicket(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-bold">ثبت در تیکت‌های پشتیبانی</span>
                    </div>
                  </label>
                </div>
                {/* Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E26]">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForMessage(null)}
                    disabled={isSendingMessage}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingMessage || !messageContent.trim()}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSendingMessage ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>در حال ارسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 rotate-180" />
                        <span>ارسال پیام به کاربر</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};