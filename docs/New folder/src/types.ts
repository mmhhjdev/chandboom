export type UserRole = 'user' | 'admin';

export type SubscriptionTier = 'free' | 'bronze' | 'pro' | 'vip';

export type SubscriptionStatus = 'active' | 'expired' | 'pending_approval' | 'none';

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'خوراک و رستوران'
  | 'خوراک و غذا'
  | 'مسکن و اجاره'
  | 'مسکن و قبوض'
  | 'حمل‌ونقل و خودرو'
  | 'حمل و نقل'
  | 'خرید و پوشاک'
  | 'سرگرمی و تفریح'
  | 'تفریح و سرگرمی'
  | 'سلامت و درمان'
  | 'قبوض و شارژ'
  | 'آموزش و کتاب'
  | 'آموزش و یادگیری'
  | 'سرمایه‌گذاری و سود'
  | 'سرمایه‌گذاری'
  | 'حقوق و دستمزد'
  | 'هدیه و پاداش'
  | 'فروش و کسب‌وکار'
  | 'سایر دریافتی‌ها'
  | 'سایر و متفرقه'
  | 'سایر';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  age?: number | null;
  gender?: 'مرد' | 'زن' | 'سایر' | null;
  avatar_url?: string | null;
  role: UserRole;
  tier: SubscriptionTier;
  is_premium?: boolean;
  subscription_status: SubscriptionStatus;
  subscription_started_at?: string | null;
  subscription_expires_at?: string | null;
  monthly_budget_cap: number;
  theme_preference: 'dark' | 'light' | 'system';
  currency: 'تومان' | 'ریال';
  ai_queries_used?: number;
  ai_queries_limit?: number | null;
  ai_requests_left?: number | null;
  ai_queries_reset_date?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  date: string;
  description: string;
  account?: string;
  tags?: string[];
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'reminder' | 'payment_alert' | 'budget_warning' | 'subscription' | 'system';
  title: string;
  message: string;
  amount?: number;
  priority: 'low' | 'normal' | 'urgent';
  status: 'pending' | 'settled' | 'dismissed';
  is_read: boolean;
  created_at: string;
}

export type TicketDepartment = 'پشتیبانی مالی' | 'پشتیبانی فنی' | 'انتقادات و پیشنهادات' | 'عمومی';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: 'user' | 'admin';
  message?: string;
  content?: string;
  attachment_url?: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  subject: string;
  category?: string;
  department?: TicketDepartment;
  priority?: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export type ActiveTab =
  | 'landing'
  | 'dashboard'
  | 'transactions'
  | 'goals'
  | 'analytics'
  | 'reminders'
  | 'dong'
  | 'subscription'
  | 'support'
  | 'settings'
  | 'ai-assistant';

export type NavTab = ActiveTab;

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  category?: string;
  status: 'in_progress' | 'achieved' | 'paused';
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface SubscriptionOrder {
  id: string;
  user_id: string;
  plan_id: string;
  amount_toman: number;
  receipt_path: string;
  note?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  reject_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_date: string;
  category: TransactionCategory;
  is_paid: boolean;
  recurrence: 'once' | 'monthly' | 'yearly';
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  nameFa: string;
  price: number;
  originalPrice?: number;
  durationMonths: number;
  billingCycle?: 'monthly' | 'yearly';
  description: string;
  features: string[];
  tier?: SubscriptionTier;
  aiAccess?: boolean;
  monthlyAiLimit?: number;
  isPopular?: boolean;
  badge?: string;
}

export interface ManualPaymentSubmission {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  plan_id: string;
  plan_name: string;
  amount: number;
  card_sender_name?: string;
  card_sender_number?: string;
  card_last4?: string;
  reference_code?: string;
  tracking_code: string;
  payment_date?: string;
  receipt_url?: string;
  receipt_image_url?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  alt_id?: string;
}

export interface ParsedAITransaction {
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  date: string;
  description: string;
  confidence: number;
  missingFields?: string[];
  clarificationPrompt?: string;
}

export interface AIBudgetAlert {
  id: string;
  category: string;
  currentSpent: number;
  budgetLimit: number;
  depletionPaceDays: number;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  parsedTransaction?: ParsedAITransaction;
  isActionable?: boolean;
}
