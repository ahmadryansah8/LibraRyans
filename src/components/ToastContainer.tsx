import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useLibrary();

  if (toasts.length === 0) return null;

  return (
    <div
      className="no-print fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2.5"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styleMap = {
          success: {
            border: 'border-teal-200 bg-white',
            icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-600" />,
          },
          error: {
            border: 'border-rose-200 bg-white',
            icon: <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />,
          },
          info: {
            border: 'border-sky-200 bg-white',
            icon: <Info className="h-5 w-5 shrink-0 text-sky-600" />,
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-lg transition-all ${styleMap.border}`}
          >
            {styleMap.icon}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Tutup notifikasi"
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
