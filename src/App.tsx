import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { AnalyticsView } from './components/AnalyticsView';
import { DongView } from './components/DongView';
import { GoalsView } from './components/GoalsView';
import { RemindersView } from './components/RemindersView';
import { SubscriptionView } from './components/SubscriptionView';
import { SupportView } from './components/SupportView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { TicketModal } from './components/TicketModal';
import { AuthModal } from './components/AuthModal';
import { AvatarModal } from './components/AvatarModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { FloatingAIAssistant } from './components/FloatingAIAssistant';
import { LandingPage } from './components/LandingPage';
import { AuthGuardModal } from './components/AuthGuardModal';
import { BankSmsModal } from './components/BankSmsModal';
import { DailyQuestsModal } from './components/DailyQuestsModal';
import { Routes, Route, Link } from 'react-router-dom';
import { Transaction } from './types';
import { FAQPage } from './pages/FAQPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FeaturesPage } from './pages/FeaturesPage';
import { PricingPage } from './pages/PricingPage';
import { AIAssistant } from './components/AIAssistant';
import { ShieldCheck, Heart, Sparkles, ShieldAlert } from 'lucide-react';
import { initSecurityProtection } from './utils/devtoolsProtection';
import { EnvNoticeBanner } from './components/EnvNoticeBanner';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setIsAuthModalOpen,
    isSubscriptionModalOpen,
    closeSubscriptionModal,
    isAuthGuardOpen,
    authGuardMessage,
    closeAuthGuard,
    addTicket,
    addTransaction,
  } = useApp();

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isBankSmsModalOpen, setIsBankSmsModalOpen] = useState(false);
  const [isDailyQuestsModalOpen, setIsDailyQuestsModalOpen] = useState(false);
  const [showSecurityNotice, setShowSecurityNotice] = useState(false);

  useEffect(() => {
    const cleanup = initSecurityProtection(() => {
      setShowSecurityNotice(true);
      setTimeout(() => setShowSecurityNotice(false), 3000);
    });
    return cleanup;
  }, []);

  const handleOpenTransactionModal = (tx?: Transaction) => {
    setEditingTx(tx || null);
    setIsTxModalOpen(true);
  };

  const handleTicketSubmit = (data: {
    subject: string;
    department: any;
    priority: any;
    initialMessage: string;
  }) => {
    addTicket(data.subject, data.department, data.priority, data.initialMessage);
  };

  if (activeTab === 'landing') {
    return (
      <>
        {/* Security Shield Toast for Inspector/DevTools Attempts */}
        {showSecurityNotice && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs font-cairo font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>کدهای منبع سامانه جهت حفظ امنیت حساب‌های مالی رمزنگاری و حفاظت شده‌اند.</span>
          </div>
        )}

        {/* Environment configuration banner if variables missing */}
        <EnvNoticeBanner />

        <LandingPage
          onEnterApp={() => setActiveTab('dashboard')}
          onOpenAuth={() => {
            setIsAuthModalOpen(true);
            setActiveTab('dashboard');
          }}
          onOpenSubscription={() => setActiveTab('subscription')}
        />

        <AuthModal />
        <AuthGuardModal
          isOpen={isAuthGuardOpen}
          onClose={closeAuthGuard}
          message={authGuardMessage}
        />
        <SubscriptionModal
          isOpen={isSubscriptionModalOpen}
          onClose={closeSubscriptionModal}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] dark:bg-[#070B09] text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200 font-cairo" dir="rtl">
      {/* Security Shield Toast for Inspector/DevTools Attempts */}
      {showSecurityNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-rose-950/90 border border-rose-500/70 text-rose-200 text-xs font-cairo font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>کدهای منبع سامانه جهت حفظ امنیت حساب‌های مالی رمزنگاری و حفاظت شده‌اند.</span>
        </div>
      )}

      {/* Environment configuration banner if variables missing */}
      <EnvNoticeBanner />

      {/* Top Header */}
      <Header
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAvatarModal={() => setIsAvatarModalOpen(true)}
      />

      {/* Navigation Bar (Desktop and Mobile) */}
      <Navigation />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenTransactionModal={() => handleOpenTransactionModal()}
            onOpenBankSmsModal={() => setIsBankSmsModalOpen(true)}
            onOpenDailyQuestsModal={() => setIsDailyQuestsModalOpen(true)}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsView
            onOpenTransactionModal={handleOpenTransactionModal}
            onOpenBankSmsModal={() => setIsBankSmsModalOpen(true)}
          />
        )}
        {activeTab === 'goals' && <GoalsView />}
        {activeTab === 'analytics' && <AnalyticsView />}
        {activeTab === 'dong' && <DongView />}
        {activeTab === 'reminders' && <RemindersView />}
        {activeTab === 'subscription' && <SubscriptionView />}
        {activeTab === 'support' && (
          <SupportView onOpenTicketModal={() => setIsTicketModalOpen(true)} />
        )}
        {activeTab === 'ai-assistant' && <AIAssistant />}
        {activeTab === 'settings' && (
          <SettingsView onOpenAvatarModal={() => setIsAvatarModalOpen(true)} />
        )}
      </main>

      {/* Application Footer with SEO Landing Page Links */}
      <footer className="border-t border-[#E2E8E4] dark:border-[#1A2621] py-8 mb-18 md:mb-0 text-xs text-zinc-500 dark:text-zinc-400 bg-white/70 dark:bg-[#0A100D]/70 font-cairo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 pb-2 border-b border-[#E2E8E4] dark:border-[#1A2621]">
            <Link to="/features" className="hover:text-emerald-500 transition">امکانات و قابلیت‌ها</Link>
            <Link to="/pricing" className="hover:text-emerald-500 transition">تعرفه‌ها و اشتراک طلایی</Link>
            <Link to="/faq" className="hover:text-emerald-500 transition">سوالات متداول (FAQ)</Link>
            <Link to="/about" className="hover:text-emerald-500 transition">درباره ما</Link>
            <Link to="/contact" className="hover:text-emerald-500 transition">تماس با پشتیبانی</Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <img src="./logo.png" alt="لوگوی چندبوم" className="w-5 h-5 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = './assets/logo.png'; }} />
              <span className="font-brand font-bold text-sm text-zinc-800 dark:text-zinc-200">
                چندبوم (Chandboom)
              </span>
              <span>• تمامی حقوق برای سامانه مدیریت مالی «چندبوم» محفوظ است.</span>
            </div>
            <div className="text-zinc-400 font-mono" dir="ltr">
              chandboom.ir © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Bottom-Left AI Assistant */}
      <FloatingAIAssistant />

      {/* Global Modals */}
      <BankSmsModal
        isOpen={isBankSmsModalOpen}
        onClose={() => setIsBankSmsModalOpen(false)}
        onSaveTransaction={(tx) => addTransaction(tx)}
      />

      <DailyQuestsModal
        isOpen={isDailyQuestsModalOpen}
        onClose={() => setIsDailyQuestsModalOpen(false)}
        currentDayOfMonth={new Date().getDate()}
      />

      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        editingTransaction={editingTx}
      />

      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSubmit={handleTicketSubmit}
      />

      <AdminDashboardModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      <AuthModal />

      <AuthGuardModal
        isOpen={isAuthGuardOpen}
        onClose={closeAuthGuard}
        message={authGuardMessage}
      />

      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={closeSubscriptionModal}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<AppContent />} />
      </Routes>
    </AppProvider>
  );
}
