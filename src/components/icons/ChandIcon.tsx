import React from 'react';

/**
 * مجموعه‌ی آیکون چندبوم. شبکه‌ی ۲۴. آیکون‌های ساده با currentColor و متغیرهای --icon-soft / --icon-accent.
 * آیکون‌های براق (ai، goals، quest، forecast، vip-crown) گرادیانت ثابت سبز دارند تا در هر تم یکسان بمانند.
 * تولیدشده از منبع واحد: icons/source.py + icons/extra.py + icons/generate.py
 */
export type ChandIconName = "dashboard"|"transactions"|"goals"|"dong"|"analytics"|"reminders"|"support"|"settings"|"subscription"|"ai"|"more"|"wallet"|"card"|"receipt"|"sms"|"bank"|"tag"|"cart"|"chart"|"calculator"|"calendar"|"clock"|"add"|"edit"|"trash"|"search"|"upload"|"copy"|"mic"|"send"|"logout"|"login"|"user"|"users"|"user-plus"|"home"|"crown"|"award"|"heart"|"shield"|"shield-alert"|"key"|"check"|"check-circle"|"alert"|"info"|"bell"|"lightbulb"|"loader"|"close"|"chevron-left"|"chevron-right"|"chevron-down"|"chevron-up"|"arrow-left"|"arrow-right"|"sun"|"moon"|"quest"|"forecast"|"vip-crown";

export interface ChandIconProps {
  name: ChandIconName;
  size?: number;
  className?: string;
  title?: string;
}

