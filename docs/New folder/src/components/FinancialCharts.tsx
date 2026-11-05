import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  PlusCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { Transaction } from '../types';
import { formatToman, toPersianDigits, formatShamsiDate } from '../utils/formatters';
import { FinancialChartsErrorBoundary } from './FinancialChartsErrorBoundary';

interface FinancialChartsProps {
  transactions?: Transaction[] | null;
  onOpenAddTransaction?: () => void;
}

const PALETTE = [
  '#10B981', // emerald
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#EC4899', // pink
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#A855F7', // purple
];

const PersianChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-[#0E1713]/95 border border-[#E2E8E4] dark:border-[#1F2E26] p-3 rounded-2xl shadow-xl backdrop-blur-md text-right text-xs font-cairo">
        {label && <p className="font-bold text-zinc-800 dark:text-zinc-200 mb-1.5">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-zinc-500 flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color || entry.fill }}
              />
              {entry.name}:
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {formatToman(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FinancialChartsContent: React.FC<FinancialChartsProps> = ({
  transactions,
  onOpenAddTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'comparison' | 'timeline' | 'categories'>('comparison');

  const safeTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return transactions.filter(
      (tx) => tx && typeof tx.amount === 'number' && !isNaN(tx.amount) && tx.amount > 0
    );
  }, [transactions]);

  // 1. Calculate Category Breakdown Data
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tx of safeTransactions) {
      if (tx.type === 'expense') {
        const cat = tx.category || 'سایر';
        map[cat] = (map[cat] || 0) + tx.amount;
      }
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [safeTransactions]);

  // 2. Calculate Monthly Spending & Income Comparison
  const monthlyData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; income: number; expense: number }> = {};

    for (const tx of safeTransactions) {
      const dateStr = tx.date || tx.created_at || new Date().toISOString();
      let key = 'نامشخص';
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const formatter = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'short',
          });
          key = formatter.format(d);
        }
      } catch {
        key = 'امروز';
      }

      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: key, income: 0, expense: 0 };
      }

      if (tx.type === 'income') {
        monthlyMap[key].income += tx.amount;
      } else {
        monthlyMap[key].expense += tx.amount;
      }
    }

    const result = Object.values(monthlyMap);
    return result.length > 0
      ? result
      : [
          { month: 'ماه جاری', income: 0, expense: 0 },
        ];
  }, [safeTransactions]);

  // 3. Calculate 30-Day Cumulative Timeline
  const timelineData = useMemo(() => {
    const dailyMap: Record<string, { date: string; expense: number; income: number }> = {};

    // Sort ascending by date
    const sorted = [...safeTransactions].sort(
      (a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime()
    );

    for (const tx of sorted.slice(-20)) {
      const d = tx.date ? formatShamsiDate(tx.date) : 'امروز';
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, expense: 0, income: 0 };
      }
      if (tx.type === 'expense') {
        dailyMap[d].expense += tx.amount;
      } else {
        dailyMap[d].income += tx.amount;
      }
    }

    return Object.values(dailyMap);
  }, [safeTransactions]);

  // Empty state handling
  if (safeTransactions.length === 0) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs text-center flex flex-col items-center justify-center font-cairo">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-500/20">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          هنوز داده‌ای برای نمایش وجود ندارد
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
          برای فعال‌سازی نمودارهای درآمد، مخارج و تفکیک دسته‌بندی‌ها، اولین تراکنش مالی خود را ثبت
          کنید.
        </p>
        {onOpenAddTransaction && (
          <button
            onClick={onOpenAddTransaction}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ثبت اولین تراکنش</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0F1512] border border-[#E2E8E4] dark:border-[#1A2621] shadow-xs space-y-6 font-cairo">
      {/* Top Header & View Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8E4] dark:border-[#1A2621]">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>تحلیل تصویری و نمودارهای مالی</span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            بررسی هوشمندانه تراز درآمد در برابر هزینه، دسته‌بندی‌ها و روند ماهانه
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-[#141F1A] rounded-2xl border border-[#E2E8E4] dark:border-[#1F2E26] self-start sm:self-auto text-xs">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'comparison'
                ? 'bg-white dark:bg-[#1C2C24] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>درآمد در برابر هزینه</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-white dark:bg-[#1C2C24] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>روند مخارج</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-[#1C2C24] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>تفکیک دسته‌ها</span>
          </button>
        </div>
      </div>

      {/* Chart View Content */}
      <div className="w-full h-72 sm:h-80">
        {activeTab === 'comparison' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23352B" opacity={0.25} />
              <XAxis
                dataKey="month"
                stroke="#888888"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${toPersianDigits(Math.round(val / 1000000))}M`}
              />
              <Tooltip content={<PersianChartTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontFamily: 'Cairo' }}
                formatter={(value) => (value === 'income' ? 'درآمدها' : 'هزینه‌ها')}
              />
              <Bar dataKey="income" name="income" fill="#10B981" radius={[8, 8, 0, 0]} maxBarSize={45} />
              <Bar dataKey="expense" name="expense" fill="#EF4444" radius={[8, 8, 0, 0]} maxBarSize={45} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'timeline' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#23352B" opacity={0.25} />
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${toPersianDigits(Math.round(val / 1000000))}M`}
              />
              <Tooltip content={<PersianChartTooltip />} />
              <Area
                type="monotone"
                dataKey="expense"
                name="هزینه روزانه"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorExpense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeTab === 'categories' && (
          <div className="flex flex-col sm:flex-row items-center justify-center h-full gap-4">
            <div className="w-full sm:w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<PersianChartTooltip />} />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category Badges Grid */}
            <div className="w-full sm:w-1/2 max-h-60 overflow-y-auto space-y-2 text-xs pr-1">
              {categoryData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-[#131F19] border border-[#E2E8E4] dark:border-[#1E2D24]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
                    />
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{item.name}</span>
                  </div>
                  <span className="font-mono text-zinc-500 font-bold">{formatToman(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const FinancialCharts: React.FC<FinancialChartsProps> = (props) => {
  return (
    <FinancialChartsErrorBoundary fallbackMessage="نمایش نمودار به دلیل عدم سازگاری موقت مقادیر با خطا مواجه شد.">
      <FinancialChartsContent {...props} />
    </FinancialChartsErrorBoundary>
  );
};
