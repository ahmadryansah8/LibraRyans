import React, { useMemo, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Modal } from '../../components/Modal';
import { LoanStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { Loan, LoanStatus } from '../../types/library';
import { formatDateID } from '../../utils/formatters';

export const AdminLoansPage: React.FC = () => {
  const {
    db,
    approveLoan,
    rejectLoan,
    createDirectLoanAdmin,
    notify,
  } = useLibrary();

  const [statusFilter, setStatusFilter] = useState<'semua' | LoanStatus>('semua');
  const [search, setSearch] = useState('');

  const [newLoanOpen, setNewLoanOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [durationDays, setDurationDays] = useState(db.settings.loanDurationDays);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const [rejectTarget, setRejectTarget] = useState<Loan | null>(null);

  const userMap = useMemo(() => new Map(db.users.map((u) => [u.id, u])), [db.users]);
  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);

  const activeMembers = useMemo(
    () => db.users.filter((u) => u.role === 'member' && u.status === 'aktif'),
    [db.users]
  );

  const availableBooks = useMemo(
    () => db.books.filter((b) => b.status !== 'arsip' && b.availableCopies > 0),
    [db.books]
  );

  const filteredLoans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...db.loans]
      .filter((l) => {
        if (statusFilter !== 'semua' && l.status !== statusFilter) return false;
        if (!q) return true;
        const memberName = userMap.get(l.memberId)?.name.toLowerCase() ?? '';
        const bookTitle = bookMap.get(l.bookId)?.title.toLowerCase() ?? '';
        return (
          l.id.toLowerCase().includes(q) ||
          memberName.includes(q) ||
          bookTitle.includes(q)
        );
      })
      .sort((a, b) => {
        if (a.status === 'menunggu' && b.status !== 'menunggu') return -1;
        if (b.status === 'menunggu' && a.status !== 'menunggu') return 1;
        return b.borrowDate.localeCompare(a.borrowDate);
      });
  }, [bookMap, db.loans, search, statusFilter, userMap]);

  const openNewLoanModal = () => {
    setSelectedMemberId(activeMembers[0]?.id ?? '');
    setSelectedBookId(availableBooks[0]?.id ?? '');
    setDurationDays(db.settings.loanDurationDays);
    setNotes('');
    setFormError('');
    setNewLoanOpen(true);
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const res = createDirectLoanAdmin(selectedMemberId, selectedBookId, durationDays, notes);
    if (!res.ok) {
      setFormError(res.message);
      return;
    }
    setNewLoanOpen(false);
  };

  const statusTabs: { key: 'semua' | LoanStatus; label: string }[] = [
    { key: 'semua', label: 'Semua' },
    { key: 'menunggu', label: 'Menunggu' },
    { key: 'dipinjam', label: 'Dipinjam' },
    { key: 'terlambat', label: 'Terlambat' },
    { key: 'dikembalikan', label: 'Dikembalikan' },
    { key: 'ditolak', label: 'Ditolak' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Manajemen Peminjaman Buku
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Proses pengajuan peminjaman dari Member atau catat transaksi peminjaman langsung di meja layanan.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewLoanModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Catat Peminjaman Baru</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1">
          {statusTabs.map((tab) => {
            const count =
              tab.key === 'semua'
                ? db.loans.length
                : db.loans.filter((l) => l.status === tab.key).length;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari ID transaksi, anggota, atau buku..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Loans Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">ID Transaksi</th>
                <th className="px-4 py-3">Nama Anggota</th>
                <th className="px-4 py-3">Judul Buku</th>
                <th className="px-4 py-3">Tgl Pinjam</th>
                <th className="px-4 py-3">Jatuh Tempo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-500">
                    Tidak ada transaksi peminjaman pada kategori ini.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const member = userMap.get(loan.memberId);
                  const book = bookMap.get(loan.bookId);
                  return (
                    <tr key={loan.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                        {loan.id}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{member?.name ?? 'Anggota'}</p>
                        <p className="text-xs text-slate-500">{member?.department}</p>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="truncate font-medium text-slate-800">{book?.title ?? loan.bookId}</p>
                        {loan.notes && (
                          <p className="truncate text-xs text-slate-400">{loan.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(loan.borrowDate)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(loan.dueDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <LoanStatusBadge status={loan.status} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {loan.status === 'menunggu' ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const res = approveLoan(loan.id);
                                if (!res.ok) notify('error', 'Gagal Menyetujui', res.message);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Setujui</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectTarget(loan)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Tolak</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {loan.approvedBy ? `Oleh ${loan.approvedBy}` : '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Direct Loan Modal */}
      <Modal
        open={newLoanOpen}
        onClose={() => setNewLoanOpen(false)}
        title="Catat Peminjaman Langsung"
        subtitle="Pilih anggota aktif dan buku tersedia untuk langsung menerbitkan pinjaman."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateLoan} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Pilih Anggota</label>
            <select
              required
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            >
              {activeMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Pilih Koleksi Buku</label>
            <select
              required
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            >
              {availableBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — Tersedia {b.availableCopies} eks
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Lama Peminjaman (Hari)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Catatan (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan transaksi..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setNewLoanOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Terbitkan Peminjaman
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={() => {
          if (rejectTarget) {
            rejectLoan(rejectTarget.id, 'Ditolak oleh Administrator');
          }
        }}
        title="Tolak Pengajuan Peminjaman"
        description={`Yakin ingin menolak pengajuan peminjaman ${rejectTarget?.id}? Status akan diubah menjadi Ditolak.`}
        confirmLabel="Tolak Pengajuan"
      />
    </div>
  );
};
