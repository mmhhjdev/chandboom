# Single source of truth for the Chandboom icon set.
# Style: 24x24 grid, 1.8 stroke, round caps/joins, duotone soft fill (var(--icon-soft)),
# accent dots use var(--icon-accent). Colors come from CSS variables so light/dark just works.
SOFT = 'fill="var(--icon-soft)"'
ACC = 'fill="var(--icon-accent)" stroke="none"'

ICONS = {
  # ---------- navigation ----------
  "dashboard": f'<rect x="3" y="3" width="8" height="10" rx="2.5" {SOFT}/><rect x="13" y="3" width="8" height="6" rx="2.5"/><rect x="13" y="11" width="8" height="10" rx="2.5" {SOFT}/><rect x="3" y="15" width="8" height="6" rx="2.5"/>',
  "transactions": '<path d="M7.5 4v15.5"/><path d="M4 16l3.5 3.5L11 16"/><path d="M16.5 20.5V5"/><path d="M13 8l3.5-3.5L20 8"/>',
  "goals": f'<circle cx="12" cy="12" r="8.5" {SOFT}/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" {ACC}/><path d="M12 12l5.5-5.5"/>',
  "dong": f'<circle cx="9" cy="8.5" r="3.2" {SOFT}/><path d="M3.5 19.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5"/><circle cx="16.8" cy="9.2" r="2.5"/><path d="M15.6 14.6c2.4-.3 4.5.9 5.1 3.6"/>',
  "analytics": f'<path d="M12 3v9h9A9 9 0 1 1 12 3z" {SOFT}/><path d="M15 3.4A9 9 0 0 1 20.6 9H15z"/>',
  "reminders": f'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" {SOFT}/><path d="M10 20.5a2 2 0 0 0 4 0"/><circle cx="18.5" cy="5.5" r="2.3" {ACC}/>',
  "support": f'<path d="M4.5 13.5v-1.5a7.5 7.5 0 0 1 15 0v1.5"/><rect x="3" y="13" width="4.5" height="6.5" rx="2.2" {SOFT}/><rect x="16.5" y="13" width="4.5" height="6.5" rx="2.2" {SOFT}/><path d="M19 19.5c0 1.4-2 2.3-5 2.3"/>',
  "settings": f'<path d="M12 2.8l1.6 2.3 2.7-.6.6 2.7 2.4 1.4-1 2.6 1 2.6-2.4 1.4-.6 2.7-2.7-.6L12 21.2l-1.6-2.3-2.7.6-.6-2.7-2.4-1.4 1-2.6-1-2.6 2.4-1.4.6-2.7 2.7.6z" {SOFT}/><circle cx="12" cy="12" r="3"/>',
  "subscription": f'<path d="M3.5 8.5l4.5 4 4-6 4 6 4.5-4-1.8 10H5.3z" {SOFT}/><path d="M5.3 18.5h13.4"/>',
  "ai": f'<path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8z" {SOFT}/><path d="M19 3v3M17.5 4.5h3" />',
  "more": '<circle cx="5.5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.8" fill="currentColor" stroke="none"/>',

  # ---------- money & finance ----------
  "wallet": f'<rect x="3" y="6" width="18" height="13" rx="3" {SOFT}/><path d="M3 10.5h18"/><path d="M15.5 15h2.5"/><circle cx="17.5" cy="15" r="0.8" {ACC}/>',
  "card": f'<rect x="2.5" y="5" width="19" height="14" rx="3" {SOFT}/><path d="M2.5 10h19"/><path d="M6 15.5h4"/>',
  "receipt": f'<path d="M6 3h12v18l-2.5-1.5L13.5 21 12 19.5 10.5 21 8 19.5 6 21z" {SOFT}/><path d="M9 8.5h6M9 12h6M9 15.5h3.5"/>',
  "sms": f'<path d="M4 5h16v11.5H9.5L5 20v-3.5H4z" {SOFT}/><path d="M8 9.5h8M8 12.5h5"/>',
  "bank": f'<path d="M3 9.5L12 4l9 5.5z" {SOFT}/><path d="M5 10.5V17M9.5 10.5V17M14.5 10.5V17M19 10.5V17"/><path d="M3 20h18"/>',
  "tag": f'<path d="M3.5 12.5V5.5a2 2 0 0 1 2-2h7l8 8-9 9z" {SOFT}/><circle cx="8" cy="8" r="1.5" {ACC}/>',
  "cart": f'<path d="M3 4h2.5l2.2 10.5h10.6L20.5 7H7" {SOFT}/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/>',
  "chart": f'<rect x="4" y="11" width="3.5" height="9" rx="1.2" {SOFT}/><rect x="10.25" y="6" width="3.5" height="14" rx="1.2" {SOFT}/><rect x="16.5" y="3.5" width="3.5" height="16.5" rx="1.2" {SOFT}/>',
  "calculator": f'<rect x="5" y="3" width="14" height="18" rx="2.5" {SOFT}/><rect x="8" y="6.5" width="8" height="3" rx="1" /><path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17h.01M12 17h.01M15.5 17h.01"/>',
  "calendar": f'<rect x="3.5" y="5" width="17" height="15.5" rx="3" {SOFT}/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="14" r="1.2" {ACC}/>',
  "clock": f'<circle cx="12" cy="12" r="8.5" {SOFT}/><path d="M12 7.5V12l3 2"/>',

  # ---------- actions ----------
  "add": f'<circle cx="12" cy="12" r="9" {SOFT}/><path d="M12 8v8M8 12h8"/>',
  "edit": f'<path d="M4 20h4l10.5-10.5a2.8 2.8 0 0 0-4-4L4 16z" {SOFT}/><path d="M13.5 6.5l4 4"/>',
  "trash": f'<path d="M4.5 6.5h15"/><path d="M9.5 6.5V4.5h5v2" /><path d="M6.5 6.5l1 13h9l1-13" {SOFT}/><path d="M10 10.5v6M14 10.5v6"/>',
  "search": f'<circle cx="11" cy="11" r="6.8" {SOFT}/><path d="M16 16l4.5 4.5"/>',
  "upload": f'<path d="M4 15.5v3a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-3"/><path d="M12 15V4M8 8l4-4 4 4"/>',
  "copy": f'<rect x="8.5" y="8.5" width="12" height="12" rx="2.8" {SOFT}/><path d="M15.5 5.5V5a2.5 2.5 0 0 0-2.5-2.5H5A2.5 2.5 0 0 0 2.5 5v8A2.5 2.5 0 0 0 5 15.5h.5"/>',
  "mic": f'<rect x="8.5" y="3" width="7" height="12" rx="3.5" {SOFT}/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6"/>',
  "send": f'<path d="M21 3L10.5 13.5"/><path d="M21 3l-6.5 18-3.5-7.5L3 10.5z" {SOFT}/>',
  "logout": f'<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M10 12h10.5M17 8.5l3.5 3.5-3.5 3.5"/>',
  "login": f'<path d="M10 4.5h7.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H10"/><path d="M14 12H3.5M7 8.5L3.5 12 7 15.5"/>',

  # ---------- people & account ----------
  "user": f'<circle cx="12" cy="8.5" r="4" {SOFT}/><path d="M4.5 20.5c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6"/>',
  "users": f'<circle cx="9" cy="8.5" r="3.5" {SOFT}/><path d="M2.5 20c.6-3.4 3-5.5 6.5-5.5s5.9 2.1 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.8.9 2.8 2.8 3 5.2"/>',
  "user-plus": f'<circle cx="9.5" cy="8.5" r="4" {SOFT}/><path d="M2.5 20c.6-3.4 3.2-5.5 7-5.5"/><path d="M18.5 12.5v6M15.5 15.5h6"/>',
  "home": f'<path d="M3.5 11L12 4l8.5 7V20a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1z" {SOFT}/><path d="M9.5 21v-6h5v6"/>',
  "crown": f'<path d="M3.5 8l4.5 4 4-6 4 6 4.5-4-1.8 10H5.3z" {SOFT}/>',
  "award": f'<circle cx="12" cy="9" r="6" {SOFT}/><path d="M8.5 14.2L7 21l5-2.5 5 2.5-1.5-6.8"/>',
  "heart": f'<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" {SOFT}/>',

  # ---------- status & feedback ----------
  "shield": f'<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 9.5-4.4-1.2-7.5-4.9-7.5-9.5V6z" {SOFT}/><path d="M9 12l2.2 2.2L15.5 10"/>',
  "shield-alert": f'<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.3-7.5 9.5-4.4-1.2-7.5-4.9-7.5-9.5V6z" {SOFT}/><path d="M12 8.5v4.5"/><circle cx="12" cy="16" r="0.9" fill="currentColor" stroke="none"/>',
  "key": f'<circle cx="8" cy="12" r="4.5" {SOFT}/><path d="M12.5 12H21M18 12v3.5M15.5 12v2.5"/>',
  "check": '<path d="M4.5 12.5l4.8 4.8L19.5 7.5"/>',
  "check-circle": f'<circle cx="12" cy="12" r="9" {SOFT}/><path d="M7.8 12.3l2.9 2.9 5.5-5.8"/>',
  "alert": f'<path d="M12 3.8l9 16H3z" {SOFT}/><path d="M12 10v4"/><circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none"/>',
  "info": f'<circle cx="12" cy="12" r="9" {SOFT}/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none"/>',
  "bell": f'<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" {SOFT}/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  "lightbulb": f'<path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2V16h5.2v-.1c0-.8.3-1.5.9-2A6 6 0 0 0 12 3z" {SOFT}/>',
  "loader": '<path d="M12 3a9 9 0 1 0 9 9" />',
  "close": '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',

  # ---------- navigation chevrons & arrows (RTL-aware: use chevron-left for "forward") ----------
  "chevron-left": '<path d="M15 5.5L8.5 12l6.5 6.5"/>',
  "chevron-right": '<path d="M9 5.5l6.5 6.5L9 18.5"/>',
  "chevron-down": '<path d="M5.5 9l6.5 6.5L18.5 9"/>',
  "chevron-up": '<path d="M5.5 15l6.5-6.5L18.5 15"/>',
  "arrow-left": '<path d="M19.5 12H5M11 6l-6 6 6 6"/>',
  "arrow-right": '<path d="M4.5 12H19M13 6l6 6-6 6"/>',

  # ---------- theme ----------
  "sun": f'<circle cx="12" cy="12" r="4" {SOFT}/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  "moon": f'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" {SOFT}/>',
}

if __name__ == '__main__':
    print(len(ICONS), 'icons')
