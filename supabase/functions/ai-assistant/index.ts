import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.117.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ✅ پرامپت جامع و اصلاح‌شده برای پشتیبانی از همه عملیات
const SYSTEM_PROMPT = `شما دستیار اجرایی هوشمند چندبوم هستید. خروجی شما باید منحصراً JSON معتبر باشد.
حیطه وظایف: پاسخ به سوالات + پیشنهاد ثبت تراکنش، گروه دنگ، هدف مالی، یادآور.
ممنوعیت مطلق: هرگز درباره فیش، رسید، واریز، ادمین، رمز عبور صحبت نکنید.

قالب خروجی الزامی (فقط JSON):
{
  "reply": "پاسخ کوتاه و صمیمی فارسی",
  "action": { 
    "type": "نوع_عملیات", 
    "params": { ... }, 
    "description": "توضیح فارسی کوتاه" 
  } | null,
  "requires_confirmation": true
}

انواع action.type مجاز و پارامترهای دقیق هر کدام:
1. "create_transaction": { "amount": عدد, "category": "دسته‌بندی", "type": "expense|income", "description": "شرح", "date": "YYYY-MM-DD" }
2. "create_dong_group": { "name": "نام گروه", "members": ["علی", "رضا"] }
3. "create_goal": { "title": "عنوان هدف", "target_amount": عدد, "deadline": "YYYY-MM-DD", "category": "دسته‌بندی" }
4. "create_reminder": { "title": "عنوان یادآور", "amount": عدد, "due_date": "YYYY-MM-DD", "recurrence": "once|monthly" }

اگر اطلاعات ناقص است، action را null بگذارید و در reply سوال بپرسید.`;

const PROHIBITED_KEYWORDS = ['فیش', 'رسید', 'واریز', 'ادمین', 'رمز عبور', 'پسورد'];
const INSTANT_REPLIES: Record<string, string> = {
  'سلام': 'سلام! 👋 چطور می‌توانم در مدیریت مالی، دنگ گروهی یا تنظیم یادآورها به شما کمک کنم؟',
  'خداحافظ': 'خداحافظ! روز مالی خوبی داشته باشید. ',
};

