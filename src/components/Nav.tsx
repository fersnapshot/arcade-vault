"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

const LINKS = [
  { href: "/library", label: "BIBLIOTECA" },
  { href: "/hall-of-fame", label: "SALÓN" },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[var(--bg)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/library"
          className="font-pixel text-[10px] text-[var(--cyan)] tracking-widest hover:text-white transition-colors"
        >
          ARCADE<span className="text-white/40">_</span>VAULT
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-mono text-xs tracking-widest transition-colors ${
                pathname === href
                  ? "text-[var(--cyan)]"
                  : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              <span className="font-mono text-xs text-[var(--yellow)] tracking-widest">
                ▶ {user.name}
              </span>
              <button
                onClick={signOut}
                className="font-mono text-xs text-white/40 hover:text-white tracking-widest transition-colors"
              >
                SALIR
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="font-mono text-xs border border-[var(--cyan)] text-[var(--cyan)] px-3 py-1.5 tracking-widest hover:bg-[var(--cyan)] hover:text-black transition-all"
            >
              INICIAR SESIÓN
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú"
        >
          <span
            className={`block w-5 h-px bg-white transition-all ${
              open ? "rotate-45 translate-y-2" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-white transition-all ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-white transition-all ${
              open ? "-rotate-45 -translate-y-2" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[var(--bg)] px-4 py-6 flex flex-col gap-6">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="font-mono text-sm tracking-widest text-white/70 hover:text-white transition-colors"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-4">
            {user ? (
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--yellow)] tracking-widest">
                  ▶ {user.name}
                </span>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="font-mono text-xs text-white/40 hover:text-white tracking-widest"
                >
                  SALIR
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className="font-mono text-xs border border-[var(--cyan)] text-[var(--cyan)] px-3 py-2 tracking-widest block text-center"
              >
                INICIAR SESIÓN
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
