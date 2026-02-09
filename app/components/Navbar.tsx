"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { allNavMenus, type NavMenu, type NavCard } from "@/lib/navigation";

const neonColors: Record<string, string> = {
  cyan: "border-cyan-400/60 bg-cyan-500/10 hover:border-cyan-300 hover:bg-cyan-500/20 text-cyan-200",
  emerald: "border-emerald-400/60 bg-emerald-500/10 hover:border-emerald-300 hover:bg-emerald-500/20 text-emerald-200",
  amber: "border-amber-400/60 bg-amber-500/10 hover:border-amber-300 hover:bg-amber-500/20 text-amber-200",
  violet: "border-violet-400/60 bg-violet-500/10 hover:border-violet-300 hover:bg-violet-500/20 text-violet-200",
  fuchsia: "border-fuchsia-400/60 bg-fuchsia-500/10 hover:border-fuchsia-300 hover:bg-fuchsia-500/20 text-fuchsia-200",
  sky: "border-sky-400/60 bg-sky-500/10 hover:border-sky-300 hover:bg-sky-500/20 text-sky-200",
  rose: "border-rose-400/60 bg-rose-500/10 hover:border-rose-300 hover:bg-rose-500/20 text-rose-200",
  lime: "border-lime-400/60 bg-lime-500/10 hover:border-lime-300 hover:bg-lime-500/20 text-lime-200",
};

function NavCardItem({ card }: { card: NavCard }) {
  const colorClass = neonColors[card.neonColor] ?? neonColors.cyan;
  return (
    <Link
      href={card.href}
      className={`block rounded-xl border-2 p-4 transition-all ${colorClass}`}
    >
      <span className="font-semibold">{card.label}</span>
    </Link>
  );
}

function NavDropdown({ menu }: { menu: NavMenu }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-4 py-2 text-neutral-300 hover:bg-neutral-800 hover:text-white transition"
      >
        <span>{menu.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-1 z-50">
          <div className="min-w-[200px] rounded-xl border border-neutral-700 bg-neutral-900/95 backdrop-blur-sm p-3 shadow-xl shadow-black/30 grid gap-2">
            {menu.cards.map((card) => (
              <NavCardItem key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
            <span className="text-sm font-bold text-white">I</span>
          </div>
          <span className="text-xl font-bold text-white">Illustrate</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {allNavMenus.map((menu) => (
            <NavDropdown key={menu.id} menu={menu} />
          ))}
        </nav>
      </div>
    </header>
  );
}
