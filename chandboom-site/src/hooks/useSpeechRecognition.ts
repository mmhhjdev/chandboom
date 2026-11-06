import { useState, useEffect, useRef, useCallback } from 'react';

// Extend window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface UseSpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = 'fa-IR',
    continuous = false,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  // Keep options in ref to avoid re-instantiating recognition unnecessarily
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);

    if (!isSupported) {
      const msg = 'مرورگر شما از ورودی صوتی پشتیبانی نمی‌کند. لطفاً از مرورگرهای کروم، اج یا سافاری استفاده فرمایید.';
      setError(msg);
      onErrorRef.current?.(msg);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const SpeechRecognitionClass =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();

      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let currentFinal = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            currentFinal += text;
          } else {
            currentInterim += text;
          }
        }

        if (currentFinal) {
          setFinalTranscript((prev) => {
            const next = prev ? `${prev} ${currentFinal}` : currentFinal;
            setTranscript(next);
            onResultRef.current?.(next, true);
            return next;
          });
          setInterimTranscript('');
        } else if (currentInterim) {
          setInterimTranscript(currentInterim);
          onResultRef.current?.(currentInterim, false);
        }
      };

      recognition.onerror = (event: any) => {
        let errorMsg = 'خطا در دریافت صدا';
        if (event.error === 'not-allowed') {
          errorMsg = 'دسترسی به میکروفون داده نشده است. لطفاً دسترسی مرورگر را فعال کنید.';
        } else if (event.error === 'no-speech') {
          errorMsg = 'صدایی شنیده نشد. لطفاً نزدیک‌تر به میکروفون صحبت کنید.';
        } else if (event.error === 'network') {
          errorMsg = 'خطای اتصال به سرور تشخیص صدا';
        }

        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const msg = err?.message || 'خطا در راه‌اندازی ضبط صدا';
      setError(msg);
      onErrorRef.current?.(msg);
      setIsListening(false);
    }
  }, [continuous, interimResults, isSupported, lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    finalTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    toggleListening,
    resetTranscript,
  };
}

export default useSpeechRecognition;