function detectIntent(message: string): boolean {
  const lower = message.toLowerCase();
  for (const key of Object.keys(INSTANT_REPLIES)) if (lower.includes(key)) return false;
  return /ثبت|ساخت|ایجاد|هزینه|درآمد|خرید|پرداخت|دنگ|گروه|هدف|یادآور|قسط|قبض|\d+\s*(هزار|میلیون|تومان)/i.test(lower);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const gapgptApiKey = Deno.env.get('GAPGPT_API_KEY') || '';
    const gapgptBaseUrl = (Deno.env.get('GAPGPT_BASE_URL') || 'https://api.gapgpt.app/v1').replace(/\/+$/, '');
    const aiModel = Deno.env.get('AI_MODEL') || 'gpt-4o-mini';

    if (!supabaseUrl || !supabaseServiceKey || !gapgptApiKey) {
      return new Response(JSON.stringify({ success: false, error: 'پیکربندی سرور ناقص است.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) return new Response(JSON.stringify({ success: false, error: 'لطفاً وارد حساب خود شوید.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: authUserData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUserData?.user) return new Response(JSON.stringify({ success: false, error: 'نشست معتبر نیست.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const userId = authUserData.user.id;
    const { data: dbUser } = await supabaseAdmin.from('users').select('id, email, tier, subscription_status, ai_queries_used, ai_queries_limit, ai_queries_reset_date').eq('id', userId).maybeSingle();
    if (!dbUser) return new Response(JSON.stringify({ success: false, error: 'اطلاعات کاربری یافت نشد.' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const isActive = dbUser.subscription_status === 'active';
    const isPaidTier = dbUser.tier === 'pro' || dbUser.tier === 'vip' || dbUser.tier === 'bronze';
    if (!isActive && !isPaidTier) return new Response(JSON.stringify({ success: false, error: 'دستیار هوشمند فقط برای کاربران دارای اشتراک فعال است.', code: 'SUBSCRIPTION_REQUIRED' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let limit = dbUser.ai_queries_limit;
    if (limit === null || limit === undefined) {
      limit = dbUser.tier === 'vip' ? -1 : dbUser.tier === 'pro' ? 1000 : dbUser.tier === 'bronze' ? 100 : 0;
      await supabaseAdmin.from('users').update({ ai_queries_limit: limit }).eq('id', userId);
    }
    let used = dbUser.ai_queries_used || 0;
    if (dbUser.ai_queries_reset_date) {
      const resetDate = new Date(dbUser.ai_queries_reset_date);
      if (new Date() > resetDate) {
        used = 0;
        const nextReset = new Date(); nextReset.setMonth(nextReset.getMonth() + 1);
        await supabaseAdmin.from('users').update({ ai_queries_used: 0, ai_queries_reset_date: nextReset.toISOString() }).eq('id', userId);
      }
    }
    if (limit !== -1 && used >= limit) return new Response(JSON.stringify({ success: false, error: `سقف ماهانه (${limit}) به اتمام رسیده است.`, code: 'QUOTA_EXCEEDED' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const { message, messages: incomingHistory, mode: requestedMode } = body;
    const mode = requestedMode === 'advisor' ? 'advisor' : 'agent';
    const userMessage = (message || '').trim();
    if (!userMessage) return new Response(JSON.stringify({ success: false, error: 'متن پیام الزامی است.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    if (PROHIBITED_KEYWORDS.some(k => userMessage.toLowerCase().includes(k))) {
      return new Response(JSON.stringify({ success: true, reply: 'این درخواست خارج از حیطه من است. لطفاً از منوی پشتیبانی استفاده کنید.', action: null, requires_confirmation: false, remaining_queries: limit === -1 ? -1 : Math.max(0, limit - used) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isAdvisor = mode === 'advisor';
    const isAction = !isAdvisor && detectIntent(userMessage);
    if (!isAction) {
      for (const [key, val] of Object.entries(INSTANT_REPLIES)) {
        if (userMessage.toLowerCase().includes(key)) return new Response(JSON.stringify({ success: true, reply: val, action: null, requires_confirmation: false, remaining_queries: limit === -1 ? -1 : Math.max(0, limit - used) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    let advisorContext = '';
    if (isAdvisor) {
      // Read only the authenticated user's own financial records. Failures degrade
      // gracefully, but the assistant must disclose when data is missing.
      const since = new Date();
      since.setMonth(since.getMonth() - 6);
      const [txRes, goalsRes, remindersRes] = await Promise.all([
        supabaseAdmin.from('transactions')
          .select('amount,type,category,description,date')
          .eq('user_id', userId).gte('date', since.toISOString())
          .order('date', { ascending: false }).limit(150),
        supabaseAdmin.from('financial_goals')
          .select('title,target_amount,current_amount,deadline,category')
          .eq('user_id', userId).limit(30),
        supabaseAdmin.from('reminders')
          .select('title,amount,due_date,is_paid')
          .eq('user_id', userId).order('due_date', { ascending: true }).limit(30),
      ]);
      const tx = txRes.data || [];
      const income = tx.filter((t: any) => t.type === 'income').reduce((n: number, t: any) => n + Number(t.amount || 0), 0);
      const expenses = tx.filter((t: any) => t.type === 'expense').reduce((n: number, t: any) => n + Number(t.amount || 0), 0);
      const byCategory: Record<string, number> = {};
      for (const t of tx) if (t.type === 'expense') byCategory[t.category || 'سایر'] = (byCategory[t.category || 'سایر'] || 0) + Number(t.amount || 0);
      const topCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([category, amount]) => ({ category, amount }));
      advisorContext = `\n\nداده مالی واقعی و محدود به همین کاربر (شش ماه اخیر؛ مبالغ با واحد ثبت‌شده در برنامه):\n${JSON.stringify({
        period_start: since.toISOString().slice(0, 10),
        transaction_count: tx.length,
        income_total: income,
        expense_total: expenses,
        net_cashflow: income - expenses,
        expense_categories: topCategories,
        recent_transactions: tx.slice(0, 60),
        goals: goalsRes.data || [],
        reminders: remindersRes.data || [],
        missing_data: { transactions_query_failed: Boolean(txRes.error), goals_query_failed: Boolean(goalsRes.error), reminders_query_failed: Boolean(remindersRes.error) }
      }).slice(0, 18000)}\n\nاز این داده‌ها فقط برای پاسخ به درخواست همین کاربر استفاده کن. اگر داده کافی نیست، صریح بگو و سؤال تکمیلی بپرس. اعداد محاسبه‌شده را با بازه زمانی توضیح بده؛ پیش‌بینی را قطعی معرفی نکن و فرضیاتش را ذکر کن.`;
    }
    const selectedSystemPrompt = isAdvisor
      ? `شما مشاور مالی شخصی چندبوم هستید. به فارسی روان، دقیق و کاربردی پاسخ بده. وظیفه‌ات تحلیل روند هزینه و درآمد، توضیح جزئیات، بودجه‌بندی، سناریوهای یک تا شش ماه آینده و پیشنهادهای عملی است. از داده واقعی ارائه‌شده استفاده کن؛ هیچ تراکنش، هدف یا یادآوری را در این حالت ایجاد یا تغییر نده. action همیشه null و requires_confirmation همیشه false باشد. اگر داده‌ای موجود نیست، آن را جعل نکن. توصیه‌ها را متناسب با سن و وضعیت کاربر، محتاطانه و غیرقطعی بیان کن. درباره فیش، رسید، واریز، ادمین، رمز عبور یا پسورد راهنمایی نده. خروجی فقط JSON معتبر با شکل {"reply":"پاسخ کامل فارسی","action":null,"requires_confirmation":false} باشد.${advisorContext}`
      : SYSTEM_PROMPT;
    const chatMessages: Array<{ role: string; content: string }> = [{ role: 'system', content: selectedSystemPrompt }];
    if (Array.isArray(incomingHistory)) {
      incomingHistory.slice(-4).forEach(m => {
        if (m.role === 'user' || m.role === 'assistant') chatMessages.push({ role: m.role, content: String(m.content).slice(0, 500) });
      });
    }
    chatMessages.push({ role: 'user', content: userMessage.slice(0, 800) });

    let aiRawReply = '';
    try {
      const res = await fetch(`${gapgptBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gapgptApiKey}` },
        body: JSON.stringify({ model: aiModel, messages: chatMessages, temperature: isAction ? 0.2 : 0.55, max_tokens: isAction ? 500 : (isAdvisor ? 1200 : 800) }),
      });
      if (res.ok) {
        const data = await res.json();
        aiRawReply = data.choices?.[0]?.message?.content || '';
      } else if (res.status === 404 && aiModel !== 'gpt-4o-mini') {
        const fallbackRes = await fetch(`${gapgptBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${gapgptApiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: chatMessages, temperature: isAdvisor ? 0.35 : 0.2, max_tokens: isAdvisor ? 1200 : 500 }),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          aiRawReply = fallbackData.choices?.[0]?.message?.content || '';
        }
      }
    } catch (err) { console.error('GapGPT fetch error:', err); }

    let parsed;
    try {
      const jsonMatch = aiRawReply.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { reply: aiRawReply || 'خطا در پردازش.', action: null, requires_confirmation: false };
    } catch { parsed = { reply: aiRawReply || 'پاسخ نامعتبر بود.', action: null, requires_confirmation: false }; }

    const newUsed = limit === -1 ? used : used + 1;
    if (limit !== -1) await supabaseAdmin.from('users').update({ ai_queries_used: newUsed }).eq('id', userId);
    try { await supabaseAdmin.from('ai_usage_logs').insert([{ user_id: userId, query_category: isAction ? 'action_proposal' : 'guide', tokens_used: 1 }]); } catch (logErr) { console.warn('Logging error:', logErr); }

    return new Response(JSON.stringify({ success: true, reply: parsed.reply, action: isAdvisor ? null : parsed.action, requires_confirmation: isAdvisor ? false : parsed.requires_confirmation, remaining_queries: limit === -1 ? -1 : Math.max(0, limit - newUsed) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('Edge Function exception:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'خطای سرور' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});