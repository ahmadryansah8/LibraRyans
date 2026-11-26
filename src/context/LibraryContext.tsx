import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buildSeedDatabase } from '../data/seedData';
import {
  ActionResult,
  Book,
  Category,
  Favorite,
  LibraryDatabase,
  LibrarySettings,
  Loan,
  ToastMessage,
  User,
} from '../types/library';
import { addDaysISO, getTodayISO } from '../utils/formatters';

const STORAGE_DB_KEY = 'libraryan_db_v1';
const STORAGE_SESSION_KEY = 'libraryan_session_user_id_v1';

interface BookInput {
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  categoryId: string;
  description: string;
  coverPattern: Book['coverPattern'];
  coverPalette: Book['coverPalette'];
  totalCopies: number;
  availableCopies: number;
  status: Book['status'];
}

interface MemberInput {
  name: string;
  email: string;
  phone: string;
  department: string;
  status: User['status'];
  password?: string;
}

interface LibraryContextValue {
  db: LibraryDatabase;
  currentUser: User | null;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  notify: (type: ToastMessage['type'], title: string, description?: string) => void;

  // Auth
  login: (email: string, password: string) => ActionResult;
  loginAsDemo: (role: 'admin' | 'member') => ActionResult;
  registerMember: (input: { name: string; email: string; password: string; phone: string; department: string }) => ActionResult;
  logout: () => void;

  // Book CRUD (Admin)
  createBook: (input: BookInput) => ActionResult;
  updateBook: (bookId: string, input: BookInput) => ActionResult;
  deleteBook: (bookId: string) => ActionResult;

  // Member CRUD (Admin)
  createMember: (input: MemberInput) => ActionResult;
  updateMember: (memberId: string, input: MemberInput) => ActionResult;
  deleteMember: (memberId: string) => ActionResult;

  // Profile (Member/Admin self)
  updateOwnProfile: (input: { name: string; phone: string; department: string }) => ActionResult;

  // Loan & Return Workflows
  requestLoan: (bookId: string, notes?: string, customDays?: number) => ActionResult;
  cancelPendingLoan: (loanId: string) => ActionResult;
  createDirectLoanAdmin: (memberId: string, bookId: string, durationDays: number, notes?: string) => ActionResult;
  approveLoan: (loanId: string) => ActionResult;
  rejectLoan: (loanId: string, reason?: string) => ActionResult;
  processReturn: (loanId: string) => ActionResult;

  // Favorites
  toggleFavorite: (bookId: string) => ActionResult;
  isFavorite: (bookId: string) => boolean;

