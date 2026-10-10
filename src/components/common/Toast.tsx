import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5 ${
              toast.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
                : toast.type === 'info'
                ? 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/80 dark:text-sky-200 dark:border-sky-800'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-[#15291E] dark:text-emerald-200 dark:border-[#224A32]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              ) : toast.type === 'info' ? (
                <Info className="w-5 h-5 text-sky-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Dismiss toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (message: string) => {
        console.log('Toast:', message);
      },
    };
  }
  return context;
};
