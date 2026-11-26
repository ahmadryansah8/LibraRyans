import React, { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  CategoryBorrowChart,
  MonthlyBorrowTrendChart,
  TransactionActivityChart,
} from '../../components/Charts';
import { BookStatusBadge, LoanStatusBadge, MemberStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { LoanStatus } from '../../types/library';
import {
  diffDaysISO,
  downloadCSV,
  formatCurrencyIDR,
  formatDateID,
  getTodayISO,
} from '../../utils/formatters';

type ReportTab =
  | 'peminjaman'
  | 'pengembalian'
  | 'keterlambatan'
  | 'anggota'
  | 'koleksi'
  | 'terpopuler';

export const AdminReportsPage: React.FC = () => {
  const { db, notify } = useLibrary();

  const [activeTab, setActiveTab] = useState<ReportTab>('peminjaman');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | LoanStatus>('semua');

  const today = getTodayISO();
  const userMap = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db.users]);
  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);
  const catMap = useMemo(() => new Map(db.categories.map((c) => [c.id, c.name])), [db.categories]);

  // Base filtered loans respecting date, category, and status filters
  const filteredLoans = useMemo(() => {
    return db.loans.filter((l) => {
      const book = bookMap.get(l.bookId);
      if (categoryFilter !== 'semua' && book?.categoryId !== categoryFilter) return false;
      if (statusFilter !== 'semua' && l.status !== statusFilter) return false;
      if (dateFrom && l.borrowDate < dateFrom) return false;
      if (dateTo && l.borrowDate > dateTo) return false;
      return true;
    });
  }, [bookMap, categoryFilter, dateFrom, dateTo, db.loans, statusFilter]);

  const tabLoans = useMemo(() => {
    switch (activeTab) {
      case 'pengembalian':
        return filteredLoans.filter((l) => l.status === 'dikembalikan');
      case 'keterlambatan':
        return filteredLoans.filter((l) => l.status === 'terlambat');
      case 'peminjaman':
      default:
        return filteredLoans;
    }
  }, [activeTab, filteredLoans]);

  const memberActivityRows = useMemo(() => {
    const members = db.users.filter((u) => u.role === 'member');
    return members.map((m) => {
      const mLoans = filteredLoans.filter((l) => l.memberId === m.id);
      const active = mLoans.filter((l) => l.status === 'dipinjam').length;
      const returned = mLoans.filter((l) => l.status === 'dikembalikan').length;
      const overdue = mLoans.filter((l) => l.status === 'terlambat').length;
      return {
        member: m,
        total: mLoans.length,
        active,
        returned,
        overdue,
      };
    });
  }, [db.users, filteredLoans]);

  const collectionRows = useMemo(() => {
    return db.books.filter((b) => categoryFilter === 'semua' || b.categoryId === categoryFilter);
  }, [categoryFilter, db.books]);

  const popularBookRows = useMemo(() => {
    const counts = new Map<string, { total: number; active: number; returned: number }>();
    filteredLoans.forEach((l) => {
      if (l.status === 'ditolak') return;
      const curr = counts.get(l.bookId) ?? { total: 0, active: 0, returned: 0 };
      curr.total += 1;
      if (l.status === 'dipinjam' || l.status === 'terlambat') curr.active += 1;
      if (l.status === 'dikembalikan') curr.returned += 1;
      counts.set(l.bookId, curr);
    });

    return collectionRows
      .map((book) => ({
        book,
        ...(counts.get(book.id) ?? { total: 0, active: 0, returned: 0 }),
      }))
      .sort((a, b) => b.total - a.total);
  }, [collectionRows, filteredLoans]);

  const reportSummary = useMemo(() => {
    const totalFiltered = filteredLoans.length;
    const totalReturned = filteredLoans.filter((l) => l.status === 'dikembalikan').length;
    const totalOverdue = filteredLoans.filter((l) => l.status === 'terlambat').length;
    const totalActive = filteredLoans.filter((l) => l.status === 'dipinjam' || l.status === 'terlambat').length;
    return { totalFiltered, totalReturned, totalOverdue, totalActive };
  }, [filteredLoans]);

  const reportTabs: { key: ReportTab; label: string }[] = [
    { key: 'peminjaman', label: 'Peminjaman Buku' },
    { key: 'pengembalian', label: 'Pengembalian' },
    { key: 'keterlambatan', label: 'Keterlambatan' },
    { key: 'anggota', label: 'Aktivitas Anggota' },
    { key: 'koleksi', label: 'Statistik Koleksi' },
    { key: 'terpopuler', label: 'Buku Terpopuler' },
  ];

  const handleExportCSV = () => {
    const stamp = today;
    if (activeTab === 'peminjaman' || activeTab === 'pengembalian' || activeTab === 'keterlambatan') {
      const headers = [
        'ID Transaksi',
        'Nama Anggota',
        'Judul Buku',
        'Kategori',
        'Tanggal Pinjam',
        'Jatuh Tempo',
        'Tanggal Kembali',
        'Status',
      ];
      const rows = tabLoans.map((l) => {
        const book = bookMap.get(l.bookId);
        return [
          l.id,
          userMap.get(l.memberId)?.name ?? '-',
          book?.title ?? l.bookId,
          book ? catMap.get(book.categoryId) ?? '-' : '-',
          l.borrowDate,
          l.dueDate,
          l.returnDate ?? '-',
          l.status,
        ];
      });
      downloadCSV(`laporan-${activeTab}-libraryan-${stamp}.csv`, headers, rows);
    } else if (activeTab === 'anggota') {
      const headers = ['ID Anggota', 'Nama', 'Email', 'Program/Divisi', 'Status', 'Total Transaksi', 'Aktif', 'Dikembalikan', 'Terlambat'];
      const rows = memberActivityRows.map((r) => [
        r.member.id,
        r.member.name,
        r.member.email,
        r.member.department,
        r.member.status,
        r.total,
        r.active,
        r.returned,
        r.overdue,
      ]);
      downloadCSV(`laporan-aktivitas-anggota-${stamp}.csv`, headers, rows);
    } else if (activeTab === 'koleksi') {
      const headers = ['ID Buku', 'Judul', 'Penulis', 'ISBN', 'Kategori', 'Tahun', 'Total Eksemplar', 'Tersedia', 'Status'];
      const rows = collectionRows.map((b) => [
        b.id,
        b.title,
        b.author,
        b.isbn,
        catMap.get(b.categoryId) ?? '-',
        b.year,
        b.totalCopies,
        b.availableCopies,
        b.status,
      ]);
      downloadCSV(`laporan-statistik-koleksi-${stamp}.csv`, headers, rows);
    } else {
      const headers = ['Peringkat', 'ID Buku', 'Judul Buku', 'Penulis', 'Kategori', 'Total Dipinjam', 'Sedang Dipinjam', 'Dikembalikan'];
      const rows = popularBookRows.map((r, idx) => [
        idx + 1,
        r.book.id,
        r.book.title,
        r.book.author,
        catMap.get(r.book.categoryId) ?? '-',
        r.total,
        r.active,
        r.returned,
      ]);
      downloadCSV(`laporan-buku-terpopuler-${stamp}.csv`, headers, rows);
    }
    notify('success', 'Laporan Diekspor', 'Berkas CSV berhasil diunduh ke perangkat Anda.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Sistem Pelaporan Otomatis
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Laporan dihasilkan langsung dari data transaksi sirkulasi, anggota, dan inventaris koleksi terkini.
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="h-4 w-4 text-teal-700" />
            <span>Ekspor CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="no-print flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-2">
        {reportTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#0F1E36] text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="no-print rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Dari Tanggal</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Sampai Tanggal</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Kategori Koleksi</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              <option value="semua">Semua Kategori</option>
              {db.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Status Transaksi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'semua' | LoanStatus)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu">Menunggu Persetujuan</option>
              <option value="dipinjam">Dipinjam</option>
              <option value="dikembalikan">Dikembalikan</option>
              <option value="terlambat">Terlambat</option>
              <option value="ditolak">Ditolak</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Transaksi Tersaring</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-[#0F1E36] tabular-nums">
            {reportSummary.totalFiltered}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Sedang Berjalan</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-sky-700 tabular-nums">
            {reportSummary.totalActive}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Telah Dikembalikan</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-teal-700 tabular-nums">
            {reportSummary.totalReturned}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Terlambat</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-rose-600 tabular-nums">
            {reportSummary.totalOverdue}
          </p>
        </div>
      </div>

      {/* Visualization Chart matched to selected report */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-display text-base font-bold text-slate-900">
          Visualisasi Statistik — {reportTabs.find((t) => t.key === activeTab)?.label}
        </h2>
        {activeTab === 'koleksi' || activeTab === 'terpopuler' ? (
          <CategoryBorrowChart loans={filteredLoans} books={db.books} categories={db.categories} />
        ) : activeTab === 'keterlambatan' || activeTab === 'anggota' ? (
          <TransactionActivityChart loans={filteredLoans} />
        ) : (
          <MonthlyBorrowTrendChart loans={filteredLoans} />
        )}
      </div>

      {/* Report Data Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <p className="font-display text-sm font-bold text-slate-900">
            Tabel Rincian: {reportTabs.find((t) => t.key === activeTab)?.label}
          </p>
          <p className="text-xs text-slate-500">Dicetak pada {formatDateID(today)} · {db.settings.libraryName}</p>
        </div>

        <div className="overflow-x-auto">
          {(activeTab === 'peminjaman' || activeTab === 'pengembalian' || activeTab === 'keterlambatan') && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Judul Buku</th>
                  <th className="px-4 py-3">Tgl Pinjam</th>
                  <th className="px-4 py-3">Jatuh Tempo</th>
                  <th className="px-4 py-3">Tgl Kembali / Denda</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tabLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                      Tidak ada data transaksi pada rentang filter ini.
                    </td>
                  </tr>
                ) : (
                  tabLoans.map((l) => {
                    const lateDays =
                      l.status === 'terlambat' ? Math.max(1, diffDaysISO(l.dueDate, today)) : 0;
                    return (
                      <tr key={l.id}>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600 tabular-nums">{l.id}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-900">
                          {userMap.get(l.memberId)?.name ?? '-'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {bookMap.get(l.bookId)?.title ?? l.bookId}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-slate-600">
                          {formatDateID(l.borrowDate)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-slate-600">
                          {formatDateID(l.dueDate)}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs tabular-nums text-slate-600">
                          {l.status === 'terlambat'
                            ? `${lateDays} hr (${formatCurrencyIDR(lateDays * db.settings.dailyFineIdr)})`
                            : formatDateID(l.returnDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          <LoanStatusBadge status={l.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'anggota' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Anggota</th>
                  <th className="px-4 py-3">Program / Divisi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total Pinjam</th>
                  <th className="px-4 py-3 text-right">Sedang Dipinjam</th>
                  <th className="px-4 py-3 text-right">Dikembalikan</th>
                  <th className="px-4 py-3 text-right">Terlambat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberActivityRows.map((row) => (
                  <tr key={row.member.id}>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-900">{row.member.name}</p>
                      <p className="text-xs text-slate-500">{row.member.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{row.member.department}</td>
                    <td className="px-4 py-2.5">
                      <MemberStatusBadge status={row.member.status} />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">{row.total}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sky-700">{row.active}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-teal-700">{row.returned}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-rose-600">{row.overdue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'koleksi' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Judul Buku</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Total Eks</th>
                  <th className="px-4 py-3 text-right">Tersedia</th>
                  <th className="px-4 py-3 text-right">Dipinjam</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {collectionRows.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{b.id}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{b.title}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{catMap.get(b.categoryId)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{b.totalCopies}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-teal-700">{b.availableCopies}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sky-700">
                      {b.totalCopies - b.availableCopies}
                    </td>
                    <td className="px-4 py-2.5">
                      <BookStatusBadge status={b.status} availableCopies={b.availableCopies} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'terpopuler' && (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Peringkat</th>
                  <th className="px-4 py-3">Judul Buku</th>
                  <th className="px-4 py-3">Penulis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Total Dipinjam</th>
                  <th className="px-4 py-3 text-right">Aktif</th>
                  <th className="px-4 py-3 text-right">Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {popularBookRows.map((row, idx) => (
                  <tr key={row.book.id}>
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-slate-700 tabular-nums">
                      #{idx + 1}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">{row.book.title}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">{row.book.author}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      {catMap.get(row.book.categoryId)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-[#0F1E36] tabular-nums">
                      {row.total}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-sky-700">
                      {row.active}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-teal-700">
                      {row.returned}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
