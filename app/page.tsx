import Link from "next/link";

export default function Home() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-center text-slate-900">
      <section className="max-w-xl rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-premium">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-brand-700">
          MPVTL
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-navy-950">
          Short Course Registration
        </h1>
        <p className="mt-4 leading-7 text-slate-600">
          Take the next step toward practical skills, career confidence, and professional growth with MPVTL.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex rounded-full bg-brand-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-600"
        >
          Open Registration
        </Link>
      </section>
    </main>
  );
}
