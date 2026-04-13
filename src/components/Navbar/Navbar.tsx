"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MeResponse = {
  ok: boolean;
  user: null | { id: string; email: string; name: string; plan: string };
};

export default function Navbar() {
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json: MeResponse = await res.json();
        if (!active) return;
        setIsAuthed(Boolean(json?.user));
      } catch {
        if (!active) return;
        setIsAuthed(false);
      }
    }
    void loadMe();
    return () => {
      active = false;
    };
  }, []);

  return (
    <nav className="relative w-full overflow-hidden bg-black/95 backdrop-blur-md">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo Section */}
        <span className="text-sm font-semibold text-white">Stellar</span>
        {/* Navigation Links */}
        <div className="flex items-center gap-6 text-sm md:gap-8">
          <Link
            href="/"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/trade"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Trade
          </Link>
          <Link
            href="/dashboard/portfolio"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Portfolio
          </Link>
          <Link
            href="/dashboard/orders"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Orders
          </Link>
          <Link
            href="/dashboard/engine"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Engine
          </Link>
          <Link
            href="/dashboard/mutual-funds"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Mutual Funds
          </Link>
          <Link
            href="/crypto"
            className="text-gray-300 transition-colors hover:text-white"
          >
            Crypto
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <Link
            href={isAuthed ? "/profile" : "/login"}
            className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black transition hover:bg-gray-200"
          >
            {isAuthed ? "Profile" : "Login"}
          </Link>
        </div>
      </div>
    </nav>
  );
}
