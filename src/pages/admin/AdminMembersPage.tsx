import React, { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Modal } from '../../components/Modal';
import { LoanStatusBadge, MemberStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { MemberStatus, User } from '../../types/library';
import { formatDateID, getInitials } from '../../utils/formatters';

interface MemberFormState {
  name: string;
  email: string;
  phone: string;
  department: string;
  status: MemberStatus;
  password: string;
}

const INITIAL_MEMBER_FORM: MemberFormState = {
  name: '',
  email: '',
  phone: '',
  department: '',
  status: 'aktif',
  password: 'member123',
};

export const AdminMembersPage: React.FC = () => {
  const { db, createMember, updateMember, deleteMember, notify } = useLibrary();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | MemberStatus>('semua');

  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [form, setForm] = useState<MemberFormState>(INITIAL_MEMBER_FORM);
  const [formError, setFormError] = useState('');

  const [detailMember, setDetailMember] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const members = useMemo(
    () => db.users.filter((u) => u.role === 'member'),
    [db.users]
  );

  const loanStatsByMember = useMemo(() => {
    const map = new Map<string, { total: number; active: number; overdue: number }>();
    db.loans.forEach((l) => {
      const curr = map.get(l.memberId) ?? { total: 0, active: 0, overdue: 0 };
      curr.total += 1;
      if (l.status === 'dipinjam') curr.active += 1;
      if (l.status === 'terlambat') {
        curr.active += 1;
        curr.overdue += 1;
      }
      map.set(l.memberId, curr);
    });
    return map;
  }, [db.loans]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== 'semua' && m.status !== statusFilter) return false;
      if (!q) return true;
      return (
        m.id.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q)
      );
    });
  }, [members, search, statusFilter]);

  const bookMap = useMemo(() => new Map(db.books.map((b) => [b.id, b])), [db.books]);

  const detailMemberLoans = useMemo(() => {
    if (!detailMember) return [];
    return db.loans
      .filter((l) => l.memberId === detailMember.id)
      .sort((a, b) => b.borrowDate.localeCompare(a.borrowDate));
  }, [db.loans, detailMember]);

  const openCreateModal = () => {
    setEditingMember(null);
    setForm(INITIAL_MEMBER_FORM);
    setFormError('');
    setFormOpen(true);
  };

  const openEditModal = (member: User) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      email: member.email,
      phone: member.phone,
      department: member.department,
      status: member.status,
      password: member.password,
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const res = editingMember
      ? updateMember(editingMember.id, form)
      : createMember(form);
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
            Data Anggota Perpustakaan
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Kelola profil anggota terdaftar, status keanggotaan, dan pantau aktivitas peminjaman.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F1E36] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 whitespace-nowrap shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Anggota</span>
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, email, ID anggota, atau program studi/divisi..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-teal-600 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'semua' | MemberStatus)}
            aria-label="Filter status keanggotaan"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="semua">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Anggota</th>
                <th className="px-4 py-3">Kontak &amp; Program</th>
                <th className="px-4 py-3">Tgl Registrasi</th>
                <th className="px-4 py-3 text-right">Transaksi</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                    Tidak ada anggota yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const st = loanStatsByMember.get(member.id) ?? { total: 0, active: 0, overdue: 0 };
                  return (
                    <tr key={member.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F1E36] font-display text-xs font-bold text-white">
                            {getInitials(member.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900">{member.name}</p>
                            <p className="font-mono text-xs text-slate-500">{member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-800">{member.email}</p>
                        <p className="text-xs text-slate-500">
                          {member.department} · {member.phone}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatDateID(member.registeredAt)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{st.total}</span>
                        <span className="text-slate-400"> total</span>
                        {st.active > 0 && (
                          <span className="ml-1.5 text-sky-700">({st.active} aktif)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <MemberStatusBadge status={member.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailMember(member)}
                            title="Detail & Riwayat Anggota"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            title="Edit Anggota"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(member)}
                            title="Hapus Anggota"
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingMember ? `Edit Anggota (${editingMember.name})` : 'Tambah Anggota Baru'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">No. Telepon</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as MemberStatus })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              >
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Program / Departemen</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              placeholder="Contoh: Teknik Informatika"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          {!editingMember && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Kata Sandi Awal</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
              />
            </div>
          )}

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
              {editingMember ? 'Simpan Perubahan' : 'Daftarkan Anggota'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Member Detail & Transaction History Modal */}
      <Modal
        open={Boolean(detailMember)}
        onClose={() => setDetailMember(null)}
        title="Detail & Aktivitas Anggota"
        maxWidthClass="max-w-2xl"
      >
        {detailMember && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F1E36] font-display text-base font-bold text-white">
                  {getInitials(detailMember.name)}
                </div>
                <div>
                  <h4 className="font-display text-lg font-bold text-slate-900">{detailMember.name}</h4>
                  <p className="text-xs text-slate-500">
                    {detailMember.email} · {detailMember.department}
                  </p>
                </div>
              </div>
              <MemberStatusBadge status={detailMember.status} />
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Tanggal Daftar</p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {formatDateID(detailMember.registeredAt)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Total Transaksi</p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {detailMemberLoans.length}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">No. Telepon</p>
                <p className="mt-1 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {detailMember.phone}
                </p>
              </div>
            </div>

            <div>
              <h5 className="font-display text-sm font-bold text-slate-900">
                Riwayat Transaksi Anggota
              </h5>
              {detailMemberLoans.length === 0 ? (
                <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  Belum ada riwayat peminjaman untuk anggota ini.
                </p>
              ) : (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Buku</th>
                        <th className="px-3 py-2">Pinjam</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailMemberLoans.map((l) => (
                        <tr key={l.id}>
                          <td className="px-3 py-2 font-mono tabular-nums text-slate-600">{l.id}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {bookMap.get(l.bookId)?.title ?? l.bookId}
                          </td>
                          <td className="px-3 py-2 font-mono tabular-nums text-slate-500">
                            {formatDateID(l.borrowDate)}
                          </td>
                          <td className="px-3 py-2">
                            <LoanStatusBadge status={l.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            const res = deleteMember(deleteTarget.id);
            if (!res.ok) {
              notify('error', 'Gagal Menghapus Anggota', res.message);
            }
          }
        }}
        title="Hapus Data Anggota"
        description={`Yakin ingin menghapus akun anggota "${deleteTarget?.name}"? Anggota dengan pinjaman aktif tidak dapat dihapus.`}
        confirmLabel="Hapus Anggota"
      />
    </div>
  );
};
