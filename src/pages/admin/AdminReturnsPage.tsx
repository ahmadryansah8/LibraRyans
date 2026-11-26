import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LoanStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { Loan } from '../../types/library';
import { diffDaysISO, formatCurrencyIDR, formatDateID, getTodayISO } from '../../utils/formatters';

export const AdminReturnsPage: React.FC = () => {
  const { db, processReturn } = useLibrary();
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'belum_kembali' | 'terlambat' | 'riwayat'>('belum_kembali');
  const [returnTarget, setReturnTarget] = useState<Loan | null>(null);

  const today = getTodayISO();
  const userMap = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db.users]);
  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);

  const unreturnedCount = db.loans.filter(
    (l) => l.status === 'dipinjam' || l.status === 'terlambat'
  ).length;
  const overdueCount = db.loans.filter((l) => l.status === 'terlambat').length;
  const returnedCount = db.loans.filter((l) => l.status === 'dikembalikan').length;

  const filteredLoans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.loans
      .filter((l) => {
        if (filterMode === 'belum_kembali' && l.status !== 'dipinjam' && l.status !== 'terlambat') {
          return false;
        }
        if (filterMode === 'terlambat' && l.status !== 'terlambat') {
          return false;
        }
        if (filterMode === 'riwayat' && l.status !== 'dikembalikan') {
          return false;
        }
        if (!q) return true;
        const memberName = userMap.get(l.memberId)?.name.toLowerCase() ?? '';
        const bookTitle = bookMap.get(l.bookId)?.title.toLowerCase() ?? '';
        return (
          l.id.toLowerCase().includes(q) ||
          memberName.includes(q) ||
          bookTitle.includes(q)
        );
      })
      .sort((a, b) => {
        if (a.status === 'terlambat' && b.status !== 'terlambat') return -1;
        if (b.status === 'terlambat' && a.status !== 'terlambat') return 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [bookMap, db.loans, filterMode, search, userMap]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Pengelolaan Pengembalian Buku
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Proses pengembalian buku yang dipinjam, pantau status keterlambatan, dan perbarui stok otomatis.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Belum Dikembalikan</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-[#0F1E36] tabular-nums">
            {unreturnedCount}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <p className="text-xs font-medium text-rose-700">Melewati Jatuh Tempo</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-rose-700 tabular-nums">
            {overdueCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Sudah Dikembalikan</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-teal-700 tabular-nums">
            {returnedCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setFilterMode('belum_kembali')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              filterMode === 'belum_kembali'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belum Dikembalikan ({unreturnedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('terlambat')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              filterMode === 'terlambat'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Terlambat ({overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('riwayat')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
              filterMode === 'riwayat'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Kembali ({returnedCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari anggota, buku, atau ID..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Judul Buku</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Keterlambatan / Tgl Kembali</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    Tidak ada daftar transaksi untuk ditampilkan pada tab ini.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const member = userMap.get(loan.memberId);
                  const book = bookMap.get(loan.bookId);
                  const lateDays =
                    loan.status === 'terlambat'
                      ? Math.max(1, diffDaysISO(loan.dueDate, today))
                      : loan.returnDate && loan.returnDate > loan.dueDate
                      ? diffDaysISO(loan.dueDate, loan.returnDate)
                      : 0;
                  const fine = lateDays * db.settings.dailyFineIdr;

                  return (
                    <tr
                      key={loan.id}
                      className={`transition-colors ${
                        loan.status === 'terlambat' ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                        {loan.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {member?.name ?? 'Anggota'}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-800">
                        {book?.title ?? loan.bookId}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(loan.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {loan.returnDate ? (
                          <div>
                            <span className="font-mono text-slate-700 tabular-nums">
                              Aktual: {formatDateID(loan.returnDate)}
                            </span>
                            {lateDays > 0 && (
                              <span className="ml-2 text-rose-600 font-medium">
                                (Telat {lateDays} hr)
                              </span>
                            )}
                          </div>
                        ) : loan.status === 'terlambat' ? (
                          <div className="inline-flex items-center gap-1.5 font-medium text-rose-700">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="tabular-nums">
                              Telat {lateDays} hari · Denda {formatCurrencyIDR(fine)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Dalam masa pinjam</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <LoanStatusBadge status={loan.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {loan.status === 'dipinjam' || loan.status === 'terlambat' ? (
                          <button
                            type="button"
                            onClick={() => setReturnTarget(loan)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F1E36] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Proses Pengembalian</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Selesai</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(returnTarget)}
        onClose={() => setReturnTarget(null)}
        onConfirm={() => {
          if (returnTarget) {
            processReturn(returnTarget.id);
          }
        }}
        variant="primary"
        title="Konfirmasi Pengembalian Buku"
        description={`Konfirmasi bahwa buku "${
          returnTarget ? bookMap.get(returnTarget.bookId)?.title : ''
        }" telah diterima kembali? Stok buku tersedia akan bertambah otomatis.`}
        confirmLabel="Selesaikan Pengembalian"
      />
    </div>
  );
};
