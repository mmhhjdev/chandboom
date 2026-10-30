import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  UserProfile,
  Transaction,
  NotificationItem,
  Ticket,
  TicketMessage,
  ActiveTab,
  UserRole,
  SubscriptionTier,
  SubscriptionStatus,
  Reminder,
  ManualPaymentSubmission,
  AIBudgetAlert,
  TransactionCategory,
  FinancialGoal,
} from '../types';
import {
  INITIAL_USER,
  INITIAL_TRANSACTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TICKETS,
  INITIAL_REMINDERS,
  INITIAL_MANUAL_PAYMENTS,
  INITIAL_GOALS,
  GUEST_USER,
} from '../data/initialData';
import { generatePredictiveBudgetAlerts } from '../utils/aiParser';
import { isAdminEmail, isStoredAdminSessionValid, clearStoredAdminSession, getEnvAdminEmail } from '../utils/admin';
import {
  requestAdminOtpViaEdgeFunction,
  verifyAdminOtpViaEdgeFunction,
  isAdmin2FAVerified as checkAdmin2FASession,
  revokeAdmin2FA,
} from '../utils/admin2fa';
import { updatePageSeo } from '../utils/seo';
import {
  getSupabaseClient,
  createUserOtp,
  verifyUserOtp,
  checkEmailExists,
  sendLoginOtp,
  sendPasswordResetOtp,
  resetUserPassword,
} from '../lib/supabase';
import { MALE_AVATAR_SVG } from '../utils/avatars';

export interface AuthResult {
  success: boolean;
  error?: string;
  isDuplicate?: boolean;
  requiresEmailConfirmation?: boolean;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  adminMode: boolean;
  setAdminMode: (enabled: boolean) => void;
  isAdmin: boolean;

