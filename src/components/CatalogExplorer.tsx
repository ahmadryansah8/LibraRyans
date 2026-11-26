import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  BookOpen,
  Heart,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { Book } from '../types/library';
import { BookCover } from './BookCover';
import { BookDetailModal } from './BookDetailModal';
import { BookStatusBadge } from './StatusBadge';

interface CatalogExplorerProps {
  initialSearch?: string;
  initialCategoryId?: string;
  onRequestLogin?: () => void;
  compactHeader?: boolean;
}

export const CatalogExplorer: React.FC<CatalogExplorerProps> = ({
  initialSearch = '',
  initialCategoryId = 'semua',
  onRequestLogin,
  compactHeader = false,
}) => {
  const { db, currentUser, toggleFavorite, isFavorite } = useLibrary();
  const [search, setSearch] = useState(initialSearch);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [availability, setAvailability] = useState<'semua' | 'tersedia' | 'habis'>('semua');
  const [sortBy, setSortBy] = useState<'title_asc' | 'title_desc' | 'year_desc' | 'year_asc'>('title_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  React.useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  React.useEffect(() => {
    setCategoryId(initialCategoryId);
  }, [initialCategoryId]);

  const categoryMap = useMemo(
    () => new Map(db.categories.map((c) => [c.id, c.name])),
    [db.categories]
  );

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = db.books.filter((b) => {
      if (b.status === 'arsip' && currentUser?.role !== 'admin') return false;
      if (categoryId !== 'semua' && b.categoryId !== categoryId) return false;
      if (availability === 'tersedia' && b.availableCopies < 1) return false;
      if (availability === 'habis' && b.availableCopies > 0) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        (categoryMap.get(b.categoryId) ?? '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'title_desc':
          return b.title.localeCompare(a.title, 'id');
        case 'year_desc':
          return b.year - a.year;
        case 'year_asc':
          return a.year - b.year;
        case 'title_asc':
        default:
          return a.title.localeCompare(b.title, 'id');
      }
    });
  }, [availability, categoryId, categoryMap, currentUser?.role, db.books, search, sortBy]);

  return (
    <div className="space-y-5">
      {!compactHeader && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Katalog Koleksi Buku
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Telusuri {db.books.length} judul terkurasi lintas disiplin ilmu beserta status ketersediaan aktual.
            </p>
          </div>
          <p className="font-mono text-xs text-slate-500 tabular-nums">
            Menampilkan {filteredBooks.length} dari {db.books.length} koleksi
          </p>
        </div>
      )}

      {/* Filter & Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_200px_170px_190px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul, penulis, ISBN, atau kata kunci..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filter kategori"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="semua">Semua Kategori</option>
            {db.categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value as 'semua' | 'tersedia' | 'habis')}
            aria-label="Filter ketersediaan"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="habis">Dipinjam Penuh</option>
          </select>

          <div className="relative">
            <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'title_asc' | 'title_desc' | 'year_desc' | 'year_asc')
              }
              aria-label="Urutkan buku"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              <option value="title_asc">Judul (A–Z)</option>
              <option value="title_desc">Judul (Z–A)</option>
              <option value="year_desc">Tahun Terbaru</option>
              <option value="year_asc">Tahun Terlama</option>
            </select>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Tampilan Grid"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="Tampilan List"
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Daftar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
          <BookOpen className="h-10 w-10 text-slate-300" />
          <h3 className="mt-3 font-display text-base font-semibold text-slate-900">
            Buku tidak ditemukan
          </h3>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Tidak ada koleksi yang sesuai dengan filter atau kata kunci pencarian Anda.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategoryId('semua');
              setAvailability('semua');
            }}
            className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset Filter Pencarian
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book) => {
            const fav = isFavorite(book.id);
            const catName = categoryMap.get(book.categoryId) ?? 'Umum';
            return (
              <article
                key={book.id}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-teal-500/60"
              >
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 rounded-lg"
                  >
                    <BookCover book={book} size="md" />
                  </button>
                  {currentUser?.role === 'member' && (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(book.id)}
                      aria-label={fav ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                      className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-lg border border-white/25 bg-slate-900/75 text-white backdrop-blur-sm transition-colors hover:bg-slate-900"
                    >
                      <Heart className={`h-4 w-4 ${fav ? 'fill-rose-400 text-rose-400' : ''}`} />
                    </button>
                  )}
                </div>

                <div className="mt-3.5 flex flex-1 flex-col">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="truncate">{catName}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{book.year}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    className="mt-1.5 text-left"
                  >
                    <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-teal-700">
                      {book.title}
                    </h3>
                  </button>
                  <p className="mt-1 truncate text-xs text-slate-600">{book.author}</p>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-4">
                    <BookStatusBadge status={book.status} availableCopies={book.availableCopies} />
                    <button
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="text-xs font-semibold text-slate-800 hover:text-teal-700 whitespace-nowrap"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="divide-y divide-slate-200">
            {filteredBooks.map((book) => {
              const fav = isFavorite(book.id);
              const catName = categoryMap.get(book.categoryId) ?? 'Umum';
              return (
                <div
                  key={book.id}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <BookCover book={book} size="sm" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-medium text-slate-700">{book.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{catName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{book.year}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">ISBN {book.isbn}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedBook(book)}
                        className="mt-1 text-left font-display text-base font-bold text-slate-900 hover:text-teal-700"
                      >
                        {book.title}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {book.author} — {book.publisher}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 self-end sm:self-center">
                    <span className="font-mono text-xs text-slate-500 tabular-nums">
                      {book.availableCopies}/{book.totalCopies} eks
                    </span>
                    <BookStatusBadge status={book.status} availableCopies={book.availableCopies} />
                    {currentUser?.role === 'member' && (
                      <button
                        type="button"
                        onClick={() => toggleFavorite(book.id)}
                        aria-label="Favorit"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      >
                        <Heart className={`h-4 w-4 ${fav ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap"
                    >
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <BookDetailModal
        book={selectedBook}
        open={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        onRequestLogin={onRequestLogin}
      />
    </div>
  );
};
