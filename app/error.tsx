"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 text-center text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-premium">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">MPVTL</p>
        <h1 className="mt-3 text-2xl font-semibold text-navy-950">Something needs a refresh</h1>
        <p className="mt-4 text-sm leading-6 text-slate-600">
          The page could not load cleanly. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-brand-700 px-6 py-3 text-sm font-bold text-white shadow-redGlow"
        >
          Try Again
        </button>
      </section>
    </main>
  );
}
