import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from '../lib/analytics';
import { getConsent, onConsentChange } from '../lib/consent';

/**
 * Tracks page views across client-side route changes, only after the visitor accepts analytics.
 * Must be mounted inside a <BrowserRouter>.
 */
export const AnalyticsTracker: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const enableIfConsented = () => {
      if (getConsent() === 'granted') initGA();
    };
    enableIfConsented();
    return onConsentChange(enableIfConsented);
  }, []);

  useEffect(() => {
    if (getConsent() === 'granted') {
      trackPageView(location.pathname + location.search, document.title);
    }
  }, [location]);

  return null;
};
