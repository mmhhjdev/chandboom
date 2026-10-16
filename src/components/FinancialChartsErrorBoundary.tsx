import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Crash-protection ErrorBoundary specifically for financial charts
 * Ensures rendering anomalies never break the main application interface
 */
export class FinancialChartsErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FinancialCharts ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-3xl bg-zinc-50 dark:bg-[#121A16] border border-dashed border-rose-300 dark:border-rose-900/60 text-center flex flex-col items-center justify-center font-cairo">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            خطا در بارگذاری نمودار مالی
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-4">
            {this.props.fallbackMessage ||
              'متاسفانه در پردازش داده‌های نمودار خطایی رخ داده است. می‌توانید مجدداً تلاش نمایید.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بارگذاری مجدد نمودار</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