  // Admin 2FA / OTP via Edge Functions
  isAdmin2FAVerified: boolean;
  verifyAdmin2FA: (code: string) => Promise<{ success: boolean; error?: string }>;
  requestAdminOtp: () => Promise<{ success: boolean; message?: string; error?: string; code?: string }>;
  logoutAdmin2FA: () => void;

  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, password?: string) => Promise<AuthResult>;
  register: (
    email: string,
    passwordOrFullName: string,
    fullNameOrPassword?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر',
    budgetCap?: number
  ) => Promise<AuthResult>;
  loginWithEmail: (email: string, password?: string) => Promise<AuthResult>;
  registerWithEmail: (
    email: string,
    fullName: string,
    password?: string,
    avatarUrl?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر',
    budgetCap?: number
  ) => Promise<AuthResult>;
  requestSignupOtp: (email: string) => Promise<{ success: boolean; code?: string; error?: string; isDuplicate?: boolean }>;
  verifySignupOtpAndRegister: (
    email: string,
    code: string,
    password: string,
    fullName: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر',
    budgetCap?: number
  ) => Promise<AuthResult>;
  requestLoginOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (email: string, code: string) => Promise<AuthResult>;
  requestPasswordResetOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordWithOtp: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  checkEmailRegistered: (email: string) => Promise<boolean>;
  loginAsRole: (role: UserRole) => void;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;

  user: UserProfile;
  currentUser: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isProUser: boolean;
  hasAIAccess: boolean;
  aiQueriesRemaining: number;
  syncAiQuotaFromServer: (remaining: number) => void;
  upgradeUserTier: (tier: SubscriptionTier, durationMonths: number) => Promise<void>;

  // Financial Goals (اهداف مالی)
  goals: FinancialGoal[];
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;

  // Subscription modal
  isSubscriptionModalOpen: boolean;
  openSubscriptionModal: () => void;
  closeSubscriptionModal: () => void;

  // Auth Guard modal
  isAuthGuardOpen: boolean;
  authGuardMessage: string;
  openAuthGuard: (message?: string) => void;
  closeAuthGuard: () => void;
  requestSubscription: () => void;

  // Users management for Admin
  allUsers: UserProfile[];
  refreshAllUsers: () => Promise<void>;
  updateUserRoleAndTier: (userId: string, role: UserRole, tier: SubscriptionTier, durationDays?: number) => Promise<void>;
  updateUserSubscriptionDays: (userId: string, daysToAdd: number, reason?: string) => Promise<void>;
  adminUpdateUser: (userId: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  adminExpireUserSubscription: (userId: string) => Promise<void>;
  sendDirectUserMessage: (
    targetUserId: string,
    targetUserName: string,
    targetUserEmail: string,
    title: string,
    message: string,
    sendAsNotification?: boolean,
    sendAsTicket?: boolean
  ) => Promise<boolean>;

  // Manual Card-to-Card Payment System
  manualPayments: ManualPaymentSubmission[];
  submitManualPayment: (data: Omit<ManualPaymentSubmission, 'id' | 'created_at' | 'status'>) => Promise<void>;
  approveManualPayment: (paymentId: string, adminNotes?: string) => Promise<void>;
  rejectManualPayment: (paymentId: string, adminNotes?: string) => Promise<void>;

  // Transactions
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Reminders
  reminders: Reminder[];
  addReminder: (rem: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateReminder: (id: string, rem: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleReminderPaid: (id: string) => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  settleNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  unreadNotificationsCount: number;

  // Tickets
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  createTicket: (ticket: {
    subject: string;
    department?: Ticket['department'];
    category?: string;
    priority?: Ticket['priority'];
    initialMessage: string;
    attachmentUrl?: string | null;
  }) => Promise<void>;
  addTicket: (
    subject: string,
    department?: Ticket['department'],
    priority?: Ticket['priority'],
    initialMessage?: string,
    attachmentUrl?: string | null
  ) => Promise<void>;
  addTicketMessage: (ticketId: string, content: string, asAdmin?: boolean, attachmentUrl?: string | null) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;

  // Financial Metrics & Predictive AI
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthlyBudgetCap: number;
  budgetUtilizationPercent: number;
  expensesByCategory: Record<TransactionCategory, number>;
  predictiveAlerts: AIBudgetAlert[];
  metrics: {
    balance: number;
    totalIncome: number;
    totalExpense: number;
    categoryBreakdown: Record<string, number>;
  };
  budgetInsight: {
    message: string;
    isWarning: boolean;
    dailyBurnRate: number;
  };

  // AI Assistant Modal
  isAIAssistantOpen: boolean;
  setIsAIAssistantOpen: (open: boolean) => void;

  resetToInitialData: () => void;
  resetToDefaults: () => void;
  activeSupportTicketId: string | null;
  navigateToSupportWithTicket: (ticketId?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function translateSupabaseError(msg: string): string {
  if (!msg) return 'خطایی در پردازش اطلاعات رخ داد.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid path specified in request url') || lower.includes('invalid path')) {
    return 'آدرس یا تنظیمات ارتباط با سرور دیتابیس معتبر نیست.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'ایمیل یا رمز عبور وارد شده اشتباه است.';
  }
  if (lower.includes('email not confirmed') || lower.includes('not verified')) {
    return 'آدرس ایمیل شما هنوز تایید نشده است. لطفاً لینک فعال‌سازی ایمیل را بررسی نمایید.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'حساب کاربری با این ایمیل قبلاً ثبت‌نام شده است.';
  }
  if (lower.includes('password should be at least')) {
    return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  }
  return msg;
}

const VALID_TABS: ActiveTab[] = [
  'landing',
  'dashboard',
  'transactions',
  'goals',
  'analytics',
  'reminders',
  'dong',
  'subscription',
  'support',
  'settings',
  'ai-assistant',
];

function getInitialTab(): ActiveTab {
  if (typeof window !== 'undefined') {
    // 1. Check standard path (e.g. /dashboard or /transactions)
    const path = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '').toLowerCase();
    if (VALID_TABS.includes(path as ActiveTab)) {
      return path as ActiveTab;
    }
    // 2. Check legacy hash (e.g. #/dashboard or #dashboard) and migrate
    const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (VALID_TABS.includes(hash as ActiveTab)) {
      window.history.replaceState(null, '', `/${hash}`);
      return hash as ActiveTab;
    }
  }
  try {
    const stored = localStorage.getItem('chandboom_active_tab');
    if (stored && VALID_TABS.includes(stored as ActiveTab)) {
      return stored as ActiveTab;
    }
  } catch {}
  return 'landing';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Strict Zero LocalStorage & Zero SessionStorage policy:
  // Theme relies solely on component state and system preferences (no browser storage).
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);
  const [adminMode, setAdminModeState] = useState<boolean>(false);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);

  // Authenticated State strictly driven by Supabase Auth Session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const [user, setUser] = useState<UserProfile>(GUEST_USER);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>(INITIAL_REMINDERS);
  const [manualPayments, setManualPayments] = useState<ManualPaymentSubmission[]>(INITIAL_MANUAL_PAYMENTS);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>(INITIAL_GOALS);

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const openSubscriptionModal = () => setIsSubscriptionModalOpen(true);
  const closeSubscriptionModal = () => setIsSubscriptionModalOpen(false);

  // Auth Guard State
  const [isAuthGuardOpen, setIsAuthGuardOpen] = useState(false);
  const [authGuardMessage, setAuthGuardMessage] = useState(
    'برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.'
  );

  const openAuthGuard = (message?: string) => {
    if (message) setAuthGuardMessage(message);
    setIsAuthGuardOpen(true);
  };

  const closeAuthGuard = () => {
    setIsAuthGuardOpen(false);
  };

  const requestSubscription = () => {
    if (!isAuthenticated) {
      openAuthGuard('برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.');
    } else {
      setIsSubscriptionModalOpen(true);
    }
  };

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    updatePageSeo(tab);
    try {
      localStorage.setItem('chandboom_active_tab', tab);
    } catch {}
    if (typeof window !== 'undefined') {
      const targetPath = tab === 'landing' ? '/' : `/${tab}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
      if (window.location.hash) {
        window.history.replaceState(null, '', targetPath);
      }
    }
  };

  // Sync with browser back/forward buttons (popstate) and migrate legacy hashes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncRouteFromPath = () => {
      // 1. Check legacy hash (e.g. #/dashboard or #dashboard) and migrate to standard path
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (VALID_TABS.includes(hash as ActiveTab)) {
        const targetPath = hash === 'landing' ? '/' : `/${hash}`;
        window.history.replaceState(null, '', targetPath);
        if (hash !== activeTab) {
          setActiveTabState(hash as ActiveTab);
          updatePageSeo(hash as ActiveTab);
          try {
            localStorage.setItem('chandboom_active_tab', hash);
          } catch {}
        }
        return;
      }

      // 2. Standard pathname routing (/dashboard, /transactions, /goals, etc.)
      const path = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '').toLowerCase();
      const targetTab: ActiveTab = VALID_TABS.includes(path as ActiveTab)
        ? (path as ActiveTab)
        : path === ''
        ? 'landing'
        : 'landing';

      if (targetTab !== activeTab) {
        setActiveTabState(targetTab);
        updatePageSeo(targetTab);
        try {
          localStorage.setItem('chandboom_active_tab', targetTab);
        } catch {}
      }
    };

    window.addEventListener('popstate', syncRouteFromPath);
    window.addEventListener('hashchange', syncRouteFromPath);
    return () => {
      window.removeEventListener('popstate', syncRouteFromPath);
      window.removeEventListener('hashchange', syncRouteFromPath);
    };
  }, [activeTab]);

  const [admin2FAVerified, setAdmin2FAVerified] = useState<boolean>(() => {
    return checkAdmin2FASession(INITIAL_USER.email) || isStoredAdminSessionValid(INITIAL_USER.email);
  });

  const isAdmin = useMemo(() => {
    return (
      (isAuthenticated && (user?.role === 'admin' || isAdminEmail(user?.email))) ||
      admin2FAVerified ||
      isStoredAdminSessionValid(user?.email)
    );
  }, [isAuthenticated, user?.role, user?.email, admin2FAVerified]);

  const requestAdminOtp = async () => {
    return await requestAdminOtpViaEdgeFunction(user.email || getEnvAdminEmail() || 'admin@chandboom.ir');
  };

  const verifyAdmin2FA = async (code: string) => {
    const result = await verifyAdminOtpViaEdgeFunction(code, user.email || getEnvAdminEmail() || 'admin@chandboom.ir');
    if (result.success) {
      setAdmin2FAVerified(true);
    }
    return result;
  };

  const logoutAdmin2FA = () => {
    revokeAdmin2FA();
    clearStoredAdminSession();
    setAdmin2FAVerified(false);
    setAdminModeState(false);
  };

  const setAdminMode = useCallback(
    (enabled: boolean) => {
      if (enabled && !isAdmin) {
        alert('دسترسی به پنل مدیریت ارشد فقط برای مدیر سامانه چندبوم امکان‌پذیر است.');
        setAdminModeState(false);
        return;
      }
      setAdminModeState(enabled);
    },
    [isAdmin]
  );

  const isProUser = useMemo(() => {
    if (isAdmin) return true;
    if (user.tier === 'pro' || user.tier === 'vip') {
      if (user.subscription_expires_at) {
        return new Date(user.subscription_expires_at).getTime() > Date.now();
      }
      return user.subscription_status === 'active';
    }
    return false;
  }, [isAdmin, user.tier, user.subscription_status, user.subscription_expires_at]);

  const hasAIAccess = useMemo(() => {
    if (isAdmin) return true;
    if (!user.tier || user.tier === 'free' || user.subscription_status === 'none' || user.subscription_status === 'expired') {
      return false;
    }
    if (user.subscription_expires_at) {
      const isExpired = new Date(user.subscription_expires_at).getTime() <= Date.now();
      if (isExpired) return false;
    }
    return (user.tier === 'bronze' || user.tier === 'pro' || user.tier === 'vip') && user.subscription_status === 'active';
  }, [isAdmin, user.tier, user.subscription_status, user.subscription_expires_at]);

  const aiQueriesRemaining = useMemo(() => {
    if (user.tier === 'free') return 0;
    const limit = user.ai_queries_limit ?? (user.tier === 'bronze' ? 30 : user.tier === 'vip' ? 250 : 100);
    const serverRemaining = user.ai_requests_left;
    if (typeof serverRemaining === 'number') return Math.max(0, serverRemaining);
    return Math.max(0, Number(limit) - (user.ai_queries_used || 0));
  }, [user.tier, user.ai_queries_limit, user.ai_requests_left, user.ai_queries_used]);

  // The server is authoritative for quota consumption; this only mirrors its response locally.
  const syncAiQuotaFromServer = useCallback((remaining: number) => {
    if (!Number.isFinite(remaining) || remaining < 0) return;
    setUser((prev) => {
      const limit = Number(prev.ai_queries_limit ?? (
        prev.tier === 'bronze' ? 30 : prev.tier === 'vip' ? 250 : prev.tier === 'pro' ? 100 : 0
      ));
      return {
        ...prev,
        ai_requests_left: remaining,
        ai_queries_used: Math.max(0, limit - remaining),
      };
    });
  }, []);

  // Direct Supabase synchronization
  const fetchUserDataFromSupabase = async (userId: string, userEmail: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    try {
      // 1. Fetch User Profile with maybeSingle() to prevent PGRST116 throwing
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const isAdm = isAdminEmail(userEmail) || profileData?.role === 'admin';
      const currentRole: UserRole = isAdm ? 'admin' : (profileData?.role || 'user');

      const mergedUser: UserProfile = {
        ...GUEST_USER,
        ...(profileData || {}),
        id: userId,
        email: userEmail,
        role: currentRole,
        full_name: profileData?.full_name || userEmail.split('@')[0],
      };

      setUser(mergedUser);

      // 2. Fetch User Transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      if (txData && txData.length > 0) {
        setTransactions(txData);
      }

      // 3. Fetch User Reminders
      const { data: remData } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });
      if (remData && remData.length > 0) {
        setReminders(remData);
      }

      // 4. Fetch User Notifications
      const { data: notifData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (notifData && notifData.length > 0) {
        setNotifications(notifData);
      }

      // 5. Fetch Support Tickets
      let ticketQuery = supabase.from('tickets').select('*').order('updated_at', { ascending: false });
      if (!isAdm) {
        ticketQuery = ticketQuery.eq('user_id', userId);
      }
      const { data: ticketData } = await ticketQuery;
      if (ticketData && ticketData.length > 0) {
        setTickets(ticketData);
      }

      // 6. Fetch Manual Payments & Subscription Orders simultaneously and merge
      try {
        const [payRes, ordersRes] = await Promise.allSettled([
          isAdm
            ? supabase.from('manual_payments').select('*').order('created_at', { ascending: false })
            : supabase.from('manual_payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          isAdm
            ? supabase.from('subscription_orders').select('*').order('created_at', { ascending: false })
            : supabase.from('subscription_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        ]);

        const mergedMap = new Map<string, ManualPaymentSubmission>();

        if (payRes.status === 'fulfilled' && payRes.value.data) {
          for (const item of payRes.value.data) {
            mergedMap.set(item.id, item);
          }
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
          for (const order of ordersRes.value.data) {
            const orderAmount = order.amount_toman || order.amount || 0;
            const orderTracking = order.tracking_code || order.receipt_path || '';
            const orderReceipt = order.receipt_image_url || order.receipt_path || undefined;

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

            const mappedStatus =
              order.status === 'approved' ? 'approved' : order.status === 'rejected' ? 'rejected' : 'pending';

            if (duplicateKey) {
              const existing = mergedMap.get(duplicateKey)!;
              mergedMap.set(duplicateKey, {
                ...existing,
                plan_name: mappedPlanName,
                amount: orderAmount || existing.amount,
                status: existing.status === 'approved' || mappedStatus === 'approved' ? 'approved' : mappedStatus,
                receipt_url: existing.receipt_url || orderReceipt,
                receipt_image_url: existing.receipt_image_url || orderReceipt,
              });
            } else {
              const mapped: ManualPaymentSubmission = {
                id: order.id,
                user_id: order.user_id,
                user_email: order.user_email || '',
                user_name: order.user_name || order.note || 'کاربر چندبوم',
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
              };
              mergedMap.set(order.id, mapped);
            }
          }
        }

        const combinedList = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        if (combinedList.length > 0) {
          setManualPayments(combinedList);
        }
      } catch (err) {
        console.warn('Error fetching unified subscription payments:', err);
      }

      // 7. If Admin, fetch all users
      if (isAdm) {
        const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (usersData && usersData.length > 0) {
          setAllUsers(usersData);
        }
      }

      // 8. Fetch Financial Goals
      const { data: goalsData } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (goalsData && goalsData.length > 0) {
        setGoals(goalsData);
      }
    } catch (err) {
      console.error('Error fetching live data from Supabase:', err);
    }
  };

  // Restore session via real Supabase Auth (bulletproof cloud session persistence)
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Session retrieval error:', error);
          return;
        }

        if (session?.user && isMounted) {
          setIsAuthenticated(true);
          const email = session.user.email || '';
          await fetchUserDataFromSupabase(session.user.id, email);

          // Clean up Supabase OAuth / Auth hash fragment once captured to avoid ugly URL tokens
          if (typeof window !== 'undefined' && window.location.hash) {
            const h = window.location.hash;
            if (h.includes('access_token=') || h.includes('error=') || h.includes('type=recovery') || h.includes('type=signup') || h.includes('token=')) {
              window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
          }

          // Respect the current URL path so landing page always displays on /
          const currentPath = typeof window !== 'undefined'
            ? window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '').toLowerCase()
            : '';
          if (currentPath === '' || currentPath === 'landing') {
            setActiveTabState('landing');
          } else if (VALID_TABS.includes(currentPath as ActiveTab)) {
            setActiveTabState(currentPath as ActiveTab);
          }
        }
      } catch (e) {
        console.warn('Could not restore Supabase session:', e);
      }
    };

    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!isMounted) return;

      if (session?.user) {
        setIsAuthenticated(true);
        const email = session.user.email || '';
        await fetchUserDataFromSupabase(session.user.id, email);

        if (event === 'SIGNED_IN') {
          setActiveTabState('dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(GUEST_USER);
        setAdminModeState(false);
        setAdmin2FAVerified(false);
        setActiveTabState('landing');
        try {
          localStorage.removeItem('chandboom_active_tab');
        } catch {}
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, ...updated, updated_at: new Date().toISOString() } : u))
    );

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id && user.id !== 'guest') {
      try {
        const nextUser = { ...user, ...updated };
        const isFree = nextUser.tier === 'free';
        const finalStatus: SubscriptionStatus = isFree ? 'none' : (nextUser.subscription_status || 'none');
        const isPrem = !isFree && finalStatus === 'active';

        const cleanPayload = {
          id: user.id,
          email: nextUser.email || user.email,
          full_name: nextUser.full_name || 'کاربر چندبوم',
          avatar_url: nextUser.avatar_url ?? null,
          role: nextUser.role || 'user',
          tier: nextUser.tier || 'free',
          subscription_status: finalStatus,
          is_premium: nextUser.is_premium !== undefined ? nextUser.is_premium : isPrem,
          subscription_started_at: isFree ? null : (nextUser.subscription_started_at ?? null),
          subscription_expires_at: isFree ? null : (nextUser.subscription_expires_at ?? null),
          monthly_budget_cap: Number(nextUser.monthly_budget_cap) || 20000000,
          theme_preference: nextUser.theme_preference || (isDarkMode ? 'dark' : 'light'),
          currency: nextUser.currency || 'تومان',
          created_at: nextUser.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          age: nextUser.age !== undefined && nextUser.age !== null ? Number(nextUser.age) : null,
          gender: nextUser.gender ?? null,
          ai_requests_left: nextUser.ai_requests_left !== undefined && nextUser.ai_requests_left !== null
            ? Number(nextUser.ai_requests_left)
            : (isFree ? 5 : nextUser.tier === 'bronze' ? 50 : nextUser.tier === 'pro' ? 150 : 500),
          ai_queries_used: nextUser.ai_queries_used !== undefined ? Number(nextUser.ai_queries_used) : 0,
          ai_queries_limit: nextUser.ai_queries_limit !== undefined
            ? nextUser.ai_queries_limit
            : (isFree ? 10 : nextUser.tier === 'bronze' ? 50 : nextUser.tier === 'pro' ? 150 : 500),
          ai_queries_reset_date: nextUser.ai_queries_reset_date ?? null,
        };
        await supabase.from('users').upsert(cleanPayload);
      } catch (err) {
        console.warn('Could not sync user profile update to Supabase:', err);
      }
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'سرویس پایگاه داده در دسترس نیست.' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: translateSupabaseError(error.message) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err?.message) };
    }
  };

  const upgradeUserTier = async (tier: SubscriptionTier, durationMonths: number) => {
    const durationDays = durationMonths * 30;
    // Smart Subscription Extension: Accumulate remaining active days without loss
    const currentExpiryTime = user.subscription_expires_at ? new Date(user.subscription_expires_at).getTime() : 0;
    const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
    const expiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await updateUserProfile({
      tier,
      subscription_status: 'active',
      subscription_expires_at: expiresAt,
    });

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.rpc('sync_user_subscription', {
          p_user_id: user.id,
          p_tier: tier,
          p_duration_days: durationDays,
        });
      } catch (rpcErr) {
        // Fallback to direct upsert handled by updateUserProfile
      }
    }

    await addNotification({
      type: 'subscription',
      title: 'ارتقای حساب به اشتراک طلایی چندبوم',
      message: `حساب کاربری شما با موفقیت به سطح ${tier.toUpperCase()} ارتقا یافت و روزهای باقی‌مانده اشتراک قبلی به دوره جدید افزوده شد.`,
      priority: 'normal',
      status: 'settled',
    });
  };

  const refreshAllUsers = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          setAllUsers(data);
        }
      } catch (err) {
        console.warn('Error refreshing users list from Supabase:', err);
      }
    }
  };

  const updateUserRoleAndTier = async (userId: string, role: UserRole, tier: SubscriptionTier, durationDays: number = 30) => {
    if (!isAdmin) {
      alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به تغییر نقش و سطح اشتراک کاربران هستند.');
      return;
    }

    const target = allUsers.find((u) => u.id === userId) || (user.id === userId ? user : null);
    
    let finalStatus: SubscriptionStatus = 'none';
    let finalExpiry: string | null = null;
    let finalStartedAt: string | null = null;
    let finalAiLimit = 10;
    let finalAiRequests = 5;
    let isPremium = false;

    if (tier === 'free') {
      finalStatus = 'none';
      finalExpiry = null;
      finalStartedAt = null;
      finalAiLimit = 10;
      finalAiRequests = 5;
      isPremium = false;
    } else {
      finalStatus = 'active';
      isPremium = true;
      finalStartedAt = target?.subscription_started_at || new Date().toISOString();
      finalAiLimit = tier === 'bronze' ? 50 : tier === 'vip' ? 500 : 150;
      finalAiRequests = tier === 'bronze' ? 50 : tier === 'vip' ? 500 : 150;
      const currentExpiryTime = target?.subscription_expires_at ? new Date(target.subscription_expires_at).getTime() : 0;
      const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
      finalExpiry = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: updateErr } = await supabase
          .from('users')
          .update({
            role,
            tier,
            subscription_status: finalStatus,
            is_premium: isPremium,
            subscription_started_at: finalStartedAt,
            subscription_expires_at: finalExpiry,
            ai_requests_left: finalAiRequests,
            ai_queries_limit: finalAiLimit,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateErr) {
          console.error('Error updating user in Supabase:', updateErr);
        }
      } catch (err: any) {
        console.warn('Direct user update warning in Supabase:', err?.message);
      }
    }

    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              role,
              tier,
              subscription_status: finalStatus,
              is_premium: isPremium,
              subscription_started_at: finalStartedAt,
              subscription_expires_at: finalExpiry,
              ai_requests_left: finalAiRequests,
              ai_queries_limit: finalAiLimit,
              updated_at: new Date().toISOString(),
            }
          : u
      )
    );

    if (user.id === userId) {
      setUser((prev) => ({
        ...prev,
        role,
        tier,
        subscription_status: finalStatus,
        is_premium: isPremium,
        subscription_started_at: finalStartedAt,
        subscription_expires_at: finalExpiry,
        ai_requests_left: finalAiRequests,
        ai_queries_limit: finalAiLimit,
      }));
    }
  };

  const updateUserSubscriptionDays = async (userId: string, daysToAdd: number, reason?: string) => {
    if (!isAdmin) {
      alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به افزایش روزهای اشتراک هستند.');
      return;
    }

    const target = allUsers.find((u) => u.id === userId) || (user.id === userId ? user : null);
    if (!target) return;

    let finalExpiry: string | null = null;
    let finalTier: SubscriptionTier = target.tier;
    let finalStatus: SubscriptionStatus = target.subscription_status;
    let isPremium = target.is_premium ?? false;
    let aiRequestsLeft = target.ai_requests_left ?? 5;

    if (daysToAdd <= 0) {
      finalExpiry = new Date(Date.now() - 1000).toISOString();
      finalStatus = 'expired';
      isPremium = false;
      aiRequestsLeft = 0;
    } else {
      const currentExpiryTime = target.subscription_expires_at ? new Date(target.subscription_expires_at).getTime() : 0;
      const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
      finalExpiry = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
      finalTier = target.tier === 'free' ? 'pro' : target.tier;
      finalStatus = 'active';
      isPremium = true;
      aiRequestsLeft = (target.ai_requests_left && target.ai_requests_left > 0) ? target.ai_requests_left : (finalTier === 'vip' ? 500 : 150);
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('users')
          .update({
            tier: finalTier,
            subscription_status: finalStatus,
            subscription_expires_at: finalExpiry,
            is_premium: isPremium,
            ai_requests_left: aiRequestsLeft,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);
      } catch (err: any) {
        console.warn('Error updating subscription days in Supabase:', err?.message);
      }
    }

    setAllUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              tier: finalTier,
              subscription_status: finalStatus,
              subscription_expires_at: finalExpiry,
              is_premium: isPremium,
              ai_requests_left: aiRequestsLeft,
              updated_at: new Date().toISOString(),
            }
          : u
      )
    );

    if (user.id === userId) {
      setUser((prev) => ({
        ...prev,
        tier: finalTier,
        subscription_status: finalStatus,
        subscription_expires_at: finalExpiry,
        is_premium: isPremium,
        ai_requests_left: aiRequestsLeft,
      }));
    }

    // Automatically forward admin comment / days update into Support Ticketing system
    const daysLabel = daysToAdd > 0 ? `افزایش ${daysToAdd} روزه` : `${daysToAdd} روز`;
    const noteText = reason?.trim() ? `\nتوضیحات مدیر ارشد: ${reason}` : '';
    await forwardAdminNotificationToTicket(
      userId,
      target.full_name || 'کاربر گرامی',
      target.email,
      'تمدید اعتبار اشتراک طلایی توسط مدیریت چندبوم',
      `کاربر گرامی، مدت اعتبار حساب کاربری شما به میزان ${daysLabel} اعمال گردید.${noteText}\nتاریخ انقضای جدید: ${finalExpiry ? new Date(finalExpiry).toLocaleDateString('fa-IR') : 'فاقد اشتراک'}`
    );
  };

  /**
   * Comprehensive Admin Edit Function:
   * Direct sync across all 21 columns of public.users table in Supabase
   */
  const adminUpdateUser = async (userId: string, updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'دسترسی غیرمجاز: فقط مدیران ارشد مجاز به ویرایش اطلاعات کاربر هستند.' };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'پایگاه داده در دسترس نیست.' };
    }

    try {
      const dbPayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.full_name !== undefined) dbPayload.full_name = updates.full_name;
      if (updates.role !== undefined) dbPayload.role = updates.role;
      if (updates.tier !== undefined) {
        dbPayload.tier = updates.tier;
        if (updates.tier === 'free') {
          dbPayload.subscription_status = 'none';
          dbPayload.is_premium = false;
          dbPayload.subscription_expires_at = null;
          dbPayload.ai_requests_left = 5;
        } else if (updates.subscription_status === undefined) {
          dbPayload.subscription_status = 'active';
          dbPayload.is_premium = true;
          if (updates.ai_requests_left === undefined) {
            dbPayload.ai_requests_left = updates.tier === 'bronze' ? 50 : updates.tier === 'vip' ? 500 : 150;
          }
        }
      }
      if (updates.subscription_status !== undefined) {
        dbPayload.subscription_status = updates.subscription_status;
        dbPayload.is_premium = updates.subscription_status === 'active' && (updates.tier ? updates.tier !== 'free' : true);
        if (updates.subscription_status === 'none' || updates.subscription_status === 'expired') {
          dbPayload.is_premium = false;
        }
      }
      if (updates.is_premium !== undefined) dbPayload.is_premium = updates.is_premium;
      if (updates.subscription_expires_at !== undefined) dbPayload.subscription_expires_at = updates.subscription_expires_at;
      if (updates.subscription_started_at !== undefined) dbPayload.subscription_started_at = updates.subscription_started_at;
      if (updates.monthly_budget_cap !== undefined) dbPayload.monthly_budget_cap = Number(updates.monthly_budget_cap);
      if (updates.theme_preference !== undefined) dbPayload.theme_preference = updates.theme_preference;
      if (updates.currency !== undefined) dbPayload.currency = updates.currency;
      if (updates.age !== undefined) dbPayload.age = updates.age !== null ? Number(updates.age) : null;
      if (updates.gender !== undefined) dbPayload.gender = updates.gender;
      if (updates.ai_requests_left !== undefined) dbPayload.ai_requests_left = Number(updates.ai_requests_left);
      if (updates.ai_queries_limit !== undefined) dbPayload.ai_queries_limit = updates.ai_queries_limit !== null ? Number(updates.ai_queries_limit) : null;
      if (updates.ai_queries_used !== undefined) dbPayload.ai_queries_used = Number(updates.ai_queries_used);

      const { error: updateErr } = await supabase
        .from('users')
        .update(dbPayload)
        .eq('id', userId);

      if (updateErr) {
        console.error('Error updating user in Supabase:', updateErr);
        return { success: false, error: updateErr.message };
      }

      setAllUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, ...updates, ...dbPayload } : u))
      );

      if (user.id === userId) {
        setUser((prev) => ({ ...prev, ...updates, ...dbPayload }));
      }

      return { success: true };
    } catch (err: any) {
      console.error('Exception updating user:', err);
      return { success: false, error: err?.message || 'خطا در ثبت تغییرات در دیتابیس' };
    }
  };

  /**
   * Quick action to immediately expire user subscription
   */
  const adminExpireUserSubscription = async (userId: string) => {
    if (!isAdmin) return;
    await adminUpdateUser(userId, {
      subscription_status: 'expired',
      is_premium: false,
      subscription_expires_at: new Date(Date.now() - 1000).toISOString(),
      ai_requests_left: 0,
    });
  };

  // Forward administrative comments / subscription status into Support Ticketing system
  const forwardAdminNotificationToTicket = async (
    targetUserId: string,
    targetUserName: string,
    targetUserEmail: string,
    subject: string,
    messageContent: string
  ) => {
    const supabase = getSupabaseClient();
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: '',
      sender_id: user.id || 'admin',
      sender_name: 'پشتیبان رسمی چندبوم (مدیریت)',
      sender_role: 'admin',
      content: messageContent,
      created_at: new Date().toISOString(),
    };

    // Find if user already has a ticket for subscription
    const existingTicket = tickets.find(
      (t) => (t.user_id === targetUserId || t.user_email === targetUserEmail) && t.subject.includes('اشتراک')
    );

    if (existingTicket) {
      newMsg.ticket_id = existingTicket.id;
      const updatedMessages = [...existingTicket.messages, newMsg];
      setTickets((prev) =>
        prev.map((t) =>
          t.id === existingTicket.id
            ? { ...t, status: 'resolved', updated_at: new Date().toISOString(), messages: updatedMessages }
            : t
        )
      );
      if (supabase) {
        try {
          await supabase
            .from('tickets')
            .update({
              status: 'resolved',
              updated_at: new Date().toISOString(),
              messages: updatedMessages,
            })
            .eq('id', existingTicket.id);
        } catch (e) {
          console.warn('Could not update ticket in Supabase:', e);
        }
      }
    } else {
      const ticketId = `tkt-${Date.now()}`;
      newMsg.ticket_id = ticketId;
      const newTicket: Ticket = {
        id: ticketId,
        user_id: targetUserId,
        user_name: targetUserName,
        user_email: targetUserEmail,
        subject,
        department: 'پشتیبانی مالی',
        priority: 'high',
        status: 'resolved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [newMsg],
      };
      setTickets((prev) => [newTicket, ...prev]);
      if (supabase) {
        try {
          await supabase.from('tickets').insert([newTicket]);
        } catch (e) {
          console.warn('Could not insert ticket in Supabase:', e);
        }
      }
    }
  };

  // Direct User Notification and Support Messaging System for Admin
  const sendDirectUserMessage = async (
    targetUserId: string,
    targetUserName: string,
    targetUserEmail: string,
    title: string,
    message: string,
    sendAsNotification: boolean = true,
    sendAsTicket: boolean = true
  ): Promise<boolean> => {
    const supabase = getSupabaseClient();
    let success = false;

    // 1. Direct Platform Notification in user's dashboard notification inbox
    if (sendAsNotification) {
      const notifItem: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        user_id: targetUserId,
        type: 'system',
        title: title.trim(),
        message: message.trim(),
        priority: 'urgent',
        status: 'pending',
        is_read: false,
        created_at: new Date().toISOString(),
      };

      if (user.id === targetUserId) {
        setNotifications((prev) => [notifItem, ...prev]);
      }

      if (supabase) {
        try {
          await supabase.from('notifications').insert([notifItem]);
          success = true;
        } catch (err) {
          console.warn('Direct notification supabase insert error:', err);
        }
      } else {
        success = true;
      }
    }

    // 2. Direct Support Ticket Messaging in user's ticketing inbox
    if (sendAsTicket) {
      await forwardAdminNotificationToTicket(
        targetUserId,
        targetUserName,
        targetUserEmail,
        title.trim(),
        message.trim()
      );
      success = true;
    }

    return success;
  };

  // Manual Card-to-Card Payment Actions
  const submitManualPayment = async (data: Omit<ManualPaymentSubmission, 'id' | 'created_at' | 'status'>) => {
    const newSubmission: ManualPaymentSubmission = {
      ...data,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setManualPayments((prev) => [newSubmission, ...prev]);

    // Instantly update user subscription_status to 'pending_approval' to display the golden review badge
    await updateUserProfile({
      subscription_status: 'pending_approval',
    });

    // Immutably record in transactions history
    await addTransaction({
      amount: data.amount,
      type: 'expense',
      category: 'سایر',
      description: `واریز وجه اشتراک طلایی ${data.plan_name} (کد رهگیری: ${data.tracking_code})`,
      date: new Date().toISOString(),
      account: 'بانک سامان (کارت به کارت)',
    });

    await addNotification({
      type: 'subscription',
      title: 'رسید پرداخت ثبت شد',
      message: `اطلاعات واریزی کارت به کارت برای پلن «${data.plan_name}» ثبت و برای بررسی به مدیریت ارسال گردید.`,
      amount: data.amount,
      priority: 'normal',
      status: 'pending',
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('manual_payments').insert([newSubmission]);
        // Also insert in subscription_orders if user is authenticated
        if (data.user_id && data.user_id !== 'guest') {
          await supabase.from('subscription_orders').insert([{
            user_id: data.user_id,
            plan_id: data.plan_id,
            amount_toman: data.amount,
            receipt_path: data.receipt_url || '',
            note: data.notes || '',
            status: 'pending',
          }]);
        }
      } catch (err) {
        console.error('Supabase manual_payment insert error:', err);
      }
    }
  };

  const approveManualPayment = async (paymentId: string, adminNotes?: string) => {
    if (!isAdmin) {
      alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به تایید پرداخت هستند.');
      return;
    }

    const targetPayment = manualPayments.find((p) => p.id === paymentId);
    const targetUserId = targetPayment?.user_id;
    const planId = targetPayment?.plan_id || 'pro-1m';
    const durationMonths = (planId.endsWith('-3m') || planId === 'pro-3m') ? 3 : 1;
    const targetTier: SubscriptionTier =
      planId.startsWith('vip') ? 'vip' : planId.startsWith('bronze') ? 'bronze' : 'pro';

    const targetUser = allUsers.find((u) => u.id === targetUserId) || (user.id === targetUserId ? user : null);
    const currentExpiryTime = targetUser?.subscription_expires_at ? new Date(targetUser.subscription_expires_at).getTime() : 0;
    const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
    const finalExpiresAt = new Date(baseTime + durationMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('manual_payments')
          .update({
            status: 'approved',
            admin_notes: adminNotes || 'پرداخت تایید شد و اشتراک فعال گردید.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          })
          .eq('id', paymentId);

        await supabase
          .from('subscription_orders')
          .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', paymentId);

        if (targetUserId && targetUserId !== 'guest') {
          const aiQuota = targetTier === 'vip' ? 500 : targetTier === 'bronze' ? 50 : 150;
          await supabase
            .from('users')
            .update({
              tier: targetTier,
              subscription_status: 'active',
              is_premium: true,
              subscription_started_at: targetUser?.subscription_started_at || new Date().toISOString(),
              subscription_expires_at: finalExpiresAt,
              ai_requests_left: aiQuota,
              ai_queries_limit: aiQuota,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId);
        }
      } catch (err: any) {
        console.warn('Direct Supabase approve order note:', err?.message);
      }
    }

    setManualPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            status: 'approved',
            admin_notes: adminNotes || 'پرداخت تایید شد و اشتراک فعال گردید.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          };
        }
        return p;
      })
    );

    if (targetUserId) {
      const aiQuota = targetTier === 'vip' ? 500 : targetTier === 'bronze' ? 50 : 150;
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                tier: targetTier,
                subscription_status: 'active',
                is_premium: true,
                subscription_expires_at: finalExpiresAt,
                ai_requests_left: aiQuota,
                ai_queries_limit: aiQuota,
                updated_at: new Date().toISOString(),
              }
            : u
        )
      );

      if (user.id === targetUserId) {
        setUser((prev) => ({
          ...prev,
          tier: targetTier,
          subscription_status: 'active',
          is_premium: true,
          subscription_expires_at: finalExpiresAt,
          ai_requests_left: aiQuota,
          ai_queries_limit: aiQuota,
          updated_at: new Date().toISOString(),
        }));
      }
    }
  };

  const rejectManualPayment = async (paymentId: string, adminNotes?: string) => {
    if (!isAdmin) {
      alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به رد پرداخت هستند.');
      return;
    }

    const targetPayment = manualPayments.find((p) => p.id === paymentId);
    const targetUserId = targetPayment?.user_id;
    const targetU = allUsers.find((u) => u.id === targetUserId);
    const hasRemainingActivePlan = Boolean(
      targetU?.subscription_expires_at &&
      new Date(targetU.subscription_expires_at).getTime() > Date.now() &&
      targetU.tier !== 'free'
    );
    const fallbackStatus: SubscriptionStatus = hasRemainingActivePlan ? 'active' : 'none';
    const fallbackTier: SubscriptionTier = hasRemainingActivePlan && targetU ? targetU.tier : 'free';
    const fallbackPremium = hasRemainingActivePlan;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase
          .from('manual_payments')
          .update({
            status: 'rejected',
            admin_notes: adminNotes || 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          })
          .eq('id', paymentId);

        await supabase
          .from('subscription_orders')
          .update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', paymentId);

        if (targetUserId && targetUserId !== 'guest') {
          await supabase
            .from('users')
            .update({
              tier: fallbackTier,
              subscription_status: fallbackStatus,
              is_premium: fallbackPremium,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId);
        }
      } catch (err: any) {
        console.warn('Direct Supabase reject order note:', err?.message);
      }
    }

    setManualPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            status: 'rejected',
            admin_notes: adminNotes || 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.email,
          };
        }
        return p;
      })
    );

    if (targetUserId) {
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserId
            ? {
                ...u,
                tier: fallbackTier,
                subscription_status: fallbackStatus,
                is_premium: fallbackPremium,
                updated_at: new Date().toISOString(),
              }
            : u
        )
      );

      if (user.id === targetUserId) {
        setUser((prev) => ({
          ...prev,
          tier: fallbackTier,
          subscription_status: fallbackStatus,
          is_premium: fallbackPremium,
          updated_at: new Date().toISOString(),
        }));
      }
    }
  };

  // Transaction Actions
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id || 'guest',
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .insert([
            {
              user_id: user.id,
              amount: tx.amount,
              category: tx.category,
              type: tx.type,
              date: tx.date || new Date().toISOString(),
              description: tx.description,
              account: tx.account || 'کارت اصلی',
              tags: tx.tags || [],
            },
          ])
          .select()
          .single();

        if (!error && data) {
          setTransactions((prev) => [data, ...prev.filter((t) => t.id !== newTx.id)]);
        }
      } catch (err) {
        console.error('Supabase insert transaction error:', err);
      }
    }
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('transactions').update(updated).eq('id', id);
      } catch (err) {
        console.error('Supabase update transaction error:', err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete transaction error:', err);
      }
    }
  };

  // Notification Actions
  const addNotification = async (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    const newItem: NotificationItem = {
      ...item,
      id: `notif-${Date.now()}`,
      user_id: user.id || 'guest',
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newItem, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.from('notifications').insert([newItem]);
      } catch (err) {
        console.error('Supabase notification insert error:', err);
      }
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (err) {
        console.error('Supabase update notification error:', err);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
      } catch (err) {
        console.error('Supabase mark all notifications error:', err);
      }
    }
  };

  const settleNotification = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'settled', is_read: true } : n))
    );
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('notifications').update({ status: 'settled', is_read: true }).eq('id', id);
      } catch (err) {
        console.error('Supabase settle notification error:', err);
      }
    }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('notifications').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete notification error:', err);
      }
    }
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // Support Ticket Actions
  const createTicket = async ({
    subject,
    department = 'پشتیبانی مالی',
    category,
    priority = 'medium',
    initialMessage,
    attachmentUrl,
  }: {
    subject: string;
    department?: Ticket['department'];
    category?: string;
    priority?: Ticket['priority'];
    initialMessage: string;
    attachmentUrl?: string | null;
  }) => {
    if (!isAuthenticated || !user.id || user.id === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }

    const ticketId = `tkt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const effectiveCategory = category || (department === 'پشتیبانی مالی' ? 'financial' : department === 'پشتیبانی فنی' ? 'technical' : 'support');
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: user.id,
      sender_name: user.full_name || 'کاربر چندبوم',
      sender_role: 'user',
      message: initialMessage,
      content: initialMessage,
      attachment_url: attachmentUrl || null,
      created_at: new Date().toISOString(),
    };

    const newTicket: Ticket = {
      id: ticketId,
      user_id: user.id,
      user_name: user.full_name || 'کاربر چندبوم',
      user_email: user.email || '',
      subject,
      category: effectiveCategory,
      department,
      priority,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      messages: [newMsg],
    };

    setTickets((prev) => [newTicket, ...prev]);
    setSelectedTicket(newTicket);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id && user.id !== 'guest') {
      try {
        const payload = {
          id: ticketId,
          user_id: user.id,
          user_name: user.full_name || user.email || 'کاربر چندبوم',
          user_email: user.email || '',
          subject,
          category: effectiveCategory,
          department,
          priority,
          status: 'open',
          messages: [newMsg],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('tickets').insert([payload]);
        if (error) {
          console.warn('Supabase create ticket note:', error.message);
        }

        // Also attempt insert into normalized ticket_messages table if provisioned
        try {
          await supabase.from('ticket_messages').insert([{
            ticket_id: ticketId,
            sender_id: user.id,
            message: initialMessage,
            attachment_url: attachmentUrl || null,
            created_at: new Date().toISOString(),
          }]);
        } catch {}
      } catch (err) {
        console.error('Supabase create ticket exception:', err);
      }
    }
  };

  const addTicket = async (
    subject: string,
    department: Ticket['department'] = 'پشتیبانی مالی',
    priority: Ticket['priority'] = 'medium',
    initialMessage: string = '',
    attachmentUrl?: string | null
  ) => {
    await createTicket({ subject, department, priority, initialMessage, attachmentUrl });
  };

  const addTicketMessage = async (
    ticketId: string,
    content: string,
    asAdmin: boolean = false,
    attachmentUrl?: string | null
  ) => {
    const isActAsAdmin = asAdmin && isAdmin;
    const newMsg: TicketMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ticket_id: ticketId,
      sender_id: user.id || 'guest',
      sender_name: isActAsAdmin ? 'پشتیبان رسمی چندبوم' : user.full_name || 'کاربر چندبوم',
      sender_role: isActAsAdmin ? 'admin' : 'user',
      message: content,
      content,
      attachment_url: attachmentUrl || null,
      created_at: new Date().toISOString(),
    };

    let updatedList: Ticket[] = [];
    setTickets((prev) => {
      updatedList = prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: isActAsAdmin ? 'resolved' : 'in_progress',
            updated_at: new Date().toISOString(),
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      });
      return updatedList;
    });

    const target = updatedList.find((t) => t.id === ticketId);
    if (target) {
      setSelectedTicket(target);
      const supabase = getSupabaseClient();
      if (supabase && isAuthenticated) {
        try {
          await supabase
            .from('tickets')
            .update({
              status: target.status,
              updated_at: target.updated_at,
              messages: target.messages,
            })
            .eq('id', ticketId);

          // Also attempt insert into normalized ticket_messages table
          try {
            await supabase.from('ticket_messages').insert([{
              ticket_id: ticketId,
              sender_id: user.id,
              message: content,
              attachment_url: attachmentUrl || null,
              created_at: new Date().toISOString(),
            }]);
          } catch {}
        } catch (err) {
          console.error('Supabase update ticket message error:', err);
        }
      }
    }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    if (!isAdmin) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t))
    );
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId);
      } catch (err) {
        console.error('Supabase update ticket status error:', err);
      }
    }
  };

  const navigateToSupportWithTicket = (ticketId?: string) => {
    setActiveTab('support');
    if (ticketId) {
      const found = tickets.find((t) => t.id === ticketId);
      if (found) {
        setSelectedTicket(found);
        setActiveSupportTicketId(ticketId);
      }
    }
  };

  // Real Supabase Authentication Methods
  const loginWithEmail = async (email: string, password?: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (!cleanEmail || !password) {
      return { success: false, error: 'لطفاً ایمیل و رمز عبور را وارد نمایید.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) {
        return { success: false, error: translateSupabaseError(error.message) };
      }

      if (data?.user) {
        setIsAuthenticated(true);
        await fetchUserDataFromSupabase(data.user.id, cleanEmail);
        return { success: true };
      }

      return { success: false, error: 'اطلاعات ورود تایید نشد.' };
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err?.message) };
    }
  };

  const registerWithEmail = async (
    email: string,
    fullName: string,
    password?: string,
    avatarUrl?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر',
    budgetCap?: number
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const supabase = getSupabaseClient();

    if (!cleanEmail || !password || !fullName.trim()) {
      return { success: false, error: 'لطفاً تمام فیلدهای الزامی را تکمیل نمایید.' };
    }

    try {
      const isAdm = isAdminEmail(cleanEmail);
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            age: age || null,
            gender: gender || null,
            avatar_url: avatarUrl || MALE_AVATAR_SVG,
          },
        },
      });

      if (error) {
        return { success: false, error: translateSupabaseError(error.message) };
      }

      if (data?.user) {
        // Upsert into Supabase public.users table with demographics for AI personalization
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: cleanEmail,
            full_name: fullName.trim(),
            avatar_url: avatarUrl || MALE_AVATAR_SVG,
            role: isAdm ? 'admin' : 'user',
            tier: 'free',
            subscription_status: 'none',
            subscription_started_at: null,
            subscription_expires_at: null,
            monthly_budget_cap: Number(budgetCap) || 20000000,
            theme_preference: isDarkMode ? 'dark' : 'light',
            currency: 'تومان',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            age: age || null,
            gender: gender || null,
            ai_queries_used: 0,
            ai_queries_limit: 50,
            ai_queries_reset_date: null,
          });
        } catch (dbErr) {
          console.warn('Could not insert profile row immediately into users table:', dbErr);
        }

        if (!data.session) {
          return { success: true, requiresEmailConfirmation: true };
        }

        setIsAuthenticated(true);
        await fetchUserDataFromSupabase(data.user.id, cleanEmail);
        return { success: true, requiresEmailConfirmation: false };
      }

      return { success: false, error: 'ثبت‌نام ناموفق بود.' };
    } catch (err: any) {
      return { success: false, error: translateSupabaseError(err?.message) };
    }
  };

  const login = async (email: string, password?: string) => {
    return loginWithEmail(email, password);
  };

  const register = async (
    email: string,
    arg2: string,
    arg3?: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر',
    budgetCap?: number
  ) => {
    // Gracefully handle either (email, password, fullName) or (email, fullName, password)
    let password = arg2;
    let fullName = arg3 || '';
    if (arg2.includes(' ') || (arg3 && arg3.length < arg2.length && !arg2.includes('@'))) {
      fullName = arg2;
      password = arg3 || '';
    } else if (!fullName) {
      fullName = email.split('@')[0];
    }
    return registerWithEmail(email, fullName, password, undefined, age, gender, budgetCap);
  };

  const checkEmailRegistered = async (email: string): Promise<boolean> => {
    return await checkEmailExists(email);
  };

  const requestSignupOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const isRegistered = await checkEmailExists(cleanEmail);
    if (isRegistered) {
      return {
        success: false,
        error: 'این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید.',
        isDuplicate: true,
      };
    }
    return await createUserOtp(cleanEmail);
  };

  const requestLoginOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    return await sendLoginOtp(cleanEmail);
  };

  const loginWithOtp = async (email: string, code: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const verifyRes = await verifyUserOtp(cleanEmail, cleanCode, 'email');
    if (!verifyRes.success) {
      return { success: false, error: verifyRes.error || 'کد تایید اشتباه یا منقضی شده است.' };
    }

    const supabase = getSupabaseClient();
    const sessionUser = verifyRes.user || (await supabase?.auth.getUser())?.data?.user;

    if (supabase && sessionUser) {
      setIsAuthenticated(true);
      await fetchUserDataFromSupabase(sessionUser.id, cleanEmail);
      return { success: true };
    }

    setIsAuthenticated(true);
    return { success: true };
  };

  const requestPasswordResetOtp = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    return await sendPasswordResetOtp(cleanEmail);
  };

  const resetPasswordWithOtp = async (email: string, code: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    return await resetUserPassword(cleanEmail, code, newPassword);
  };

  const verifySignupOtpAndRegister = async (
    email: string,
    code: string,
    password: string,
    fullName: string,
    age?: number,
    gender?: 'مرد' | 'زن' | 'سایر',
    budgetCap?: number
  ): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. اعتبارسنجی کد در Supabase Auth
    const verifyRes = await verifyUserOtp(cleanEmail, cleanCode, 'signup');
    if (!verifyRes.success) {
      return { success: false, error: verifyRes.error || 'کد تایید اشتباه است.' };
    }

    const supabase = getSupabaseClient();
    const sessionUser = verifyRes.user || (await supabase?.auth.getUser())?.data?.user;

    // 2. تنظیم رمز عبور و اطلاعات کاربری در احراز هویت
    if (supabase && password) {
      try {
        await supabase.auth.updateUser({
          password,
          data: {
            full_name: fullName.trim(),
            age: age || null,
            gender: gender || null,
          },
        });
      } catch (pwdErr) {
        console.warn('Password update note:', pwdErr);
      }
    }

    // 3. ثبت مشخصات در جدول عمومی users
    if (supabase && sessionUser) {
      try {
        const isAdm = isAdminEmail(cleanEmail);
        await supabase.from('users').upsert({
          id: sessionUser.id,
          email: cleanEmail,
          full_name: fullName.trim(),
          avatar_url: MALE_AVATAR_SVG,
          role: isAdm ? 'admin' : 'user',
          tier: 'free',
          subscription_status: 'none',
          subscription_started_at: null,
          subscription_expires_at: null,
          monthly_budget_cap: Number(budgetCap) || 20000000,
          theme_preference: isDarkMode ? 'dark' : 'light',
          currency: 'تومان',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          age: age || null,
          gender: gender || null,
          ai_queries_used: 0,
          ai_queries_limit: 50,
          ai_queries_reset_date: null,
        });
        await fetchUserDataFromSupabase(sessionUser.id, cleanEmail);
      } catch (dbErr) {
        console.warn('User table upsert note:', dbErr);
      }
    }

    setIsAuthenticated(true);
    return { success: true };
  };

  // Financial Goals Handlers (اهداف مالی)
  const addGoal = async (goalData: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => {
    const newGoal: FinancialGoal = {
      ...goalData,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: user.id || 'guest',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id && user.id !== 'guest') {
      try {
        await supabase.from('financial_goals').insert([{
          id: newGoal.id,
          user_id: user.id,
          title: newGoal.title,
          target_amount: newGoal.target_amount,
          current_amount: newGoal.current_amount,
          deadline: newGoal.deadline,
          category: newGoal.category,
          status: newGoal.status,
          notes: newGoal.notes,
        }]);
      } catch (err) {
        console.warn('Supabase add goal note:', err);
      }
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g))
    );
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase
          .from('financial_goals')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase update goal note:', err);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('financial_goals').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete goal note:', err);
      }
    }
  };

  const contributeToGoal = async (id: string, amount: number) => {
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    const newCurrent = target.current_amount + amount;
    const newStatus = newCurrent >= target.target_amount ? 'achieved' : target.status;
    await updateGoal(id, { current_amount: newCurrent, status: newStatus });

    // Immutably record in Supabase transactions history
    await addTransaction({
      amount,
      type: 'expense',
      category: 'سرمایه‌گذاری',
      description: `واریز پس‌انداز به هدف مالی «${target.title}»`,
      date: new Date().toISOString(),
      account: 'صندوق اهداف مالی',
    });

    await addNotification({
      type: 'system',
      title: 'واریز به هدف مالی ثبت شد',
      message: `مبلغ ${amount.toLocaleString('fa-IR')} تومان به هدف «${target.title}» افزوده شد.`,
      amount,
      priority: 'normal',
      status: 'pending',
    });
  };

  const loginAsRole = (role: UserRole) => {
    setUser((prev) => ({
      ...prev,
      role,
      tier: role === 'admin' ? 'vip' : 'pro',
    }));
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    setIsAuthenticated(false);
    setUser(GUEST_USER);
    setAdminModeState(false);
    setAdmin2FAVerified(false);
    setActiveTab('landing');
  };

  const addReminder = async (rem: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => {
    const newRem: Reminder = {
      ...rem,
      id: `rem-${Date.now()}`,
      user_id: user.id || 'guest',
      created_at: new Date().toISOString(),
    };
    setReminders((prev) => [newRem, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        const { data, error } = await supabase
          .from('reminders')
          .insert([
            {
              user_id: user.id,
              title: rem.title,
              amount: rem.amount,
              due_date: rem.due_date,
              category: rem.category,
              is_paid: rem.is_paid || false,
              recurrence: rem.recurrence || 'once',
            },
          ])
          .select()
          .single();

        if (!error && data) {
          setReminders((prev) => [data, ...prev.filter((r) => r.id !== newRem.id)]);
        }
      } catch (err) {
        console.error('Supabase insert reminder error:', err);
      }
    }
  };

  const updateReminder = async (id: string, updated: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('reminders').update(updated).eq('id', id);
      } catch (err) {
        console.error('Supabase update reminder error:', err);
      }
    }
  };

  const deleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('reminders').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase delete reminder error:', err);
      }
    }
  };

  const toggleReminderPaid = async (id: string) => {
    const current = reminders.find((r) => r.id === id);
    const newPaidStatus = current ? !current.is_paid : true;

    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_paid: newPaidStatus } : r)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) {
      try {
        await supabase.from('reminders').update({ is_paid: newPaidStatus }).eq('id', id);
      } catch (err) {
        console.error('Supabase toggle reminder error:', err);
      }
    }
  };

  // Financial Metrics & Calculations
  const totalIncome = useMemo(() => {
    return transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const netBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const monthlyBudgetCap = user.monthly_budget_cap || 20000000;

  const budgetUtilizationPercent = useMemo(() => {
    if (!monthlyBudgetCap || monthlyBudgetCap <= 0) return 0;
    return Math.min(Math.round((totalExpense / monthlyBudgetCap) * 100), 100);
  }, [totalExpense, monthlyBudgetCap]);

  const expensesByCategory = useMemo(() => {
    const result = {} as Record<TransactionCategory, number>;
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        result[t.category] = (result[t.category] || 0) + t.amount;
      });
    return result;
  }, [transactions]);

  const predictiveAlerts = useMemo(() => {
    return generatePredictiveBudgetAlerts(transactions, monthlyBudgetCap);
  }, [transactions, monthlyBudgetCap]);

  const metrics = useMemo(
    () => ({
      balance: netBalance,
      totalIncome,
      totalExpense,
      categoryBreakdown: expensesByCategory,
    }),
    [netBalance, totalIncome, totalExpense, expensesByCategory]
  );

  const budgetInsight = useMemo(() => {
    const now = new Date();
    const currentDay = Math.max(1, now.getDate());
    const dailyBurnRate = Math.round(totalExpense / currentDay);

    const topAlert = predictiveAlerts[0];
    if (topAlert) {
      return {
        message: topAlert.message,
        isWarning: topAlert.severity === 'warning' || topAlert.severity === 'critical',
        dailyBurnRate,
      };
    }
    return {
      message: 'مخارج ماهانه شما در سطح متعادل و تحت کنترل است.',
      isWarning: false,
      dailyBurnRate,
    };
  }, [predictiveAlerts, totalExpense]);

  const resetToInitialData = () => {
    setUser(GUEST_USER);
    setTransactions([]);
    setReminders([]);
    setNotifications([]);
    setTickets([]);
    setManualPayments([]);
    setGoals([]);
    setSelectedTicket(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        adminMode,
        setAdminMode,
        isAdmin,
        isAdmin2FAVerified: admin2FAVerified,
        verifyAdmin2FA,
        requestAdminOtp,
        logoutAdmin2FA,
        isDarkMode,
        toggleDarkMode,
        theme: isDarkMode ? 'dark' : 'light',
        toggleTheme: toggleDarkMode,
        isAuthenticated,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithEmail,
        registerWithEmail,
        login,
        register,
        requestSignupOtp,
        verifySignupOtpAndRegister,
        requestLoginOtp,
        loginWithOtp,
        requestPasswordResetOtp,
        resetPasswordWithOtp,
        checkEmailRegistered,
        loginAsRole,
        logout,
        changePassword,
        user,
        currentUser: user,
        updateUserProfile,
        isProUser,
        hasAIAccess,
        aiQueriesRemaining,
        syncAiQuotaFromServer,
        upgradeUserTier,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        isSubscriptionModalOpen,
        openSubscriptionModal,
        closeSubscriptionModal,
        isAuthGuardOpen,
        authGuardMessage,
        openAuthGuard,
        closeAuthGuard,
        requestSubscription,
        allUsers,
        refreshAllUsers,
        updateUserRoleAndTier,
        updateUserSubscriptionDays,
        adminUpdateUser,
        adminExpireUserSubscription,
        sendDirectUserMessage,
        manualPayments,
        submitManualPayment,
        approveManualPayment,
        rejectManualPayment,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        reminders,
        addReminder,
        updateReminder,
        deleteReminder,
        toggleReminderPaid,
        notifications,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        settleNotification,
        deleteNotification,
        unreadNotificationsCount,
        tickets,
        selectedTicket,
        setSelectedTicket,
        createTicket,
        addTicket,
        addTicketMessage,
        updateTicketStatus,
        totalIncome,
        totalExpense,
        netBalance,
        monthlyBudgetCap,
        budgetUtilizationPercent,
        expensesByCategory,
        predictiveAlerts,
        metrics,
        budgetInsight,
        isAIAssistantOpen,
        setIsAIAssistantOpen,
        resetToInitialData,
        resetToDefaults: resetToInitialData,
        activeSupportTicketId,
        navigateToSupportWithTicket,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
