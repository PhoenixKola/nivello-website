import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Nivello Studio',
  description:
    'Learn more about Nivello Studio, an Italian digital studio focused on marketing, design and modern web development.'
}

export default function AboutPage() {
  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-3xl px-4 pb-12 pt-10 md:pb-16 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            About
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            A small studio for brands that care about details.
          </h1>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-300 md:py-14 space-y-5">
          <p>
            Nivello is a compact digital studio based in Italy, focused
            on helping companies communicate clearly and look modern across
            every touchpoint. We combine marketing strategy, interface design
            and front-end development in one place, so you do not have to manage
            three different suppliers.
          </p>
          <p>
            We work mainly with founders, small teams and established SMEs that
            want a partner they can speak to directly. No layers of account
            managers – you collaborate with the people actually designing and
            building your site.
          </p>
          <p>
            Our work ranges from marketing websites and simple landing pages to
            UI for SaaS products and custom front-end builds using React and
            Next.js. The goal is always the same: a result that looks sharp,
            feels fast, and supports your business goals.
          </p>
          <p>
            Projects are usually run remotely, with clear milestones, Figma
            previews and staging links. We keep communication structured and
            async-friendly so you can focus on your own work while things move
            forward in the background.
          </p>
          <p>
            If you are looking for a long-term design and development partner
            that understands both Italian and international expectations, we
            would be happy to hear from you.
          </p>
        </div>
      </section>
    </main>
  )
}