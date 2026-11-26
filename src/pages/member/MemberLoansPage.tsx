import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Clock, XCircle } from 'lucide-react';
import { BookCover } from '../../components/BookCover';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LoanStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { Loan } from '../../types/library';
import { diffDaysISO, formatCurrencyIDR, formatDateID, getTodayISO } from '../../utils/formatters';

interface MemberLoansPageProps {
  onOpenCatalog: () => void;
}

export const MemberLoansPage: React.FC<MemberLoansPageProps> = ({ onOpenCatalog }) => {
  const { db, currentUser, cancelPendingLoan } = useLibrary();
  const [cancelTarget, setCancelTarget] = useState<Loan | null>(null);
  const today = getTodayISO();

  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);

  const activeLoans = useMemo(() => {
    if (!currentUser) return [];
    return db.loans
      .filter(
        (l) =>
          l.memberId === currentUser.id &&
          (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'menunggu')
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [currentUser, db.loans]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Peminjaman Saya
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pantau status pengajuan persetujuan, buku yang sedang dipinjam, dan batas waktu pengembalian.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCatalog}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
        >
          <BookOpen className="h-4 w-4" />
          <span>Pinjam Buku Lain</span>
        </button>
      </div>

      {activeLoans.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
            Belum ada peminjaman aktif
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Telusuri katalog buku untuk mengajukan peminjaman koleksi pertama Anda.
          </p>
          <button
            type="button"
            onClick={onOpenCatalog}
            className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Buka Katalog Buku
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeLoans.map((loan) => {
            const book = bookMap.get(loan.bookId);
            const daysLeft = diffDaysISO(today, loan.dueDate);
            const isLate = loan.status === 'terlambat';
            const lateDays = isLate ? Math.max(1, diffDaysISO(loan.dueDate, today)) : 0;

            return (
              <div
                key={loan.id}
                className={`flex flex-col justify-between rounded-xl border bg-white p-5 ${
                  isLate ? 'border-rose-300' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {book && <BookCover book={book} size="sm" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-medium text-slate-500">{loan.id}</span>
                      <LoanStatusBadge status={loan.status} />
                    </div>
                    <h3 className="mt-1.5 font-display text-base font-bold text-slate-900">
                      {book?.title ?? loan.bookId}
                    </h3>
                    <p className="text-xs text-slate-500">{book?.author}</p>

                    <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-3 text-xs">
                      <div>
                        <span className="block text-slate-400">Tanggal Pengajuan / Pinjam</span>
                        <span className="font-mono font-semibold text-slate-800 tabular-nums">
                          {formatDateID(loan.borrowDate)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Batas Pengembalian</span>
                        <span className="font-mono font-semibold text-slate-800 tabular-nums">
                          {formatDateID(loan.dueDate)}
                        </span>
                      </div>
                    </div>

                    {loan.notes && (
                      <p className="mt-2 text-xs text-slate-500">Catatan: {loan.notes}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  {loan.status === 'menunggu' ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
                        <Clock className="h-3.5 w-3.5" />
                        Menunggu konfirmasi Admin
                      </span>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(loan)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Batalkan</span>
                      </button>
                    </>
                  ) : isLate ? (
                    <div className="flex w-full items-center justify-between text-xs font-semibold text-rose-700">
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        Terlambat {lateDays} hari
                      </span>
                      <span className="font-mono tabular-nums">
                        Estimasi Denda: {formatCurrencyIDR(lateDays * db.settings.dailyFineIdr)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex w-full items-center justify-between text-xs">
                      <span className="text-slate-500">Status masa pinjam</span>
                      <span
                        className={`font-semibold tabular-nums ${
                          daysLeft <= 3 ? 'text-amber-700' : 'text-teal-700'
                        }`}
                      >
                        Sisa waktu {daysLeft} hari lagi
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) cancelPendingLoan(cancelTarget.id);
        }}
        title="Batalkan Pengajuan Peminjaman"
        description={`Apakah Anda ingin membatalkan pengajuan peminjaman ${cancelTarget?.id}?`}
        confirmLabel="Ya, Batalkan"
      />
    </div>
  );
};
