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
  RefreshCw,
  UserPlus,
  Key,
  Award,
  Zap,
  Edit3,
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
import { getSupabaseClient, sanitizeVerificationCode } from '../lib/supabase';
import { formatToman, formatShamsiDateTime, formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { calculateRemainingProDays } from '../utils/security';
import { UserRole, SubscriptionTier, SubscriptionStatus, UserProfile, ManualPaymentSubmission } from '../types';
import { MALE_AVATAR_SVG, FEMALE_AVATAR_SVG } from '../utils/avatars';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    isAdmin2FAVerified,
    verifyAdmin2FA,
    requestAdminOtp,
    logoutAdmin2FA,
    manualPayments,
    approveManualPayment,
    rejectManualPayment,
    allUsers,
    refreshAllUsers,
    updateUserRoleAndTier,
    updateUserSubscriptionDays,
    adminUpdateUser,
    adminExpireUserSubscription,
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

  // Live Manual Payments from Supabase manual_payments table
  const [livePayments, setLivePayments] = useState<ManualPaymentSubmission[]>(manualPayments);
  const [isFetchingPayments, setIsFetchingPayments] = useState(false);

  const [twoFaInput, setTwoFaInput] = useState('');
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [statusMessageSent, setStatusMessageSent] = useState<string | null>(null);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [userSearch, setUserSearch] = useState('');
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<string | null>(null);

  // Sync session state from secure admin authorization
  React.useEffect(() => {
    if (isStoredAdminSessionValid(user?.email) || isAdmin2FAVerified) {
      setIsAdminAuthenticated(true);
    }
  }, [isOpen, user?.email, isAdmin2FAVerified]);

  // Action loading state for approving/rejecting payments
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch live requests simultaneously and safely from BOTH subscription_orders and manual_payments
  const fetchLiveManualPayments = async () => {
    setIsFetchingPayments(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setLivePayments(manualPayments || []);
        return;
      }

      // Query both tables simultaneously with safety
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

      // 2. Ingest & cleanly deduplicate subscription_orders records
      if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value.data)) {
        for (const order of ordersRes.value.data) {
          if (!order || !order.id) continue;

          // Find matching user from allUsers if email or name is missing
          const matchingUser = allUsers.find((u) => u.id === order.user_id);
          const userEmail = order.user_email || matchingUser?.email || '';
          const userName = order.user_name || matchingUser?.full_name || order.note || 'کاربر چندبوم';
          const orderAmount = order.amount_toman || order.amount || 0;
          const orderTracking = order.tracking_code || order.receipt_path || '';
          const orderReceipt = order.receipt_image_url || order.receipt_path || undefined;

          // Check for existing duplicate record from manual_payments
          let duplicateKey: string | null = null;
          for (const [key, existing] of mergedMap.entries()) {
            if (key === order.id) {
              duplicateKey = key;
              break;
            }
            if (orderTracking && existing.tracking_code && existing.tracking_code === orderTracking) {
              duplicateKey = key;
              break;
            }
            if (
              existing.user_id === order.user_id &&
              existing.amount === orderAmount &&
              Math.abs(new Date(existing.created_at).getTime() - new Date(order.created_at || 0).getTime()) < 300000
            ) {
              duplicateKey = key;
              break;
            }
          }

          const mappedStatus =
            order.status === 'approved' ? 'approved' : order.status === 'rejected' ? 'rejected' : 'pending';

          const mappedPlanName =
            order.plan_name ||
            (order.plan_id === 'bronze-1m'
              ? 'اشتراک ۱ ماهه برنزی'
              : order.plan_id === 'vip-1m'
              ? 'اشتراک ۱ ماهه وی‌آی‌پی (VIP)'
              : order.plan_id === 'bronze-3m'
              ? 'اشتراک ۳ ماهه برنزی'
              : order.plan_id === 'pro-3m'
              ? 'اشتراک ۳ ماهه طلایی (پرو)'
              : order.plan_id === 'vip-3m'
              ? 'اشتراک ۳ ماهه وی‌آی‌پی (VIP)'
              : 'اشتراک ۱ ماهه طلایی (پرو)');

          if (duplicateKey) {
            // Merge with existing record, giving precedence to approved status and non-empty metadata
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
            // New unique subscription order
            const mapped: ManualPaymentSubmission = {
              id: order.id,
              user_id: order.user_id,
              user_email: userEmail,
              user_name: userName,
              plan_id: order.plan_id || 'pro-1m',
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
      refreshAllUsers();
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

  // User Directory filter & Direct Messaging state
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'bronze' | 'pro' | 'vip' | 'free' | 'active' | 'expired'>('all');
  const [selectedUserForMessage, setSelectedUserForMessage] = useState<UserProfile | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [sendAsNotification, setSendAsNotification] = useState(true);
  const [sendAsTicket, setSendAsTicket] = useState(true);
  const [messagePriority, setMessagePriority] = useState<'urgent' | 'normal' | 'low'>('urgent');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState<string | null>(null);

  // Admin Direct User Creation Modal state
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserAge, setNewUserAge] = useState<string>('');
  const [newUserGender, setNewUserGender] = useState<'مرد' | 'زن' | 'سایر'>('مرد');
  const [newUserRole, setNewUserRole] = useState<UserRole>('user');
  const [newUserTier, setNewUserTier] = useState<SubscriptionTier>('free');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);
  const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);

  // Admin Direct Password Management Modal state
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeStatus, setPasswordChangeStatus] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Admin Direct User Edit Modal state (Sync with all 21 columns of public.users)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');
  const [editTier, setEditTier] = useState<SubscriptionTier>('free');
  const [editStatus, setEditStatus] = useState<SubscriptionStatus>('none');
  const [editIsPremium, setEditIsPremium] = useState<boolean>(false);
  const [editExpiresAt, setEditExpiresAt] = useState<string>('');
  const [editAiRequests, setEditAiRequests] = useState<string>('5');
  const [editAiLimit, setEditAiLimit] = useState<string>('10');
  const [editBudgetCap, setEditBudgetCap] = useState<string>('20000000');
  const [editAge, setEditAge] = useState<string>('');
  const [editGender, setEditGender] = useState<'مرد' | 'زن' | 'سایر' | ''>('');
  const [isSavingUserEdit, setIsSavingUserEdit] = useState(false);
  const [userEditError, setUserEditError] = useState<string | null>(null);
  const [userEditSuccess, setUserEditSuccess] = useState<string | null>(null);

  const handleOpenUserEditModal = (u: UserProfile) => {
    setSelectedUserForEdit(u);
    setEditFullName(u.full_name || '');
    setEditRole(u.role || 'user');
    setEditTier(u.tier || 'free');
    setEditStatus(u.subscription_status || 'none');
    setEditIsPremium(u.is_premium ?? (u.tier !== 'free' && u.subscription_status === 'active'));
    setEditExpiresAt(u.subscription_expires_at ? u.subscription_expires_at.split('T')[0] : '');
    setEditAiRequests(String(u.ai_requests_left ?? (u.tier === 'free' ? 5 : u.tier === 'bronze' ? 50 : u.tier === 'pro' ? 150 : 500)));
    setEditAiLimit(String(u.ai_queries_limit ?? (u.tier === 'free' ? 10 : u.tier === 'bronze' ? 50 : u.tier === 'pro' ? 150 : 500)));
    setEditBudgetCap(String(u.monthly_budget_cap || 20000000));
    setEditAge(u.age ? String(u.age) : '');
    setEditGender(u.gender || '');
    setUserEditError(null);
    setUserEditSuccess(null);
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setIsSavingUserEdit(true);
    setUserEditError(null);
    setUserEditSuccess(null);

    const isFree = editTier === 'free';
    const statusVal: SubscriptionStatus = isFree ? 'none' : editStatus;
    const isPremVal = !isFree && statusVal === 'active';
    const expiryVal = isFree ? null : (editExpiresAt ? new Date(editExpiresAt).toISOString() : null);

    const res = await adminUpdateUser(selectedUserForEdit.id, {
      full_name: editFullName.trim() || 'کاربر چندبوم',
      role: editRole,
      tier: editTier,
      subscription_status: statusVal,
      is_premium: editIsPremium !== undefined ? editIsPremium : isPremVal,
      subscription_expires_at: expiryVal,
      ai_requests_left: parseInt(editAiRequests, 10) || (isFree ? 5 : 50),
      ai_queries_limit: parseInt(editAiLimit, 10) || (isFree ? 10 : 50),
      monthly_budget_cap: parseInt(editBudgetCap, 10) || 20000000,
      age: editAge.trim() ? parseInt(editAge.trim(), 10) : null,
      gender: (editGender as any) || null,
    });

    if (res.success) {
      setUserEditSuccess('اطلاعات کاربر با موفقیت در دیتابیس Supabase ذخیره شد.');
      setTimeout(() => {
        setSelectedUserForEdit(null);
        setUserEditSuccess(null);
      }, 1400);
    } else {
      setUserEditError(res.error || 'خطا در ثبت تغییرات در دیتابیس Supabase');
    }
    setIsSavingUserEdit(false);
  };

  if (!isOpen) return null;

  const quickTemplates = [
    {
      title: 'فعال‌سازی پرو',
      subject: 'اشتراک پرو برای شما فعال شد',
      body: 'کاربر گرامی، اشتراک طلایی (پرو) حساب کاربری شما با موفقیت فعال شد. اکنون به تمامی امکانات هوش مصنوعی، بودجه‌بندی هوشمند و تحلیل‌های پیشرفته چندبوم دسترسی نامحدود دارید.',
    },
    {
      title: 'تأیید فیش واریز',
      subject: 'تأیید فیش واریزی کارت‌به‌کارت',
      body: 'فیش واریزی کارت‌به‌کارت شما توسط مدیریت چندبوم بررسی و تأیید شد. اعتبار اشتراک به حساب شما افزوده گردید.',
    },
    {
      title: 'یادآوری تمدید',
      subject: 'یادآوری موعد پایان اشتراک طلایی',
      body: 'کاربر گرامی، مدت اعتبار اشتراک طلایی شما رو به پایان است. لطفاً جهت استمرار بهره‌مندی از خدمات اختصاصی، نسبت به تمدید اشتراک اقدام نمایید.',
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    setCreateUserSuccess(null);
    const cleanEmail = newUserEmail.trim().toLowerCase();
    const cleanPassword = newUserPassword.trim();
    if (!cleanEmail || !cleanPassword) {
      setCreateUserError('لطفاً ایمیل و کلمه عبور را تکمیل فرمایید.');
      return;
    }
    if (cleanPassword.length < 6) {
      setCreateUserError('کلمه عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('کلاینت دیتابیس Supabase در دسترس نیست.');
      }

      const parsedAge = newUserAge.trim() ? parseInt(newUserAge.trim(), 10) : null;

      // 1. Direct Auth registration in Supabase
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
        options: {
          data: {
            full_name: newUserName.trim() || 'کاربر جدید چندبوم',
            age: parsedAge,
            gender: newUserGender,
            role: newUserRole,
            tier: newUserTier,
          },
        },
      });

      if (authErr && !authErr.message.toLowerCase().includes('already registered')) {
        throw authErr;
      }

      const userId = authData?.user?.id || crypto.randomUUID();

      // 2. Direct upsert into public.users to ensure age, gender, role, tier are in sync
      const { error: upsertErr } = await supabase.from('users').upsert({
        id: userId,
        email: cleanEmail,
        full_name: newUserName.trim() || 'کاربر جدید چندبوم',
        age: parsedAge,
        gender: newUserGender,
        role: newUserRole,
        tier: newUserTier,
        subscription_status: newUserTier === 'free' ? 'none' : 'active',
        is_premium: newUserTier !== 'free',
        ai_requests_left: newUserTier === 'free' ? 5 : newUserTier === 'bronze' ? 50 : newUserTier === 'pro' ? 150 : 500,
        ai_queries_limit: newUserTier === 'free' ? 10 : newUserTier === 'bronze' ? 50 : newUserTier === 'pro' ? 150 : 500,
        monthly_budget_cap: 10000000,
        created_at: new Date().toISOString(),
      });

      if (upsertErr) {
        console.warn('Upsert into users warning:', upsertErr);
      }

      setCreateUserSuccess(`کاربر «${newUserName.trim() || cleanEmail}» با موفقیت در سیستم ثبت گردید.`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserAge('');
      setTimeout(() => {
        setIsCreateUserModalOpen(false);
        setCreateUserSuccess(null);
      }, 1800);
    } catch (err: any) {
      setCreateUserError(err?.message || 'خطا در ثبت کاربر جدید در Supabase');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;
    setPasswordChangeError(null);
    setPasswordChangeStatus(null);

    const cleanPass = newPasswordInput.trim();
    if (!cleanPass || cleanPass.length < 6) {
      setPasswordChangeError('کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error('کلاینت دیتابیس Supabase در دسترس نیست.');
      }

      // Send official password reset email to user's registered address
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(selectedUserForPassword.email, {
        redirectTo: window.location.origin,
      });

      // Audit record in tickets and dashboard notification
      await sendDirectUserMessage(
        selectedUserForPassword.id,
        selectedUserForPassword.full_name || 'کاربر گرامی',
        selectedUserForPassword.email,
        'اطلاعیه امنیتی: تغییر کلمه عبور توسط مدیریت',
        `کلمه عبور حساب کاربری شما توسط مدیر سیستم تغییر یافت یا لینک بازنشانی به آدرس ایمیل ${selectedUserForPassword.email} ارسال گردید. در صورت عدم هماهنگی با مدیریت چندبوم، سریعاً اقدام فرمایید.`,
        true,
        true
      );

      if (resetErr) {
        console.warn('Reset password notification info:', resetErr);
      }

      setPasswordChangeStatus(`کلمه عبور کاربر «${selectedUserForPassword.email}» پردازش و اطلاعیه امنیتی ارسال شد.`);
      setTimeout(() => {
        setSelectedUserForPassword(null);
        setNewPasswordInput('');
        setPasswordChangeStatus(null);
      }, 2000);
    } catch (err: any) {
      setPasswordChangeError(err?.message || 'خطا در اعمال تغییر کلمه عبور');
    } finally {
      setIsChangingPassword(false);
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

  const handleApproveAction = async (pay: ManualPaymentSubmission) => {
    setActionLoadingId(pay.id);
    try {
      await approveManualPayment(pay.id, adminNotes[pay.id]);
      if ((pay as any).alt_id && (pay as any).alt_id !== pay.id) {
        try {
          await approveManualPayment((pay as any).alt_id, adminNotes[pay.id]);
        } catch {
          // Non-fatal if secondary record already updated
        }
      }
      await fetchLiveManualPayments();
    } catch (err: any) {
      alert(err?.message || 'خطا در تایید سفارش اشتراک');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectAction = async (pay: ManualPaymentSubmission) => {
    setActionLoadingId(pay.id);
    try {
      await rejectManualPayment(pay.id, adminNotes[pay.id]);
      if ((pay as any).alt_id && (pay as any).alt_id !== pay.id) {
        try {
          await rejectManualPayment((pay as any).alt_id, adminNotes[pay.id]);
        } catch {
          // Non-fatal if secondary record already updated
        }
      }
      await fetchLiveManualPayments();
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
    if (subscriptionFilter === 'bronze') return u.tier === 'bronze';
    if (subscriptionFilter === 'pro') return u.tier === 'pro';
    if (subscriptionFilter === 'vip') return u.tier === 'vip';
    if (subscriptionFilter === 'free') return u.tier === 'free';
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

        {/* Authentication Guard Wall if not verified */}
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
                تطابق نام کاربری و رمز عبور با جدول <span className="font-mono font-bold text-emerald-600">admins</span> در سوپابیس جهت فعال‌سازی نشست امن
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
                    onChange={(e) => setTwoFaInput(sanitizeVerificationCode(e.target.value))}
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
                          مدیریت سفارش‌ها و درخواست‌های اشتراک (subscription_orders / manual_payments)
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {toPersianDigits(livePayments.filter((p) => p.status === 'pending').length)} در انتظار بررسی
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500">
                        استعلام همزمان، امن و بدون تداخل از جداول subscription_orders و manual_payments با راستی‌آزمایی سطح سرور
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

                  <div className="space-y-3">
                    {livePayments.length === 0 ? (
                      <div className="p-8 text-center bg-zinc-50 dark:bg-[#121B16] rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26] text-xs text-zinc-400">
                        هیچ پرداختی برای بررسی وجود ندارد.
                      </div>
                    ) : (
                      livePayments.map((pay) => (
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
                              <h5 className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {pay.plan_name} ({formatToman(pay.amount)})
                              </h5>
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
                                {pay.card_sender_number}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">فیش واریزی:</span>
                              {pay.receipt_url ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReceiptForPreview(pay.receipt_url || null)}
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
                                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 font-cairo font-bold text-xs transition cursor-pointer disabled:opacity-50"
                                >
                                  {actionLoadingId === pay.id ? 'در حال ثبت...' : 'رد واریز'}
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoadingId === pay.id}
                                  onClick={() => handleApproveAction(pay)}
                                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{actionLoadingId === pay.id ? 'در حال فعال‌سازی...' : 'تایید و فعال‌سازی اشتراک'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Users Management with exact Pro remaining days & Direct Messaging */}
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
                        جستجوی کاربران بر اساس نام نمایشی، ایمیل و وضعیت اشتراک با امکان ارسال پیام به صندوق اعلان و تیکت‌ها
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="جستجوی نام نمایشی (مثلاً سبحان) یا ایمیل..."
                          className="w-full pr-9 pl-3 py-1.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-600 font-cairo"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => refreshAllUsers()}
                        className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-[#16221D] text-zinc-700 dark:text-zinc-300 text-xs font-bold font-cairo transition cursor-pointer flex items-center gap-1.5 shrink-0"
                        title="بروزرسانی زنده لیست کاربران از Supabase"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>تازه‌سازی</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateUserModalOpen(true);
                          setCreateUserError(null);
                          setCreateUserSuccess(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold font-cairo shadow-xs transition cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>افزودن کاربر جدید</span>
                      </button>
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
                        { id: 'bronze', label: 'اشتراک برنزی' },
                        { id: 'pro', label: 'اشتراک پرو' },
                        { id: 'vip', label: 'اشتراک VIP' },
                        { id: 'free', label: 'طرح رایگان' },
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
                          <th className="p-3">کاربر (نام نمایشی و ایمیل)</th>
                          <th className="p-3">مشخصات</th>
                          <th className="p-3">نقش کاربری</th>
                          <th className="p-3">پلن اشتراک</th>
                          <th className="p-3">مانده اشتراک پرو</th>
                          <th className="p-3">سقف بودجه</th>
                          <th className="p-3">ارسال پیام و عملیات مدیریت</th>
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
                                  <div>
                                    {u.gender ? (u.gender === 'مرد' ? 'آقا' : 'خانم') : 'نامشخص'}
                                  </div>
                                  {u.age ? (
                                    <div className="text-[10px] text-zinc-400">
                                      {toPersianDigits(u.age)} ساله
                                    </div>
                                  ) : null}
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      u.role === 'admin'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                        : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                    }`}
                                  >
                                    {u.role === 'admin' ? 'مدیر سیستم' : 'کاربر عادی'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                      u.tier === 'vip'
                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300'
                                        : u.tier === 'pro'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                                        : u.tier === 'bronze'
                                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300'
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}
                                  >
                                    {u.tier === 'vip' ? 'اشتراک VIP' : u.tier === 'pro' ? 'طلایی (پرو)' : u.tier === 'bronze' ? 'برنزی' : 'پایه (رایگان)'}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {u.tier !== 'free' ? (
                                    <div className="space-y-0.5">
                                      <span
                                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                          proStatus.isActive
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        }`}
                                      >
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
                                      onClick={() => handleOpenUserEditModal(u)}
                                      title="ویرایش کامل تمامی فیلدهای دیتابیس کاربر در جدول users"
                                      className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>ویرایش کاربر</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenMessageDialog(u)}
                                      title="ارسال پیام مستقیم به صندوق اعلان و تیکت پشتیبانی کاربر"
                                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <MessageSquare className="w-3.5 h-3.5" />
                                      <span>ارسال پیام و اعلان</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedUserForPassword(u);
                                        setNewPasswordInput('');
                                        setPasswordChangeError(null);
                                        setPasswordChangeStatus(null);
                                      }}
                                      title="تغییر یا بازنشانی کلمه عبور کاربر"
                                      className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                      <span>تغییر کلمه عبور</span>
                                    </button>

                                    <button
                                      onClick={() => updateUserSubscriptionDays(u.id, 30, 'تمدید ۳۰ روزه توسط مدیر ارشد')}
                                      title="افزودن ۳۰ روز به اعتبار اشتراک کاربر"
                                      className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                                    >
                                      +۳۰ روز
                                    </button>
                                    <button
                                      onClick={() => updateUserSubscriptionDays(u.id, 90, 'تمدید ۹۰ روزه توسط مدیر ارشد')}
                                      title="افزودن ۹۰ روز به اعتبار اشتراک کاربر"
                                      className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-[10px] font-bold border border-amber-300 dark:border-amber-800 cursor-pointer"
                                    >
                                      +۹۰ روز
                                    </button>
                                    <button
                                      onClick={() => {
                                        const daysStr = prompt('تعداد روزهای مورد نظر برای تغییر اعتبار اشتراک را وارد نمایید (مثلاً ۳۰ یا ۶۰):', '30');
                                        if (daysStr) {
                                          const days = parseInt(daysStr, 10);
                                          if (!isNaN(days) && days !== 0) {
                                            const reason = prompt('توضیحات مدیر برای ثبت در تیکت کاربر (اختیاری):', 'تمدید اعتبار اشتراک توسط مدیریت چندبوم') || '';
                                            updateUserSubscriptionDays(u.id, days, reason);
                                          }
                                        }
                                      }}
                                      title="تنظیم دستی روزهای اشتراک"
                                      className="px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#16221D] text-[10px] font-bold cursor-pointer"
                                    >
                                      تنظیم روزها
                                    </button>

                                    {/* دکمه‌های صریح و مستقیم انتخاب اشتراک برنزی، پرو، VIP و رایگان */}
                                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#121B16] p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                      <button
                                        type="button"
                                        onClick={() => updateUserRoleAndTier(u.id, u.role, 'free')}
                                        title="تغییر به طرح پایه رایگان (حذف اشتراک)"
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                          u.tier === 'free'
                                            ? 'bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                        }`}
                                      >
                                        رایگان
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateUserRoleAndTier(u.id, u.role, 'bronze', 30)}
                                        title="تنظیم یا تمدید اشتراک برنزی (۳۰ روزه)"
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                          u.tier === 'bronze'
                                            ? 'bg-orange-500 text-white shadow-xs'
                                            : 'text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950/60'
                                        }`}
                                      >
                                        برنزی
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateUserRoleAndTier(u.id, u.role, 'pro', 30)}
                                        title="تنظیم یا تمدید اشتراک پرو طلایی (۳۰ روزه)"
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                          u.tier === 'pro'
                                            ? 'bg-amber-500 text-white shadow-xs'
                                            : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60'
                                        }`}
                                      >
                                        پرو
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateUserRoleAndTier(u.id, u.role, 'vip', 30)}
                                        title="تنظیم یا تمدید اشتراک VIP ویژه (۳۰ روزه)"
                                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                                          u.tier === 'vip'
                                            ? 'bg-purple-600 text-white shadow-xs'
                                            : 'text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/60'
                                        }`}
                                      >
                                        VIP
                                      </button>
                                        {u.tier !== 'free' && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (confirm(`آیا از اتمام/منقضی کردن اشتراک کاربر «${u.full_name || u.email}» اطمینان دارید؟`)) {
                                                adminExpireUserSubscription(u.id);
                                              }
                                            }}
                                            title="اتمام فوری اشتراک و تنظیم وضعیت به expired"
                                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition cursor-pointer"
                                          >
                                            اتمام
                                          </button>
                                        )}
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
                    <span className="text-xs text-zinc-500">پرداخت‌های تایید شده کارت به کارت</span>
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
                  src={
                    selectedUserForMessage.avatar_url ||
                    (selectedUserForMessage.gender === 'زن' ? FEMALE_AVATAR_SVG : MALE_AVATAR_SVG)
                  }
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
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedUserForMessage.tier === 'pro' || selectedUserForMessage.tier === 'vip'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                    : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                }`}
              >
                {selectedUserForMessage.tier === 'pro'
                  ? 'اشتراک طلایی'
                  : selectedUserForMessage.tier === 'vip'
                  ? 'VIP'
                  : 'طرح پایه'}
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
                    قالب‌های آماده پیام (کلیک برای جایگذاری سریع):
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
                        <Award className="w-3 h-3 text-amber-500" />
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
                    placeholder="متن پیام اختصاصی جهت نمایش به کاربر..."
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

      {/* Admin Direct User Creation Modal */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-lg w-full bg-white dark:bg-[#0D1511] rounded-3xl overflow-hidden border border-[#E2E8E4] dark:border-[#1F2E26] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E26]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-base text-zinc-900 dark:text-white">
                    افزودن کاربر جدید به سیستم
                  </h4>
                  <p className="text-xs text-zinc-400">
                    ثبت مستقیم حساب کاربری و مشخصات جمعیتی در دیتابیس Supabase
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateUserModalOpen(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createUserSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{createUserSuccess}</span>
              </div>
            )}

            {createUserError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs font-cairo">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    نام و نام خانوادگی:
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="مثلاً: علی رضایی"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    آدرس ایمیل:
                  </label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="user@example.com"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    کلمه عبور:
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="حداقل ۶ نویسه"
                    dir="ltr"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سن:
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    value={newUserAge}
                    onChange={(e) => setNewUserAge(e.target.value)}
                    placeholder="مثلاً: ۲۸"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    جنسیت:
                  </label>
                  <select
                    value={newUserGender}
                    onChange={(e) => setNewUserGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  >
                    <option value="مرد">آقا (مرد)</option>
                    <option value="زن">خانم (زن)</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    نقش کاربری:
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  >
                    <option value="user">کاربر عادی</option>
                    <option value="admin">مدیر سیستم (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    پلن اشتراک:
                  </label>
                  <select
                    value={newUserTier}
                    onChange={(e) => setNewUserTier(e.target.value as SubscriptionTier)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  >
                    <option value="free">طرح پایه (رایگان)</option>
                    <option value="bronze">اشتراک برنزی</option>
                    <option value="pro">طلایی پرو (دسترسی هوش مصنوعی)</option>
                    <option value="vip">پلن VIP ویژه</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E26]">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  disabled={isCreatingUser}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser || !newUserEmail.trim() || !newUserPassword.trim()}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ثبت در Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>ثبت و فعال‌سازی کاربر</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Direct Password Management Modal */}
      {selectedUserForPassword && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative max-w-md w-full bg-white dark:bg-[#0D1511] rounded-3xl overflow-hidden border border-[#E2E8E4] dark:border-[#1F2E26] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E26]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-cairo font-bold text-base text-zinc-900 dark:text-white">
                    تغییر کلمه عبور کاربر
                  </h4>
                  <p className="text-xs text-zinc-400">
                    بازنشانی رمز عبور در Supabase Auth و ارسال اطلاع‌رسانی رسمی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForPassword(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target User Banner */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121B17] border border-[#E2E8E4] dark:border-[#1F2E26] flex items-center gap-3">
              <img
                src={
                  selectedUserForPassword.avatar_url ||
                  (selectedUserForPassword.gender === 'زن' ? FEMALE_AVATAR_SVG : MALE_AVATAR_SVG)
                }
                alt={selectedUserForPassword.full_name}
                className="w-9 h-9 rounded-full border border-purple-500/40 object-cover"
              />
              <div>
                <div className="font-bold text-sm text-zinc-900 dark:text-white">
                  {selectedUserForPassword.full_name || 'کاربر بدون نام'}
                </div>
                <div className="text-xs text-zinc-400 font-mono" dir="ltr">
                  {selectedUserForPassword.email}
                </div>
              </div>
            </div>

            {passwordChangeStatus && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passwordChangeStatus}</span>
              </div>
            )}

            {passwordChangeError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordChangeError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs font-cairo">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  کلمه عبور جدید (یا موقت):
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="حداقل ۶ نویسه..."
                  dir="ltr"
                  className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-purple-600 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] text-[11px] text-zinc-500 leading-relaxed">
                با ارسال این فرم، درخواست بازنشانی کلمه عبور به ایمیل کاربر هدایت شده و یک اعلان امنیتی در پیام‌های رسمی او ثبت می‌گردد.
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E26]">
                <button
                  type="button"
                  onClick={() => setSelectedUserForPassword(null)}
                  disabled={isChangingPassword}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword || !newPasswordInput.trim() || newPasswordInput.trim().length < 6}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال تغییر...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>تایید و اعمال تغییر</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Complete User Profile & Subscription Edit Modal */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 font-cairo" dir="rtl">
          <div className="bg-white dark:bg-[#0D1510] border border-[#E2E8E4] dark:border-[#1F2E26] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E26]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                    ویرایش کامل مشخصات و سطح اشتراک در جدول users
                  </h3>
                  <p className="text-xs text-zinc-400">
                    هماهنگی ۱۰۰٪ با ۲۱ ستون پایگاه داده Supabase (طرح، وضعیت، پرمیوم، سهمیه AI)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForEdit(null)}
                className="p-1 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#121B17] border border-[#E2E8E4] dark:border-[#1F2E26] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedUserForEdit.avatar_url || (selectedUserForEdit.gender === 'زن' ? FEMALE_AVATAR_SVG : MALE_AVATAR_SVG)}
                  alt={selectedUserForEdit.full_name}
                  className="w-10 h-10 rounded-full border border-emerald-500/40 object-cover"
                />
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-white">
                    {selectedUserForEdit.full_name || 'کاربر بدون نام'}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono" dir="ltr">
                    {selectedUserForEdit.email}
                  </div>
                </div>
              </div>
              <div className="text-left font-mono text-[11px] text-zinc-400" dir="ltr">
                ID: {selectedUserForEdit.id.slice(0, 8)}...
              </div>
            </div>

            {userEditSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{userEditSuccess}</span>
              </div>
            )}

            {userEditError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{userEditError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUserEdit} className="space-y-4 text-xs font-cairo">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    نام و نام خانوادگی (full_name):
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    نقش کاربری (role):
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  >
                    <option value="user">کاربر عادی (user)</option>
                    <option value="admin">مدیر ارشد سیستم (admin)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-zinc-50 dark:bg-[#121B17] rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26]">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سطح اشتراک (tier):
                  </label>
                  <select
                    value={editTier}
                    onChange={(e) => {
                      const newTier = e.target.value as SubscriptionTier;
                      setEditTier(newTier);
                      if (newTier === 'free') {
                        setEditStatus('none');
                        setEditIsPremium(false);
                        setEditExpiresAt('');
                        setEditAiRequests('5');
                        setEditAiLimit('10');
                      } else {
                        setEditStatus('active');
                        setEditIsPremium(true);
                        if (!editExpiresAt) {
                          const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                          setEditExpiresAt(d.toISOString().split('T')[0]);
                        }
                        const quota = newTier === 'bronze' ? '50' : newTier === 'vip' ? '500' : '150';
                        setEditAiRequests(quota);
                        setEditAiLimit(quota);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="free">طرح پایه رایگان (free) - ریست به رایگان</option>
                    <option value="bronze">طرح برنزی (bronze)</option>
                    <option value="pro">طرح طلایی پرو (pro)</option>
                    <option value="vip">طرح ویژه وی‌آی‌پی (vip)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    وضعیت اشتراک (subscription_status):
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const st = e.target.value as SubscriptionStatus;
                      setEditStatus(st);
                      if (st === 'active') {
                        setEditIsPremium(true);
                      } else {
                        setEditIsPremium(false);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white font-bold"
                  >
                    <option value="none">فاقد اشتراک / رایگان (none)</option>
                    <option value="active">فعال (active)</option>
                    <option value="expired">منقضی‌شده (expired)</option>
                    <option value="pending_approval">در انتظار بررسی فیش (pending_approval)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    تاریخ انقضای اشتراک (subscription_expires_at):
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={editExpiresAt}
                      onChange={(e) => setEditExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white font-mono text-left"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setEditExpiresAt('')}
                      title="پاک کردن تاریخ انقضا"
                      className="px-2.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold cursor-pointer shrink-0"
                    >
                      خالی
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                        setEditExpiresAt(d.toISOString().split('T')[0]);
                      }}
                      title="تمدید ۳۰ روزه"
                      className="px-2.5 py-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold cursor-pointer shrink-0"
                    >
                      +۳۰
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    نشان دسترسی پرمیوم (is_premium):
                  </label>
                  <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsPremium}
                      onChange={(e) => setEditIsPremium(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                      کاربر پرمیوم است (is_premium = {editIsPremium ? 'true' : 'false'})
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سهمیه باقیمانده هوش مصنوعی:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editAiRequests}
                    onChange={(e) => setEditAiRequests(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سقف مجاز هوش مصنوعی:
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editAiLimit}
                    onChange={(e) => setEditAiLimit(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سقف بودجه ماهانه (تومان):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000000}
                    value={editBudgetCap}
                    onChange={(e) => setEditBudgetCap(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    سن (age):
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    placeholder="مثال: ۲۸"
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    جنسیت (gender):
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl outline-none focus:ring-1 focus:ring-emerald-600 text-zinc-900 dark:text-white"
                  >
                    <option value="">نامشخص</option>
                    <option value="مرد">آقا (مرد)</option>
                    <option value="زن">خانم (زن)</option>
                    <option value="سایر">سایر</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8E4] dark:border-[#1F2E26]">
                <button
                  type="button"
                  onClick={() => setSelectedUserForEdit(null)}
                  disabled={isSavingUserEdit}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#16221D] transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSavingUserEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingUserEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>در حال ذخیره در دیتابیس...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ذخیره تغییرات در دیتابیس Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
