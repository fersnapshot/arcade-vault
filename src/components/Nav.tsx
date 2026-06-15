"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/games", label: "Biblioteca" },
  { href: "/hall-of-fame", label: "Salón de la Fama" },
  { href: "/about", label: "Acerca de", disabled: true },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[var(--bg)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="av-nav-logo-mark" />
          <span className="font-pixel text-xs tracking-widest leading-none">
            <span className="text-[var(--cyan)]">ARCADE</span>{" "}
            <span className="text-[var(--magenta)]">VAULT</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6 flex-1">
          {LINKS.map(({ href, label, disabled }) => {
            const active = isActive(href);
            if (disabled) {
              return (
                <span
                  key={href}
                  className="font-pixel text-[9px] tracking-widest text-white/20 cursor-not-allowed"
                >
                  {label}
                </span>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`font-pixel text-[9px] tracking-widest transition-colors relative pb-0.5 ${
                  active
                    ? "text-[var(--cyan)]! after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-[var(--cyan)]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Credits counter */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true">
            <rect x="6" y="0" width="8" height="2" fill="#ffcf3a" />
            <rect x="2" y="2" width="16" height="2" fill="#ffcf3a" />
            <rect x="0" y="4" width="20" height="12" fill="#ffcf3a" />
            <rect x="2" y="16" width="16" height="2" fill="#ffcf3a" />
            <rect x="6" y="18" width="8" height="2" fill="#ffcf3a" />
            <rect x="8" y="4" width="4" height="12" fill="#0a0a0f" />
          </svg>
          <span className="font-mono text-xs text-[var(--gold)] tracking-widest">
            CRÉDITOS · 03
          </span>
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="font-mono text-xs text-[var(--yellow)] tracking-widest">
                ▶ {user.name}
              </span>
              <button
                onClick={signOut}
                className="font-mono text-xs text-white/40 hover:text-white tracking-widest transition-colors"
              >
                SALIR
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="font-mono text-xs border border-[var(--cyan)] text-[var(--cyan)] px-3 py-1.5 tracking-widest hover:bg-[var(--cyan)] hover:text-black transition-all"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 ml-auto"
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
          {LINKS.map(({ href, label, disabled }) => {
            const active = isActive(href);
            if (disabled) {
              return (
                <span
                  key={href}
                  className="font-mono text-sm tracking-widest text-white/20"
                >
                  {label}
                </span>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`font-mono text-sm tracking-widest transition-colors ${
                  active
                    ? "text-[var(--cyan)]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <svg
                width="10"
                height="10"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <rect x="6" y="0" width="8" height="2" fill="#ffcf3a" />
                <rect x="2" y="2" width="16" height="2" fill="#ffcf3a" />
                <rect x="0" y="4" width="20" height="12" fill="#ffcf3a" />
                <rect x="2" y="16" width="16" height="2" fill="#ffcf3a" />
                <rect x="6" y="18" width="8" height="2" fill="#ffcf3a" />
                <rect x="8" y="4" width="4" height="12" fill="#0a0a0f" />
              </svg>
              <span className="font-pixel text-[8px] text-[var(--gold)] tracking-widest">
                CRÉDITOS · 03
              </span>
            </div>
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
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
