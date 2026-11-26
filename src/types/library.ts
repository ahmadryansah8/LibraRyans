export type UserRole = 'admin' | 'member';

export type MemberStatus = 'aktif' | 'nonaktif';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  registeredAt: string; // YYYY-MM-DD
  status: MemberStatus;
  phone: string;
  department: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  accentColor: string;
}

export type BookStatus = 'tersedia' | 'dipinjam_penuh' | 'arsip';

export type CoverPattern =
  | 'geometric'
  | 'arch'
  | 'orbital'
  | 'grid'
  | 'waves'
  | 'monolith';

export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  year: number;
  isbn: string;
  categoryId: string;
  description: string;
  coverPattern: CoverPattern;
  coverPalette: 'navy' | 'teal' | 'slate' | 'cyan' | 'indigo' | 'emerald';
  coverImage?: string;
  totalCopies: number;
  availableCopies: number;
  status: BookStatus;
  createdAt: string;
}

export type LoanStatus =
  | 'menunggu'
  | 'dipinjam'
  | 'ditolak'
  | 'dikembalikan'
  | 'terlambat';

export interface Loan {
  id: string;
  memberId: string;
  bookId: string;
  borrowDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate: string | null; // YYYY-MM-DD | null
  status: LoanStatus;
  notes?: string;
  approvedBy?: string;
}

export interface Favorite {
  id: string;
  memberId: string;
  bookId: string;
  createdAt: string;
}

export interface LibrarySettings {
  libraryName: string;
  contactEmail: string;
  maxBooksPerMember: number;
  loanDurationDays: number;
  dailyFineIdr: number;
  autoFlagOverdue: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface LibraryDatabase {
  users: User[];
  categories: Category[];
  books: Book[];
  loans: Loan[];
  favorites: Favorite[];
  settings: LibrarySettings;
}
