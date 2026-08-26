import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ConfirmState {
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const showSuccess = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type: 'success' }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const showError = (message: string) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type: 'error' }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ title, message, resolve });
    });
  };

  const handleConfirmClose = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showConfirm }}>
      {children}
      
      {/* Toast notifications container */}
      {createPortal(
        <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm w-full">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-2xl shadow-lg text-white text-xs font-bold flex items-center gap-3 animate-in slide-in-from-top duration-200 ${
                t.type === 'success' ? 'bg-status-success' : 'bg-status-error'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {t.type === 'success' ? 'check_circle' : 'error'}
              </span>
              <span>{t.message}</span>
            </div>
          ))}
        </div>,
        document.body
      )}

      {/* React Confirmation Modal */}
      {confirmState && createPortal(
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl shadow-xl max-w-sm w-full p-5 sm:p-6 animate-in fade-in duration-150">
            <h2 className="font-headline-sm text-lg font-bold text-primary mb-2">
              {confirmState.title}
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 font-medium">
              {confirmState.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleConfirmClose(false)}
                className="px-4 py-2 border border-border-subtle rounded-xl text-xs font-medium text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmClose(true)}
                className="btn-primary-vibrant px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
