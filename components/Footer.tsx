import Link from 'next/link'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-800/60 bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© {year} Nivello Studio. All rights reserved.</p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Based in Italy · Working worldwide
          </span>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-slate-100">
              Contact
            </Link>
            <a href="mailto:hello@nivello.studio" className="hover:text-slate-100">
              hello@nivello.studio
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}