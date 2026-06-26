import Link from 'next/link'
import { getRoutePath } from '@/lib/site'

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center bg-slate-950">
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 text-center">
        <p className="text-7xl font-semibold tracking-tight text-[var(--brand-gold)] md:text-9xl">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold text-slate-50 md:text-2xl">
          This page does not exist.
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          It might be a broken link or a project that is not published yet.
          Use the navigation above or choose one of the options below.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={getRoutePath('home', 'en')}
            className="rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm hover:bg-slate-200"
          >
            Back to homepage
          </Link>
          <Link
            href={getRoutePath('contact', 'en')}
            className="rounded-full border border-slate-700 bg-slate-900/40 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-[var(--brand-gold)]/70 hover:bg-slate-900/70"
          >
            Contact us
          </Link>
        </div>
      </div>
    </div>
  )
}
