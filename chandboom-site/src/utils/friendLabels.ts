/**
 * برچسب اعضای گروه دنگ از روی دوستان انتخاب‌شده.
 * هر عضو باید یک برچسب یکتا داشته باشد، چون تسویه با برچسب کار می‌کند:
 * - اسم نمایشی دوست استفاده می‌شود.
 * - اگر دو دوست یا یک دوست با «من» هم‌نام باشند، برچسب به @یوزرنیم تبدیل می‌شود.
 * - مالک گروه همیشه با ownerLabel (پیش‌فرض «من») به‌عنوان اولین عضو می‌آید.
 */
export interface FriendForLabel {
  username: string;
  display_name: string | null;
}

export function buildGroupMemberLabels(friends: FriendForLabel[], ownerLabel = 'من'): string[] {
  const base = friends.map((f) => (f.display_name || '').trim() || `@${f.username}`);
  const counts = new Map<string, number>();
  base.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1));

  const labels = friends.map((f, index) => {
    const name = base[index];
    const clashes = (counts.get(name) ?? 0) > 1 || name === ownerLabel;
    return clashes ? `@${f.username}` : name;
  });

  return [ownerLabel, ...labels];
}
