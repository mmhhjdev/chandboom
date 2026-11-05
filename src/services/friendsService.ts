import { getSupabaseClient } from '../lib/supabase';

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
  if (error) throw new Error(error.message);
  return (data ?? []) as FriendEntry[];
}

/** ارسال درخواست با نام کاربری. اگر طرف مقابل قبلاً درخواست داده باشد، خودکار پذیرفته می‌شود. */
export async function sendFriendRequest(username: string): Promise<'sent' | 'accepted'> {
  const { data, error } = await getSupabaseClient().rpc('friend_send_request', { p_username: username });
  if (error) throw new Error(error.message);
  return data === 'accepted' ? 'accepted' : 'sent';
}

export async function respondFriendRequest(friendshipId: string, accept: boolean): Promise<void> {
  const { error } = await getSupabaseClient().rpc('friend_respond_request', {
    p_friendship_id: friendshipId,
    p_accept: accept,
  });
  if (error) throw new Error(error.message);
}

/** حذف دوست، یا لغو درخواست ارسالی. */
export async function removeFriend(userId: string): Promise<void> {
  const { error } = await getSupabaseClient().rpc('friend_remove', { p_user_id: userId });
  if (error) throw new Error(error.message);
}
