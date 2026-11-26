import React, { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { MemberStatusBadge } from '../../components/StatusBadge';
import { useLibrary } from '../../context/LibraryContext';
import { formatDateID, getInitials } from '../../utils/formatters';

export const MemberProfilePage: React.FC = () => {
  const { currentUser, db, updateOwnProfile } = useLibrary();

  const [name, setName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState(currentUser?.phone ?? '');
  const [department, setDepartment] = useState(currentUser?.department ?? '');

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setPhone(currentUser.phone);
      setDepartment(currentUser.department);
    }
  }, [currentUser]);

  const stats = useMemo(() => {
    if (!currentUser) return { total: 0, returned: 0, active: 0 };
    const mine = db.loans.filter((l) => l.memberId === currentUser.id);
    return {
      total: mine.length,
      returned: mine.filter((l) => l.status === 'dikembalikan').length,
      active: mine.filter((l) => l.status === 'dipinjam' || l.status === 'terlambat').length,
    };
  }, [currentUser, db.loans]);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateOwnProfile({ name, phone, department });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Profil Anggota
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Informasi keanggotaan pribadi dan ringkasan aktivitas perpustakaan Anda.
        </p>
      </div>

      {/* Member Card */}
      <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0F1E36] font-display text-xl font-bold text-white">
            {getInitials(currentUser.name)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-xl font-bold text-slate-900">{currentUser.name}</h2>
              <MemberStatusBadge status={currentUser.status} />
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{currentUser.email}</p>
            <p className="mt-1 font-mono text-xs text-slate-500">
              ID: {currentUser.id} · Terdaftar sejak {formatDateID(currentUser.registeredAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Total Transaksi</p>
          <p className="mt-1 font-display text-2xl font-bold text-[#0F1E36] tabular-nums">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Sedang Dipinjam</p>
          <p className="mt-1 font-display text-2xl font-bold text-sky-700 tabular-nums">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Selesai Kembali</p>
          <p className="mt-1 font-display text-2xl font-bold text-teal-700 tabular-nums">{stats.returned}</p>
        </div>
      </div>

      {/* Editable Form */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-base font-bold text-slate-900">Perbarui Informasi Pribadi</h3>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Lengkap</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">No. Telepon</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Program / Divisi</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Alamat Email (Tetap)</label>
          <input
            type="email"
            disabled
            value={currentUser.email}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-500"
          />
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Profil</span>
          </button>
        </div>
      </form>
    </div>
  );
};
