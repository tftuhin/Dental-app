import { COMPANY } from "@/site/config";

/** Layout for the privacy policy and terms (plain, readable, numbered sections). */
export function LegalPage({ title, intro, sections }: { title: string; intro: string; sections: Array<{ heading: string; body: React.ReactNode }> }) {
  return (
    <article className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated {COMPANY.legalUpdated}</p>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">{intro}</p>
        <nav aria-label="Contents" className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">Contents</p>
          <ol className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.heading}>
                <a href={`#s${i + 1}`} className="hover:text-teal-800">
                  {i + 1}. {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="mt-10 space-y-10">
          {sections.map((s, i) => (
            <section key={s.heading} id={`s${i + 1}`} className="scroll-mt-24">
              <h2 className="text-xl font-semibold text-slate-900">
                {i + 1}. {s.heading}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-slate-700 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
