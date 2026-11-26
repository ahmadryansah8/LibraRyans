import React, { useState } from 'react';
import { RotateCcw, Save } from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useLibrary } from '../../context/LibraryContext';
import { LibrarySettings } from '../../types/library';

export const AdminSettingsPage: React.FC = () => {
  const { db, updateSettings, resetDemoDatabase } = useLibrary();
  const [form, setForm] = useState<LibrarySettings>(db.settings);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  React.useEffect(() => {
    setForm(db.settings);
  }, [db.settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          Pengaturan Sistem &amp; Aturan Sirkulasi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Sesuaikan batas maksimal peminjaman, lama masa pinjam, dan tarif denda keterlambatan harian.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Nama Perpustakaan
            </label>
            <input
              type="text"
              required
              value={form.libraryName}
              onChange={(e) => setForm({ ...form, libraryName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Email Layanan Perpustakaan
            </label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Maksimal Buku per Anggota
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={form.maxBooksPerMember}
              onChange={(e) => setForm({ ...form, maxBooksPerMember: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">Batas transaksi aktif &amp; menunggu per member.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Lama Peminjaman Standar (Hari)
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={form.loanDurationDays}
              onChange={(e) => setForm({ ...form, loanDurationDays: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">Durasi jatuh tempo otomatis saat persetujuan.</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Tarif Denda Harian (IDR)
            </label>
            <input
              type="number"
              min={0}
              step={500}
              value={form.dailyFineIdr}
              onChange={(e) => setForm({ ...form, dailyFineIdr: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2 font-mono text-sm tabular-nums text-slate-900 focus:border-teal-600 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-500">Dihitung per hari setelah tanggal jatuh tempo.</p>
          </div>

          <div className="flex items-center gap-3 pt-5">
            <input
              id="auto-overdue"
              type="checkbox"
              checked={form.autoFlagOverdue}
              onChange={(e) => setForm({ ...form, autoFlagOverdue: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <label htmlFor="auto-overdue" className="text-sm font-medium text-slate-700">
              Tandai keterlambatan secara otomatis
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 pt-4">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            <Save className="h-4 w-4" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>

      {/* Demo Data Reset Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-display text-base font-bold text-slate-900">
          Pemulihan Data Demo Lokal
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Jika Anda ingin mengembalikan 24 koleksi buku, data anggota, dan daftar transaksi ke kondisi awal demo, gunakan tombol di bawah ini.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setResetDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Seluruh Data Demo</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        onConfirm={() => resetDemoDatabase()}
        title="Reset Data Demo LibraRyan"
        description="Seluruh perubahan buku, anggota baru, dan transaksi di browser ini akan dikembalikan ke data awal demo. Lanjutkan?"
        confirmLabel="Ya, Reset Data"
      />
    </div>
  );
};
