import React, { useState } from 'react';
import {
  BarChart3,
  BookCopy,
  BookOpen,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { getInitials } from '../../utils/formatters';
import { AdminBooksPage } from './AdminBooksPage';
import { AdminLoansPage } from './AdminLoansPage';
import { AdminMembersPage } from './AdminMembersPage';
import { AdminOverview } from './AdminOverview';
import { AdminReportsPage } from './AdminReportsPage';
import { AdminReturnsPage } from './AdminReturnsPage';
import { AdminSettingsPage } from './AdminSettingsPage';

export type AdminTab =
  | 'overview'
  | 'books'
  | 'members'
  | 'loans'
  | 'returns'
  | 'reports'
  | 'settings';

interface AdminLayoutProps {
  onNavigateLanding: () => void;
}

const NAV_ITEMS: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { key: 'books', label: 'Manajemen Koleksi', icon: <BookCopy className="h-4 w-4 shrink-0" /> },
  { key: 'members', label: 'Data Anggota', icon: <Users className="h-4 w-4 shrink-0" /> },
  { key: 'loans', label: 'Peminjaman', icon: <ClipboardList className="h-4 w-4 shrink-0" /> },
  { key: 'returns', label: 'Pengembalian', icon: <RotateCcw className="h-4 w-4 shrink-0" /> },
  { key: 'reports', label: 'Laporan', icon: <BarChart3 className="h-4 w-4 shrink-0" /> },
  { key: 'settings', label: 'Pengaturan', icon: <Settings className="h-4 w-4 shrink-0" /> },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onNavigateLanding }) => {
  const { currentUser, db, logout } = useLibrary();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Strict role enforcement guard
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
          <h2 className="font-display text-lg font-bold text-slate-900">Akses Dibatasi</h2>
          <p className="mt-2 text-sm text-slate-600">
            Halaman ini hanya dapat diakses oleh pengguna dengan peran Administrator.
          </p>
          <button
            type="button"
            onClick={onNavigateLanding}
            className="mt-4 rounded-lg bg-[#0F1E36] px-4 py-2 text-sm font-semibold text-white"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = db.loans.filter((l) => l.status === 'menunggu').length;
  const overdueCount = db.loans.filter((l) => l.status === 'terlambat').length;
  const activeNav = NAV_ITEMS.find((n) => n.key === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'books':
        return <AdminBooksPage />;
      case 'members':
        return <AdminMembersPage />;
      case 'loans':
        return <AdminLoansPage />;
      case 'returns':
        return <AdminReturnsPage />;
      case 'reports':
        return <AdminReportsPage />;
      case 'settings':
        return <AdminSettingsPage />;
      case 'overview':
      default:
        return <AdminOverview onNavigateTab={(tab) => setActiveTab(tab as AdminTab)} />;
    }
  };

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0F1E36] text-slate-300">
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight">LibraRyan</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Tutup sidebar"
            className="rounded p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-4">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu Administrator
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              const badge =
                item.key === 'loans' && pendingCount > 0
                  ? pendingCount
                  : item.key === 'returns' && overdueCount > 0
                  ? overdueCount
                  : null;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.key);
                    setMobileSidebarOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 whitespace-nowrap">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {badge !== null && (
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.key === 'returns'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-slate-800 p-4 space-y-2">
        <button
          type="button"
          onClick={onNavigateLanding}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Halaman Depan</span>
        </button>
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-950/50 hover:text-rose-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="no-print hidden w-64 shrink-0 lg:block">{SidebarContent}</aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 shrink-0">{SidebarContent}</aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 min-w-0">
              <span className="hidden sm:inline">Admin</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="truncate font-semibold text-slate-900">
                {activeNav?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500">Administrator</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F1E36] font-display text-xs font-bold text-white">
              {getInitials(currentUser.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};
