/**
 * سرویس مشترک گروه‌ها و خرج‌های دنگ.
 * همه‌ی مسیرهای ساخت گروه/ثبت خرج (فرم، دستیار شناور، دستیار AI) از اینجا می‌گذرند تا:
 *  - عضویت مالک همیشه ثبت شود (بدون آن گروه در بخش همکاری دیده نمی‌شود)
 *  - خطای دیتابیس هرگز بی‌صدا نماند (قبلاً AIAssistant خطا را نادیده می‌گرفت و موفقیت گزارش می‌کرد)
 *  - گروه بر اساس نام فقط وقتی پیدا شود که دقیقاً یک گروه قابل مشاهده با آن نام باشد
 */
import { getSupabaseClient } from '../lib/supabase';
import { validateExpenseDraft, findDuplicateNames } from '../utils/dongValidation';

export interface DongGroupRef {
  id: string;
  name: string;
  members: string[];
}

export async function createDongGroup(userId: string, name: string, members: string[]): Promise<DongGroupRef> {
  const supabase = getSupabaseClient();
  const cleanName = name.trim();
  if (!cleanName) throw new Error('نام گروه دنگ مشخص نشده است.');

  const cleanMembers = [...new Set(members.map((m) => m.trim()).filter(Boolean))];
  if (cleanMembers.length === 0) throw new Error('حداقل یک عضو برای گروه لازم است.');
  const dup = findDuplicateNames(members);
  if (dup.length) throw new Error(`نام تکراری در اعضا: ${dup.join('، ')}`);

  const { data, error } = await supabase
    .from('dong_groups')
    .insert({ user_id: userId, name: cleanName, members: cleanMembers, is_family_mode: false, families: [] })
    .select('id, name, members')
    .single();
  if (error || !data?.id) throw new Error(`ساخت گروه ناموفق بود: ${error?.message || 'شناسه دریافت نشد.'}`);

  // ثبت مالک در جدول عضویت. اگر این مرحله شکست بخورد، گروه ناقص را پاک می‌کنیم تا گروه یتیم نماند.
  const { error: ownerError } = await supabase.rpc('dong_register_group_owner', { p_group_id: String(data.id) });
  if (ownerError) {
    await supabase.from('dong_groups').delete().eq('id', data.id);
    throw new Error(`ثبت مالکیت گروه ناموفق بود و گروه حذف شد: ${ownerError.message}`);
  }

  return { id: String(data.id), name: data.name, members: data.members ?? cleanMembers };
}

/**
 * گروهی را که کاربر به آن دسترسی دارد با نام پیدا می‌کند. RLS فقط گروه‌های قابل مشاهده را برمی‌گرداند.
 * اگر چند گروه با یک نام باشد، خطا می‌دهد تا خرج به گروه اشتباه نرود.
 * اگر پیدا نشد، گروه جدید با اعضای داده‌شده ساخته می‌شود.
 */
export async function findOrCreateDongGroup(userId: string, name: string, members: string[]): Promise<DongGroupRef> {
  const supabase = getSupabaseClient();
  const cleanName = name.trim();
  if (!cleanName) throw new Error('نام گروه دنگ مشخص نشده است.');

  const { data, error } = await supabase.from('dong_groups').select('id, name, members').eq('name', cleanName).limit(3);
  if (error) throw new Error(`جست‌وجوی گروه ناموفق بود: ${error.message}`);
  if (data && data.length > 1) {
    throw new Error(`چند گروه با نام «${cleanName}» دارید. لطفاً از بخش دنگ گروه دقیق را انتخاب کنید.`);
  }
  if (data && data.length === 1) {
    return { id: String(data[0].id), name: data[0].name, members: data[0].members ?? [] };
  }
  return createDongGroup(userId, cleanName, members);
}

export async function addDongExpense(params: {
  groupId: string;
  members: string[];
  title: string;
  payer: string;
  amount: number;
  participants: string[];
}): Promise<string> {
  const supabase = getSupabaseClient();
  const valid = validateExpenseDraft({
    title: params.title,
    payer: params.payer,
    amount: params.amount,
    participants: params.participants,
    members: params.members,
  });

  const { data, error } = await supabase
    .from('dong_expenses')
    .insert({
      group_id: params.groupId,
      title: valid.title,
      payer: valid.payer,
      amount: valid.amount,
      participants: valid.participants,
      is_itemized: false,
      bill_items: [],
    })
    .select('id')
    .single();
  if (error || !data?.id) throw new Error(`ثبت خرج ناموفق بود: ${error?.message || 'شناسه دریافت نشد.'}`);
  return String(data.id);
}
