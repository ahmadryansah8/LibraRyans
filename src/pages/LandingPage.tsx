import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { BookCover } from '../components/BookCover';
import { BookDetailModal } from '../components/BookDetailModal';
import { CatalogExplorer } from '../components/CatalogExplorer';
import { BookStatusBadge } from '../components/StatusBadge';
import { useLibrary } from '../context/LibraryContext';
import { ARCHIVE_SHOWCASE_IMAGE, HERO_LIBRARY_IMAGE } from '../data/seedData';
import { Book } from '../types/library';

interface LandingPageProps {
  onNavigateLogin: () => void;
  onNavigateDashboard: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateLogin,
  onNavigateDashboard,
}) => {
  const { db, currentUser } = useLibrary();
  const [heroQuery, setHeroQuery] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('semua');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = useMemo(() => {
    const totalTitles = db.books.filter((b) => b.status !== 'arsip').length;
    const totalCopies = db.books.reduce((sum, b) => sum + b.totalCopies, 0);
    const totalMembers = db.users.filter((u) => u.role === 'member' && u.status === 'aktif').length;
    const totalLoans = db.loans.length;
    return { totalTitles, totalCopies, totalMembers, totalLoans };
  }, [db.books, db.loans.length, db.users]);

  const popularBooks = useMemo(() => {
    const loanCounts = new Map<string, number>();
    db.loans.forEach((l) => {
      if (l.status !== 'ditolak') {
        loanCounts.set(l.bookId, (loanCounts.get(l.bookId) ?? 0) + 1);
      }
    });
    return [...db.books]
      .filter((b) => b.status !== 'arsip')
      .sort((a, b) => (loanCounts.get(b.id) ?? 0) - (loanCounts.get(a.id) ?? 0))
      .slice(0, 4);
  }, [db.books, db.loans]);

  const categoryMap = useMemo(
    () => new Map(db.categories.map((c) => [c.id, c.name])),
    [db.categories]
  );

  const scrollToCatalog = (query?: string, catId?: string) => {
    if (query !== undefined) setCatalogSearch(query);
    if (catId !== undefined) setCatalogCategory(catId);
    const el = document.getElementById('katalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHeroSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scrollToCatalog(heroQuery, 'semua');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation Bar - Strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-6 py-4">
          <a
            href="#beranda"
            className="font-display text-xl font-extrabold tracking-tight text-[#0F1E36] whitespace-nowrap shrink-0"
          >
            LibraRyan
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#beranda" className="transition-colors hover:text-[#0F1E36] whitespace-nowrap shrink-0">
              Beranda
            </a>
            <a href="#katalog" className="transition-colors hover:text-[#0F1E36] whitespace-nowrap shrink-0">
              Katalog
            </a>
            <a href="#tentang" className="transition-colors hover:text-[#0F1E36] whitespace-nowrap shrink-0">
              Tentang
            </a>
            <a href="#layanan" className="transition-colors hover:text-[#0F1E36] whitespace-nowrap shrink-0">
              Layanan
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={onNavigateDashboard}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <span>Buka Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                <span>Masuk</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu navigasi"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
            <nav className="flex flex-col gap-3 text-sm font-medium text-slate-700">
              <a href="#beranda" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Beranda
              </a>
              <a href="#katalog" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Katalog
              </a>
              <a href="#tentang" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Tentang
              </a>
              <a href="#layanan" onClick={() => setMobileMenuOpen(false)} className="py-1">
                Layanan
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="beranda" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
            <div className="flex flex-col justify-center lg:col-span-6">
              <p className="text-sm font-semibold tracking-wide text-teal-700">
                Sistem Manajemen Perpustakaan Digital
              </p>
              <h1
                className="mt-3 font-display font-extrabold tracking-tight text-[#0F1E36]"
                style={{ fontSize: 'clamp(2.25rem, 4vw, 3.5rem)', lineHeight: 1.1, textWrap: 'balance' }}
              >
                Kelola Koleksi, Jelajahi Pengetahuan.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                LibraRyan menyatukan katalog buku digital, sirkulasi peminjaman dan pengembalian, manajemen keanggotaan, serta pelaporan otomatis dalam satu platform terstruktur untuk pustakawan dan pembaca.
              </p>

              {/* Hero Search Form */}
              <form
                onSubmit={handleHeroSearchSubmit}
                className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Cari judul buku, penulis, atau ISBN..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-700 whitespace-nowrap shrink-0"
                >
                  <span>Jelajahi Koleksi</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span>Peminjaman Terjadwal</span>
                <span aria-hidden="true">·</span>
                <span>Pelaporan Otomatis CSV &amp; Cetak</span>
                <span aria-hidden="true">·</span>
                <span>Akses Role Admin &amp; Member</span>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 sm:h-96 lg:h-full lg:min-h-[420px]">
                <img
                  src={HERO_LIBRARY_IMAGE}
                  alt="Ruang baca modern perpustakaan digital LibraRyan"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1E36]/75 via-[#0F1E36]/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-medium text-cyan-200">Koleksi Terintegrasi</p>
                  <p className="mt-1 font-display text-lg font-bold">
                    Akses katalog akademik, sastra Nusantara, hingga referensi desain modern.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4-column Library Statistics Strip */}
          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-slate-200 pt-8 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-medium text-slate-500">Judul Koleksi Aktif</p>
              <p className="mt-2 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
                {stats.totalTitles}
              </p>
              <p className="mt-1 text-xs text-slate-500">Tersedia lintas 6 kategori</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-medium text-slate-500">Total Eksemplar</p>
              <p className="mt-2 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
                {stats.totalCopies}
              </p>
              <p className="mt-1 text-xs text-slate-500">Unit buku terdata rapi</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-medium text-slate-500">Anggota Aktif</p>
              <p className="mt-2 font-display text-3xl font-bold text-teal-700 tabular-nums">
                {stats.totalMembers}
              </p>
              <p className="mt-1 text-xs text-slate-500">Member terverifikasi sistem</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5">
              <p className="text-xs font-medium text-slate-500">Transaksi Tercatat</p>
              <p className="mt-2 font-display text-3xl font-bold text-[#0F1E36] tabular-nums">
                {stats.totalLoans}
              </p>
              <p className="mt-1 text-xs text-slate-500">Sirkulasi peminjaman &amp; kembali</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Books Section */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Pilihan Pembaca
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#0F1E36] sm:text-3xl">
              Buku Populer Minggu Ini
            </h2>
          </div>
          <button
            type="button"
            onClick={() => scrollToCatalog('', 'semua')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800 whitespace-nowrap"
          >
            <span>Lihat Semua Katalog</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {popularBooks.map((book) => (
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
              <div className="mt-4 flex flex-1 flex-col">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="truncate">{categoryMap.get(book.categoryId)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{book.year}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBook(book)}
                  className="mt-1.5 text-left"
                >
                  <h3 className="line-clamp-2 font-display text-base font-bold text-slate-900 group-hover:text-teal-700">
                    {book.title}
                  </h3>
                </button>
                <p className="mt-1 truncate text-xs text-slate-600">{book.author}</p>
                <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 mt-4">
                  <BookStatusBadge status={book.status} availableCopies={book.availableCopies} />
                  <button
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    className="text-xs font-semibold text-[#0F1E36] hover:text-teal-700"
                  >
                    Detail
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Klasifikasi Koleksi
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[#0F1E36] sm:text-3xl">
              Jelajahi Berdasarkan Kategori
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Pilih bidang keilmuan untuk langsung menyaring daftar koleksi di katalog interaktif.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {db.categories.map((cat) => {
              const count = db.books.filter((b) => b.categoryId === cat.id && b.status !== 'arsip').length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => scrollToCatalog('', cat.id)}
                  className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-5 text-left transition-colors hover:border-teal-600 hover:bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-teal-700">
                        {cat.name}
                      </h3>
                      <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
                        {count} buku
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">{cat.description}</p>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-teal-700">
                    <span>Tampilkan kategori</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* About & Core Capabilities (Asymmetric Layout) */}
      <section id="tentang" className="mx-auto max-w-7xl px-6 py-16">
        <div id="layanan" className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img
                src={ARCHIVE_SHOWCASE_IMAGE}
                alt="Koleksi buku referensi dan arsitektur di ruang arsip LibraRyan"
                referrerPolicy="no-referrer"
                className="h-64 w-full object-cover lg:h-80"
              />
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                  Tentang LibraRyan
                </p>
                <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#0F1E36]">
                  Dirancang untuk Efisiensi Sirkulasi &amp; Transparansi Data.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Setiap transaksi peminjaman dan pengembalian langsung memperbarui ketersediaan stok buku, riwayat anggota, serta laporan statistik tanpa pencatatan manual terpisah.
                </p>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={currentUser ? onNavigateDashboard : onNavigateLogin}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                  >
                    <span>{currentUser ? 'Masuk ke Workspace' : 'Coba Akun Demo Sekarang'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F1E36]">
                  01. Manajemen Koleksi Terstruktur
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Kelola judul buku, ISBN, penerbit, jumlah eksemplar, dan status ketersediaan melalui tabel interaktif dengan pencarian cepat dan validasi stok otomatis.
                </p>
              </div>
              <p className="mt-4 text-xs font-medium text-teal-700">CRUD Koleksi Lengkap · Validasi ISBN</p>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F1E36]">
                  02. Sirkulasi Pinjam &amp; Kembali
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Alur pengajuan oleh Member, persetujuan oleh Admin, pencatatan tanggal jatuh tempo, dan deteksi keterlambatan dengan pembaruan stok langsung.
                </p>
              </div>
              <p className="mt-4 text-xs font-medium text-teal-700">Batas Pinjam Kustom · Deteksi Terlambat</p>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F1E36]">
                  03. Pelaporan Otomatis &amp; Ekspor
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Hasilkan laporan peminjaman, pengembalian, keterlambatan, dan buku terpopuler berdasarkan data aktual dengan dukungan ekspor CSV serta cetak rapi.
                </p>
              </div>
              <p className="mt-4 text-xs font-medium text-teal-700">6 Jenis Laporan · Unduh CSV &amp; Print</p>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0F1E36]">
                  04. Dashboard Terpisah Admin &amp; Member
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  Pemisahan hak akses penuh antara Administrator perpustakaan dan Member untuk pemantauan jatuh tempo, riwayat, dan daftar buku favorit pribadi.
                </p>
              </div>
              <p className="mt-4 text-xs font-medium text-teal-700">Kontrol Akses Berbasis Role</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Catalog Preview Section */}
      <section id="katalog" className="border-t border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <CatalogExplorer
            initialSearch={catalogSearch}
            initialCategoryId={catalogCategory}
            onRequestLogin={onNavigateLogin}
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#0F1E36] text-slate-300">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 text-white">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                <span className="font-display text-xl font-extrabold tracking-tight">LibraRyan</span>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
                Aplikasi manajemen perpustakaan digital berbasis web untuk pengelolaan koleksi, sirkulasi peminjaman, anggota, dan pelaporan statistik terpadu.
              </p>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold text-white">Navigasi Cepat</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>
                  <a href="#beranda" className="hover:text-white">
                    Beranda
                  </a>
                </li>
                <li>
                  <a href="#katalog" className="hover:text-white">
                    Katalog Koleksi
                  </a>
                </li>
                <li>
                  <a href="#tentang" className="hover:text-white">
                    Tentang Sistem
                  </a>
                </li>
                <li>
                  <button type="button" onClick={onNavigateLogin} className="hover:text-white">
                    Masuk Dashboard
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold text-white">Informasi Layanan</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>{db.settings.libraryName}</li>
                <li>Email: {db.settings.contactEmail}</li>
                <li className="tabular-nums">
                  Maksimal Pinjam: {db.settings.maxBooksPerMember} buku / {db.settings.loanDurationDays} hari
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-slate-800 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center">
            <p>© {new Date().getFullYear()} LibraRyan. Seluruh hak cipta dilindungi.</p>
            <p>Mode Demo Interaktif · Penyimpanan Lokal Browser</p>
          </div>
        </div>
      </footer>

      <BookDetailModal
        book={selectedBook}
        open={Boolean(selectedBook)}
        onClose={() => setSelectedBook(null)}
        onRequestLogin={onNavigateLogin}
      />
    </div>
  );
};
