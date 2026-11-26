import React, { useState } from 'react';
import { BookOpen, Calendar, Heart, Layers, Building2, Hash } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book } from '../types/library';
import { BookCover } from './BookCover';
import { Modal } from './Modal';
import { BookStatusBadge } from './StatusBadge';

interface BookDetailModalProps {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onRequestLogin?: () => void;
}

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  book,
  open,
  onClose,
  onRequestLogin,
}) => {
  const { db, currentUser, requestLoan, toggleFavorite, isFavorite } = useLibrary();
  const [notes, setNotes] = useState('');
  const [durationDays, setDurationDays] = useState<number>(db.settings.loanDurationDays);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    setNotes('');
    setDurationDays(db.settings.loanDurationDays);
    setFeedback(null);
  }, [book?.id, open, db.settings.loanDurationDays]);

  if (!book) return null;

  const category = db.categories.find((c) => c.id === book.categoryId);
  const fav = isFavorite(book.id);
  const canBorrow = book.status !== 'arsip' && book.availableCopies > 0;

  const existingLoan = currentUser
    ? db.loans.find(
        (l) =>
          l.memberId === currentUser.id &&
          l.bookId === book.id &&
          (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'menunggu')
      )
    : null;

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = requestLoan(book.id, notes, durationDays);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setNotes('');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Detail Koleksi Buku" maxWidthClass="max-w-3xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
        <div>
          <BookCover book={book} size="lg" />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Ketersediaan</span>
            <span className="font-mono font-semibold text-slate-800 tabular-nums">
              {book.availableCopies} / {book.totalCopies} eks
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-medium text-slate-700">{book.id}</span>
              <span aria-hidden="true">·</span>
              <span>{category?.name ?? 'Umum'}</span>
            </div>
            <BookStatusBadge status={book.status} availableCopies={book.availableCopies} />
          </div>

          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
            {book.title}
          </h3>
          <p className="mt-1 text-sm font-medium text-slate-600">Oleh {book.author}</p>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">{book.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <span className="block text-slate-400">Penerbit</span>
                <span className="truncate font-medium text-slate-800">{book.publisher}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <span className="block text-slate-400">Tahun Terbit</span>
                <span className="font-mono font-medium text-slate-800 tabular-nums">{book.year}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Hash className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0">
                <span className="block text-slate-400">ISBN</span>
                <span className="truncate font-mono font-medium text-slate-800 tabular-nums">{book.isbn}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Layers className="h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <span className="block text-slate-400">Stok Tersedia</span>
                <span className="font-mono font-medium text-slate-800 tabular-nums">
                  {book.availableCopies} dari {book.totalCopies} eksemplar
                </span>
              </div>
            </div>
          </div>

          {feedback && (
            <div
              className={`mt-4 rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
                feedback.ok
                  ? 'border-teal-200 bg-teal-50 text-teal-800'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* Action area based on role */}
          <div className="mt-5 border-t border-slate-200 pt-4">
            {!currentUser ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Masuk sebagai Member untuk mengajukan peminjaman atau menyimpan ke daftar favorit.
                </p>
                {onRequestLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestLogin();
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                  >
                    Masuk untuk Pinjam
                  </button>
                )}
              </div>
            ) : currentUser.role === 'member' ? (
              <form onSubmit={handleBorrowSubmit} className="space-y-3">
                {existingLoan ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-xs text-sky-800">
                    <span>
                      Buku ini sudah dalam daftar transaksi Anda (Status:{' '}
                      <strong className="uppercase">{existingLoan.status}</strong>).
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Durasi (Hari)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={durationDays}
                        onChange={(e) => setDurationDays(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Catatan Peminjaman (Opsional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Referensi riset kuliah"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(book.id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                      fav
                        ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${fav ? 'fill-rose-600 text-rose-600' : ''}`} />
                    <span>{fav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}</span>
                  </button>

                  {!existingLoan && (
                    <button
                      type="submit"
                      disabled={!canBorrow}
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 whitespace-nowrap"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span>{canBorrow ? 'Ajukan Peminjaman' : 'Stok Sedang Habis'}</span>
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                <span>Mode Administrator aktif. Gunakan menu Manajemen Koleksi atau Peminjaman untuk mengelola transaksi.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
