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
  const { user, isProUser, hasAIAccess } = useApp();

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
    // Use the same active-subscription rule as AppContext and the Edge Function.
    // A null expiry date is valid for subscriptions that do not have a fixed end date.
    if (!hasAIAccess) {
      return {
        allowed: false,
        reason: 'برای استفاده از دستیار هوشمند به اشتراک فعال نیاز دارید.',
      };
    }
    if (aiRequestsLeft <= 0) {
      return {
        allowed: false,
        reason: 'سهمیه درخواست‌های هوش مصنوعی شما در این دوره به اتمام رسیده است.',
      };
    }
    return { allowed: true };
  }, [hasAIAccess, aiRequestsLeft]);

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
    updateUserQuotaByAdmin,
  };
}
