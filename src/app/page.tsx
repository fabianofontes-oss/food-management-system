"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!slug.trim()) return;
    router.push(/);
  }

  function goToDashboard() {
    if (!slug.trim()) return;
    router.push(//dashboard);
  }

  const isEmpty = slug.trim().length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold">
            Food Management System
          </h1>
          <p className="text-sm text-slate-400">
            Digite o <span className="font-mono text-slate-200">slug</span> de uma loja
            para abrir o cardápio ou o painel do lojista.
          </p>
        </header>

        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-xs font-medium text-slate-400">
              Slug da loja
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ex: acai-sabor-real"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-500"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                disabled={isEmpty}
                className="rounded-xl border border-emerald-500 bg-emerald-500/10 px-3 py-2 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Ver cardápio /[slug]
              </button>

              <button
                type="button"
                onClick={goToDashboard}
                disabled={isEmpty}
                className="rounded-xl border border-sky-500 bg-sky-500/10 px-3 py-2 text-sm font-medium hover:bg-sky-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Abrir dashboard /[slug]/dashboard
              </button>
            </div>
          </form>
        </section>

        <section className="flex items-center justify-between text-xs text-slate-400">
          <div className="space-x-3">
            <Link
              href="/admin"
              className="underline-offset-4 hover:underline text-slate-200"
            >
              Painel Super Admin (/admin)
            </Link>
            <Link
              href="/login"
              className="underline-offset-4 hover:underline"
            >
              Login
            </Link>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            v0.1  dev launcher
          </span>
        </section>
      </div>
    </div>
  );
}
