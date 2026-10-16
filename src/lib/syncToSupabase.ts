import { supabase } from './supabase';
import { Transaction } from '../types';

/**
 * ثبت تراکنش در دیتابیس سوپابیس
 */
export async function syncTransactionToSupabase(tx: Omit<Transaction, 'id'> & { id?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (!userId) return { success: false, error: 'کاربر لاگین نیست' };

    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id: userId,
        amount: tx.amount,
        category: tx.category,
        type: tx.type,
        date: tx.date,
        description: tx.description,
        account: tx.account || 'کارت اصلی',
        tags: tx.tags || [],
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * حذف تراکنش از دیتابیس
 */
export async function deleteTransactionFromSupabase(txId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', txId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * به‌روزرسانی تراکنش در دیتابیس
 */
export async function updateTransactionInSupabase(txId: string, updates: Partial<Transaction>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', txId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * بارگذاری تراکنش‌های کاربر از دیتابیس
 */
export async function loadTransactionsFromSupabase(): Promise<Transaction[]> {
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    if (!userId) return [];

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase load error:', error);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}