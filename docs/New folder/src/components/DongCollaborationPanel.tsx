import React, { useCallback, useEffect, useState } from 'react';
import { Search, UserPlus, Bell, Check, X, RefreshCw, Shield, Users } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';

type SearchProfile = { id: string; username: string; display_name: string | null };
type Invitation = { id: string; group_id: string; group_name: string; inviter_name: string; status: string; created_at: string };
type Member = { user_id: string; username: string; display_name: string | null; role: string };

const roleLabel: Record<string, string> = { owner: 'مالک', admin: 'مدیر', member: 'عضو' };

export const DongCollaborationPanel: React.FC<{ groupId: string; currentUserId: string; onChanged?: () => void }> = ({ groupId, currentUserId, onChanged }) => {
  const [username, setUsername] = useState('');
  const [matches, setMatches] = useState<SearchProfile[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const supabase = getSupabaseClient();
    const [memberRes, invitationRes] = await Promise.all([
      supabase.rpc('dong_group_members_list', { p_group_id: groupId }),
      supabase.rpc('dong_my_pending_invitations'),
    ]);
    if (!memberRes.error && Array.isArray(memberRes.data)) setMembers(memberRes.data as Member[]);
    if (!invitationRes.error && Array.isArray(invitationRes.data)) setInvitations(invitationRes.data as Invitation[]);
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  const searchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('');
    const normalized = username.trim().replace(/^@/, '').toLowerCase();
    if (normalized.length < 3) { setNotice('نام کاربری را حداقل با ۳ حرف وارد کنید.'); return; }
    setBusy(true);
    const { data, error } = await getSupabaseClient().rpc('dong_search_profiles', { p_query: normalized });
    setBusy(false);
    if (error) { setNotice('جست‌وجو انجام نشد. ابتدا فایل SQL همراه پروژه را اجرا کنید.'); return; }
    setMatches((data || []) as SearchProfile[]);
    if (!data?.length) setNotice('کاربری با این نام کاربری پیدا نشد.');
  };

  const invite = async (profile: SearchProfile) => {
    setBusy(true); setNotice('');
    const { error } = await getSupabaseClient().rpc('dong_send_invitation', { p_group_id: groupId, p_username: profile.username });
    setBusy(false);
    if (error) { setNotice(error.message.includes('already') ? 'این کاربر قبلاً عضو گروه است یا دعوت فعالی دارد.' : 'ارسال دعوت انجام نشد. مجوز و تنظیمات دیتابیس را بررسی کنید.'); return; }
    setNotice(`دعوت برای ${profile.display_name || profile.username} ارسال شد.`);
    setMatches([]); setUsername(''); await load();
  };

  const respond = async (invitationId: string, accept: boolean) => {
    setBusy(true); setNotice('');
    const { error } = await getSupabaseClient().rpc('dong_respond_invitation', { p_invitation_id: invitationId, p_accept: accept });
    setBusy(false);
    if (error) { setNotice('ثبت پاسخ دعوت انجام نشد. دوباره تلاش کنید.'); return; }
    setNotice(accept ? 'با موفقیت به گروه پیوستید.' : 'دعوت رد شد.');
    await load(); onChanged?.();
  };

  return <section className="bg-white dark:bg-[#0F1512] rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621] p-4 space-y-4">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2"><Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400"/><h3 className="font-cairo font-bold text-sm">اعضای گروه و دعوت دوستان</h3></div>
      <button type="button" onClick={() => void load()} className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="به‌روزرسانی"><RefreshCw className="w-4 h-4"/></button>
    </div>
    <form onSubmit={searchUsers} className="flex gap-2">
      <input value={username} onChange={e => setUsername(e.target.value)} placeholder="نام کاربری دوست، بدون @" autoComplete="off" className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm" />
      <button disabled={busy} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"><Search className="w-4 h-4"/> جست‌وجو</button>
    </form>
    {matches.length > 0 && <div className="space-y-2">{matches.map(profile => <div key={profile.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
      <div className="min-w-0"><div className="font-bold text-sm truncate">{profile.display_name || profile.username}</div><div dir="ltr" className="text-xs text-zinc-500 text-right">@{profile.username}</div></div>
      <button type="button" disabled={busy || profile.id === currentUserId} onClick={() => void invite(profile)} className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-emerald-700 text-white px-3 py-2 text-xs disabled:opacity-40"><UserPlus className="w-3.5 h-3.5"/> دعوت</button>
    </div>)}</div>}
    {notice && <p role="status" className="text-xs text-emerald-700 dark:text-emerald-400">{notice}</p>}
    <div className="space-y-2">
      <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400">اعضای ثبت‌شده</div>
      {members.length === 0 ? <p className="text-xs text-zinc-500">هنوز اطلاعات عضویت بارگذاری نشده است؛ اجرای SQL هماهنگ‌سازی لازم است.</p> : members.map(member => <div key={member.user_id} className="flex items-center justify-between gap-3 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
        <div className="min-w-0"><div className="text-sm font-semibold truncate">{member.display_name || member.username}</div><div dir="ltr" className="text-[11px] text-zinc-500 text-right">@{member.username}</div></div>
        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500"><Shield className="w-3 h-3"/>{roleLabel[member.role] || 'عضو'}</span>
      </div>)}
    </div>
    {invitations.filter(i => i.group_id !== groupId || i.status === 'pending').length > 0 && <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-400"><Bell className="w-4 h-4"/> دعوت‌های در انتظار شما</div>
      {invitations.map(inv => <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
        <div className="text-xs"><span className="font-bold">{inv.group_name}</span><span className="text-zinc-500"> — دعوت از طرف {inv.inviter_name}</span></div>
        <div className="flex gap-2"><button type="button" disabled={busy} onClick={() => void respond(inv.id, true)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 text-white px-3 py-2 text-xs"><Check className="w-3.5 h-3.5"/> قبول</button><button type="button" disabled={busy} onClick={() => void respond(inv.id, false)} className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-xs"><X className="w-3.5 h-3.5"/> رد</button></div>
      </div>)}
    </div>}
  </section>;
};
