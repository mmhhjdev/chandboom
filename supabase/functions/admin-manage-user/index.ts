import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const configuredAdminEmail = (Deno.env.get('ADMIN_EMAIL') || 'admin@chandboom.ir').toLowerCase().trim();

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'پیکربندی سرور مدیریت کاربران ناقص است.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Authenticate caller using Supabase Auth JWT
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'توکن احراز هویت الزامی است.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'نشست احراز هویت منقضی شده یا نامعتبر است.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerUser = userData.user;
    const callerEmail = (callerUser.email || '').toLowerCase().trim();

    // 2. Verify caller has admin privileges
    const isConfiguredAdmin = callerEmail === configuredAdminEmail;
    const { data: dbCaller } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', callerUser.id)
      .maybeSingle();

    const isDbAdmin = dbCaller?.role === 'admin';

    if (!isConfiguredAdmin && !isDbAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'دسترسی غیرمجاز: فقط مدیران ارشد مجاز به تغییر اطلاعات کاربران هستند.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action, userId } = body;

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'شناسه کاربر الزامی است.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowIso = new Date().toISOString();

    if (action === 'update_role_tier') {
      const { role, tier } = body;
      const validRoles = ['user', 'admin'];
      const validTiers = ['free', 'pro', 'vip'];

      if (!validRoles.includes(role) || !validTiers.includes(tier)) {
        return new Response(
          JSON.stringify({ success: false, error: 'نقش یا سطح کاربری نامعتبر است.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          role,
          tier,
          updated_at: nowIso,
        })
        .eq('id', userId);

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: 'خطا در به‌روزرسانی اطلاعات کاربر در پایگاه داده.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'نقش و سطح کاربری با موفقیت به‌روزرسانی شد.',
          data: { userId, role, tier },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update_subscription_days') {
      const { daysToAdd, reason } = body;
      const days = Number(daysToAdd) || 0;

      const { data: targetUser, error: userFetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userFetchError || !targetUser) {
        return new Response(
          JSON.stringify({ success: false, error: 'کاربر مورد نظر یافت نشد.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const currentExpiry = targetUser.subscription_expires_at
        ? new Date(targetUser.subscription_expires_at).getTime()
        : 0;
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();
      const newTier = days > 0 ? (targetUser.tier === 'vip' ? 'vip' : 'pro') : (new Date(newExpiry).getTime() > Date.now() ? targetUser.tier : 'free');
      const newStatus = newTier !== 'free' ? 'active' : 'none';

      await supabaseAdmin
        .from('users')
        .update({
          tier: newTier,
          subscription_status: newStatus,
          subscription_expires_at: newExpiry,
          updated_at: nowIso,
        })
        .eq('id', userId);

      // Notify user
      if (days > 0) {
        await supabaseAdmin.from('notifications').insert([
          {
            user_id: userId,
            title: 'تمدید اشتراک توسط مدیریت',
            message: `اشتراک شما به میزان ${days} روز تمدید شد.${reason ? ` دلیل: ${reason}` : ''}`,
            type: 'subscription',
            status: 'settled',
            is_read: false,
            created_at: nowIso,
          },
        ]);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `اشتراک کاربر به میزان ${days} روز تمدید شد.`,
          data: { userId, newTier, newExpiry, newStatus },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'عملیات مشخص‌شده معتبر نیست.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'خطای سرور' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
