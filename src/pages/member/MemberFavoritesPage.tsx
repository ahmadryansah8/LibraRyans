import React, { useMemo, useState } from 'react';
import { BookOpen, Heart, Trash2 } from 'lucide-react';
import { BookCover } from '../../components/BookCover';
import { BookDetailModal } from '../../components/BookDetailModal';
import { BookStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { Book } from '../../types/library';

interface MemberFavoritesPageProps {
  onOpenCatalog: () => void;
}

export const MemberFavoritesPage: React.FC<MemberFavoritesPageProps> = ({ onOpenCatalog }) => {
  const { db, currentUser, toggleFavorite } = useLibrary();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const catMap = useMemo(() => new Map(db.categories.map((c) => [c.id, c.name])), [db.categories]);

  const favoriteBooks = useMemo(() => {
    if (!currentUser) return [];
    const favBookIds = new Set(
      db.favorites.filter((f) => f.memberId === currentUser.id).map((f) => f.bookId)
    );
    return db.books.filter((b) => favBookIds.has(b.id));
  }, [currentUser, db.books, db.favorites]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Buku Favorit Saya
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Daftar koleksi pilihan yang Anda simpan untuk dipinjam atau dibaca di lain waktu.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCatalog}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 whitespace-nowrap"
        >
          <BookOpen className="h-4 w-4 text-teal-700" />
          <span>Tambah dari Katalog</span>
        </button>
      </div>

      {favoriteBooks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <Heart className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
            Daftar favorit masih kosong
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Klik ikon hati pada buku mana saja di katalog untuk menyimpannya di sini.
          </p>
          <button
            type="button"
            onClick={onOpenCatalog}
            className="mt-4 rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Jelajahi Katalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteBooks.map((book) => (
            <article
              key={book.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-4"
            >
              <button
                type="button"
                onClick={() => setSelectedBook(book)}
                className="block w-full text-left"
              >
                <BookCover book={book} size="md" />
              </button>

              <div className="mt-3.5 flex flex-1 flex-col">
                <p className="text-xs text-slate-500">
                  {catMap.get(book.categoryId)} · <span className="font-mono">{book.year}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedBook(book)}
                  className="mt-1 text-left font-display text-base font-bold text-slate-900 hover:text-teal-700 line-clamp-2"
                >
                  {book.title}
                </button>
                <p className="mt-1 truncate text-xs text-slate-600">{book.author}</p>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-4">
                  <BookStatusBadge status={book.status} availableCopies={book.availableCopies} />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(book.id)}
                      title="Hapus dari favorit"
                      className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="rounded-lg bg-[#0F1E36] px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <BookDetailModal
        book={selectedBook}
        open={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
      />
    </div>
  );
};