  // Settings & Demo Reset (Admin)
  updateSettings: (next: LibrarySettings) => ActionResult;
  resetDemoDatabase: () => ActionResult;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function normalizeOverdueLoans(db: LibraryDatabase): LibraryDatabase {
  if (!db.settings.autoFlagOverdue) return db;
  const today = getTodayISO();
  let changed = false;
  const nextLoans = db.loans.map((loan) => {
    if (loan.status === 'dipinjam' && loan.dueDate < today) {
      changed = true;
      return { ...loan, status: 'terlambat' as const };
    }
    return loan;
  });
  return changed ? { ...db, loans: nextLoans } : db;
}

function loadDatabase(): LibraryDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LibraryDatabase;
      if (parsed && Array.isArray(parsed.books) && Array.isArray(parsed.users) && Array.isArray(parsed.loans)) {
        return normalizeOverdueLoans(parsed);
      }
    }
  } catch {
    // Fallback to seed database
  }
  const seed = normalizeOverdueLoans(buildSeedDatabase());
  localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(seed));
  return seed;
}

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<LibraryDatabase>(() => loadDatabase());
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_SESSION_KEY);
    } catch {
      return null;
    }
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(db));
    } catch {
      // Ignore quota errors
    }
  }, [db]);

  useEffect(() => {
    try {
      if (sessionUserId) {
        localStorage.setItem(STORAGE_SESSION_KEY, sessionUserId);
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch {
      // Ignore
    }
  }, [sessionUserId]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_DB_KEY && e.newValue) {
        try {
          setDb(normalizeOverdueLoans(JSON.parse(e.newValue)));
        } catch {
          // Ignore malformed storage event
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const currentUser = useMemo(() => {
    if (!sessionUserId) return null;
    return db.users.find((u) => u.id === sessionUserId) ?? null;
  }, [db.users, sessionUserId]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((type: ToastMessage['type'], title: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const requireAdmin = useCallback((): ActionResult | null => {
    if (!currentUser) {
      return { ok: false, message: 'Silakan masuk terlebih dahulu.' };
    }
    if (currentUser.role !== 'admin') {
      return { ok: false, message: 'Akses ditolak: tindakan ini khusus Administrator.' };
    }
    return null;
  }, [currentUser]);

  const login = useCallback(
    (email: string, password: string): ActionResult => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password.trim()) {
        return { ok: false, message: 'Email dan kata sandi wajib diisi.' };
      }
      const user = db.users.find(
        (u) => u.email.toLowerCase() === cleanEmail && u.password === password
      );
      if (!user) {
        return { ok: false, message: 'Email atau kata sandi tidak sesuai.' };
      }
      if (user.status === 'nonaktif') {
        return { ok: false, message: 'Akun anggota ini berstatus nonaktif. Hubungi pustakawan Admin.' };
      }
      setSessionUserId(user.id);
      notify('success', `Selamat datang, ${user.name}`, `Masuk sebagai ${user.role === 'admin' ? 'Administrator' : 'Member'}.`);
      return { ok: true, message: 'Berhasil masuk.' };
    },
    [db.users, notify]
  );

  const loginAsDemo = useCallback(
    (role: 'admin' | 'member'): ActionResult => {
      const user = db.users.find((u) => u.role === role && u.status === 'aktif');
      if (!user) {
        return { ok: false, message: 'Akun demo tidak ditemukan.' };
      }
      setSessionUserId(user.id);
      notify('success', `Masuk Demo ${role === 'admin' ? 'Admin' : 'Member'}`, `Aktif sebagai ${user.name}.`);
      return { ok: true, message: 'Berhasil masuk akun demo.' };
    },
    [db.users, notify]
  );

  const registerMember = useCallback(
    (input: { name: string; email: string; password: string; phone: string; department: string }): ActionResult => {
      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      const password = input.password.trim();
      if (!name || !email || !password) {
        return { ok: false, message: 'Nama, email, dan kata sandi wajib diisi.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, message: 'Format alamat email tidak valid.' };
      }
      if (password.length < 6) {
        return { ok: false, message: 'Kata sandi minimal 6 karakter.' };
      }
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, message: 'Email sudah terdaftar dalam sistem.' };
      }

      const newUser: User = {
        id: `usr-mem-${Date.now()}`,
        name,
        email,
        password,
        role: 'member',
        registeredAt: getTodayISO(),
        status: 'aktif',
        phone: input.phone.trim() || '-',
        department: input.department.trim() || 'Anggota Umum',
      };

      setDb((prev) => ({ ...prev, users: [newUser, ...prev.users] }));
      setSessionUserId(newUser.id);
      notify('success', 'Pendaftaran Berhasil', `Akun member untuk ${name} telah aktif.`);
      return { ok: true, message: 'Pendaftaran berhasil.' };
    },
    [db.users, notify]
  );

  const logout = useCallback(() => {
    setSessionUserId(null);
    notify('info', 'Sesi Diakhiri', 'Anda telah keluar dari akun LibraRyan.');
  }, [notify]);

  const createBook = useCallback(
    (input: BookInput): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      if (!input.title.trim() || !input.author.trim() || !input.isbn.trim() || !input.categoryId) {
        return { ok: false, message: 'Judul, penulis, ISBN, dan kategori wajib diisi.' };
      }
      if (input.totalCopies < 1 || input.availableCopies < 0 || input.availableCopies > input.totalCopies) {
        return { ok: false, message: 'Jumlah eksemplar tersedia harus berada di antara 0 dan total eksemplar.' };
      }
      if (db.books.some((b) => b.isbn.trim().toLowerCase() === input.isbn.trim().toLowerCase())) {
        return { ok: false, message: 'ISBN sudah terdaftar pada koleksi lain.' };
      }

      const nextNum = db.books.reduce((max, b) => {
        const num = parseInt(b.id.replace('BK-', ''), 10);
        return Number.isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1;
      const id = `BK-${String(nextNum).padStart(3, '0')}`;

      const computedStatus: Book['status'] =
        input.status === 'arsip'
          ? 'arsip'
          : input.availableCopies === 0
          ? 'dipinjam_penuh'
          : 'tersedia';

      const newBook: Book = {
        id,
        title: input.title.trim(),
        author: input.author.trim(),
        publisher: input.publisher.trim() || 'Penerbit Umum',
        year: Number(input.year) || new Date().getFullYear(),
        isbn: input.isbn.trim(),
        categoryId: input.categoryId,
        description: input.description.trim() || 'Belum ada deskripsi koleksi.',
        coverPattern: input.coverPattern,
        coverPalette: input.coverPalette,
        totalCopies: Number(input.totalCopies),
        availableCopies: Number(input.availableCopies),
        status: computedStatus,
        createdAt: getTodayISO(),
      };

      setDb((prev) => ({ ...prev, books: [newBook, ...prev.books] }));
      notify('success', 'Koleksi Ditambahkan', `${newBook.title} (${newBook.id}) berhasil disimpan.`);
      return { ok: true, message: 'Buku berhasil ditambahkan.' };
    },
    [db.books, notify, requireAdmin]
  );

  const updateBook = useCallback(
    (bookId: string, input: BookInput): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      if (!input.title.trim() || !input.author.trim() || !input.isbn.trim() || !input.categoryId) {
        return { ok: false, message: 'Judul, penulis, ISBN, dan kategori wajib diisi.' };
      }
      if (input.totalCopies < 1 || input.availableCopies < 0 || input.availableCopies > input.totalCopies) {
        return { ok: false, message: 'Jumlah eksemplar tersedia tidak valid terhadap total eksemplar.' };
      }
      if (db.books.some((b) => b.id !== bookId && b.isbn.trim().toLowerCase() === input.isbn.trim().toLowerCase())) {
        return { ok: false, message: 'ISBN tersebut sudah digunakan oleh buku lain.' };
      }

      const computedStatus: Book['status'] =
        input.status === 'arsip'
          ? 'arsip'
          : input.availableCopies === 0
          ? 'dipinjam_penuh'
          : 'tersedia';

      setDb((prev) => ({
        ...prev,
        books: prev.books.map((b) =>
          b.id === bookId
            ? {
                ...b,
                title: input.title.trim(),
                author: input.author.trim(),
                publisher: input.publisher.trim() || 'Penerbit Umum',
                year: Number(input.year) || b.year,
                isbn: input.isbn.trim(),
                categoryId: input.categoryId,
                description: input.description.trim() || b.description,
                coverPattern: input.coverPattern,
                coverPalette: input.coverPalette,
                totalCopies: Number(input.totalCopies),
                availableCopies: Number(input.availableCopies),
                status: computedStatus,
              }
            : b
        ),
      }));
      notify('success', 'Koleksi Diperbarui', `Data buku ${input.title.trim()} telah diperbarui.`);
      return { ok: true, message: 'Buku berhasil diperbarui.' };
    },
    [db.books, notify, requireAdmin]
  );

  const deleteBook = useCallback(
    (bookId: string): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const hasActiveLoan = db.loans.some(
        (l) => l.bookId === bookId && (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'menunggu')
      );
      if (hasActiveLoan) {
        return {
          ok: false,
          message: 'Buku tidak dapat dihapus karena masih memiliki transaksi aktif atau menunggu persetujuan.',
        };
      }

      const target = db.books.find((b) => b.id === bookId);
      setDb((prev) => ({
        ...prev,
        books: prev.books.filter((b) => b.id !== bookId),
        favorites: prev.favorites.filter((f) => f.bookId !== bookId),
      }));
      notify('success', 'Koleksi Dihapus', `${target?.title ?? 'Buku'} telah dihapus dari katalog.`);
      return { ok: true, message: 'Buku berhasil dihapus.' };
    },
    [db.books, db.loans, notify, requireAdmin]
  );

  const createMember = useCallback(
    (input: MemberInput): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (!name || !email) {
        return { ok: false, message: 'Nama lengkap dan email anggota wajib diisi.' };
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { ok: false, message: 'Format email anggota tidak valid.' };
      }
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, message: 'Email sudah digunakan oleh pengguna lain.' };
      }

      const newMember: User = {
        id: `usr-mem-${Date.now()}`,
        name,
        email,
        password: input.password?.trim() || 'member123',
        role: 'member',
        registeredAt: getTodayISO(),
        status: input.status,
        phone: input.phone.trim() || '-',
        department: input.department.trim() || 'Anggota Umum',
      };

      setDb((prev) => ({ ...prev, users: [newMember, ...prev.users] }));
      notify('success', 'Anggota Ditambahkan', `${name} terdaftar sebagai anggota baru.`);
      return { ok: true, message: 'Anggota berhasil ditambahkan.' };
    },
    [db.users, notify, requireAdmin]
  );

  const updateMember = useCallback(
    (memberId: string, input: MemberInput): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const name = input.name.trim();
      const email = input.email.trim().toLowerCase();
      if (!name || !email) {
        return { ok: false, message: 'Nama dan email anggota wajib diisi.' };
      }
      if (db.users.some((u) => u.id !== memberId && u.email.toLowerCase() === email)) {
        return { ok: false, message: 'Email sudah digunakan oleh akun lain.' };
      }

      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === memberId
            ? {
                ...u,
                name,
                email,
                phone: input.phone.trim() || '-',
                department: input.department.trim() || u.department,
                status: input.status,
              }
            : u
        ),
      }));
      notify('success', 'Data Anggota Diperbarui', `Profil ${name} berhasil disimpan.`);
      return { ok: true, message: 'Data anggota berhasil diperbarui.' };
    },
    [db.users, notify, requireAdmin]
  );

  const deleteMember = useCallback(
    (memberId: string): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const target = db.users.find((u) => u.id === memberId);
      if (!target || target.role === 'admin') {
        return { ok: false, message: 'Akun Administrator tidak dapat dihapus.' };
      }
      const hasUnreturned = db.loans.some(
        (l) => l.memberId === memberId && (l.status === 'dipinjam' || l.status === 'terlambat')
      );
      if (hasUnreturned) {
        return { ok: false, message: 'Anggota masih memiliki buku yang belum dikembalikan.' };
      }

      setDb((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== memberId),
        favorites: prev.favorites.filter((f) => f.memberId !== memberId),
      }));
      notify('success', 'Anggota Dihapus', `Data anggota ${target.name} telah dihapus.`);
      return { ok: true, message: 'Anggota berhasil dihapus.' };
    },
    [db.loans, db.users, notify, requireAdmin]
  );

  const updateOwnProfile = useCallback(
    (input: { name: string; phone: string; department: string }): ActionResult => {
      if (!currentUser) return { ok: false, message: 'Silakan masuk terlebih dahulu.' };
      if (!input.name.trim()) {
        return { ok: false, message: 'Nama lengkap tidak boleh kosong.' };
      }
      setDb((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === currentUser.id
            ? {
                ...u,
                name: input.name.trim(),
                phone: input.phone.trim() || '-',
                department: input.department.trim() || u.department,
              }
            : u
        ),
      }));
      notify('success', 'Profil Diperbarui', 'Perubahan informasi profil Anda telah disimpan.');
      return { ok: true, message: 'Profil berhasil diperbarui.' };
    },
    [currentUser, notify]
  );

  const requestLoan = useCallback(
    (bookId: string, notes?: string, customDays?: number): ActionResult => {
      if (!currentUser) {
        return { ok: false, message: 'Silakan masuk sebagai Member untuk mengajukan peminjaman.' };
      }
      if (currentUser.status !== 'aktif') {
        return { ok: false, message: 'Status keanggotaan Anda tidak aktif.' };
      }
      const book = db.books.find((b) => b.id === bookId);
      if (!book) {
        return { ok: false, message: 'Buku tidak ditemukan dalam katalog.' };
      }
      if (book.status === 'arsip' || book.availableCopies < 1) {
        return { ok: false, message: 'Eksemplar buku sedang tidak tersedia untuk dipinjam.' };
      }

      const activeOrPendingCount = db.loans.filter(
        (l) =>
          l.memberId === currentUser.id &&
          (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'menunggu')
      ).length;

      if (activeOrPendingCount >= db.settings.maxBooksPerMember) {
        return {
          ok: false,
          message: `Batas maksimal peminjaman (${db.settings.maxBooksPerMember} buku aktif/menunggu) telah tercapai.`,
        };
      }

      const alreadyHasBook = db.loans.some(
        (l) =>
          l.memberId === currentUser.id &&
          l.bookId === bookId &&
          (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'menunggu')
      );
      if (alreadyHasBook) {
        return { ok: false, message: 'Anda sudah memiliki pengajuan atau peminjaman aktif untuk buku ini.' };
      }

      const today = getTodayISO();
      const duration = Math.min(Math.max(customDays ?? db.settings.loanDurationDays, 1), 30);
      const nextNum = db.loans.reduce((max, l) => {
        const parts = l.id.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        return Number.isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1;

      const newLoan: Loan = {
        id: `TRX-${today.slice(0, 4)}-${String(nextNum).padStart(3, '0')}`,
        memberId: currentUser.id,
        bookId,
        borrowDate: today,
        dueDate: addDaysISO(today, duration),
        returnDate: null,
        status: 'menunggu',
        notes: notes?.trim() || undefined,
      };

      setDb((prev) => ({ ...prev, loans: [newLoan, ...prev.loans] }));
      notify('success', 'Pengajuan Peminjaman Terkirim', `${book.title} menunggu persetujuan Admin.`);
      return { ok: true, message: 'Pengajuan peminjaman berhasil dicatat.' };
    },
    [currentUser, db.books, db.loans, db.settings.loanDurationDays, db.settings.maxBooksPerMember, notify]
  );

  const cancelPendingLoan = useCallback(
    (loanId: string): ActionResult => {
      if (!currentUser) return { ok: false, message: 'Silakan masuk terlebih dahulu.' };
      const loan = db.loans.find((l) => l.id === loanId);
      if (!loan) return { ok: false, message: 'Transaksi tidak ditemukan.' };
      if (currentUser.role !== 'admin' && loan.memberId !== currentUser.id) {
        return { ok: false, message: 'Akses ditolak.' };
      }
      if (loan.status !== 'menunggu') {
        return { ok: false, message: 'Hanya pengajuan berstatus menunggu yang dapat dibatalkan.' };
      }
      setDb((prev) => ({ ...prev, loans: prev.loans.filter((l) => l.id !== loanId) }));
      notify('info', 'Pengajuan Dibatalkan', `Permintaan peminjaman ${loan.id} telah dibatalkan.`);
      return { ok: true, message: 'Pengajuan dibatalkan.' };
    },
    [currentUser, db.loans, notify]
  );

  const createDirectLoanAdmin = useCallback(
    (memberId: string, bookId: string, durationDays: number, notes?: string): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const member = db.users.find((u) => u.id === memberId && u.role === 'member');
      if (!member) return { ok: false, message: 'Anggota tidak ditemukan.' };
      if (member.status !== 'aktif') return { ok: false, message: 'Status anggota nonaktif.' };

      const book = db.books.find((b) => b.id === bookId);
      if (!book) return { ok: false, message: 'Buku tidak ditemukan.' };
      if (book.availableCopies < 1 || book.status === 'arsip') {
        return { ok: false, message: 'Eksemplar buku tidak tersedia.' };
      }

      const activeCount = db.loans.filter(
        (l) => l.memberId === memberId && (l.status === 'dipinjam' || l.status === 'terlambat')
      ).length;
      if (activeCount >= db.settings.maxBooksPerMember) {
        return {
          ok: false,
          message: `Anggota telah mencapai batas maksimal ${db.settings.maxBooksPerMember} buku dipinjam.`,
        };
      }

      const today = getTodayISO();
      const days = Math.min(Math.max(durationDays || db.settings.loanDurationDays, 1), 60);
      const nextNum = db.loans.reduce((max, l) => {
        const parts = l.id.split('-');
        const num = parseInt(parts[parts.length - 1], 10);
        return Number.isNaN(num) ? max : Math.max(max, num);
      }, 0) + 1;

      const newLoan: Loan = {
        id: `TRX-${today.slice(0, 4)}-${String(nextNum).padStart(3, '0')}`,
        memberId,
        bookId,
        borrowDate: today,
        dueDate: addDaysISO(today, days),
        returnDate: null,
        status: 'dipinjam',
        notes: notes?.trim() || undefined,
        approvedBy: currentUser?.name,
      };

      setDb((prev) => ({
        ...prev,
        loans: [newLoan, ...prev.loans],
        books: prev.books.map((b) => {
          if (b.id !== bookId) return b;
          const nextAvail = Math.max(0, b.availableCopies - 1);
          return {
            ...b,
            availableCopies: nextAvail,
            status: nextAvail === 0 ? 'dipinjam_penuh' : 'tersedia',
          };
        }),
      }));

      notify('success', 'Peminjaman Dicatat', `${book.title} dipinjam oleh ${member.name}.`);
      return { ok: true, message: 'Peminjaman berhasil dicatat.' };
    },
    [currentUser?.name, db.books, db.loans, db.settings.loanDurationDays, db.settings.maxBooksPerMember, db.users, notify, requireAdmin]
  );

  const approveLoan = useCallback(
    (loanId: string): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const loan = db.loans.find((l) => l.id === loanId);
      if (!loan) return { ok: false, message: 'Transaksi tidak ditemukan.' };
      if (loan.status !== 'menunggu') {
        return { ok: false, message: 'Hanya transaksi berstatus menunggu yang dapat disetujui.' };
      }

      const book = db.books.find((b) => b.id === loan.bookId);
      if (!book || book.availableCopies < 1) {
        return { ok: false, message: 'Eksemplar buku sudah habis saat ini.' };
      }

      const today = getTodayISO();
      const dueDate = addDaysISO(today, db.settings.loanDurationDays);

      setDb((prev) => ({
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                borrowDate: today,
                dueDate,
                status: 'dipinjam',
                approvedBy: currentUser?.name,
              }
            : l
        ),
        books: prev.books.map((b) => {
          if (b.id !== loan.bookId) return b;
          const nextAvail = Math.max(0, b.availableCopies - 1);
          return {
            ...b,
            availableCopies: nextAvail,
            status: nextAvail === 0 ? 'dipinjam_penuh' : 'tersedia',
          };
        }),
      }));

      notify('success', 'Peminjaman Disetujui', `Transaksi ${loanId} aktif dan stok buku telah diperbarui.`);
      return { ok: true, message: 'Peminjaman disetujui.' };
    },
    [currentUser?.name, db.books, db.loans, db.settings.loanDurationDays, notify, requireAdmin]
  );

  const rejectLoan = useCallback(
    (loanId: string, reason?: string): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const loan = db.loans.find((l) => l.id === loanId);
      if (!loan) return { ok: false, message: 'Transaksi tidak ditemukan.' };
      if (loan.status !== 'menunggu') {
        return { ok: false, message: 'Transaksi sudah diproses sebelumnya.' };
      }

      setDb((prev) => ({
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                status: 'ditolak',
                notes: reason?.trim() ? reason.trim() : l.notes,
                approvedBy: currentUser?.name,
              }
            : l
        ),
      }));

      notify('info', 'Permintaan Ditolak', `Pengajuan peminjaman ${loanId} telah ditolak.`);
      return { ok: true, message: 'Peminjaman ditolak.' };
    },
    [currentUser?.name, db.loans, notify, requireAdmin]
  );

  const processReturn = useCallback(
    (loanId: string): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      const loan = db.loans.find((l) => l.id === loanId);
      if (!loan) return { ok: false, message: 'Transaksi tidak ditemukan.' };
      if (loan.status !== 'dipinjam' && loan.status !== 'terlambat') {
        return { ok: false, message: 'Buku ini sudah dikembalikan atau belum berstatus dipinjam.' };
      }

      const today = getTodayISO();
      const book = db.books.find((b) => b.id === loan.bookId);

      setDb((prev) => ({
        ...prev,
        loans: prev.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                returnDate: today,
                status: 'dikembalikan',
              }
            : l
        ),
        books: prev.books.map((b) => {
          if (b.id !== loan.bookId) return b;
          const nextAvail = Math.min(b.totalCopies, b.availableCopies + 1);
          return {
            ...b,
            availableCopies: nextAvail,
            status: b.status === 'arsip' ? 'arsip' : nextAvail > 0 ? 'tersedia' : 'dipinjam_penuh',
          };
        }),
      }));

      notify('success', 'Pengembalian Diproses', `${book?.title ?? 'Buku'} telah kembali ke rak tersedia.`);
      return { ok: true, message: 'Pengembalian berhasil diproses.' };
    },
    [db.books, db.loans, notify, requireAdmin]
  );

  const toggleFavorite = useCallback(
    (bookId: string): ActionResult => {
      if (!currentUser) {
        return { ok: false, message: 'Masuk sebagai Member untuk menyimpan buku favorit.' };
      }
      const exists = db.favorites.some((f) => f.memberId === currentUser.id && f.bookId === bookId);
      const book = db.books.find((b) => b.id === bookId);

      if (exists) {
        setDb((prev) => ({
          ...prev,
          favorites: prev.favorites.filter((f) => !(f.memberId === currentUser.id && f.bookId === bookId)),
        }));
        notify('info', 'Dihapus dari Favorit', book?.title);
      } else {
        const fav: Favorite = {
          id: `fav-${Date.now()}`,
          memberId: currentUser.id,
          bookId,
          createdAt: getTodayISO(),
        };
        setDb((prev) => ({ ...prev, favorites: [fav, ...prev.favorites] }));
        notify('success', 'Ditambahkan ke Favorit', book?.title);
      }
      return { ok: true, message: 'Daftar favorit diperbarui.' };
    },
    [currentUser, db.books, db.favorites, notify]
  );

  const isFavorite = useCallback(
    (bookId: string) => {
      if (!currentUser) return false;
      return db.favorites.some((f) => f.memberId === currentUser.id && f.bookId === bookId);
    },
    [currentUser, db.favorites]
  );

  const updateSettings = useCallback(
    (next: LibrarySettings): ActionResult => {
      const guard = requireAdmin();
      if (guard) return guard;

      if (!next.libraryName.trim() || next.maxBooksPerMember < 1 || next.loanDurationDays < 1) {
        return { ok: false, message: 'Pastikan nama perpustakaan dan aturan peminjaman bernilai valid.' };
      }
      setDb((prev) => normalizeOverdueLoans({ ...prev, settings: next }));
      notify('success', 'Pengaturan Disimpan', 'Kebijakan peminjaman dan profil sistem telah diperbarui.');
      return { ok: true, message: 'Pengaturan disimpan.' };
    },
    [notify, requireAdmin]
  );

  const resetDemoDatabase = useCallback((): ActionResult => {
    const guard = requireAdmin();
    if (guard) return guard;

    const fresh = normalizeOverdueLoans(buildSeedDatabase());
    setDb(fresh);
    notify('info', 'Data Demo Direset', 'Seluruh koleksi, anggota, dan transaksi dikembalikan ke kondisi awal.');
    return { ok: true, message: 'Data demo direset.' };
  }, [notify, requireAdmin]);

  const value: LibraryContextValue = {
    db,
    currentUser,
    toasts,
    dismissToast,
    notify,
    login,
    loginAsDemo,
    registerMember,
    logout,
    createBook,
    updateBook,
    deleteBook,
    createMember,
    updateMember,
    deleteMember,
    updateOwnProfile,
    requestLoan,
    cancelPendingLoan,
    createDirectLoanAdmin,
    approveLoan,
    rejectLoan,
    processReturn,
    toggleFavorite,
    isFavorite,
    updateSettings,
    resetDemoDatabase,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
