import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { UserProfile, Transaction, NotificationItem, Ticket, TicketMessage, ActiveTab, UserRole, SubscriptionTier, Reminder, ManualPaymentSubmission, AIBudgetAlert, TransactionCategory, FinancialGoal } from '../types';
import { INITIAL_USER, INITIAL_TRANSACTIONS, INITIAL_NOTIFICATIONS, INITIAL_TICKETS, INITIAL_REMINDERS, INITIAL_MANUAL_PAYMENTS, INITIAL_GOALS, GUEST_USER } from '../data/initialData';
import { generatePredictiveBudgetAlerts } from '../utils/aiParser';
import { isAdminEmail, isStoredAdminSessionValid, clearStoredAdminSession, getEnvAdminEmail } from '../utils/admin';
import { requestAdminOtpViaEdgeFunction, verifyAdminOtpViaEdgeFunction, isAdmin2FAVerified as checkAdmin2FASession, revokeAdmin2FA } from '../utils/admin2fa';
import { updatePageSeo } from '../utils/seo';
import { getSupabaseClient, createUserOtp, verifyUserOtp, checkEmailExists, sendLoginOtp, sendPasswordResetOtp, resetUserPassword, invokeAdminReviewOrderEdgeFunction, invokeAdminManageUserEdgeFunction } from '../lib/supabase';
import { MALE_AVATAR_SVG } from '../utils/avatars';

export interface AuthResult { success: boolean; error?: string; isDuplicate?: boolean; requiresEmailConfirmation?: boolean; }

