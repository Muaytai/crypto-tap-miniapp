"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  onReload?: () => void;
};

export function ThreeDotsMenu({ onReload }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openLink = (url: string) => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.openLink(url, { try_instant_view: true });
    } else {
      window.open(url, "_blank");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Кнопка ⋮ */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/5 active:bg-black/10"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div
          className="absolute right-0 top-[110%] z-[100] w-[210px] overflow-hidden rounded-[14px] border border-zinc-100 bg-white py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-150"
          style={{ transformOrigin: 'top right' }}
        >
          {/* Reload */}
          <button
            onClick={() => { onReload ? onReload() : window.location.reload(); setIsOpen(false); }}
            className="flex w-full items-center gap-4 px-4 py-[10px] text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
          >
            <ReloadIcon />
            <span className="text-[15px] leading-tight text-zinc-700">Reload Page</span>
          </button>

          {/* Divider */}
          <div className="mx-4 my-1 h-[0.5px] bg-zinc-100" />

          {/* Terms */}
          <button
            onClick={() => openLink("https://telegram.org/tos/mini-apps")}
            className="flex w-full items-center gap-4 px-4 py-[10px] text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
          >
            <TermsIcon />
            <span className="text-[15px] leading-tight text-zinc-700">Terms of Use</span>
          </button>

          {/* Privacy */}
          <button
            onClick={() => openLink("https://telegra.ph/Politika-konfidencialnosti--Kaplya-Ruperta-05-10")}
            className="flex w-full items-center gap-4 px-4 py-[10px] text-left transition-colors hover:bg-zinc-50 active:bg-zinc-100"
          >
            <PrivacyIcon />
            <span className="text-[15px] leading-tight text-zinc-700">Privacy Policy</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Иконки максимально близкие к стилю Telegram (тонкие линии 1.5-2px)
function ReloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function TermsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
      <path d="M9 17h3" />
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}