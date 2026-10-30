import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center p-4 font-cairo text-right" dir="rtl">
          <div className="max-w-md w-full bg-[#121A16] border border-emerald-900/60 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-white font-cairo">
              خطایی در اجرای برنامه رخ داده است
            </h2>

            <p className="text-xs text-zinc-400 leading-relaxed">
              متاسفانه مشکلی غیرمنتظره به وجود آمد. داده‌های شما امن هستند. لطفاً صفحه را تازه‌سازی کنید یا به صفحه اصلی بازگردید.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 text-[10px] text-zinc-400 font-mono text-left max-h-24 overflow-y-auto" dir="ltr">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بارگذاری مجدد صفحه</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