interface AppContextType {
  activeTab: ActiveTab; setActiveTab: (tab: ActiveTab) => void; adminMode: boolean; setAdminMode: (enabled: boolean) => void; isAdmin: boolean;
  isAdmin2FAVerified: boolean; verifyAdmin2FA: (code: string) => Promise<{ success: boolean; error?: string }>; requestAdminOtp: () => Promise<{ success: boolean; message?: string; error?: string; code?: string }>; logoutAdmin2FA: () => void;
  isDarkMode: boolean; toggleDarkMode: () => void; theme: 'dark' | 'light'; toggleTheme: () => void;
  isAuthenticated: boolean; isAuthModalOpen: boolean; setIsAuthModalOpen: (open: boolean) => void;
  login: (email: string, password?: string) => Promise<AuthResult>; register: (email: string, passwordOrFullName: string, fullNameOrPassword?: string, age?: number, gender?: 'مرد' | 'زن' | 'سایر') => Promise<AuthResult>;
  loginWithEmail: (email: string, password?: string) => Promise<AuthResult>; registerWithEmail: (email: string, fullName: string, password?: string, avatarUrl?: string, age?: number, gender?: 'مرد' | 'زن' | 'سایر') => Promise<AuthResult>;
  requestSignupOtp: (email: string) => Promise<{ success: boolean; code?: string; error?: string; isDuplicate?: boolean }>; verifySignupOtpAndRegister: (email: string, code: string, password: string, fullName: string, age?: number, gender?: 'مرد' | 'زن' | 'سایر') => Promise<AuthResult>;
  requestLoginOtp: (email: string) => Promise<{ success: boolean; error?: string }>; loginWithOtp: (email: string, code: string) => Promise<AuthResult>;
  requestPasswordResetOtp: (email: string) => Promise<{ success: boolean; error?: string }>; resetPasswordWithOtp: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  checkEmailRegistered: (email: string) => Promise<boolean>; loginAsRole: (role: UserRole) => void; logout: () => Promise<void>;
  user: UserProfile; currentUser: UserProfile; updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isProUser: boolean; hasAIAccess: boolean; aiQueriesRemaining: number; upgradeUserTier: (tier: SubscriptionTier, durationMonths: number) => Promise<void>;
  goals: FinancialGoal[]; addGoal: (goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => Promise<void>; updateGoal: (id: string, updates: Partial<FinancialGoal>) => Promise<void>; deleteGoal: (id: string) => Promise<void>; contributeToGoal: (id: string, amount: number) => Promise<void>;
  isSubscriptionModalOpen: boolean; openSubscriptionModal: () => void; closeSubscriptionModal: () => void;
  isAuthGuardOpen: boolean; authGuardMessage: string; openAuthGuard: (message?: string) => void; closeAuthGuard: () => void; requestSubscription: () => void;
  allUsers: UserProfile[]; updateUserRoleAndTier: (userId: string, role: UserRole, tier: SubscriptionTier) => Promise<boolean>; updateUserSubscriptionDays: (userId: string, daysToAdd: number, reason?: string) => Promise<void>;
  sendDirectUserMessage: (targetUserId: string, targetUserName: string, targetUserEmail: string, title: string, message: string, sendAsNotification?: boolean, sendAsTicket?: boolean) => Promise<boolean>;
  manualPayments: ManualPaymentSubmission[]; submitManualPayment: (data: Omit<ManualPaymentSubmission, 'id' | 'created_at' | 'status'>) => Promise<void>; approveManualPayment: (paymentId: string, adminNotes?: string) => Promise<void>; rejectManualPayment: (paymentId: string, adminNotes?: string) => Promise<void>;
  transactions: Transaction[]; addTransaction: (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<void>; updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>; deleteTransaction: (id: string) => Promise<void>;
  reminders: Reminder[]; addReminder: (rem: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => Promise<void>; updateReminder: (id: string, rem: Partial<Reminder>) => Promise<void>; deleteReminder: (id: string) => Promise<void>; toggleReminderPaid: (id: string) => Promise<void>;
  notifications: NotificationItem[]; addNotification: (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => Promise<void>; markNotificationAsRead: (id: string) => Promise<void>; markAllNotificationsAsRead: () => Promise<void>; settleNotification: (id: string) => Promise<void>; deleteNotification: (id: string) => Promise<void>; unreadNotificationsCount: number;
  tickets: Ticket[]; selectedTicket: Ticket | null; setSelectedTicket: (ticket: Ticket | null) => void; createTicket: (ticket: { subject: string; department: Ticket['department']; priority: Ticket['priority']; initialMessage: string }) => Promise<void>; addTicket: (subject: string, department: Ticket['department'], priority: Ticket['priority'], initialMessage: string) => Promise<void>; addTicketMessage: (ticketId: string, content: string, asAdmin?: boolean) => Promise<void>; updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;
  totalIncome: number; totalExpense: number; netBalance: number; monthlyBudgetCap: number; budgetUtilizationPercent: number; expensesByCategory: Record<TransactionCategory, number>; predictiveAlerts: AIBudgetAlert[];
  metrics: { balance: number; totalIncome: number; totalExpense: number; categoryBreakdown: Record<string, number>; };
  budgetInsight: { message: string; isWarning: boolean; dailyBurnRate: number; };
  isAIAssistantOpen: boolean; setIsAIAssistantOpen: (open: boolean) => void; resetToInitialData: () => void; resetToDefaults: () => void; activeSupportTicketId: string | null; navigateToSupportWithTicket: (ticketId?: string) => void;
  // ✅ تابع جدید برای ساخت گروه دنگ توسط AI
  createDongGroup: (name: string, members: string[], isFamilyMode?: boolean) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function translateSupabaseError(msg: string): string {
  if (!msg) return 'خطایی در پردازش اطلاعات رخ داد.';
  const lower = msg.toLowerCase();
  if (lower.includes('invalid path specified in request url') || lower.includes('invalid path')) return 'آدرس یا تنظیمات ارتباط با سرور دیتابیس معتبر نیست.';
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) return 'ایمیل یا رمز عبور وارد شده اشتباه است.';
  if (lower.includes('email not confirmed') || lower.includes('not verified')) return 'آدرس ایمیل شما هنوز تایید نشده است. لطفاً لینک فعال‌سازی ایمیل را بررسی نمایید.';
  if (lower.includes('user already registered') || lower.includes('already exists')) return 'حساب کاربری با این ایمیل قبلاً ثبت‌نام شده است.';
  if (lower.includes('password should be at least')) return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
  return msg;
}

const VALID_TABS: ActiveTab[] = ['landing', 'dashboard', 'transactions', 'goals', 'analytics', 'reminders', 'dong', 'subscription', 'support', 'settings', 'ai-assistant'];

function getInitialTab(): ActiveTab {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
    if (VALID_TABS.includes(hash as ActiveTab)) return hash as ActiveTab;
    const path = window.location.pathname.replace(/^\/+/g, '').replace(/\/+$/g, '').toLowerCase();
    if (VALID_TABS.includes(path as ActiveTab)) return path as ActiveTab;
  }
  try { const stored = localStorage.getItem('chandboom_active_tab'); if (stored && VALID_TABS.includes(stored as ActiveTab)) return stored as ActiveTab; } catch {}
  return 'landing';
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { const root = document.documentElement; if (isDarkMode) root.classList.add('dark'); else root.classList.remove('dark'); }, [isDarkMode]);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);
  const [adminMode, setAdminModeState] = useState<boolean>(false);
  const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);
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
  const [isAuthGuardOpen, setIsAuthGuardOpen] = useState(false);
  const [authGuardMessage, setAuthGuardMessage] = useState('برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.');
  const openAuthGuard = (message?: string) => { if (message) setAuthGuardMessage(message); setIsAuthGuardOpen(true); };
  const closeAuthGuard = () => setIsAuthGuardOpen(false);
  const requestSubscription = () => { if (!isAuthenticated) openAuthGuard('برای خرید اشتراک و استفاده از امکانات، لطفاً ابتدا ثبت‌نام کنید یا وارد حساب خود شوید.'); else setIsSubscriptionModalOpen(true); };

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab); updatePageSeo(tab);
    try { localStorage.setItem('chandboom_active_tab', tab); } catch {}
    if (typeof window !== 'undefined') { const currentHash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase(); if (currentHash !== tab) window.location.hash = `#/${tab}`; }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
      if (VALID_TABS.includes(hash as ActiveTab) && hash !== activeTab) { setActiveTabState(hash as ActiveTab); updatePageSeo(hash as ActiveTab); try { localStorage.setItem('chandboom_active_tab', hash); } catch {} }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const [admin2FAVerified, setAdmin2FAVerified] = useState<boolean>(() => checkAdmin2FASession(INITIAL_USER.email) || isStoredAdminSessionValid(INITIAL_USER.email));
  const isAdmin = useMemo(() => (isAuthenticated && (user?.role === 'admin' || isAdminEmail(user?.email))) || admin2FAVerified || isStoredAdminSessionValid(user?.email), [isAuthenticated, user?.role, user?.email, admin2FAVerified]);
  const requestAdminOtp = async () => await requestAdminOtpViaEdgeFunction(user.email || getEnvAdminEmail() || 'admin@chandboom.ir');
  const verifyAdmin2FA = async (code: string) => { const result = await verifyAdminOtpViaEdgeFunction(code, user.email || getEnvAdminEmail() || 'admin@chandboom.ir'); if (result.success) setAdmin2FAVerified(true); return result; };
  const logoutAdmin2FA = () => { revokeAdmin2FA(); clearStoredAdminSession(); setAdmin2FAVerified(false); setAdminModeState(false); };
  const setAdminMode = useCallback((enabled: boolean) => { if (enabled && !isAdmin) { alert('دسترسی به پنل مدیریت ارشد فقط برای مدیر سامانه چندبوم امکان‌پذیر است.'); setAdminModeState(false); return; } setAdminModeState(enabled); }, [isAdmin]);

  // ✅ اصلاح: شامل bronze هم می‌شود
  const isProUser = useMemo(() => {
    if (isAdmin) return true;
    if (user.tier === 'pro' || user.tier === 'vip' || user.tier === 'bronze') {
      if (user.subscription_expires_at) return new Date(user.subscription_expires_at).getTime() > Date.now();
      return user.subscription_status === 'active';
    }
    return false;
  }, [isAdmin, user.tier, user.subscription_status, user.subscription_expires_at]);

  // ✅ اصلاح: شامل bronze هم می‌شود
  const hasAIAccess = useMemo(() => {
    if (isAdmin) return true;
    if (!user.tier || user.tier === 'free' || user.subscription_status === 'none' || user.subscription_status === 'expired') return false;
    if (user.subscription_expires_at) { const isExpired = new Date(user.subscription_expires_at).getTime() <= Date.now(); if (isExpired) return false; }
    return (user.tier === 'bronze' || user.tier === 'pro' || user.tier === 'vip') && user.subscription_status === 'active';
  }, [isAdmin, user.tier, user.subscription_status, user.subscription_expires_at]);

  // مقدار سهمیه از پروفایل دیتابیس خوانده می‌شود؛ -1 یعنی نامحدود.
  const aiQueriesRemaining = useMemo(() => {
    if (!hasAIAccess) return 0;
    const limit = Number(user.ai_queries_limit ?? 0);
    if (limit === -1) return -1;
    return Math.max(0, limit - Number(user.ai_queries_used ?? 0));
  }, [user.ai_queries_limit, user.ai_queries_used, hasAIAccess]);

  const fetchUserDataFromSupabase = async (userId: string, userEmail: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    try {
      const { data: profileData } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      const isAdm = isAdminEmail(userEmail) || profileData?.role === 'admin';
      const currentRole: UserRole = isAdm ? 'admin' : (profileData?.role || 'user');
      const mergedUser: UserProfile = { ...GUEST_USER, ...(profileData || {}), id: userId, email: userEmail, role: currentRole, full_name: profileData?.full_name || userEmail.split('@')[0] };
      setUser(mergedUser);

      const { data: txData } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
      if (txData && txData.length > 0) setTransactions(txData); else setTransactions([]);

      const { data: remData } = await supabase.from('reminders').select('*').eq('user_id', userId).order('due_date', { ascending: true });
      if (remData && remData.length > 0) setReminders(remData); else setReminders([]);

      const { data: notifData } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (notifData && notifData.length > 0) setNotifications(notifData); else setNotifications([]);

      let ticketQuery = supabase.from('tickets').select('*').order('updated_at', { ascending: false });
      if (!isAdm) ticketQuery = ticketQuery.eq('user_id', userId);
      const { data: ticketData } = await ticketQuery;
      if (ticketData && ticketData.length > 0) setTickets(ticketData); else setTickets([]);

      try {
        const [payRes, ordersRes] = await Promise.allSettled([
          isAdm ? supabase.from('manual_payments').select('*').order('created_at', { ascending: false }) : supabase.from('manual_payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
          isAdm ? supabase.from('subscription_orders').select('*').order('created_at', { ascending: false }) : supabase.from('subscription_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        ]);
        const mergedMap = new Map<string, ManualPaymentSubmission>();
        if (payRes.status === 'fulfilled' && payRes.value.data) for (const item of payRes.value.data) mergedMap.set(item.id, item);
        if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
          for (const order of ordersRes.value.data) {
            const orderAmount = order.amount_toman || order.amount || 0;
            const orderTracking = order.tracking_code || order.receipt_path || '';
            const orderReceipt = order.receipt_image_url || order.receipt_path || undefined;
            let duplicateKey: string | null = null;
            for (const [key, existing] of mergedMap.entries()) {
              if (key === order.id) { duplicateKey = key; break; }
              if (orderTracking && existing.tracking_code && existing.tracking_code === orderTracking) { duplicateKey = key; break; }
              if (existing.user_id === order.user_id && existing.amount === orderAmount && Math.abs(new Date(existing.created_at).getTime() - new Date(order.created_at || 0).getTime()) < 300000) { duplicateKey = key; break; }
            }
            const mappedPlanName = order.plan_name || 'اشتراک طلایی';
            const mappedStatus = order.status === 'approved' ? 'approved' : order.status === 'rejected' ? 'rejected' : 'pending';
            if (duplicateKey) {
              const existing = mergedMap.get(duplicateKey)!;
              mergedMap.set(duplicateKey, { ...existing, plan_name: mappedPlanName, amount: orderAmount || existing.amount, status: existing.status === 'approved' || mappedStatus === 'approved' ? 'approved' : mappedStatus, receipt_url: existing.receipt_url || orderReceipt, receipt_image_url: existing.receipt_image_url || orderReceipt });
            } else {
              const mapped: ManualPaymentSubmission = { id: order.id, user_id: order.user_id, user_email: order.user_email || '', user_name: order.user_name || order.note || 'کاربر چندبوم', plan_id: order.plan_id || 'pro', plan_name: mappedPlanName, amount: orderAmount, tracking_code: orderTracking || order.id.slice(-6), card_last4: order.card_last4 || undefined, receipt_image_url: orderReceipt, receipt_url: orderReceipt, status: mappedStatus, created_at: order.created_at || new Date().toISOString(), reviewed_at: order.reviewed_at, reviewed_by: order.reviewed_by, admin_notes: order.admin_note || order.reject_reason || order.note };
              mergedMap.set(order.id, mapped);
            }
          }
        }
        const combinedList = Array.from(mergedMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setManualPayments(combinedList);
      } catch (err) { console.warn('Error fetching unified subscription payments:', err); }

      if (isAdm) { const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false }); if (usersData && usersData.length > 0) setAllUsers(usersData); }
      const { data: goalsData } = await supabase.from('financial_goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (goalsData && goalsData.length > 0) setGoals(goalsData); else setGoals([]);
    } catch (err) { console.error('Error fetching live data from Supabase:', err); }
  };

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) { console.warn('Session retrieval error:', error); return; }
        if (session?.user && isMounted) {
          setIsAuthenticated(true);
          const targetTab = (() => { try { const stored = localStorage.getItem('chandboom_active_tab'); if (stored && stored !== 'landing') return stored as ActiveTab; } catch {} return 'dashboard'; })();
          setActiveTabState(targetTab);
          const email = session.user.email || '';
          await fetchUserDataFromSupabase(session.user.id, email);
        }
      } catch (e) { console.warn('Could not restore Supabase session:', e); }
    };
    restoreSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (!isMounted) return;
      if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED')) {
        setIsAuthenticated(true);
        const targetTab = (() => { try { const stored = localStorage.getItem('chandboom_active_tab'); if (stored && stored !== 'landing') return stored as ActiveTab; } catch {} return 'dashboard'; })();
        setActiveTabState(targetTab);
        const email = session.user.email || '';
        await fetchUserDataFromSupabase(session.user.id, email);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false); setUser(GUEST_USER); setAdminModeState(false); setAdmin2FAVerified(false); setActiveTabState('landing');
        try { localStorage.removeItem('chandboom_active_tab'); } catch {}
      }
    });
    return () => { isMounted = false; authListener?.subscription?.unsubscribe(); };
  }, []);

  const updateUserProfile = async (updated: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updated }));
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated, updated_at: new Date().toISOString() } : u)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) { try { await supabase.from('users').upsert({ ...user, ...updated, id: user.id, updated_at: new Date().toISOString() }); } catch (err) { console.warn('Could not sync user profile update to Supabase:', err); } }
  };

  const upgradeUserTier = async (tier: SubscriptionTier, durationMonths: number) => {
    const durationDays = durationMonths * 30;
    const currentExpiryTime = user.subscription_expires_at ? new Date(user.subscription_expires_at).getTime() : 0;
    const baseTime = currentExpiryTime > Date.now() ? currentExpiryTime : Date.now();
    const expiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();
    await updateUserProfile({ tier, subscription_status: 'active', subscription_expires_at: expiresAt });
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) { try { await supabase.rpc('sync_user_subscription', { p_user_id: user.id, p_tier: tier, p_duration_days: durationDays }); } catch (rpcErr) { console.warn('RPC sync note:', rpcErr); } }
    await addNotification({ type: 'subscription', title: 'ارتقای حساب به اشتراک طلایی چندبوم', message: `حساب کاربری شما با موفقیت به سطح ${tier.toUpperCase()} ارتقا یافت.`, priority: 'normal', status: 'settled' });
  };

  const updateUserRoleAndTier = async (userId: string, role: UserRole, tier: SubscriptionTier): Promise<boolean> => {
    if (!isAdmin) { alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به تغییر نقش و سطح اشتراک کاربران هستند.'); return false; }
    const res = await invokeAdminManageUserEdgeFunction({ action: 'update_role_tier', userId, role, tier });
    if (!res.success) { alert(res.error || 'خطا در اعمال تغییرات سمت سرور'); return false; }
    setAllUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role, tier, ...(tier === 'free' ? { subscription_status: 'none' as const, subscription_expires_at: null } : {}), updated_at: new Date().toISOString() } : u)));
    if (user.id === userId) setUser((prev) => ({ ...prev, role, tier, ...(tier === 'free' ? { subscription_status: 'none', subscription_expires_at: null } : {}) }));
    return true;
  };

  const updateUserSubscriptionDays = async (userId: string, daysToAdd: number, reason?: string) => {
    if (!isAdmin) { alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به افزایش روزهای اشتراک هستند.'); return; }
    const res = await invokeAdminManageUserEdgeFunction({ action: 'update_subscription_days', userId, daysToAdd, reason });
    if (!res.success) { alert(res.error || 'خطا در افزایش روزهای اشتراک سمت سرور'); return; }
    const target = allUsers.find((u) => u.id === userId) || (user.id === userId ? user : null);
    if (!target) return;
    const { newTier, newExpiry, newStatus } = res.data || {};
    const fallbackExpiry = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    const finalExpiry = newExpiry || fallbackExpiry;
    const finalTier = newTier || (daysToAdd > 0 ? (target.tier === 'vip' ? 'vip' : 'pro') : target.tier);
    const finalStatus = newStatus || (finalTier !== 'free' ? 'active' : 'none');
    setAllUsers((prev) => prev.map((u) => u.id === userId ? { ...u, tier: finalTier, subscription_status: finalStatus, subscription_expires_at: finalExpiry, updated_at: new Date().toISOString() } : u));
    if (user.id === userId) setUser((prev) => ({ ...prev, tier: finalTier, subscription_status: finalStatus, subscription_expires_at: finalExpiry }));
  };

  const forwardAdminNotificationToTicket = async (targetUserId: string, targetUserName: string, targetUserEmail: string, subject: string, messageContent: string) => {
    const supabase = getSupabaseClient();
    const newMsg: TicketMessage = { id: `msg-${Date.now()}`, ticket_id: '', sender_id: user.id || 'admin', sender_name: 'پشتیبان رسمی چندبوم (مدیریت)', sender_role: 'admin', content: messageContent, created_at: new Date().toISOString() };
    const existingTicket = tickets.find((t) => (t.user_id === targetUserId || t.user_email === targetUserEmail) && t.subject.includes('اشتراک'));
    if (existingTicket) {
      newMsg.ticket_id = existingTicket.id;
      const updatedMessages = [...existingTicket.messages, newMsg];
      setTickets((prev) => prev.map((t) => t.id === existingTicket.id ? { ...t, status: 'resolved', updated_at: new Date().toISOString(), messages: updatedMessages } : t));
      if (supabase) { try { await supabase.from('tickets').update({ status: 'resolved', updated_at: new Date().toISOString(), messages: updatedMessages }).eq('id', existingTicket.id); } catch (e) { console.warn('Could not update ticket in Supabase:', e); } }
    } else {
      const ticketId = `tkt-${Date.now()}`; newMsg.ticket_id = ticketId;
      const newTicket: Ticket = { id: ticketId, user_id: targetUserId, user_name: targetUserName, user_email: targetUserEmail, subject, department: 'پشتیبانی مالی', priority: 'high', status: 'resolved', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), messages: [newMsg] };
      setTickets((prev) => [newTicket, ...prev]);
      if (supabase) { try { await supabase.from('tickets').insert([newTicket]); } catch (e) { console.warn('Could not insert ticket in Supabase:', e); } }
    }
  };

  const sendDirectUserMessage = async (targetUserId: string, targetUserName: string, targetUserEmail: string, title: string, message: string, sendAsNotification: boolean = true, sendAsTicket: boolean = true): Promise<boolean> => {
    const supabase = getSupabaseClient(); let success = false;
    if (sendAsNotification) {
      const notifItem: NotificationItem = { id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, user_id: targetUserId, type: 'system', title: title.trim(), message: message.trim(), priority: 'urgent', status: 'pending', is_read: false, created_at: new Date().toISOString() };
      if (user.id === targetUserId) setNotifications((prev) => [notifItem, ...prev]);
      if (supabase) { try { await supabase.from('notifications').insert([notifItem]); success = true; } catch (err) { console.warn('Direct notification supabase insert error:', err); } } else { success = true; }
    }
    if (sendAsTicket) { await forwardAdminNotificationToTicket(targetUserId, targetUserName, targetUserEmail, title.trim(), message.trim()); success = true; }
    return success;
  };

  const submitManualPayment = async (data: Omit<ManualPaymentSubmission, 'id' | 'created_at' | 'status'>) => {
    const newSubmission: ManualPaymentSubmission = { ...data, id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, status: 'pending', created_at: new Date().toISOString() };
    setManualPayments((prev) => [newSubmission, ...prev]);
    await updateUserProfile({ subscription_status: 'pending_approval' });
    await addTransaction({ amount: data.amount, type: 'expense', category: 'سایر و متفرقه', description: `واریز وجه اشتراک ${data.plan_name} (کد رهگیری: ${data.tracking_code})`, date: new Date().toISOString(), account: 'بانک سامان (کارت به کارت)' });
    await addNotification({ type: 'subscription', title: 'رسید پرداخت ثبت شد', message: `اطلاعات واریزی کارت به کارت برای پلن «${data.plan_name}» ثبت و برای بررسی به مدیریت ارسال گردید.`, amount: data.amount, priority: 'normal', status: 'pending' });
    const supabase = getSupabaseClient();
    if (supabase) { try { await supabase.from('manual_payments').insert([newSubmission]); if (data.user_id && data.user_id !== 'guest') { await supabase.from('subscription_orders').insert([{ user_id: data.user_id, plan_id: data.plan_id, amount_toman: data.amount, receipt_url: data.receipt_url || '', user_notes: data.notes || '', status: 'pending' }]); } } catch (err) { console.error('Supabase manual_payment insert error:', err); } }
  };

  const approveManualPayment = async (paymentId: string, adminNotes?: string) => {
    if (!isAdmin) { alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به تایید پرداخت هستند.'); return; }
    const res = await invokeAdminReviewOrderEdgeFunction({ action: 'approve', paymentId, adminNotes });
    if (!res.success) { alert(res.error || 'خطا در تایید سمت سرور'); return; }
    const { userId, tier, expiresAt } = res.data || {};
    let targetPayment: ManualPaymentSubmission | undefined;
    setManualPayments((prev) => prev.map((p) => { if (p.id === paymentId) { targetPayment = { ...p, status: 'approved', admin_notes: adminNotes || 'پرداخت تایید شد و اشتراک فعال گردید.', reviewed_at: new Date().toISOString(), reviewed_by: user.email }; return targetPayment; } return p; }));
    const targetUserId = userId || targetPayment?.user_id;
    if (targetUserId) {
      const finalTier: SubscriptionTier = (tier as SubscriptionTier) || 'pro';
      const finalExpiresAt = expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      setAllUsers((prev) => prev.map((u) => u.id === targetUserId ? { ...u, tier: finalTier, subscription_status: 'active', subscription_expires_at: finalExpiresAt } : u));
      if (user.id === targetUserId) setUser((prev) => ({ ...prev, tier: finalTier, subscription_status: 'active', subscription_expires_at: finalExpiresAt }));
    }
  };

  const rejectManualPayment = async (paymentId: string, adminNotes?: string) => {
    if (!isAdmin) { alert('دسترسی غیرمجاز: فقط مدیران ارشد مجاز به رد پرداخت هستند.'); return; }
    const res = await invokeAdminReviewOrderEdgeFunction({ action: 'reject', paymentId, adminNotes });
    if (!res.success) { alert(res.error || 'خطا در رد پرداخت سمت سرور'); return; }
    const { userId } = res.data || {};
    let targetPayment: ManualPaymentSubmission | undefined;
    setManualPayments((prev) => prev.map((p) => { if (p.id === paymentId) { targetPayment = { ...p, status: 'rejected', admin_notes: adminNotes || 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.', reviewed_at: new Date().toISOString(), reviewed_by: user.email }; return targetPayment; } return p; }));
    const targetUserId = userId || targetPayment?.user_id;
    if (targetUserId) { setAllUsers((prev) => prev.map((u) => u.id === targetUserId ? { ...u, subscription_status: 'none' } : u)); if (user.id === targetUserId) setUser((prev) => ({ ...prev, subscription_status: 'none' })); }
  };

  // ✅ ثبت تراکنش در سوپابیس با ID صحیح
  const addTransaction = async (tx: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => {
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        const { data, error } = await supabase.from('transactions').insert([{ user_id: user.id, amount: tx.amount, category: tx.category, type: tx.type, date: tx.date || new Date().toISOString(), description: tx.description, account: tx.account || 'کارت اصلی', tags: tx.tags || [] }]).select().single();
        if (error) { console.error('Supabase insert transaction error:', error); alert('خطا در ثبت تراکنش در دیتابیس: ' + error.message); return; }
        if (data) setTransactions((prev) => [data, ...prev]);
      } catch (err) { console.error('Supabase insert transaction exception:', err); alert('خطا در ارتباط با دیتابیس'); }
    } else {
      const newTx: Transaction = { ...tx, id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, user_id: user.id || 'guest', created_at: new Date().toISOString() };
      setTransactions((prev) => [newTx, ...prev]);
    }
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('transactions').update(updated).eq('id', id); } catch (err) { console.error('Supabase update transaction error:', err); } }
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('transactions').delete().eq('id', id); } catch (err) { console.error('Supabase delete transaction error:', err); } }
  };

  const addNotification = async (item: Omit<NotificationItem, 'id' | 'user_id' | 'created_at' | 'is_read'>) => {
    const newItem: NotificationItem = { ...item, id: `notif-${Date.now()}`, user_id: user.id || 'guest', is_read: false, created_at: new Date().toISOString() };
    setNotifications((prev) => [newItem, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) { try { await supabase.from('notifications').insert([newItem]); } catch (err) { console.error('Supabase notification insert error:', err); } }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('notifications').update({ is_read: true }).eq('id', id); } catch (err) { console.error('Supabase update notification error:', err); } }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) { try { await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id); } catch (err) { console.error('Supabase mark all notifications error:', err); } }
  };

  const settleNotification = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'settled', is_read: true } : n)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('notifications').update({ status: 'settled', is_read: true }).eq('id', id); } catch (err) { console.error('Supabase settle notification error:', err); } }
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('notifications').delete().eq('id', id); } catch (err) { console.error('Supabase delete notification error:', err); } }
  };

  const unreadNotificationsCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  const createTicket = async ({ subject, department, priority, initialMessage }: { subject: string; department: Ticket['department']; priority: Ticket['priority']; initialMessage: string }) => {
    const ticketId = `tkt-${Date.now()}`;
    const newMsg: TicketMessage = { id: `msg-${Date.now()}`, ticket_id: ticketId, sender_id: user.id || 'guest', sender_name: user.full_name || 'کاربر چندبوم', sender_role: 'user', content: initialMessage, created_at: new Date().toISOString() };
    const newTicket: Ticket = { id: ticketId, user_id: user.id || 'guest', user_name: user.full_name || 'کاربر چندبوم', user_email: user.email || '', subject, department, priority, status: 'open', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), messages: [newMsg] };
    setTickets((prev) => [newTicket, ...prev]); setSelectedTicket(newTicket);
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('tickets').insert([newTicket]); } catch (err) { console.error('Supabase create ticket error:', err); } }
  };

  const addTicketMessage = async (ticketId: string, content: string, asAdmin: boolean = false) => {
    const isActAsAdmin = asAdmin && isAdmin;
    const newMsg: TicketMessage = { id: `msg-${Date.now()}`, ticket_id: ticketId, sender_id: user.id || 'guest', sender_name: isActAsAdmin ? 'پشتیبان رسمی چندبوم' : user.full_name || 'کاربر چندبوم', sender_role: isActAsAdmin ? 'admin' : 'user', content, created_at: new Date().toISOString() };
    let updatedList: Ticket[] = [];
    setTickets((prev) => { updatedList = prev.map((t) => { if (t.id === ticketId) { return { ...t, status: isActAsAdmin ? 'resolved' : 'in_progress', updated_at: new Date().toISOString(), messages: [...t.messages, newMsg] }; } return t; }); return updatedList; });
    const target = updatedList.find((t) => t.id === ticketId);
    if (target) { setSelectedTicket(target); const supabase = getSupabaseClient(); if (supabase && isAuthenticated) { try { await supabase.from('tickets').update({ status: target.status, updated_at: target.updated_at, messages: target.messages }).eq('id', ticketId); } catch (err) { console.error('Supabase update ticket message error:', err); } } }
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status']) => {
    if (!isAdmin) return;
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status, updated_at: new Date().toISOString() } : t)));
    const supabase = getSupabaseClient();
    if (supabase) { try { await supabase.from('tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', ticketId); } catch (err) { console.error('Supabase update ticket status error:', err); } }
  };

  const navigateToSupportWithTicket = (ticketId?: string) => {
    setActiveTab('support');
    if (ticketId) { const found = tickets.find((t) => t.id === ticketId); if (found) { setSelectedTicket(found); setActiveSupportTicketId(ticketId); } }
  };

  const loginWithEmail = async (email: string, password?: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase(); const supabase = getSupabaseClient();
    if (!cleanEmail || !password) return { success: false, error: 'لطفاً ایمیل و رمز عبور را وارد نمایید.' };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: password });
      if (error) return { success: false, error: translateSupabaseError(error.message) };
      if (data?.user) { setIsAuthenticated(true); await fetchUserDataFromSupabase(data.user.id, cleanEmail); return { success: true }; }
      return { success: false, error: 'اطلاعات ورود تایید نشد.' };
    } catch (err: any) { return { success: false, error: translateSupabaseError(err?.message) }; }
  };

  const registerWithEmail = async (email: string, fullName: string, password?: string, avatarUrl?: string, age?: number, gender?: 'مرد' | 'زن' | 'سایر'): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase(); const supabase = getSupabaseClient();
    if (!cleanEmail || !password || !fullName.trim()) return { success: false, error: 'لطفاً تمام فیلدهای الزامی را تکمیل نمایید.' };
    try {
      const isAdm = isAdminEmail(cleanEmail);
      const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password: password, options: { data: { full_name: fullName.trim(), age: age || null, gender: gender || null, avatar_url: avatarUrl || MALE_AVATAR_SVG } } });
      if (error) return { success: false, error: translateSupabaseError(error.message) };
      if (data?.user) {
        try { await supabase.from('users').upsert({ id: data.user.id, email: cleanEmail, full_name: fullName.trim(), age: age || null, gender: gender || null, avatar_url: avatarUrl || MALE_AVATAR_SVG, role: isAdm ? 'admin' : 'user', tier: 'free', subscription_status: 'none', monthly_budget_cap: 20000000, theme_preference: isDarkMode ? 'dark' : 'light', currency: 'تومان' }); } catch (dbErr) { console.warn('Could not insert profile row immediately into users table:', dbErr); }
        if (!data.session) return { success: true, requiresEmailConfirmation: true };
        setIsAuthenticated(true); await fetchUserDataFromSupabase(data.user.id, cleanEmail);
        return { success: true, requiresEmailConfirmation: false };
      }
      return { success: false, error: 'ثبت‌نام ناموفق بود.' };
    } catch (err: any) { return { success: false, error: translateSupabaseError(err?.message) }; }
  };

  const login = async (email: string, password?: string) => loginWithEmail(email, password);
  const register = async (email: string, arg2: string, arg3?: string, age?: number, gender?: 'مرد' | 'زن' | 'سایر') => {
    let password = arg2; let fullName = arg3 || '';
    if (arg2.includes(' ') || (arg3 && arg3.length < arg2.length && !arg2.includes('@'))) { fullName = arg2; password = arg3 || ''; } else if (!fullName) { fullName = email.split('@')[0]; }
    return registerWithEmail(email, fullName, password, undefined, age, gender);
  };

  const checkEmailRegistered = async (email: string): Promise<boolean> => await checkEmailExists(email);
  const requestSignupOtp = async (email: string) => { const cleanEmail = email.trim().toLowerCase(); const isRegistered = await checkEmailExists(cleanEmail); if (isRegistered) return { success: false, error: 'این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید.', isDuplicate: true }; return await createUserOtp(cleanEmail); };
  const requestLoginOtp = async (email: string) => await sendLoginOtp(email.trim().toLowerCase());
  const loginWithOtp = async (email: string, code: string): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase(); const cleanCode = code.trim();
    const verifyRes = await verifyUserOtp(cleanEmail, cleanCode, 'email');
    if (!verifyRes.success) return { success: false, error: verifyRes.error || 'کد تایید اشتباه یا منقضی شده است.' };
    const supabase = getSupabaseClient();
    const sessionUser = verifyRes.user || (await supabase?.auth.getUser())?.data?.user;
    if (supabase && sessionUser) { setIsAuthenticated(true); await fetchUserDataFromSupabase(sessionUser.id, cleanEmail); return { success: true }; }
    setIsAuthenticated(true); return { success: true };
  };

  const requestPasswordResetOtp = async (email: string) => await sendPasswordResetOtp(email.trim().toLowerCase());
  const resetPasswordWithOtp = async (email: string, code: string, newPassword: string) => await resetUserPassword(email.trim().toLowerCase(), code.trim(), newPassword);

  const verifySignupOtpAndRegister = async (email: string, code: string, password: string, fullName: string, age?: number, gender?: 'مرد' | 'زن' | 'سایر'): Promise<AuthResult> => {
    const cleanEmail = email.trim().toLowerCase(); const cleanCode = code.trim();
    const verifyRes = await verifyUserOtp(cleanEmail, cleanCode, 'signup');
    if (!verifyRes.success) return { success: false, error: verifyRes.error || 'کد تایید اشتباه است.' };
    const supabase = getSupabaseClient();
    const sessionUser = verifyRes.user || (await supabase?.auth.getUser())?.data?.user;
    if (supabase && password) { try { await supabase.auth.updateUser({ password, data: { full_name: fullName.trim(), age: age || null, gender: gender || null } }); } catch (pwdErr) { console.warn('Password update note:', pwdErr); } }
    if (supabase && sessionUser) {
      try {
        const isAdm = isAdminEmail(cleanEmail);
        await supabase.from('users').upsert({ id: sessionUser.id, email: cleanEmail, full_name: fullName.trim(), age: age || null, gender: gender || null, role: isAdm ? 'admin' : 'user', tier: 'free', subscription_status: 'none', monthly_budget_cap: 20000000, theme_preference: isDarkMode ? 'dark' : 'light', currency: 'تومان' });
        await fetchUserDataFromSupabase(sessionUser.id, cleanEmail);
      } catch (dbErr) { console.warn('User table upsert note:', dbErr); }
    }
    setIsAuthenticated(true); return { success: true };
  };

  // ✅ اهداف مالی
  const addGoal = async (goalData: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at'>) => {
    const newGoal: FinancialGoal = { ...goalData, id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, user_id: user.id || 'guest', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    setGoals((prev) => [newGoal, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id && user.id !== 'guest') {
      try {
        const { data, error } = await supabase.from('financial_goals').insert([{ id: newGoal.id, user_id: user.id, title: newGoal.title, target_amount: newGoal.target_amount, current_amount: newGoal.current_amount, deadline: newGoal.deadline, category: newGoal.category, status: newGoal.status, notes: newGoal.notes }]).select().single();
        if (!error && data) setGoals((prev) => [data, ...prev.filter((g) => g.id !== newGoal.id)]);
      } catch (err) { console.warn('Supabase add goal note:', err); }
    }
  };

  const updateGoal = async (id: string, updates: Partial<FinancialGoal>) => {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('financial_goals').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id); } catch (err) { console.warn('Supabase update goal note:', err); } }
  };

  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('financial_goals').delete().eq('id', id); } catch (err) { console.warn('Supabase delete goal note:', err); } }
  };

  const contributeToGoal = async (id: string, amount: number) => {
    const target = goals.find((g) => g.id === id);
    if (!target) return;
    const newCurrent = target.current_amount + amount;
    const newStatus = newCurrent >= target.target_amount ? 'achieved' : target.status;
    await updateGoal(id, { current_amount: newCurrent, status: newStatus });
    await addTransaction({ amount, type: 'expense', category: 'سایر و متفرقه', description: `واریز پس‌انداز به هدف مالی «${target.title}»`, date: new Date().toISOString(), account: 'صندوق اهداف مالی' });
    await addNotification({ type: 'system', title: 'واریز به هدف مالی ثبت شد', message: `مبلغ ${amount.toLocaleString('fa-IR')} تومان به هدف «${target.title}» افزوده شد.`, amount, priority: 'normal', status: 'pending' });
  };

  // ✅ ساخت گروه دنگ
  const createDongGroup = async (name: string, members: string[], isFamilyMode: boolean = false): Promise<{ success: boolean; error?: string }> => {
    if (!isAuthenticated || !user.id) return { success: false, error: 'لطفاً وارد حساب خود شوید.' };
    const supabase = getSupabaseClient();
    if (!supabase) return { success: false, error: 'اتصال به دیتابیس برقرار نیست.' };
    try {
      const { data, error } = await supabase.from('dong_groups').insert([{
        user_id: user.id, name: name.trim(), members: members.map(m => m.trim()).filter(m => m),
        is_family_mode: isFamilyMode, families: [], created_at: new Date().toISOString(),
      }]).select().single();
      if (error) { console.error('Supabase create dong group error:', error); return { success: false, error: error.message }; }
      await addNotification({ type: 'system', title: 'گروه دنگ جدید ساخته شد', message: `گروه دنگ «${name}» با ${members.length} عضو با موفقیت ایجاد شد.`, priority: 'normal', status: 'pending' });
      return { success: true };
    } catch (err: any) { return { success: false, error: err.message }; }
  };

  const loginAsRole = (role: UserRole) => { setUser((prev) => ({ ...prev, role, tier: role === 'admin' ? 'vip' : 'pro' })); setIsAuthenticated(true); setIsAuthModalOpen(false); };

  const logout = async () => {
    const supabase = getSupabaseClient();
    if (supabase) { try { await supabase.auth.signOut(); } catch (e) { console.warn('Sign out error:', e); } }
    setIsAuthenticated(false); setUser(GUEST_USER); setAdminModeState(false); setAdmin2FAVerified(false); setActiveTab('landing');
  };

  const addReminder = async (rem: Omit<Reminder, 'id' | 'user_id' | 'created_at'>) => {
    const newRem: Reminder = { ...rem, id: `rem-${Date.now()}`, user_id: user.id || 'guest', created_at: new Date().toISOString() };
    setReminders((prev) => [newRem, ...prev]);
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated && user.id) {
      try {
        const { data, error } = await supabase.from('reminders').insert([{ user_id: user.id, title: rem.title, amount: rem.amount, due_date: rem.due_date, category: rem.category, is_paid: rem.is_paid || false, recurrence: rem.recurrence || 'once' }]).select().single();
        if (!error && data) setReminders((prev) => [data, ...prev.filter((r) => r.id !== newRem.id)]);
      } catch (err) { console.error('Supabase insert reminder error:', err); }
    }
  };

  const updateReminder = async (id: string, updated: Partial<Reminder>) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('reminders').update(updated).eq('id', id); } catch (err) { console.error('Supabase update reminder error:', err); } }
  };

  const deleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('reminders').delete().eq('id', id); } catch (err) { console.error('Supabase delete reminder error:', err); } }
  };

  const toggleReminderPaid = async (id: string) => {
    const current = reminders.find((r) => r.id === id);
    const newPaidStatus = current ? !current.is_paid : true;
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_paid: newPaidStatus } : r)));
    const supabase = getSupabaseClient();
    if (supabase && isAuthenticated) { try { await supabase.from('reminders').update({ is_paid: newPaidStatus }).eq('id', id); } catch (err) { console.error('Supabase toggle reminder error:', err); } }
  };

  const addTicket = async (subject: string, department: Ticket['department'], priority: Ticket['priority'], initialMessage: string) => { await createTicket({ subject, department, priority, initialMessage }); };

  const totalIncome = useMemo(() => transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const netBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);
  const monthlyBudgetCap = user.monthly_budget_cap || 20000000;
  const budgetUtilizationPercent = useMemo(() => { if (!monthlyBudgetCap || monthlyBudgetCap <= 0) return 0; return Math.min(Math.round((totalExpense / monthlyBudgetCap) * 100), 100); }, [totalExpense, monthlyBudgetCap]);
  const expensesByCategory = useMemo(() => { const result = {} as Record<TransactionCategory, number>; transactions.filter((t) => t.type === 'expense').forEach((t) => { result[t.category] = (result[t.category] || 0) + t.amount; }); return result; }, [transactions]);
  const predictiveAlerts = useMemo(() => generatePredictiveBudgetAlerts(transactions, monthlyBudgetCap), [transactions, monthlyBudgetCap]);
  const metrics = useMemo(() => ({ balance: netBalance, totalIncome, totalExpense, categoryBreakdown: expensesByCategory }), [netBalance, totalIncome, totalExpense, expensesByCategory]);
  const budgetInsight = useMemo(() => {
    const now = new Date(); const currentDay = Math.max(1, now.getDate()); const dailyBurnRate = Math.round(totalExpense / currentDay);
    const topAlert = predictiveAlerts[0];
    if (topAlert) return { message: topAlert.message, isWarning: topAlert.severity === 'warning' || topAlert.severity === 'critical', dailyBurnRate };
    return { message: 'مخارج ماهانه شما در سطح متعادل و تحت کنترل است.', isWarning: false, dailyBurnRate };
  }, [predictiveAlerts, totalExpense]);

  const resetToInitialData = () => { setUser(GUEST_USER); setTransactions([]); setReminders([]); setNotifications([]); setTickets([]); setManualPayments([]); setGoals([]); setSelectedTicket(null); };

  return (
    <AppContext.Provider value={{
      activeTab, setActiveTab, adminMode, setAdminMode, isAdmin,
      isAdmin2FAVerified: admin2FAVerified, verifyAdmin2FA, requestAdminOtp, logoutAdmin2FA,
      isDarkMode, toggleDarkMode, theme: isDarkMode ? 'dark' : 'light', toggleTheme: toggleDarkMode,
      isAuthenticated, isAuthModalOpen, setIsAuthModalOpen,
      loginWithEmail, registerWithEmail, login, register,
      requestSignupOtp, verifySignupOtpAndRegister, requestLoginOtp, loginWithOtp,
      requestPasswordResetOtp, resetPasswordWithOtp, checkEmailRegistered,
      loginAsRole, logout,
      user, currentUser: user, updateUserProfile,
      isProUser, hasAIAccess, aiQueriesRemaining, upgradeUserTier,
      goals, addGoal, updateGoal, deleteGoal, contributeToGoal,
      isSubscriptionModalOpen, openSubscriptionModal, closeSubscriptionModal,
      isAuthGuardOpen, authGuardMessage, openAuthGuard, closeAuthGuard, requestSubscription,
      allUsers, updateUserRoleAndTier, updateUserSubscriptionDays, sendDirectUserMessage,
      manualPayments, submitManualPayment, approveManualPayment, rejectManualPayment,
      transactions, addTransaction, updateTransaction, deleteTransaction,
      reminders, addReminder, updateReminder, deleteReminder, toggleReminderPaid,
      notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead, settleNotification, deleteNotification,
      unreadNotificationsCount,
      tickets, selectedTicket, setSelectedTicket, createTicket, addTicket, addTicketMessage, updateTicketStatus,
      totalIncome, totalExpense, netBalance, monthlyBudgetCap, budgetUtilizationPercent, expensesByCategory, predictiveAlerts,
      metrics, budgetInsight,
      isAIAssistantOpen, setIsAIAssistantOpen,
      resetToInitialData, resetToDefaults: resetToInitialData,
      activeSupportTicketId, navigateToSupportWithTicket,
      // ✅ تابع جدید
      createDongGroup,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};