import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// پرامپت فشرده برای Action Agent (ثبت تراکنش)
const SYSTEM_PROMPT_ACTION = `شما دستیار اجرایی هوشمند چندبوم هستید. خروجی شما باید منحصراً JSON معتبر باشد.
حیطه وظایف: ۱.پاسخ به سوالات متداول ۲.پیشنهاد ثبت تراکنش، هدف مالی، دنگ گروهی، یادآور.
ممنوعیت مطلق: هرگز درباره فیش، رسید، واریز، ادمین، رمز عبور یا لاگین صحبت نکنید.
قالب خروجی الزامی:
{
  "reply": "پاسخ کوتاه و صمیمی فارسی",
  "action": { "type": "create_transaction", "params": {"amount":50000,"category":"خوراک","date":"1403/07/25","type":"expense","description":"سوپرمارکت"}, "description": "ثبت هزینه ۵,۰۰۰ تومان برای سوپرمارکت" } | null,
  "requires_confirmation": true
}
اگر اطلاعات ناقص است، action را null بگذارید و در reply سوال بپرسید.`;

// پرامپت فشرده برای Guide Agent (راهنمایی)
const SYSTEM_PROMPT_GUIDE = `شما راهنمای هوشمند چندبوم هستید. به سوالات کاربر درباره دنگ گروهی، اهداف مالی و یادآورها پاسخ صمیمی، کوتاه و ساختاریافته فارسی بدهید. هرگز درباره فیش، رسید یا ادمین صحبت نکنید.`;

const PROHIBITED_KEYWORDS = ['فیش', 'رسید', 'واریز', 'ادمین', 'رمز عبور', 'پسورد', 'تایید پرداخت'];

const INSTANT_REPLIES: Record<string, string> = {
  'سلام': 'سلام! 👋 چطور می‌توانم در مدیریت مالی، دنگ گروهی یا تنظیم یادآورها به شما کمک کنم؟',
  'خداحافظ': 'خداحافظ! روز مالی خوبی داشته باشید. ',
  'ممنون': 'خواهش می‌کنم! اگر سوال دیگری داشتید، در خدمتم. 🙏',
};

// تشخیص intent و انتخاب مدل مناسب
function detectIntent(message: string): { isAction: boolean; prompt: string } {
  const lower = message.toLowerCase();
  
  // بررسی پاسخ‌های فوری
  for (const [key, val] of Object.entries(INSTANT_REPLIES)) {
    if (lower.includes(key)) return { isAction: false, prompt: val };
  }
  
  // تشخیص Action (نیاز به gemma)
  const isAction = /ثبت|هزینه|درآمد|خرید|پرداخت|دنگ|هدف|یادآور|\d+\s*(هزار|میلیون|تومان)/i.test(lower);
  
  return {
    isAction,
    prompt: isAction ? SYSTEM_PROMPT_ACTION : SYSTEM_PROMPT_GUIDE
  };
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // خواندن Secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const gapgptApiKey = Deno.env.get('GAPGPT_API_KEY') || '';
    const gapgptBaseUrl = (Deno.env.get('GAPGPT_BASE_URL') || 'https://api.gapgpt.app/v1').replace(/\/+$/, '');
    const modelAction = Deno.env.get('AI_MODEL_GEMMA') || 'gemma';
    const modelGuide = Deno.env.get('AI_MODEL_JEV') || 'jev';

    if (!supabaseUrl || !supabaseServiceKey || !gapgptApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'پیکربندی سرور ناقص است.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // احراز هویت کاربر
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'لطفاً وارد حساب خود شوید.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: authUserData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUserData?.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'نشست معتبر نیست.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authUserData.user.id;

    // بررسی اشتراک و سهمیه
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('subscription_status, ai_queries_used, ai_queries_limit')
      .eq('id', userId)
      .maybeSingle();

    if (!dbUser || dbUser.subscription_status !== 'active') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'این ویژگی فقط برای مشترکین فعال است.',
          code: 'SUBSCRIPTION_REQUIRED'
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const limit = dbUser.ai_queries_limit || 100;
    const used = dbUser.ai_queries_used || 0;
    if (used >= limit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `سقف ماهانه (${limit}) به اتمام رسیده است.`,
          code: 'QUOTA_EXCEEDED'
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // پارس درخواست
    const body = await req.json();
    const { message, messages: incomingHistory } = body;
    const userMessage = (message || '').trim();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ success: false, error: 'متن پیام الزامی است.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // فیلتر کلمات ممنوعه
    if (PROHIBITED_KEYWORDS.some(k => userMessage.toLowerCase().includes(k))) {
      return new Response(
        JSON.stringify({
          success: true,
          reply: 'این درخواست خارج از حیطه من است. لطفاً از منوی پشتیبانی استفاده کنید.',
          action: null,
          requires_confirmation: false,
          remaining_queries: Math.max(0, limit - used)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // تشخیص intent
    const { isAction, prompt: systemPrompt } = detectIntent(userMessage);
    
    // اگر پاسخ فوری بود، بدون API برگردان
    if (!isAction && systemPrompt !== SYSTEM_PROMPT_ACTION && systemPrompt !== SYSTEM_PROMPT_GUIDE) {
      return new Response(
        JSON.stringify({
          success: true,
          reply: systemPrompt,
          action: null,
          requires_confirmation: false,
          remaining_queries: Math.max(0, limit - used)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ساخت پیام‌ها
    const chatMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt }
    ];
    
    if (Array.isArray(incomingHistory)) {
      incomingHistory.slice(-4).forEach(m => {
        if (m.role === 'user' || m.role === 'assistant') {
          chatMessages.push({ role: m.role, content: String(m.content).slice(0, 500) });
        }
      });
    }
    
    chatMessages.push({ role: 'user', content: userMessage.slice(0, 800) });

    // فراخوانی API
    let aiRawReply = '';
    try {
      const res = await fetch(`${gapgptBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gapgptApiKey}`
        },
        body: JSON.stringify({
          model: isAction ? modelAction : modelGuide,
          messages: chatMessages,
          temperature: isAction ? 0.2 : 0.7,
          max_tokens: isAction ? 400 : 600,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        aiRawReply = data.choices?.[0]?.message?.content || '';
      }
    } catch (err) {
      console.error('AI Error:', err);
    }

    // پارس پاسخ
    let parsed;
    try {
      const jsonMatch = aiRawReply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        reply: aiRawReply || 'خطا در پردازش.',
        action: null,
        requires_confirmation: false
      };
    } catch {
      parsed = {
        reply: aiRawReply || 'پاسخ نامعتبر بود.',
        action: null,
        requires_confirmation: false
      };
    }

    // به‌روزرسانی سهمیه و لاگ
    const newUsed = used + 1;
    await supabaseAdmin
      .from('users')
      .update({ ai_queries_used: newUsed })
      .eq('id', userId);
    
    await supabaseAdmin
      .from('ai_usage_logs')
      .insert([{
        user_id: userId,
        query_category: isAction ? 'action_proposal' : 'guide',
        tokens_used: 1
      }])
      .catch(() => {});

    return new Response(
      JSON.stringify({
        success: true,
        reply: parsed.reply,
        action: parsed.action,
        requires_confirmation: parsed.requires_confirmation,
        remaining_queries: Math.max(0, limit - newUsed),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err?.message || 'خطای سرور' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});