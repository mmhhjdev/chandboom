import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // ✅ اضافه کردن BrowserRouter
import App from './App.tsx';
import './index.css';
import AnalyticsTracker from './components/AnalyticsTracker'; // ✅ ایمپورت ترکر

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* ✅ تمام اپلیکیشن باید داخل BrowserRouter باشد */}
    <BrowserRouter>
      {/* ✅ ترکر آنالیتیکس باید قبل از کامپوننت اصلی باشد */}
      <AnalyticsTracker />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
