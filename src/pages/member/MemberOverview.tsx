import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  Heart,
} from 'lucide-react';
import { BookCover } from '../../components/BookCover';
import { BookDetailModal } from '../../components/BookDetailModal';
import { MemberMonthlyActivityChart } from '../../components/Charts';
import { BookStatusBadge, LoanStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { Book } from '../../types/library';
import { diffDaysISO, formatDateID, getTodayISO } from '../../utils/formatters';

interface MemberOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const MemberOverview: React.FC<MemberOverviewProps> = ({ onNavigateTab }) => {
  const { db, currentUser } = useLibrary();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const today = getTodayISO();

  const myLoans = useMemo(() => {
    if (!currentUser) return [];
    return db.loans
      .filter((l) => l.memberId === currentUser.id)
      .sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));
  }, [currentUser, db.loans]);

  const activeBorrowed = useMemo(
    () => myLoans.filter((l) => l.status === 'dipinjam' || l.status === 'terlambat'),
    [myLoans]
  );
  const pendingLoans = useMemo(
    () => myLoans.filter((l) => l.status === 'menunggu'),
    [myLoans]
  );
  const dueSoonOrLate = useMemo(
    () =>
      activeBorrowed.filter((l) => {
        const remaining = diffDaysISO(today, l.dueDate);
        return remaining <= 3;
      }),
    [activeBorrowed, today]
  );
  const myFavoritesCount = useMemo(
    () => (currentUser ? db.favorites.filter((f) => f.memberId === currentUser.id).length : 0),
    [currentUser, db.favorites]
  );

  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);
  const catMap = useMemo(() => new Map(db.categories.map((c) => [c.id, c.name])), [db.categories]);

  // Personalized recommendations: available books not currently borrowed by member
  const recommendations = useMemo(() => {
    const borrowedBookIds = new Set(myLoans.map((l) => l.bookId));
    return db.books
      .filter((b) => b.status === 'tersedia' && b.availableCopies > 0 && !borrowedBookIds.has(b.id))
      .slice(0, 4);
  }, [db.books, myLoans]);

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Dashboard Anggota
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#0F1E36]">
            Selamat datang kembali, {currentUser?.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kuota peminjaman Anda saat ini{' '}
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {activeBorrowed.length + pendingLoans.length} / {db.settings.maxBooksPerMember}
            </span>{' '}
            buku.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('catalog')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <BookOpen className="h-4 w-4" />
          <span>Jelajahi Katalog</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sedang Dipinjam</span>
            <BookOpen className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-sky-700 tabular-nums">
            {activeBorrowed.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Buku di tangan Anda</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menunggu Persetujuan</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-amber-700 tabular-nums">
            {pendingLoans.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Pengajuan baru diproses Admin</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mendekati Jatuh Tempo</span>
            <CalendarClock className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-rose-600 tabular-nums">
            {dueSoonOrLate.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Tenggat &le; 3 hari atau terlambat</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Koleksi Favorit</span>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
            {myFavoritesCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">Disimpan untuk dibaca nanti</p>
        </div>
      </div>

      {/* Active Loans & Due Date Cards + Personal Stats Chart */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Peminjaman Aktif &amp; Tenggat Pengembalian
              </h2>
              <p className="text-xs text-slate-500">
                Pantau batas waktu pengembalian agar terhindar dari keterlambatan
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('my_loans')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeBorrowed.length === 0 && pendingLoans.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-teal-600" />
              <p className="mt-2 text-sm font-semibold text-slate-900">
                Tidak ada buku yang sedang dipinjam
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Kunjungi katalog untuk meminjam buku baru.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...activeBorrowed, ...pendingLoans].slice(0, 4).map((loan) => {
                const book = bookMap.get(loan.bookId);
                const daysLeft = diffDaysISO(today, loan.dueDate);
                const isLate = loan.status === 'terlambat' || (loan.status === 'dipinjam' && daysLeft < 0);
                const isSoon = loan.status === 'dipinjam' && daysLeft >= 0 && daysLeft <= 3;

                return (
                  <div
                    key={loan.id}
                    className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                      isLate
                        ? 'border-rose-200 bg-rose-50/50'
                        : isSoon
                        ? 'border-amber-200 bg-amber-50/40'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {book && <BookCover book={book} size="sm" />}
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-bold text-slate-900">
                          {book?.title ?? loan.bookId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {book?.author} · <span className="font-mono">{loan.id}</span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <LoanStatusBadge status={loan.status} />
                          {loan.status !== 'menunggu' && (
                            <span className="font-mono text-slate-600 tabular-nums">
                              Jatuh tempo: {formatDateID(loan.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {loan.status === 'menunggu' ? (
                        <span className="text-xs font-medium text-amber-700">Menunggu verifikasi</span>
                      ) : isLate ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 tabular-nums">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Terlambat {Math.abs(daysLeft)} hari
                        </span>
                      ) : (
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            isSoon ? 'text-amber-700' : 'text-teal-700'
                          }`}
                        >
                          Sisa {daysLeft} hari
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
          <div className="mb-3">
            <h2 className="font-display text-base font-bold text-slate-900">
              Statistik Aktivitas Peminjaman Anda
            </h2>
            <p className="text-xs text-slate-500">Jumlah buku yang dipinjam dalam 6 bulan terakhir</p>
          </div>
          <MemberMonthlyActivityChart loans={myLoans} />
        </div>
      </div>

      {/* Recent History */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Riwayat Transaksi Terbaru
            </h2>
            <p className="text-xs text-slate-500">Catatan peminjaman dan pengembalian terakhir Anda</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            <span>Semua Riwayat</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Judul Buku</th>
                <th className="px-5 py-3">Tgl Pinjam</th>
                <th className="px-5 py-3">Jatuh Tempo</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myLoans.slice(0, 5).map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums">{l.id}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {bookMap.get(l.bookId)?.title ?? l.bookId}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums">
                    {formatDateID(l.borrowDate)}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600 tabular-nums">
                    {formatDateID(l.dueDate)}
                  </td>
                  <td className="px-5 py-3">
                    <LoanStatusBadge status={l.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Recommendations */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Rekomendasi Buku Untuk Anda
            </h2>
            <p className="text-xs text-slate-500">Koleksi tersedia yang belum pernah Anda pinjam</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('catalog')}
            className="text-xs font-semibold text-teal-700 hover:text-teal-800"
          >
            Buka Katalog Lengkap
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recommendations.map((book) => (
            <article
              key={book.id}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-500/60"
            >
              <button
                type="button"
                onClick={() => setSelectedBook(book)}
                className="block w-full text-left"
              >
                <BookCover book={book} size="md" />
              </button>
              <div className="mt-3 flex flex-1 flex-col">
                <p className="text-xs text-slate-500">{catMap.get(book.categoryId)}</p>
                <button
                  type="button"
                  onClick={() => setSelectedBook(book)}
                  className="mt-1 text-left font-display text-sm font-bold text-slate-900 group-hover:text-teal-700 line-clamp-2"
                >
                  {book.title}
                </button>
                <p className="mt-0.5 truncate text-xs text-slate-600">{book.author}</p>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 mt-3">
                  <BookStatusBadge status={book.status} availableCopies={book.availableCopies} />
                  <button
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    className="text-xs font-semibold text-[#0F1E36] hover:text-teal-700"
                  >
                    Pinjam
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <BookDetailModal
        book={selectedBook}
        open={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
};
