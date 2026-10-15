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
        JSON.stringify({ success: false, error: 'پیکربندی سرور احراز هویت ادمین ناقص است.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { action, email, code } = await req.json();

    const targetEmail = (email || '').toLowerCase().trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      return new Response(
        JSON.stringify({ success: false, error: 'آدرس ایمیل معتبر الزامی است.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify if the target email is an authorized admin on the server
    const isConfiguredAdmin = targetEmail === configuredAdminEmail;
    const { data: dbAdminUser } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('email', targetEmail)
      .maybeSingle();

    const isDbAdmin = dbAdminUser?.role === 'admin';

    if (!isConfiguredAdmin && !isDbAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: 'این حساب کاربری دسترسی سطح مدیریت ارشد ندارد.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send_otp') {
      // Generate a crypto-secure 6-digit numeric OTP
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const secureOtp = (100000 + (array[0] % 900000)).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Invalidate any existing unused OTPs for this email
      await supabaseAdmin
        .from('admin_otps')
        .update({ is_used: true })
        .eq('email', targetEmail)
        .eq('is_used', false);

      // Persist the new OTP in database
      const { error: insertError } = await supabaseAdmin.from('admin_otps').insert([
        {
          email: targetEmail,
          otp_hash: secureOtp, // In production, can be sha256 hashed
          attempts: 0,
          is_used: false,
          expires_at: expiresAt,
        },
      ]);

      if (insertError) {
        console.error('Error inserting admin OTP:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: 'خطا در ثبت کد تایید در سرور پایگاه داده.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Trigger Supabase Auth OTP or Email dispatch
      try {
        await supabaseAdmin.auth.signInWithOtp({
          email: targetEmail,
          options: { shouldCreateUser: false },
        });
      } catch (e) {
        console.warn('Supabase auth signInWithOtp warning:', e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'کد تایید دو مرحله‌ای امن به ایمیل مدیریت ارسال شد.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify_otp') {
      const cleanCode = (code || '').trim();
      if (!cleanCode) {
        return new Response(
          JSON.stringify({ success: false, error: 'کد تایید الزامی است.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch the latest active OTP for this email
      const { data: record, error: fetchError } = await supabaseAdmin
        .from('admin_otps')
        .select('*')
        .eq('email', targetEmail)
        .eq('is_used', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError || !record) {
        return new Response(
          JSON.stringify({ success: false, error: 'کد تایید معتبری برای این ایمیل یافت نشد یا منقضی شده است.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiry
      if (new Date(record.expires_at).getTime() < Date.now()) {
        await supabaseAdmin.from('admin_otps').update({ is_used: true }).eq('id', record.id);
        return new Response(
          JSON.stringify({ success: false, error: 'کد تایید منقضی شده است (مهلت ۵ دقیقه).' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rate limit attempts
      if ((record.attempts || 0) >= 5) {
        await supabaseAdmin.from('admin_otps').update({ is_used: true }).eq('id', record.id);
        return new Response(
          JSON.stringify({ success: false, error: 'تعداد دفعات تلاش بیش از حد مجاز است. لطفاً کد جدید دریافت کنید.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify code
      if (record.otp_hash !== cleanCode) {
        await supabaseAdmin
          .from('admin_otps')
          .update({ attempts: (record.attempts || 0) + 1 })
          .eq('id', record.id);

        return new Response(
          JSON.stringify({ success: false, error: 'کد تایید وارد شده اشتباه است.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Valid: mark as used
      await supabaseAdmin.from('admin_otps').update({ is_used: true }).eq('id', record.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'احراز هویت دو مرحله‌ای مدیر با موفقیت تایید شد.',
          verified: true,
          email: targetEmail,
          verified_at: new Date().toISOString(),
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
      JSON.stringify({ success: false, error: err?.message || 'خطای سرور احراز هویت' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
