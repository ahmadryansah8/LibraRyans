import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  ExternalLink,
  Heart,
  History,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  User,
  X,
} from 'lucide-react';
import { CatalogExplorer } from '../../components/CatalogExplorer';
import { useLibrary } from '../../context/LibraryContext';
import { getInitials } from '../../utils/formatters';
import { MemberFavoritesPage } from './MemberFavoritesPage';
import { MemberHistoryPage } from './MemberHistoryPage';
import { MemberLoansPage } from './MemberLoansPage';
import { MemberOverview } from './MemberOverview';
import { MemberProfilePage } from './MemberProfilePage';

export type MemberTab =
  | 'overview'
  | 'catalog'
  | 'my_loans'
  | 'history'
  | 'favorites'
  | 'profile';

interface MemberLayoutProps {
  onNavigateLanding: () => void;
}

const NAV_ITEMS: { key: MemberTab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 shrink-0" /> },
  { key: 'catalog', label: 'Katalog Buku', icon: <Library className="h-4 w-4 shrink-0" /> },
  { key: 'my_loans', label: 'Peminjaman Saya', icon: <Clock className="h-4 w-4 shrink-0" /> },
  { key: 'history', label: 'Riwayat', icon: <History className="h-4 w-4 shrink-0" /> },
  { key: 'favorites', label: 'Favorit', icon: <Heart className="h-4 w-4 shrink-0" /> },
  { key: 'profile', label: 'Profil', icon: <User className="h-4 w-4 shrink-0" /> },
];

export const MemberLayout: React.FC<MemberLayoutProps> = ({ onNavigateLanding }) => {
  const { currentUser, db, logout } = useLibrary();
  const [activeTab, setActiveTab] = useState<MemberTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!currentUser || currentUser.role !== 'member') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
          <h2 className="font-display text-lg font-bold text-slate-900">Akses Khusus Anggota</h2>
          <p className="mt-2 text-sm text-slate-600">
            Silakan masuk menggunakan akun Member untuk mengakses dashboard ini.
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

  const activeLoansCount = db.loans.filter(
    (l) =>
      l.memberId === currentUser.id &&
      (l.status === 'dipinjam' || l.status === 'terlambat' || l.status === 'menunggu')
  ).length;
  const activeNav = NAV_ITEMS.find((n) => n.key === activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'catalog':
        return <CatalogExplorer />;
      case 'my_loans':
        return <MemberLoansPage onOpenCatalog={() => setActiveTab('catalog')} />;
      case 'history':
        return <MemberHistoryPage />;
      case 'favorites':
        return <MemberFavoritesPage onOpenCatalog={() => setActiveTab('catalog')} />;
      case 'profile':
        return <MemberProfilePage />;
      case 'overview':
      default:
        return <MemberOverview onNavigateTab={(tab) => setActiveTab(tab as MemberTab)} />;
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
            Menu Anggota
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              const badge = item.key === 'my_loans' && activeLoansCount > 0 ? activeLoansCount : null;

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
                        isActive ? 'bg-white/20 text-white' : 'bg-cyan-500/20 text-cyan-300'
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

      <div className="space-y-2 border-t border-slate-800 p-4">
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
      <aside className="hidden w-64 shrink-0 lg:block">{SidebarContent}</aside>

      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative z-10 w-64 shrink-0">{SidebarContent}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex min-w-0 items-center gap-2 text-sm text-slate-500">
              <span className="hidden sm:inline">Member</span>
              <span className="hidden sm:inline" aria-hidden="true">/</span>
              <span className="truncate font-semibold text-slate-900">
                {activeNav?.label ?? 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-slate-900">{currentUser.name}</p>
              <p className="text-[11px] text-slate-500">{currentUser.department}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 font-display text-xs font-bold text-white">
              {getInitials(currentUser.name)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{renderContent()}</main>
      </div>
    </div>
  );
};
