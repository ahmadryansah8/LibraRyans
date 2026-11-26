import React, { useState } from 'react';
import { Book } from '../types/library';

interface BookCoverProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PALETTE_CLASSES: Record<
  Book['coverPalette'],
  { bg: string; accent: string; text: string; sub: string; spine: string }
> = {
  navy: {
    bg: 'bg-[#0F1E36]',
    accent: 'text-cyan-300',
    text: 'text-white',
    sub: 'text-slate-300',
    spine: 'bg-[#091324]',
  },
  teal: {
    bg: 'bg-[#0D4A4E]',
    accent: 'text-teal-200',
    text: 'text-white',
    sub: 'text-teal-100/80',
    spine: 'bg-[#083336]',
  },
  slate: {
    bg: 'bg-[#1E293B]',
    accent: 'text-sky-300',
    text: 'text-white',
    sub: 'text-slate-300',
    spine: 'bg-[#0F172A]',
  },
  cyan: {
    bg: 'bg-[#0C3547]',
    accent: 'text-cyan-300',
    text: 'text-white',
    sub: 'text-cyan-100/80',
    spine: 'bg-[#072330]',
  },
  indigo: {
    bg: 'bg-[#1A2347]',
    accent: 'text-sky-300',
    text: 'text-white',
    sub: 'text-slate-300',
    spine: 'bg-[#101630]',
  },
  emerald: {
    bg: 'bg-[#0F3D38]',
    accent: 'text-teal-200',
    text: 'text-white',
    sub: 'text-emerald-100/80',
    spine: 'bg-[#082623]',
  },
};

const CoverMotifSVG: React.FC<{ pattern: Book['coverPattern']; className?: string }> = ({
  pattern,
  className = '',
}) => {
  switch (pattern) {
    case 'orbital':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="1" opacity="0.45" />
          <ellipse cx="60" cy="60" rx="48" ry="20" transform="rotate(-24 60 60)" stroke="currentColor" strokeWidth="1" opacity="0.7" />
          <ellipse cx="60" cy="60" rx="48" ry="20" transform="rotate(32 60 60)" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <circle cx="60" cy="60" r="5" fill="currentColor" opacity="0.9" />
          <circle cx="93" cy="40" r="2.5" fill="currentColor" />
        </svg>
      );
    case 'arch':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <path d="M25 104V58C25 38.67 40.67 23 60 23C79.33 23 95 38.67 95 58V104" stroke="currentColor" strokeWidth="1.25" opacity="0.65" />
          <path d="M38 104V62C38 49.85 47.85 40 60 40C72.15 40 82 49.85 82 62V104" stroke="currentColor" strokeWidth="1" opacity="0.45" />
          <line x1="16" y1="104" x2="104" y2="104" stroke="currentColor" strokeWidth="1.25" opacity="0.75" />
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <rect x="20" y="20" width="80" height="80" stroke="currentColor" strokeWidth="1" opacity="0.5" />
          <line x1="47" y1="20" x2="47" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="73" y1="20" x2="73" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="20" y1="47" x2="100" y2="47" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <line x1="20" y1="73" x2="100" y2="73" stroke="currentColor" strokeWidth="1" opacity="0.4" />
          <rect x="47" y="47" width="26" height="26" fill="currentColor" opacity="0.22" />
        </svg>
      );
    case 'waves':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <path d="M12 42C30 30 48 54 66 42C84 30 96 46 108 40" stroke="currentColor" strokeWidth="1.2" opacity="0.65" />
          <path d="M12 60C30 48 48 72 66 60C84 48 96 64 108 58" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
          <path d="M12 78C30 66 48 90 66 78C84 66 96 82 108 76" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
        </svg>
      );
    case 'monolith':
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <rect x="26" y="28" width="24" height="72" stroke="currentColor" strokeWidth="1.1" opacity="0.55" />
          <rect x="56" y="18" width="38" height="82" fill="currentColor" opacity="0.16" stroke="currentColor" strokeWidth="1.1" />
          <line x1="16" y1="100" x2="104" y2="100" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
        </svg>
      );
    case 'geometric':
    default:
      return (
        <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
          <polygon points="60,18 100,88 20,88" stroke="currentColor" strokeWidth="1.1" opacity="0.6" />
          <polygon points="60,36 86,82 34,82" stroke="currentColor" strokeWidth="1" opacity="0.35" />
          <line x1="60" y1="18" x2="60" y2="88" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        </svg>
      );
  }
};

export const BookCover: React.FC<BookCoverProps> = ({ book, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const palette = PALETTE_CLASSES[book.coverPalette] ?? PALETTE_CLASSES.navy;

  if (size === 'sm') {
    return (
      <div
        className={`relative aspect-[3/4] w-11 shrink-0 overflow-hidden rounded border border-slate-200/80 ${palette.bg} ${className}`}
      >
        {book.coverImage && !imgError ? (
          <img
            src={book.coverImage}
            alt={`Sampul buku ${book.title}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-between p-1.5">
            <div className={`h-0.5 w-4 rounded-full bg-current ${palette.accent}`} />
            <CoverMotifSVG pattern={book.coverPattern} className={`mx-auto h-5 w-5 ${palette.accent}`} />
            <div className="h-0.5 w-full bg-white/20" />
          </div>
        )}
      </div>
    );
  }

  const paddingClass = size === 'lg' ? 'p-5' : 'p-4';
  const titleClass = size === 'lg' ? 'text-base leading-snug' : 'text-sm leading-snug';
  const motifClass = size === 'lg' ? 'h-24 w-24' : 'h-16 w-16';

  return (
    <div
      className={`group relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-slate-200/60 ${palette.bg} ${className}`}
    >
      {book.coverImage && !imgError ? (
        <>
          <img
            src={book.coverImage}
            alt={`Sampul buku ${book.title}`}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="font-mono text-[10px] tracking-wider text-cyan-300 tabular-nums">{book.id}</p>
            <h4 className="mt-1 line-clamp-2 font-display text-sm font-semibold text-white">{book.title}</h4>
            <p className="mt-1 truncate text-xs text-slate-300">{book.author}</p>
          </div>
        </>
      ) : (
        <div className={`relative flex h-full w-full flex-col justify-between ${paddingClass}`}>
          {/* Subtle book spine crease */}
          <div className={`absolute inset-y-0 left-0 w-2.5 ${palette.spine} opacity-80`} />
          <div className="relative z-10 pl-2">
            <div className="flex items-center justify-between gap-2">
              <span className={`font-mono text-[10px] font-medium tracking-wider tabular-nums ${palette.accent}`}>
                {book.id}
              </span>
              <span className={`font-mono text-[10px] tabular-nums ${palette.sub}`}>{book.year}</span>
            </div>
            <div className="mt-2 h-px w-full bg-white/15" />
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center pl-2">
            <CoverMotifSVG pattern={book.coverPattern} className={`${motifClass} ${palette.accent}`} />
          </div>

          <div className="relative z-10 pl-2">
            <div className="mb-2 h-px w-8 bg-current opacity-40" />
            <h4 className={`line-clamp-3 font-display font-semibold tracking-tight ${titleClass} ${palette.text}`}>
              {book.title}
            </h4>
            <p className={`mt-1.5 truncate text-[11px] ${palette.sub}`}>{book.author}</p>
          </div>
        </div>
      )}
    </div>
  );
};
