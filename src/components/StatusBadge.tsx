import React from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Clock,
  BookOpen,
  XCircle,
} from 'lucide-react';
import { BookStatus, LoanStatus, MemberStatus } from '../types/library';

export const LoanStatusBadge: React.FC<{ status: LoanStatus }> = ({ status }) => {
  const map: Record<LoanStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    menunggu: {
      label: 'Menunggu Persetujuan',
      cls: 'text-amber-700 bg-amber-50/90 border-amber-200',
      icon: <Clock className="h-3.5 w-3.5 shrink-0" />,
    },
    dipinjam: {
      label: 'Dipinjam',
      cls: 'text-sky-800 bg-sky-50/90 border-sky-200',
      icon: <BookOpen className="h-3.5 w-3.5 shrink-0" />,
    },
    dikembalikan: {
      label: 'Dikembalikan',
      cls: 'text-teal-800 bg-teal-50/90 border-teal-200',
      icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
    },
    terlambat: {
      label: 'Terlambat',
      cls: 'text-rose-700 bg-rose-50/90 border-rose-200',
      icon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
    },
    ditolak: {
      label: 'Ditolak',
      cls: 'text-slate-600 bg-slate-100 border-slate-200',
      icon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
    },
  };

  const item = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${item.cls}`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const BookStatusBadge: React.FC<{ status: BookStatus; availableCopies?: number }> = ({
  status,
  availableCopies,
}) => {
  if (status === 'arsip') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        <Archive className="h-3.5 w-3.5 shrink-0" />
        <span>Diarsipkan</span>
      </span>
    );
  }
  if (status === 'dipinjam_penuh' || availableCopies === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        <span>Dipinjam Penuh</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      <span>Tersedia</span>
    </span>
  );
};

export const MemberStatusBadge: React.FC<{ status: MemberStatus }> = ({ status }) => {
  if (status === 'nonaktif') {
    return (
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        <span>Nonaktif</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
      <span>Aktif</span>
    </span>
  );
};
