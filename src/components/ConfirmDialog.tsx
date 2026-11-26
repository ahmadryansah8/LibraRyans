import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <div className="flex items-start gap-3.5">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            variant === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-700'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors whitespace-nowrap ${
            variant === 'danger'
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-slate-900 hover:bg-slate-800'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
