import { getSupabaseClient } from '../lib/supabase';

/** Turns database-level failures into a Persian message the user can act on. */
function friendlyError(message: string | undefined): Error {
  const raw = message || '';
  if (/schema cache|Could not find the function|does not exist/i.test(raw)) {
    return new Error('بخش دوستان هنوز روی پایگاه داده فعال نشده است. از مدیر سیستم بخواهید فایل SQL بخش دوستان را در Supabase اجرا کند.');
  }
  return new Error(raw || 'عملیات انجام نشد. دوباره تلاش کنید.');
}

export type FriendState = 'friend' | 'incoming' | 'outgoing';

export interface FriendEntry {
  friendship_id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  state: FriendState;
}

/** فهرست دوستان، درخواست‌های دریافتی و ارسالی کاربر جاری. */
export async function friendsOverview(): Promise<FriendEntry[]> {
  const { data, error } = await getSupabaseClient().rpc('friends_overview');
  if (error) throw friendlyError(error.message);
  return (data ?? []) as FriendEntry[];
}

/** ارسال درخواست با نام کاربری. اگر طرف مقابل قبلاً درخواست داده باشد، خودکار پذیرفته می‌شود. */
export async function sendFriendRequest(username: string): Promise<'sent' | 'accepted'> {
  const { data, error } = await getSupabaseClient().rpc('friend_send_request', { p_username: username });
  if (error) throw friendlyError(error.message);
  return data === 'accepted' ? 'accepted' : 'sent';
}

export async function respondFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  const { error } = await getSupabaseClient().rpc('friend_respond_request', {
    p_friendship_id: friendshipId,
    p_accept: accept,
  });
  if (error) throw friendlyError(error.message);
}

/** حذف دوست، یا لغو درخواست ارسالی. */
export async function removeFriend(userId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('friend_remove', { p_user_id: userId });
  if (error) throw friendlyError(error.message);
}
