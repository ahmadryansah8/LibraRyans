import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { BookCover } from '../../components/BookCover';
import { BookDetailModal } from '../../components/BookDetailModal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Modal } from '../../components/Modal';
import { BookStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { Book, BookStatus, CoverPattern } from '../../types/library';

interface BookFormState {
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  categoryId: string;
  description: string;
  coverPattern: CoverPattern;
  coverPalette: Book['coverPalette'];
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
}

const INITIAL_FORM: BookFormState = {
  title: '',
  author: '',
  publisher: '',
  year: new Date().getFullYear(),
  isbn: '',
  categoryId: 'cat-tek',
  description: '',
  coverPattern: 'geometric',
  coverPalette: 'navy',
  totalCopies: 3,
  availableCopies: 3,
  status: 'tersedia',
};

const PAGE_SIZE = 8;

export const AdminBooksPage: React.FC = () => {
  const { db, createBook, updateBook, deleteBook, notify } = useLibrary();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | BookStatus>('semua');
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookFormState>(INITIAL_FORM);
  const [formError, setFormError] = useState('');

  const [detailBook, setDetailBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);

  const categoryMap = useMemo(
    () => new Map(db.categories.map((c) => [c.id, c.name])),
    [db.categories]
  );

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.books.filter((b) => {
      if (categoryFilter !== 'semua' && b.categoryId !== categoryFilter) return false;
      if (statusFilter !== 'semua' && b.status !== statusFilter) return false;
      if (!q) return true;
      return (
        b.id.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.publisher.toLowerCase().includes(q)
      );
    });
  }, [categoryFilter, db.books, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedBooks = filteredBooks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreateModal = () => {
    setEditingBook(null);
    setForm({ ...INITIAL_FORM, categoryId: db.categories[0]?.id ?? 'cat-tek' });
    setFormError('');
    setFormOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      publisher: book.publisher,
      year: book.year,
      isbn: book.isbn,
      categoryId: book.categoryId,
      description: book.description,
      coverPattern: book.coverPattern,
      coverPalette: book.coverPalette,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
      status: book.status,
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const res = editingBook
      ? updateBook(editingBook.id, form)
      : createBook(form);

    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Koleksi Buku
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola data bibliografi, jumlah eksemplar, kategori, dan status ketersediaan koleksi.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Buku</span>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari ID buku, judul, penulis, ISBN, atau penerbit..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter kategori koleksi"
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'semua' | BookStatus);
              setPage(1);
            }}
            aria-label="Filter status koleksi"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="semua">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="dipinjam_penuh">Dipinjam Penuh</option>
            <option value="arsip">Diarsipkan</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Buku</th>
                <th className="px-4 py-3">ISBN &amp; Penerbit</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-right">Eksemplar</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    Tidak ada data buku yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((book) => (
                  <tr key={book.id} className="transition-colors hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BookCover book={book} size="sm" />
                        <div className="min-w-0 max-w-xs">
                          <p className="font-mono text-[11px] font-medium text-slate-500">{book.id}</p>
                          <p className="truncate font-semibold text-slate-900">{book.title}</p>
                          <p className="truncate text-xs text-slate-500">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs text-slate-700 tabular-nums">{book.isbn}</p>
                      <p className="text-xs text-slate-500">
                        {book.publisher} · <span className="font-mono tabular-nums">{book.year}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                      {categoryMap.get(book.categoryId) ?? 'Umum'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{book.availableCopies}</span>
                      <span className="text-slate-400"> / {book.totalCopies}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BookStatusBadge status={book.status} availableCopies={book.availableCopies} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailBook(book)}
                          title="Lihat Detail"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(book)}
                          title="Edit Buku"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(book)}
                          title="Hapus Buku"
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
          <p className="tabular-nums">
            Menampilkan {paginatedBooks.length} dari {filteredBooks.length} buku (Halaman {safePage} dari {totalPages})
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Sebelumnya</span>
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40"
            >
              <span>Berikutnya</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Book Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingBook ? `Edit Koleksi (${editingBook.id})` : 'Tambah Koleksi Buku Baru'}
        subtitle="Lengkapi informasi bibliografi dan jumlah eksemplar buku."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Judul Buku <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Masukkan judul buku lengkap"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Nama Penulis <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Nama penulis"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Penerbit</label>
              <input
                type="text"
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                placeholder="Nama penerbit"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                ISBN <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                required
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                placeholder="978-623-xxxx-xx-x"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Tahun Terbit</label>
              <input
                type="number"
                min={1900}
                max={2030}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Kategori</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                {db.categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Status Koleksi</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BookStatus })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                <option value="tersedia">Tersedia</option>
                <option value="dipinjam_penuh">Dipinjam Penuh</option>
                <option value="arsip">Diarsipkan</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Total Eksemplar</label>
              <input
                type="number"
                min={1}
                value={form.totalCopies}
                onChange={(e) => {
                  const total = Math.max(1, Number(e.target.value));
                  setForm({
                    ...form,
                    totalCopies: total,
                    availableCopies: Math.min(form.availableCopies, total),
                  });
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Eksemplar Tersedia</label>
              <input
                type="number"
                min={0}
                max={form.totalCopies}
                value={form.availableCopies}
                onChange={(e) => setForm({ ...form, availableCopies: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Warna Sampul</label>
              <select
                value={form.coverPalette}
                onChange={(e) => setForm({ ...form, coverPalette: e.target.value as Book['coverPalette'] })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                <option value="navy">Navy Blue</option>
                <option value="teal">Teal</option>
                <option value="cyan">Cyan Gelap</option>
                <option value="slate">Slate Arsitektur</option>
                <option value="indigo">Indigo</option>
                <option value="emerald">Emerald Gelap</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Motif Sampul</label>
              <select
                value={form.coverPattern}
                onChange={(e) => setForm({ ...form, coverPattern: e.target.value as CoverPattern })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                <option value="geometric">Geometris</option>
                <option value="arch">Lengkungan Sastra</option>
                <option value="orbital">Orbital Sains</option>
                <option value="grid">Grid Tipografi</option>
                <option value="waves">Gelombang</option>
                <option value="monolith">Monolit</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">Deskripsi Buku</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ringkasan isi atau sinopsis singkat buku..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              {editingBook ? 'Simpan Perubahan' : 'Simpan Koleksi'}
            </button>
          </div>
        </form>
      </Modal>

      <BookDetailModal
        book={detailBook}
        open={Boolean(detailBook)}
        onClose={() => setDetailBook(null)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const res = deleteBook(deleteTarget.id);
            if (!res.ok) {
              notify('error', 'Gagal Menghapus Koleksi', res.message);
            }
          }
        }}
        title="Hapus Koleksi Buku"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.title}" dari katalog LibraRyan? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Buku"
      />
    </div>
  );
};
