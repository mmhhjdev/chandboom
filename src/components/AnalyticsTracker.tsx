import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

/**
 * Renders nothing; listens to react-router location changes and
 * reports each navigation to GA4 as a page_view (SPA-safe).
 * Place it inside <BrowserRouter> near the app root.
 */
export default function AnalyticsTracker(): null {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}
