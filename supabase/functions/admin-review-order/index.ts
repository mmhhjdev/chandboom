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
    const configuredAdminEmails = new Set([
      ...(Deno.env.get('ADMIN_EMAILS') || '').split(','),
      Deno.env.get('ADMIN_EMAIL') || '',
      'seyedmahanhejrati@gmail.com',
      'mahan.hejrati91@gmail.com',
    ].map((email) => email.trim().toLowerCase()).filter(Boolean));

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'پیکربندی سرور مدیریت ناقص است.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Authenticate caller using Supabase Auth JWT from Bearer header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'توکن احراز هویت معتبر یافت نشد (دسترسی غیرمجاز).' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'توکن ورود نامعتبر است یا منقضی شده است.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerUser = userData.user;
    const callerEmail = (callerUser.email || '').toLowerCase().trim();

    // 2. Authorize admin privileges strictly from server-side trusted state
    const isConfiguredAdmin = configuredAdminEmails.has(callerEmail);
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', callerUser.id)
      .maybeSingle();

    const isDbAdmin = ['admin', 'superuser', 'super_admin', 'super-admin'].includes(String(dbUser?.role ?? '').trim().toLowerCase());

    if (!isConfiguredAdmin && !isDbAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'شما دسترسی سطح مدیریت برای انجام این عملیات را ندارید.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Process the review action
    const body = await req.json();
    const { action, paymentId, adminNotes } = body;

    if (!paymentId || (action !== 'approve' && action !== 'reject')) {
      return new Response(
        JSON.stringify({ success: false, error: 'شناسه پرداخت یا نوع عملیات (approve/reject) نامعتبر است.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch payment record from manual_payments or subscription_orders
    let paymentRecord: any = null;
    const { data: manualPay } = await supabaseAdmin
      .from('manual_payments')
      .select('*')
      .eq('id', paymentId)
      .maybeSingle();

    if (manualPay) {
      paymentRecord = manualPay;
    } else {
      const { data: subOrder } = await supabaseAdmin
        .from('subscription_orders')
        .select('*')
        .eq('id', paymentId)
        .maybeSingle();

      if (subOrder) {
        paymentRecord = {
          id: subOrder.id,
          user_id: subOrder.user_id,
          plan_id: subOrder.plan_id,
          plan_name: subOrder.plan_name || subOrder.plan_id,
          amount: subOrder.amount_toman,
          status: subOrder.status,
        };
      }
    }

    if (!paymentRecord) {
      return new Response(
        JSON.stringify({ success: false, error: 'رکورد فیش یا سفارش اشتراک مورد نظر یافت نشد.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const nowIso = new Date().toISOString();

    if (action === 'approve') {
      const notes = (adminNotes || '').trim() || 'پرداخت تایید شد و اشتراک فعال گردید.';

      // A. Update manual_payments
      await supabaseAdmin
        .from('manual_payments')
        .update({
          status: 'approved',
          admin_notes: notes,
          reviewed_at: nowIso,
          reviewed_by: callerEmail,
        })
        .eq('id', paymentId);

      // B. Update subscription_orders
      await supabaseAdmin
        .from('subscription_orders')
        .update({
          status: 'approved',
          reviewed_at: nowIso,
          reviewed_by: callerUser.id,
        })
        .or(`id.eq.${paymentId},user_id.eq.${paymentRecord.user_id}`);

      // C. Calculate subscription duration & tier
      let durationMonths = 1;
      let tier = 'pro';
      let aiQueriesLimit = 100;
      const planId = (paymentRecord.plan_id || '').toLowerCase();

      if (planId.includes('bronze')) {
        tier = 'bronze';
        durationMonths = 1;
        aiQueriesLimit = 20;
      } else if (planId.includes('6m') || planId.includes('vip')) {
        tier = 'vip';
        durationMonths = 6;
        aiQueriesLimit = 500;
      } else if (planId.includes('3m')) {
        tier = 'pro';
        durationMonths = 3;
        aiQueriesLimit = 150;
      } else {
        tier = 'pro';
        durationMonths = 1;
        aiQueriesLimit = 100;
      }

      const durationDays = durationMonths * 30;

      // Fetch current expiry from users table
      const { data: targetUser } = await supabaseAdmin
        .from('users')
        .select('subscription_expires_at')
        .eq('id', paymentRecord.user_id)
        .maybeSingle();

      const currentExpiry = targetUser?.subscription_expires_at
        ? new Date(targetUser.subscription_expires_at).getTime()
        : 0;
      const baseTime = currentExpiry > Date.now() ? currentExpiry : Date.now();
      const expiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000).toISOString();

      // D. Update users table with verified server authority
      await supabaseAdmin
        .from('users')
        .update({
          tier,
          subscription_status: 'active',
          subscription_tier: tier,
          subscription_expires_at: expiresAt,
          ai_queries_limit: aiQueriesLimit,
          ai_queries_used: 0,
          updated_at: nowIso,
        })
        .eq('id', paymentRecord.user_id);

      // E. Insert in-app notification for the user
      await supabaseAdmin.from('notifications').insert([
        {
          user_id: paymentRecord.user_id,
          title: 'تایید اشتراک چندبوم',
          message: `فیش واریزی شما برای اشتراک «${paymentRecord.plan_name || 'اشتراک ویژه'}» تایید و حساب شما تا تاریخ ${new Date(expiresAt).toLocaleDateString('fa-IR')} فعال شد.`,
          type: 'subscription',
          status: 'settled',
          is_read: false,
          created_at: nowIso,
        },
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'پرداخت با موفقیت تایید و اشتراک کاربر ارتقا یافت.',
          data: {
            paymentId,
            userId: paymentRecord.user_id,
            tier,
            expiresAt,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'reject') {
      const notes = (adminNotes || '').trim() || 'اطلاعات واریزی مطابقت نداشت یا نامعتبر بود.';

      // A. Update manual_payments
      await supabaseAdmin
        .from('manual_payments')
        .update({
          status: 'rejected',
          admin_notes: notes,
          reviewed_at: nowIso,
          reviewed_by: callerEmail,
        })
        .eq('id', paymentId);

      // B. Update subscription_orders
      await supabaseAdmin
        .from('subscription_orders')
        .update({
          status: 'rejected',
          reject_reason: notes,
          reviewed_at: nowIso,
          reviewed_by: callerUser.id,
        })
        .eq('user_id', paymentRecord.user_id);

      // C. Update user subscription status
      await supabaseAdmin
        .from('users')
        .update({
          subscription_status: 'none',
          updated_at: nowIso,
        })
        .eq('id', paymentRecord.user_id);

      // D. Insert notification for user
      await supabaseAdmin.from('notifications').insert([
        {
          user_id: paymentRecord.user_id,
          title: 'عدم تایید فیش پرداخت',
          message: `فیش واریزی شما تایید نشد. دلیل مدیر: ${notes}`,
          type: 'alert',
          status: 'pending',
          is_read: false,
          created_at: nowIso,
        },
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'فیش پرداخت رد شد و وضعیت اشتراک کاربر به‌روزرسانی گردید.',
          data: { paymentId, userId: paymentRecord.user_id },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'عملیات نامعتبر است.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'خطای سرور بررسی سفارش' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
