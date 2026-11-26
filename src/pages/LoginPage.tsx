import React, { useState } from 'react';
import { ArrowLeft, BookOpen, ShieldCheck, UserCheck } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

interface LoginPageProps {
  onBackHome: () => void;
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackHome, onSuccess }) => {
  const { login, loginAsDemo, registerMember } = useLibrary();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDept, setRegDept] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(email, password);
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    onSuccess();
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = registerMember({
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      department: regDept,
    });
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    onSuccess();
  };

  const handleDemo = (role: 'admin' | 'member') => {
    setErrorMsg('');
    const res = loginAsDemo(role);
    if (res.ok) {
      onSuccess();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Left Brand Panel */}
      <div className="flex flex-col justify-between bg-[#0F1E36] px-8 py-10 text-white lg:w-[44%] lg:px-12 lg:py-12">
        <div>
          <button
            type="button"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Beranda</span>
          </button>

          <div className="mt-10 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="font-display text-2xl font-extrabold tracking-tight">LibraRyan</span>
          </div>

          <h1 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-white">
            Akses Terpadu untuk Pustakawan &amp; Anggota.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Masuk menggunakan akun Administrator untuk mengelola koleksi, anggota, sirkulasi, dan laporan otomatis, atau gunakan akun Member untuk meminjam buku serta memantau tenggat pengembalian.
          </p>
        </div>

        {/* Demo Account Quick Access Box */}
        <div className="mt-10 rounded-xl border border-slate-700/80 bg-slate-900/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Akses Cepat Akun Demo
          </p>
          <p className="mt-1 text-xs text-slate-300">
            Pilih salah satu role di bawah untuk langsung mencoba dashboard sesuai hak akses.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <button
              type="button"
              onClick={() => handleDemo('admin')}
              className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-3.5 text-left transition-colors hover:border-cyan-400 hover:bg-slate-800"
            >
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Demo Admin</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-300">admin@libraryan.id</p>
                <p className="font-mono text-[11px] text-slate-400">Pass: admin123</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemo('member')}
              className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-800/80 p-3.5 text-left transition-colors hover:border-teal-400 hover:bg-slate-800"
            >
              <UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-400" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Demo Member</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-slate-300">member@libraryan.id</p>
                <p className="font-mono text-[11px] text-slate-400">Pass: member123</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daftar Member
            </button>
          </div>

          {errorMsg && (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">Masuk ke LibraRyan</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Masukkan kredensial akun atau gunakan tombol Demo di samping.
                </p>
              </div>

              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Alamat Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@libraryan.id"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Kata Sandi
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#0F1E36] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Masuk Sekarang
              </button>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-center text-xs text-slate-500">
                  Ingin langsung mengisi form?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@libraryan.id');
                      setPassword('admin123');
                    }}
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    Isi Admin
                  </button>{' '}
                  atau{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('member@libraryan.id');
                      setPassword('member123');
                    }}
                    className="font-semibold text-teal-700 hover:underline"
                  >
                    Isi Member
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-3.5">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">Pendaftaran Member Baru</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Buat akun anggota untuk meminjam koleksi dan menyimpan favorit.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Raka Mahendra"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Alamat Email</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="raka@email.com"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">No. Telepon</label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Program / Divisi</label>
                  <input
                    type="text"
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    placeholder="Contoh: Teknik Sipil"
                    className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Kata Sandi (min. 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 focus:border-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Daftar &amp; Masuk
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