const ICON_CONTENT = (name: ChandIconName): React.ReactElement => {
  switch (name) {
    case "dashboard":
      return (<><rect x="3" y="3" width="8" height="10" rx="2.5" fill="var(--icon-soft)"/><rect x="13" y="3" width="8" height="6" rx="2.5"/><rect x="13" y="11" width="8" height="10" rx="2.5" fill="var(--icon-soft)"/><rect x="3" y="15" width="8" height="6" rx="2.5"/></>);
    case "transactions":
      return (<><path d="M7.5 4v15.5"/><path d="M4 16l3.5 3.5L11 16"/><path d="M16.5 20.5V5"/><path d="M13 8l3.5-3.5L20 8"/></>);
    case "goals":
      return (<><defs><linearGradient id="cb-chest-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34D399"/><stop offset="1" stopColor="#064E3B"/></linearGradient><linearGradient id="cb-chest-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10B981"/><stop offset="1" stopColor="#065F46"/></linearGradient></defs><path d="M4 11v7.4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V11z" fill="url(#cb-chest-body)" stroke="#064E3B" strokeWidth=".6"/><path d="M4 11a8 6 0 0 1 16 0z" fill="url(#cb-chest-lid)" stroke="#064E3B" strokeWidth=".6"/><path d="M4 11h16" stroke="#064E3B"/><rect x="10.6" y="10" width="2.8" height="4" rx=".8" fill="#FFFFFF" stroke="none"/><circle cx="7.6" cy="6.8" r="1.7" fill="#D1FAE5" stroke="#064E3B" strokeWidth=".5"/><circle cx="12" cy="5.4" r="2" fill="#34D399" stroke="#064E3B" strokeWidth=".5"/><circle cx="16.4" cy="6.8" r="1.7" fill="#D1FAE5" stroke="#064E3B" strokeWidth=".5"/></>);
    case "dong":
      return (<><circle cx="9" cy="8.5" r="3.2" fill="var(--icon-soft)"/><path d="M3.5 19.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.5"/><path d="M15.6 14.6c2.4-.3 4.5.9 5.1 3.6"/></>);
    case "analytics":
      return (<><path d="M12 3v9h9A9 9 0 1 1 12 3z" fill="var(--icon-soft)"/><path d="M15 3.4A9 9 0 0 1 20.6 9H15z"/></>);
    case "reminders":
      return (<><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" fill="var(--icon-soft)"/><path d="M10 20.5a2 2 0 0 0 4 0"/><circle cx="18.5" cy="5.5" r="2.3" fill="var(--icon-accent)" stroke="none"/></>);
    case "support":
      return (<><path d="M4.5 13.5v-1.5a7.5 7.5 0 0 1 15 0v1.5"/><rect x="3" y="13" width="4.5" height="6.5" rx="2.2" fill="var(--icon-soft)"/><rect x="16.5" y="13" width="4.5" height="6.5" rx="2.2" fill="var(--icon-soft)"/><path d="M19 19.5c0 1.4-2 2.3-5 2.3"/></>);
    case "settings":
      return (<><path d="M12 2.8l1.6 2.3 2.7-.6.6 2.7 2.4 1.4-1 2.6 1 2.6-2.4 1.4-.6 2.7-2.7-.6L12 21.2l-1.6-2.3-2.7.6-.6-2.7-2.4-1.4 1-2.6-1-2.6 2.4-1.4.6-2.7 2.7.6z" fill="var(--icon-soft)"/><circle cx="12" cy="12" r="3"/></>);
    case "subscription":
      return (<><path d="M3.5 8.5l4.5 4 4-6 4 6 4.5-4-1.8 10H5.3z" fill="var(--icon-soft)"/><path d="M5.3 18.5h13.4"/></>);
    case "ai":
      return (<><defs><radialGradient id="cb-ai-orb" cx="34%" cy="28%" r="78%"><stop offset="0" stopColor="#D1FAE5"/><stop offset=".35" stopColor="#34D399"/><stop offset=".75" stopColor="#059669"/><stop offset="1" stopColor="#064E3B"/></radialGradient></defs><ellipse cx="12" cy="21" rx="6.5" ry="1.3" fill="#064E3B" opacity=".25" stroke="none"/><circle cx="12" cy="11.5" r="8.5" fill="url(#cb-ai-orb)" stroke="#064E3B" strokeWidth=".6"/><ellipse cx="9" cy="7.9" rx="2.8" ry="1.5" fill="#FFFFFF" opacity=".55" stroke="none" transform="rotate(-25 9 7.9)"/><path d="M12 7.6l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="#FFFFFF" stroke="none"/><circle cx="17" cy="4.5" r=".9" fill="#34D399" stroke="none"/><circle cx="6" cy="18.5" r=".7" fill="#34D399" stroke="none"/></>);
    case "more":
      return (<><circle cx="5.5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.8" fill="currentColor" stroke="none"/></>);
    case "wallet":
      return (<><rect x="3" y="6" width="18" height="13" rx="3" fill="var(--icon-soft)"/><path d="M3 10.5h18"/><path d="M15.5 15h2.5"/><circle cx="17.5" cy="15" r="0.8" fill="var(--icon-accent)" stroke="none"/></>);
    case "card":
      return (<><rect x="2.5" y="5" width="19" height="14" rx="3" fill="var(--icon-soft)"/><path d="M2.5 10h19"/><path d="M6 15.5h4"/></>);
    case "receipt":
      return (<><path d="M6 3h12v18l-2.5-1.5L13.5 21 12 19.5 10.5 21 8 19.5 6 21z" fill="var(--icon-soft)"/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/></>);
    case "sms":
      return (<><path d="M4 5h16v11.5H9.5L5 20v-3.5H4z" fill="var(--icon-soft)"/><path d="M8 9.5h8M8 12.5h5"/></>);
    case "bank":
      return (<><path d="M3 9.5L12 4l9 5.5z" fill="var(--icon-soft)"/><path d="M5 10.5V17M9.5 10.5V17M14.5 10.5V17M19 10.5V17"/><path d="M3 20h18"/></>);
    case "tag":
      return (<><path d="M3.5 12.5V5.5a2 2 0 0 1 2-2h7l8 8-9 9z" fill="var(--icon-soft)"/><circle cx="8" cy="8" r="1.5" fill="var(--icon-accent)" stroke="none"/></>);
    case "cart":
      return (<><path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7" fill="var(--icon-soft)"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></>);
    case "chart":
      return (<><rect x="4" y="11" width="3.5" height="9" rx="1.2" fill="var(--icon-soft)"/><rect x="10.25" y="6" width="3.5" height="14" rx="1.2" fill="var(--icon-soft)"/><rect x="16.5" y="3.5" width="3.5" height="16.5" rx="1.2" fill="var(--icon-soft)"/></>);
    case "calculator":
      return (<><rect x="5" y="3" width="14" height="18" rx="2.5" fill="var(--icon-soft)"/><rect x="8" y="6.5" width="8" height="3" rx="1" /><path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17h.01M12 17h.01M15.5 17h.01"/></>);
    case "calendar":
      return (<><rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="var(--icon-soft)"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14" r="1.2" fill="var(--icon-accent)" stroke="none"/></>);
    case "clock":
      return (<><circle cx="12" cy="12" r="8.5" fill="var(--icon-soft)"/><path d="M12 7.5V12l3 2"/></>);
    case "add":
      return (<><circle cx="12" cy="12" r="9" fill="var(--icon-soft)"/><path d="M12 8v8M8 12h8"/></>);
    case "edit":
      return (<><path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16z" fill="var(--icon-soft)"/><path d="M13.5 6.5l4 4"/></>);
    case "trash":
      return (<><path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.5h5v2" /><path d="M6.5 6.5l1 13h9l1-13" fill="var(--icon-soft)"/><path d="M10 10.5v6M14 10.5v6"/></>);
    case "search":
      return (<><circle cx="11" cy="11" r="6.8" fill="var(--icon-soft)"/><path d="M16 16l4.5 4.5"/></>);
    case "upload":
      return (<><path d="M4 15.5v3a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-3"/><path d="M12 15V4M8 8l4-4 4 4"/></>);
    case "copy":
      return (<><rect x="8.5" y="8.5" width="12" height="12" rx="2.8" fill="var(--icon-soft)"/><path d="M15.5 5.5V5a2.5 2.5 0 0 0-2.5-2.5H5A2.5 2.5 0 0 0 2.5 5v8A2.5 2.5 0 0 0 5 15.5h.5"/></>);
    case "mic":
      return (<><rect x="8.5" y="3" width="7" height="12" rx="3.5" fill="var(--icon-soft)"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/></>);
    case "send":
      return (<><path d="M21 3L10.5 13.5"/><path d="M21 3l-6.5 18-3.5-7.5L3 10.5z" fill="var(--icon-soft)"/></>);
    case "logout":
      return (<><path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5"/></>);
    case "login":
      return (<><path d="M10 4.5h7.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10"/><path d="M14 12H3.5M7 8.5L3.5 12 7 15.5"/></>);
    case "user":
      return (<><circle cx="12" cy="8.5" r="4" fill="var(--icon-soft)"/><path d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/></>);
    case "users":
      return (<><circle cx="9" cy="8.5" r="3.5" fill="var(--icon-soft)"/><path d="M2.5 20c.6-3.4 3-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.8.9 2.8 2.8 3 5.2"/></>);
    case "user-plus":
      return (<><circle cx="9.5" cy="8.5" r="4" fill="var(--icon-soft)"/><path d="M2.5 20c.6-3.4 3.2-5.5 7-5.5"/><path d="M18.5 12.5v6M15.5 15.5h6"/></>);
    case "home":
      return (<><path d="M3.5 11L12 4l8.5 7V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" fill="var(--icon-soft)"/><path d="M9.5 21v-6h5v6"/></>);
    case "crown":
      return (<><path d="M3.5 8l4.5 4 4-6 4 6 4.5-4-1.8 10H5.3z" fill="var(--icon-soft)"/></>);
    case "award":
      return (<><circle cx="12" cy="9" r="6" fill="var(--icon-soft)"/><path d="M8.5 14.2L7 21l5-2.5 5 2.5-1.5-6.8"/></>);
    case "heart":
      return (<><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="var(--icon-soft)"/></>);
    case "shield":
      return (<><path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 9.5-4.4-1.2-7.5-4.9-7.5-9.5V6z" fill="var(--icon-soft)"/><path d="M9 12l2.2 2.2L15.5 10"/></>);
    case "shield-alert":
      return (<><path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 9.5-4.4-1.2-7.5-4.9-7.5-9.5V6z" fill="var(--icon-soft)"/><path d="M12 8.5v4.5"/><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none"/></>);
    case "key":
      return (<><circle cx="8" cy="12" r="4.5" fill="var(--icon-soft)"/><path d="M12.5 12H21M18 12v3.5M15.5 12v2.5"/></>);
    case "check":
      return (<><path d="M4.5 12.5l4.8 4.8L19.5 7.5"/></>);
    case "check-circle":
      return (<><circle cx="12" cy="12" r="9" fill="var(--icon-soft)"/><path d="M7.8 12.3l2.9 2.9 5.5-5.8"/></>);
    case "alert":
      return (<><path d="M12 3.8l9 16H3z" fill="var(--icon-soft)"/><path d="M12 10v4"/><circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none"/></>);
    case "info":
      return (<><circle cx="12" cy="12" r="9" fill="var(--icon-soft)"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none"/></>);
    case "bell":
      return (<><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" fill="var(--icon-soft)"/><path d="M10 20.5a2 2 0 0 0 4 0"/></>);
    case "lightbulb":
      return (<><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2V16h5.2v-.1c0-.8.3-1.5.9-2A6 6 0 0 0 12 3z" fill="var(--icon-soft)"/></>);
    case "loader":
      return (<><path d="M12 3a9 9 0 1 0 9 9" /></>);
    case "close":
      return (<><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></>);
    case "chevron-left":
      return (<><path d="M15 5.5L8.5 12l6.5 6.5"/></>);
    case "chevron-right":
      return (<><path d="M9 5.5l6.5 6.5L9 18.5"/></>);
    case "chevron-down":
      return (<><path d="M5.5 9l6.5 6.5L18.5 9"/></>);
    case "chevron-up":
      return (<><path d="M5.5 15l6.5-6.5L18.5 15"/></>);
    case "arrow-left":
      return (<><path d="M19.5 12H5M11 6l-6 6 6 6"/></>);
    case "arrow-right":
      return (<><path d="M4.5 12H19M13 6l6 6-6 6"/></>);
    case "sun":
      return (<><circle cx="12" cy="12" r="4" fill="var(--icon-soft)"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></>);
    case "moon":
      return (<><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="var(--icon-soft)"/></>);
    case "quest":
      return (<><defs><linearGradient id="cb-quest-card" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF"/><stop offset="1" stopColor="#D1FAE5"/></linearGradient><linearGradient id="cb-quest-badge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#34D399"/><stop offset="1" stopColor="#059669"/></linearGradient></defs><rect x="3.5" y="4.5" width="17" height="16" rx="4" fill="url(#cb-quest-card)"/><path d="M7.4 10.6l1.6 1.6 3-3.2"/><path d="M13.6 9.9h3.6M7.4 16h9.8"/><circle cx="17.6" cy="5.4" r="3.1" fill="url(#cb-quest-badge)" stroke="#064E3B" strokeWidth=".8"/><path d="M17.6 3.9l.5 1.1 1.2.2-.9.8.2 1.2-1-.6-1 .6.2-1.2-.9-.8 1.2-.2z" fill="#FFFFFF" stroke="none"/></>);
    case "forecast":
      return (<><defs><radialGradient id="cb-fc-orb" cx="36%" cy="30%" r="76%"><stop offset="0" stopColor="#FFFFFF"/><stop offset=".45" stopColor="#D1FAE5"/><stop offset="1" stopColor="#059669"/></radialGradient></defs><ellipse cx="12" cy="21.3" rx="6" ry="1.2" fill="#064E3B" opacity=".25" stroke="none"/><circle cx="12" cy="11" r="8.5" fill="url(#cb-fc-orb)" stroke="#064E3B" strokeWidth=".6"/><path d="M6.8 14.2l3-3 2.4 2 4-4.2"/><path d="M14.6 8.2h2.6v2.6"/><path d="M8 17.4h8" strokeDasharray="1.2 1.6" opacity=".7"/></>);
    case "vip-crown":
      return (<><defs><linearGradient id="cb-vip-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6EE7B7"/><stop offset=".55" stopColor="#10B981"/><stop offset="1" stopColor="#064E3B"/></linearGradient></defs><path d="M3 8.5l4.6 4 4.4-6.5 4.4 6.5 4.6-4-2 10.5H5z" fill="url(#cb-vip-body)" stroke="#064E3B" strokeWidth=".7"/><path d="M5 19.4h14" stroke="#064E3B" strokeWidth="1.6"/><path d="M6.6 15.6l1.1-3.6" stroke="#FFFFFF" opacity=".7" strokeWidth="1"/><circle cx="12" cy="13.6" r="1.4" fill="#FFFFFF" stroke="none"/><circle cx="3" cy="8" r="1.2" fill="#D1FAE5" stroke="none"/><circle cx="21" cy="8" r="1.2" fill="#D1FAE5" stroke="none"/><circle cx="12" cy="4.6" r="1.3" fill="#D1FAE5" stroke="none"/></>);
    default:
      return <></>;
  }
};

export const ChandIcon: React.FC<ChandIconProps> = ({ name, size = 24, className, title }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    role={title ? 'img' : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    focusable="false"
    data-icon={name}
  >
    {title && <title>{title}</title>}
    {ICON_CONTENT(name)}
  </svg>
);

export default ChandIcon;
