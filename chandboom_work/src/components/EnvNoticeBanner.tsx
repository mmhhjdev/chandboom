import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ShieldAlert, Key } from 'lucide-react';
import { validateEnvironment, EnvValidationReport } from '../utils/envValidation';

export const EnvNoticeBanner: React.FC = () => {
  const [report, setReport] = useState<EnvValidationReport | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('chandboom_env_notice_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
        return;
      }
    } catch {}

    const rep = validateEnvironment();
    if (!rep.isValid) {
      setReport(rep);
    }
  }, []);

  if (isDismissed || !report || report.missingVariables.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('chandboom_env_notice_dismissed', 'true');
    } catch {}
  };

  return (
    <aside aria-label="وضعیت پیکربندی متغیرهای محیطی" className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-2.5 text-xs font-cairo transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>پیکربندی محیطی:</strong> برخی متغیرهای محیطی سامانه (
            <code className="mx-1 px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-[11px]">
              {report.missingVariables.join(', ')}
            </code>
            ) در محیط جاری یافت نشد. لطفاً در تنظیمات مخزن گیت‌هاب (GitHub Secrets) یا فایل .env مقداردهی فرمایید.
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition cursor-pointer"
          title="بستن اعلان"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
