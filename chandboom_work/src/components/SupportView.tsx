import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquarePlus,
  Send,
  User,
  Shield,
  Search,
  LogIn,
  Lock,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TicketPriority, TicketStatus } from '../types';
import { formatShamsiDate, toPersianDigits } from '../utils/formatters';
import { getSupabaseClient } from '../lib/supabase';

interface SupportViewProps {
  onOpenTicketModal: () => void;
}

export const SupportView: React.FC<SupportViewProps> = ({ onOpenTicketModal }) => {
  const {
    tickets,
    selectedTicket,
    setSelectedTicket,
    addTicketMessage,
    updateTicketStatus,
    adminMode,
    setAdminMode,
    isAdmin,
    isAuthenticated,
    setIsAuthModalOpen,
    currentUser,
    user,
  } = useApp();

  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TicketStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Attachment state for replies
  const [isSendingReply, setIsSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat when active ticket messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.messages]);

  // Real-time channel for the currently active ticket
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !selectedTicket?.id) return;

    const channel = supabase
      .channel(`ticket-chat-${selectedTicket.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `id=eq.${selectedTicket.id}`,
        },
        (payload) => {
          if (payload.new) {
            const updated = payload.new as any;
            setSelectedTicket(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket?.id, setSelectedTicket]);

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    // If not admin mode, only show tickets for current user
    if (!adminMode && currentUser && t.user_id !== currentUser.id && t.user_email !== currentUser.email) {
      return false;
    }

    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (categoryFilter !== 'all') {
      const matchCat = (t.category || '').toLowerCase() === categoryFilter.toLowerCase() ||
        (t.department || '').toLowerCase().includes(categoryFilter.toLowerCase());
      if (!matchCat) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (t.subject || '').toLowerCase().includes(q) ||
        (t.department || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.user_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeTicket = selectedTicket || (filteredTickets.length > 0 ? filteredTickets[0] : null);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!replyText.trim() || !activeTicket) return;

    setIsSendingReply(true);

    try {
      await addTicketMessage(activeTicket.id, replyText.trim(), adminMode);
      setReplyText('');
    } catch (err: any) {
      alert(err?.message || 'ذخیره پاسخ در پایگاه داده انجام نشد.');
    } finally {
      setIsSendingReply(false);
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return {
          label: 'در انتظار پاسخ',
          color: 'bg-amber-50 text-amber-800 dark:bg-[#1E190D] dark:text-amber-300 border-amber-300 dark:border-amber-900',
        };
      case 'in_progress':
        return {
          label: 'در حال بررسی فنی',
          color: 'bg-sky-50 text-sky-800 dark:bg-[#0D1822] dark:text-sky-300 border-sky-300 dark:border-sky-900',
        };
      case 'resolved':
        return {
          label: 'پاسخ داده شده',
          color: 'bg-emerald-50 text-emerald-800 dark:bg-[#121F19] dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        };
      case 'closed':
        return {
          label: 'بسته شده',
          color: 'bg-zinc-100 text-zinc-600 dark:bg-[#121714] dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
        };
    }
  };

  const getCategoryBadge = (category?: string, department?: string) => {
    const raw = (category || department || '').toLowerCase();
    if (raw.includes('finan') || raw.includes('مالی')) {
      return { label: 'مالی', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30' };
    }
    if (raw.includes('tech') || raw.includes('فنی')) {
      return { label: 'فنی', color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30' };
    }
    if (raw.includes('feed') || raw.includes('انتقاد') || raw.includes('پیشنهاد')) {
      return { label: 'پیشنهاد', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30' };
    }
    return { label: 'عمومی', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 font-cairo" dir="rtl">
      {/* Top Header with Admin Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-cairo text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              مرکز پشتیبانی و تیکت‌های <span className="font-brand text-emerald-700 dark:text-emerald-400">چندبوم</span>
            </h2>
            {isAdmin && adminMode && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-cairo font-bold bg-emerald-700 text-white flex items-center gap-1 shadow-xs">
                <Shield className="w-3 h-3" />
                پنل مدیریت پشتیبانی
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            ارتباط مستقیم و دوطرفه ۲۴ ساعته با تیم فنی و پشتیبانی مالی چندبوم
          </p>
        </div>

        <div className="flex items-center gap-2.5 font-cairo">
          {isAdmin && (
            <button
              id="toggle-admin-support-mode-btn"
              onClick={() => setAdminMode(!adminMode)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                adminMode
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-[#15231C] dark:text-emerald-300 dark:border-emerald-800 shadow-xs'
                  : 'bg-white dark:bg-[#0F1512] text-zinc-700 dark:text-zinc-300 border-[#E2E8E4] dark:border-[#1A2621] hover:bg-emerald-50/50 dark:hover:bg-[#16201B]'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>{adminMode ? 'خروج از پنل پشتیبان' : 'ورود به پنل پشتیبان (Admin)'}</span>
            </button>
          )}

          <button
            id="open-new-ticket-btn"
            onClick={() => {
              if (!isAuthenticated) {
                setIsAuthModalOpen(true);
              } else {
                onOpenTicketModal();
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>ثبت تیکت جدید</span>
          </button>
        </div>
      </div>

      {/* Unauthenticated Banner */}
      {!isAuthenticated && (
        <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-[#13221B] border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-emerald-950 dark:text-emerald-200">
            <div className="p-2 rounded-xl bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-cairo font-bold text-sm text-zinc-900 dark:text-zinc-100">
                ورود به حساب کاربری الزامی است
              </p>
              <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                جهت دسترسی به مرکز پشتیبانی، ارسال پیام و پیگیری وضعیت تیکت‌های خود، لطفاً با ایمیل خود وارد شوید.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-cairo font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-xs transition"
          >
            <LogIn className="w-4 h-4" />
            <span>ورود / ثبت‌نام با ایمیل</span>
          </button>
        </div>
      )}

      {/* Admin Mode Notice Banner */}
      {isAdmin && adminMode && (
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#14221C] border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-200">
            <Shield className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>شما در پنل ادمین هستید:</strong> دسترسی به تیکت‌های تمامی کاربران باز است. می‌توانید وضعیت‌ها را به‌روزرسانی کرده و پاسخ رسمی ارسال فرمایید.
            </span>
          </div>
          <button
            onClick={() => setAdminMode(false)}
            className="px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 font-cairo font-bold shrink-0 cursor-pointer text-xs"
          >
            بازگشت به حالت کاربری
          </button>
        </div>
      )}

      {/* Main 2 Column Support Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#E2E8E4] dark:border-[#1A2621] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-cairo text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span>لیست تیکت‌ها</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-mono">
                  {toPersianDigits(filteredTickets.length)}
                </span>
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس موضوع، شناسه یا کاربر..."
                className="w-full pr-9 pl-3 py-2 bg-zinc-50 dark:bg-[#141E1A] border border-[#E2E8E4] dark:border-[#1F2E27] rounded-xl text-xs text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-600 font-cairo"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[11px] font-cairo">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50'
                }`}
              >
                همه وضعیت‌ها
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'open'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50'
                }`}
              >
                در انتظار
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  statusFilter === 'resolved'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-zinc-100 dark:bg-[#141F1A] text-zinc-600 dark:text-zinc-400 hover:bg-emerald-50'
                }`}
              >
                پاسخ داده شده
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#1A2621]/60 p-2 space-y-1 max-h-[500px]">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-3">
                <p>هیچ تیکتی با شرایط انتخابی یافت نشد.</p>
                {isAuthenticated && (
                  <button
                    onClick={onOpenTicketModal}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-[#162D22] text-emerald-900 dark:text-emerald-300 font-cairo font-bold text-xs cursor-pointer"
                  >
                    ثبت اولین تیکت پشتیبانی
                  </button>
                )}
              </div>
            ) : (
              filteredTickets.map((ticket) => {
                const isSelected = activeTicket?.id === ticket.id;
                const statusBadge = getStatusBadge(ticket.status);
                const categoryBadge = getCategoryBadge(ticket.category, ticket.department);
                const safeMessages = Array.isArray(ticket.messages) ? ticket.messages : [];
                const lastMsg = safeMessages.length ? safeMessages[safeMessages.length - 1] : null;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-3.5 rounded-2xl cursor-pointer transition text-right ${
                      isSelected
                        ? 'bg-emerald-50/90 dark:bg-[#14231C] border border-emerald-300 dark:border-emerald-800 shadow-xs'
                        : 'hover:bg-zinc-50 dark:hover:bg-[#121B17] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1 font-cairo">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${categoryBadge.color}`}>
                          {categoryBadge.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {formatShamsiDate(ticket.updated_at)}
                      </span>
                    </div>

                    <h4 className="font-cairo font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate mt-1">
                      {ticket.subject}
                    </h4>

                    {lastMsg && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1 leading-relaxed">
                        {lastMsg.sender_role === 'admin' ? 'پشتیبان: ' : 'شما: '}
                        {lastMsg.message || lastMsg.content}
                      </p>
                    )}

                    {adminMode && (
                      <div className="mt-2 text-[10px] text-zinc-400 flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <span>ارسال‌کننده: {ticket.user_name || ticket.user_email}</span>
                        <span className="font-mono text-[9px] text-zinc-500">{ticket.id.slice(-6)}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Ticket Conversation (Chat Interface) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0F1512] rounded-3xl border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs flex flex-col overflow-hidden">
          {activeTicket ? (
            <>
              {/* Ticket Details Header */}
              <div className="p-4 border-b border-[#E2E8E4] dark:border-[#1A2621] bg-zinc-50/60 dark:bg-[#121A16] space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-cairo font-bold border ${getStatusBadge(activeTicket.status).color}`}>
                      {getStatusBadge(activeTicket.status).label}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      کد تیکت: {activeTicket.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && adminMode && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-zinc-400">تغییر وضعیت:</span>
                        <select
                          value={activeTicket.status}
                          onChange={(e) => updateTicketStatus(activeTicket.id, e.target.value as TicketStatus)}
                          className="px-2.5 py-1 bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl text-xs font-cairo font-bold text-emerald-800 dark:text-emerald-300 outline-none"
                        >
                          <option value="open">در انتظار پاسخ</option>
                          <option value="in_progress">در حال بررسی فنی</option>
                          <option value="resolved">پاسخ داده شده</option>
                          <option value="closed">بستن تیکت</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-cairo text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {activeTicket.subject}
                </h3>

                <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                  <span>کاربر: {activeTicket.user_name || activeTicket.user_email}</span>
                  <span>•</span>
                  <span>دپارتمان: {activeTicket.department || 'پشتیبانی'}</span>
                  <span>•</span>
                  <span>تاریخ ایجاد: {formatShamsiDate(activeTicket.created_at)}</span>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px]">
                {activeTicket.messages.map((msg) => {
                  const isMsgAdmin = msg.sender_role === 'admin';
                  const msgText = msg.message || msg.content || '';

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 text-xs leading-relaxed ${
                        isMsgAdmin ? 'flex-row' : 'flex-row-reverse'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isMsgAdmin
                            ? 'bg-zinc-800 text-emerald-400 shadow-xs'
                            : 'bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        {isMsgAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div
                        className={`max-w-[85%] p-3.5 rounded-2xl ${
                          isMsgAdmin
                            ? 'bg-zinc-100 dark:bg-[#16221D] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-[#1F2E27] rounded-tr-xs'
                            : 'bg-emerald-50 dark:bg-[#14231C] text-zinc-900 dark:text-zinc-100 border border-emerald-200 dark:border-emerald-900/60 rounded-tl-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-black/5 dark:border-white/5 font-cairo">
                          <span className="font-bold text-[11px] text-zinc-700 dark:text-zinc-300">
                            {msg.sender_name || (isMsgAdmin ? 'پشتیبان رسمی چندبوم' : 'کاربر')}
                            {isMsgAdmin && (
                              <span className="mr-1 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                                (پاسخ رسمی پشتیبانی)
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-cairo">
                            {formatShamsiDate(msg.created_at)}
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap font-cairo leading-relaxed">{msgText}</p>

                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input Box */}
              <div className="border-t border-[#E2E8E4] dark:border-[#1A2621] bg-zinc-50/50 dark:bg-[#121A16] p-3 space-y-2">
                <form onSubmit={handleSendReply} className="flex items-center gap-2">
                  <input
                    id="ticket-reply-input"
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      isAdmin && adminMode
                        ? 'ارسال پاسخ رسمی به عنوان کارشناس چندبوم...'
                        : 'پاسخ یا توضیحات تکمیلی خود را بنویسید...'
                    }
                    className="flex-1 px-4 py-2.5 bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-600 outline-none font-cairo"
                  />

                  <button
                    id="send-ticket-reply-btn"
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="p-2.5 rounded-xl font-cairo font-bold text-white transition flex items-center justify-center cursor-pointer bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50 shrink-0"
                  >
                    {isSendingReply ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 rotate-180" />
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-400 text-xs space-y-2">
              <MessageSquarePlus className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-1" />
              <p className="font-bold text-sm text-zinc-600 dark:text-zinc-400">تیکتی انتخاب نشده است</p>
              <p className="max-w-xs text-zinc-400">یک تیکت را از لیست سمت راست انتخاب کنید یا تیکت جدیدی ایجاد فرمایید.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
