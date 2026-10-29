import { useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getSupabaseClient } from '../lib/supabase';
import { calculateRemainingProDays } from '../utils/security';

export interface UseSubscriptionReturn {
  isPremium: boolean;
  tier: 'free' | 'bronze' | 'pro' | 'vip';
  status: 'active' | 'expired' | 'pending_approval' | 'none';
  subscriptionExpiresAt: string | null;
  remainingDays: number;
  aiRequestsLeft: number;
  monthlyAiLimit: number;
  aiQueriesUsed: number;
  hasAiAccess: boolean;
  checkCanMakeAiRequest: () => { allowed: boolean; reason?: string };
  consumeAiRequest: () => Promise<boolean>;
  updateUserQuotaByAdmin: (
    targetUserId: string,
    params: {
      isPremium?: boolean;
      tier?: 'free' | 'bronze' | 'pro' | 'vip';
      expiresAt?: string | null;
      aiRequestsLeft?: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;
}

/**
 * useSubscription hook
 * Provides live subscription status, quota verification, AI request guards,
 * and admin quota management.
 */
export function useSubscription(): UseSubscriptionReturn {
  const { user, updateUserProfile, isProUser, hasAIAccess } = useApp();

  const remainingInfo = useMemo(() => {
    return calculateRemainingProDays(user.subscription_expires_at);
  }, [user.subscription_expires_at]);

  const isPremium = useMemo(() => {
    if (user.is_premium !== undefined) return user.is_premium;
    return isProUser && remainingInfo.isActive;
  }, [user.is_premium, isProUser, remainingInfo.isActive]);

  const aiRequestsLeft = useMemo(() => {
    if (user.ai_requests_left !== undefined && user.ai_requests_left !== null) {
      return Math.max(0, user.ai_requests_left);
    }
    const limit = user.ai_queries_limit ?? (user.tier === 'vip' ? 500 : user.tier === 'bronze' ? 30 : 100);
    const used = user.ai_queries_used ?? 0;
    return Math.max(0, limit - used);
  }, [user.ai_requests_left, user.ai_queries_limit, user.ai_queries_used, user.tier]);

  const checkCanMakeAiRequest = useCallback(() => {
    if (user.tier === 'free' && !isPremium) {
      return {
        allowed: false,
        reason: 'طرح پایه (رایگان) فاقد سهمیه هوش مصنوعی است. لطفاً اشتراک خود را ارتقا دهید.',
      };
    }
    if (!remainingInfo.isActive && user.tier !== 'free') {
      return {
        allowed: false,
        reason: 'اشتراک هوش مصنوعی شما به پایان رسیده است. لطفاً اقدام به تمدید فرمایید.',
      };
    }
    if (aiRequestsLeft <= 0) {
      return {
        allowed: false,
        reason: 'سهمیه درخواست‌های هوش مصنوعی شما در این دوره به اتمام رسیده است.',
      };
    }
    return { allowed: true };
  }, [user.tier, isPremium, remainingInfo.isActive, aiRequestsLeft]);

  const consumeAiRequest = useCallback(async (): Promise<boolean> => {
    const check = checkCanMakeAiRequest();
    if (!check.allowed) return false;

    // The AI entry points consume quota once through the atomic decrement_ai_quota RPC.
    // This method only mirrors the already-authorized request in local UI state.
    const nextUsed = (user.ai_queries_used ?? 0) + 1;
    const nextLeft = Math.max(0, aiRequestsLeft - 1);
    await updateUserProfile({
      ai_queries_used: nextUsed,
      ai_requests_left: nextLeft,
    });
    return true;
  }, [checkCanMakeAiRequest, user.ai_queries_used, aiRequestsLeft, updateUserProfile]);

  const updateUserQuotaByAdmin = useCallback(
    async (
      targetUserId: string,
      params: {
        isPremium?: boolean;
        tier?: 'free' | 'bronze' | 'pro' | 'vip';
        expiresAt?: string | null;
        aiRequestsLeft?: number;
      }
    ) => {
      const supabase = getSupabaseClient();
      if (!supabase) return { success: false, error: 'سرویس ابری در دسترس نیست' };

      try {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        if (params.tier) updatePayload.tier = params.tier;
        if (params.isPremium !== undefined) {
          updatePayload.is_premium = params.isPremium;
          updatePayload.subscription_status = params.isPremium ? 'active' : 'expired';
        }
        if (params.expiresAt !== undefined) {
          updatePayload.subscription_expires_at = params.expiresAt;
        }
        if (params.aiRequestsLeft !== undefined) {
          updatePayload.ai_requests_left = params.aiRequestsLeft;
          updatePayload.ai_queries_limit = params.aiRequestsLeft;
        }

        const { error } = await supabase.from('users').update(updatePayload).eq('id', targetUserId);
        if (error) throw error;

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || 'خطا در اعمال تغییرات توسط مدیر' };
      }
    },
    []
  );

  return {
    isPremium,
    tier: user.tier,
    status: user.subscription_status,
    subscriptionExpiresAt: user.subscription_expires_at || null,
    remainingDays: remainingInfo.daysLeft,
    aiRequestsLeft,
    monthlyAiLimit: user.ai_queries_limit ?? 100,
    aiQueriesUsed: user.ai_queries_used ?? 0,
    hasAiAccess: hasAIAccess,
    checkCanMakeAiRequest,
    consumeAiRequest,
    updateUserQuotaByAdmin,
  };
}
