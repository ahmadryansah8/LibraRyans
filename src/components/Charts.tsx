import React from 'react';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Book, Category, Loan } from '../types/library';
import { formatMonthYearID } from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const BASE_FONT = {
  family: '"DM Sans", system-ui, sans-serif',
  size: 12,
};

export const MonthlyBorrowTrendChart: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  // Build last 6 months keys dynamically from latest loan or current date
  const monthKeys = React.useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return keys;
  }, []);

  const borrowCounts = monthKeys.map(
    (mk) => loans.filter((l) => l.borrowDate.startsWith(mk) && l.status !== 'ditolak').length
  );
  const returnCounts = monthKeys.map(
    (mk) => loans.filter((l) => l.returnDate && l.returnDate.startsWith(mk)).length
  );

  const data = {
    labels: monthKeys.map(formatMonthYearID),
    datasets: [
      {
        label: 'Peminjaman',
        data: borrowCounts,
        borderColor: '#0F1E36',
        backgroundColor: 'rgba(15, 30, 54, 0.08)',
        pointBackgroundColor: '#0F1E36',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.32,
        fill: true,
      },
      {
        label: 'Pengembalian',
        data: returnCounts,
        borderColor: '#0D9488',
        backgroundColor: 'rgba(13, 148, 136, 0.08)',
        pointBackgroundColor: '#0D9488',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        tension: 0.32,
        fill: true,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: BASE_FONT, color: '#334155' },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 10,
        titleFont: { ...BASE_FONT, weight: 'bold' },
        bodyFont: BASE_FONT,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748B', font: BASE_FONT },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, color: '#64748B', font: BASE_FONT },
        grid: { color: '#F1F5F9' },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Line data={data} options={options} />
    </div>
  );
};

export const CategoryBorrowChart: React.FC<{
  loans: Loan[];
  books: Book[];
  categories: Category[];
}> = ({ loans, books, categories }) => {
  const counts = React.useMemo(() => {
    const bookMap = new Map(books.map((b) => [b.id, b]));
    return categories.map((cat) => {
      const count = loans.filter((l) => {
        if (l.status === 'ditolak') return false;
        const b = bookMap.get(l.bookId);
        return b?.categoryId === cat.id;
      }).length;
      return { name: cat.name, count };
    });
  }, [books, categories, loans]);

  const data = {
    labels: counts.map((c) => c.name),
    datasets: [
      {
        label: 'Jumlah Peminjaman',
        data: counts.map((c) => c.count),
        backgroundColor: ['#0F1E36', '#0D9488', '#0284C7', '#0891B2', '#334155', '#14B8A6'],
        borderRadius: 6,
        barThickness: 20,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 10,
        bodyFont: BASE_FONT,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, color: '#64748B', font: BASE_FONT },
        grid: { color: '#F1F5F9' },
      },
      y: {
        grid: { display: false },
        ticks: { color: '#334155', font: BASE_FONT },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={data} options={options} />
    </div>
  );
};

export const TransactionActivityChart: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  const counts = {
    dipinjam: loans.filter((l) => l.status === 'dipinjam').length,
    dikembalikan: loans.filter((l) => l.status === 'dikembalikan').length,
    menunggu: loans.filter((l) => l.status === 'menunggu').length,
    terlambat: loans.filter((l) => l.status === 'terlambat').length,
    ditolak: loans.filter((l) => l.status === 'ditolak').length,
  };

  const data = {
    labels: ['Dipinjam', 'Dikembalikan', 'Menunggu', 'Terlambat', 'Ditolak'],
    datasets: [
      {
        data: [
          counts.dipinjam,
          counts.dikembalikan,
          counts.menunggu,
          counts.terlambat,
          counts.ditolak,
        ],
        backgroundColor: ['#0284C7', '#0D9488', '#D97706', '#E11D48', '#94A3B8'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '64%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, font: BASE_FONT, color: '#334155', padding: 14 },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        padding: 10,
        bodyFont: BASE_FONT,
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export const MemberMonthlyActivityChart: React.FC<{ loans: Loan[] }> = ({ loans }) => {
  const monthKeys = React.useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return keys;
  }, []);

  const data = {
    labels: monthKeys.map(formatMonthYearID),
    datasets: [
      {
        label: 'Buku Dipinjam',
        data: monthKeys.map((mk) => loans.filter((l) => l.borrowDate.startsWith(mk) && l.status !== 'ditolak').length),
        backgroundColor: '#0D9488',
        borderRadius: 6,
        barThickness: 24,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: '#0F172A', padding: 10, bodyFont: BASE_FONT },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#64748B', font: BASE_FONT } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, precision: 0, color: '#64748B', font: BASE_FONT },
        grid: { color: '#F1F5F9' },
      },
    },
  };

  return (
    <div className="h-56 w-full">
      <Bar data={data} options={options} />
    </div>
  );
};
