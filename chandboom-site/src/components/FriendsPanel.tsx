import React, { useCallback, useEffect, useState } from 'react';

import {
  friendsOverview,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  type FriendEntry,
} from '../services/friendsService';
import { ChandIcon } from './icons/ChandIcon';

type Tab = 'friends' | 'incoming' | 'outgoing';

const tabLabel: Record<Tab, string> = {
  friends: 'دوستان',
  incoming: 'دریافتی',
  outgoing: 'ارسال‌شده',
};

const stateToTab: Record<FriendEntry['state'], Tab> = {
  friend: 'friends',
  incoming: 'incoming',
  outgoing: 'outgoing',
};

export const FriendsPanel: React.FC = () => {
  const [entries, setEntries] = useState<FriendEntry[]>([]);
  const [tab, setTab] = useState<Tab>('friends');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await friendsOverview());
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'فهرست دوستان بارگذاری نشد.' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (clean.length < 3) {
      setNotice({ type: 'error', text: 'نام کاربری را کامل وارد کنید.' });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const result = await sendFriendRequest(clean);
      setNotice({
        type: 'ok',
        text: result === 'accepted' ? 'درخواست دوستی شما پذیرفته شد؛ حالا در لیست دوستان است.' : 'درخواست دوستی ارسال شد.',
      });
      setUsername('');
      await load();
      setTab(result === 'accepted' ? 'friends' : 'outgoing');
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'ارسال درخواست انجام نشد.' });
    } finally {
      setBusy(false);
    }
  };

  const respond = async (entry: FriendEntry, accept: boolean) => {
    setBusy(true);
    try {
      await respondFriendRequest(entry.friendship_id, accept);
      setNotice({ type: 'ok', text: accept ? 'درخواست پذیرفته شد.' : 'درخواست رد شد.' });
      await load();
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'پاسخ ثبت نشد.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: FriendEntry) => {
    const question = entry.state === 'friend' ? 'این دوست از لیست حذف شود؟' : 'این درخواست لغو شود؟';
    if (!window.confirm(question)) return;
    setBusy(true);
    try {
      await removeFriend(entry.user_id);
      await load();
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'عملیات انجام نشد.' });
    } finally {
      setBusy(false);
    }
  };

  const visible = entries.filter((entry) => stateToTab[entry.state] === tab);
  const count = (t: Tab) => entries.filter((entry) => stateToTab[entry.state] === t).length;

  return (
    <div className="p-6 bg-white dark:bg-[#0E1511] rounded-3xl border border-[#E2E8E4] dark:border-[#1F2E27] shadow-xs space-y-5">
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#E2E8E4] dark:border-[#1F2E27]">
        <div>
          <h3 className="font-cairo font-bold text-base text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ChandIcon name="users" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>دوستان من</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            دوستانتان را با نام کاربری اضافه کنید. بعداً موقع ساخت گروه دنگ، از همین لیست انتخاب می‌کنید.
          </p>
        </div>
      </div>

      <form onSubmit={addFriend} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 right-3 flex items-center text-zinc-400 font-bold">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="نام کاربری دوستتان"
            maxLength={25}
            dir="ltr"
            className="w-full pr-8 pl-3 py-2.5 rounded-xl border border-[#E2E8E4] dark:border-[#1A2621] bg-transparent text-sm text-zinc-900 dark:text-zinc-100 focus:outline-emerald-600"
          />
        </div>
        <button
          type="submit"
          disabled={busy || username.trim().length < 3}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ChandIcon name="user-plus" className="w-4 h-4" />
          افزودن دوست
        </button>
      </form>

      {notice && (
        <p
          role="status"
          className={`text-xs font-bold rounded-xl px-3 py-2 border ${
            notice.type === 'ok'
              ? 'text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30'
              : 'text-zinc-900 dark:text-zinc-100 border-zinc-900 dark:border-zinc-200 bg-zinc-100 dark:bg-zinc-900'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="flex gap-2">
        {(Object.keys(tabLabel) as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              tab === t
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-[#E2E8E4] dark:border-[#1A2621] text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {tabLabel[t]} ({count(t)})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-zinc-500 py-6 text-center">
          {tab === 'friends' && 'هنوز دوستی ندارید. با نام کاربری یک دوست اضافه کنید.'}
          {tab === 'incoming' && 'درخواست جدیدی برای شما نیست.'}
          {tab === 'outgoing' && 'درخواستی در انتظار پاسخ نیست.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((entry) => (
            <li
              key={entry.friendship_id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#E2E8E4] dark:border-[#1A2621]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {(entry.display_name || entry.username).trim().charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                    {entry.display_name || `@${entry.username}`}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono" dir="ltr">@{entry.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {entry.state === 'incoming' && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => respond(entry, true)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <ChandIcon name="check" className="w-3.5 h-3.5" /> پذیرش
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => respond(entry, false)}
                      className="px-3 py-1.5 rounded-xl border border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 text-xs font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      <ChandIcon name="close" className="w-3.5 h-3.5" /> رد
                    </button>
                  </>
                )}
                {entry.state === 'outgoing' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(entry)}
                    className="px-3 py-1.5 rounded-xl border border-zinc-900 dark:border-zinc-200 text-zinc-900 dark:text-zinc-100 text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    لغو درخواست
                  </button>
                )}
                {entry.state === 'friend' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(entry)}
                    className="px-3 py-1.5 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    حذف از دوستان
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
