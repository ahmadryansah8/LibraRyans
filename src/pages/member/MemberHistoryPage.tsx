import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { LoanStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { LoanStatus } from '../../types/library';
import { formatDateID } from '../../utils/formatters';

export const MemberHistoryPage: React.FC = () => {
  const { db, currentUser } = useLibrary();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | LoanStatus>('semua');

  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);

  const history = useMemo(() => {
    if (!currentUser) return [];
    const q = search.trim().toLowerCase();
    return db.loans
      .filter((l) => {
        if (l.memberId !== currentUser.id) return false;
        if (statusFilter !== 'semua' && l.status !== statusFilter) return false;
        if (!q) return true;
        const title = bookMap.get(l.bookId)?.title.toLowerCase() ?? '';
        return l.id.toLowerCase().includes(q) || title.includes(q);
      })
      .sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));
  }, [bookMap, currentUser, db.loans, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Riwayat Transaksi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Catatan lengkap seluruh peminjaman, pengembalian, dan status pengajuan Anda.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID transaksi atau judul buku..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'semua' | LoanStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="semua">Semua Status</option>
            <option value="menunggu">Menunggu</option>
            <option value="dipinjam">Dipinjam</option>
            <option value="dikembalikan">Dikembalikan</option>
            <option value="terlambat">Terlambat</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ID Transaksi</th>
                <th className="px-4 py-3">Judul Buku</th>
                <th className="px-4 py-3">Tgl Pinjam</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Tgl Kembali Aktual</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    Belum ada riwayat transaksi yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                history.map((loan) => {
                  const book = bookMap.get(loan.bookId);
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                        {loan.id}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{book?.title ?? loan.bookId}</p>
                        <p className="text-xs text-slate-500">{book?.author}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(loan.borrowDate)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(loan.dueDate)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(loan.returnDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <LoanStatusBadge status={loan.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
