import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center bg-slate-950">
      <div className="mx-auto max-w-xl px-4 text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          404
        </p>
        <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
          This page does not exist yet.
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          It might be a broken link or a project we have not published yet.
          Use the navigation above or head back to the homepage.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
          >
            Back to homepage
          </Link>
          <Link
            href="/contact"
            className="rounded-full border border-slate-700 bg-slate-900/40 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-emerald-500/60 hover:bg-slate-900/70"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  )
}