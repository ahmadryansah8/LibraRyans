import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookCheck,
  BookOpen,
  CalendarClock,
  Library,
  Users,
} from 'lucide-react';
import {
  CategoryBorrowChart,
  MonthlyBorrowTrendChart,
  TransactionActivityChart,
} from '../../components/Charts';
import { LoanStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { formatDateID, getTodayISO } from '../../utils/formatters';

interface AdminOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateTab }) => {
  const { db } = useLibrary();

  const stats = useMemo(() => {
    const today = getTodayISO();
    const totalTitles = db.books.length;
    const totalCopies = db.books.reduce((s, b) => s + b.totalCopies, 0);
    const availableCopies = db.books.reduce((s, b) => s + b.availableCopies, 0);
    const totalMembers = db.users.filter((u) => u.role === 'member').length;
    const activeMembers = db.users.filter((u) => u.role === 'member' && u.status === 'aktif').length;
    const currentlyBorrowed = db.loans.filter(
      (l) => l.status === 'dipinjam' || l.status === 'terlambat'
    ).length;
    const todayLoans = db.loans.filter(
      (l) => l.borrowDate === today && l.status !== 'ditolak'
    ).length;
    const overdueCount = db.loans.filter((l) => l.status === 'terlambat').length;
    const pendingCount = db.loans.filter((l) => l.status === 'menunggu').length;

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      totalMembers,
      activeMembers,
      currentlyBorrowed,
      todayLoans,
      overdueCount,
      pendingCount,
    };
  }, [db.books, db.loans, db.users]);

  const userMap = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db.users]);
  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);

  const recentLoans = useMemo(() => {
    return [...db.loans]
      .sort((a, b) => b.borrowDate.localeCompare(a.borrowDate))
      .slice(0, 7);
  }, [db.loans]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Ringkasan Dashboard Admin
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Pantau statistik koleksi, keanggotaan, dan transaksi sirkulasi secara langsung.
          </p>
        </div>

        {stats.pendingCount > 0 && (
          <button
            type="button"
            onClick={() => onNavigateTab('loans')}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-100 whitespace-nowrap"
          >
            <CalendarClock className="h-4 w-4" />
            <span className="tabular-nums">{stats.pendingCount} pengajuan menunggu persetujuan</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 6 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Koleksi Buku</span>
            <Library className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
            {stats.totalTitles}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {stats.totalCopies} total eksemplar terdaftar
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Anggota</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
            {stats.totalMembers}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {stats.activeMembers} anggota berstatus aktif
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Buku Sedang Dipinjam</span>
            <BookOpen className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold text-sky-700 tabular-nums">
            {stats.currentlyBorrowed}
          </p>
          <p className="mt-1 text-xs text-slate-500">Transaksi berjalan saat ini</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Buku Tersedia</span>
            <BookCheck className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold text-teal-700 tabular-nums">
            {stats.availableCopies}
          </p>
          <p className="mt-1 text-xs text-slate-500">Eksemplar siap dipinjam</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Peminjaman Hari Ini</span>
            <CalendarClock className="h-4 w-4 text-cyan-600" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
            {stats.todayLoans}
          </p>
          <p className="mt-1 text-xs text-slate-500">Permintaan &amp; pinjaman hari ini</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pengembalian Terlambat</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2.5 font-display text-3xl font-bold text-rose-600 tabular-nums">
            {stats.overdueCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Melewati tanggal jatuh tempo</p>
        </div>
      </div>

      {/* Data Visualizations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Tren Peminjaman &amp; Pengembalian Bulanan
              </h2>
              <p className="text-xs text-slate-500">Pergerakan sirkulasi 6 bulan terakhir</p>
            </div>
          </div>
          <MonthlyBorrowTrendChart loans={db.loans} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-slate-900">
              Distribusi Status Transaksi
            </h2>
            <p className="text-xs text-slate-500">Proporsi status seluruh transaksi tercatat</p>
          </div>
          <TransactionActivityChart loans={db.loans} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="font-display text-base font-bold text-slate-900">
            Kategori Buku Paling Banyak Dipinjam
          </h2>
          <p className="text-xs text-slate-500">Akumulasi frekuensi peminjaman per kategori koleksi</p>
        </div>
        <CategoryBorrowChart
          loans={db.loans}
          books={db.books}
          categories={db.categories}
        />
      </div>

      {/* Recent Transactions Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Aktivitas Transaksi Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Pembaruan otomatis setiap kali peminjaman atau pengembalian diproses
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('loans')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            <span>Kelola Semua Transaksi</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Nama Anggota</th>
                <th className="px-5 py-3">Judul Buku</th>
                <th className="px-5 py-3">Tanggal Pinjam</th>
                <th className="px-5 py-3">Jatuh Tempo / Kembali</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLoans.map((loan) => {
                const member = userMap.get(loan.memberId);
                const book = bookMap.get(loan.bookId);
                return (
                  <tr key={loan.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-mono text-xs font-medium text-slate-600 tabular-nums whitespace-nowrap">
                      {loan.id}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {member?.name ?? 'Anggota'}
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-slate-700">
                      {book?.title ?? loan.bookId}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {formatDateID(loan.borrowDate)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                      {loan.returnDate
                        ? `Kembali ${formatDateID(loan.returnDate)}`
                        : formatDateID(loan.dueDate)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <LoanStatusBadge status={loan.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
