import { site } from "../content/site";
import { DKMonogram } from "./Nav";

export function Footer() {
  return (
    <footer className="relative bg-[#08080A] border-t border-white/5">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-16 md:py-20">
        <div className="grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2">
              <DKMonogram />
              <span className="font-display uppercase tracking-[0.2em] steel">{site.brand}</span>
            </div>
            <p className="mt-4 text-sm text-neutral-500 max-w-xs">
              {site.footer.tagline}
            </p>
            <a href={`tel:${site.phone}`} className="mt-4 inline-block text-lg text-neutral-200 hover:text-[#F08A1D] transition-colors" data-interactive>
              {site.phone}
            </a>
          </div>
          {site.footer.columns.map((c) => (
            <div key={c.title}>
              <div className="text-[10px] tracking-[0.4em] uppercase text-[#F08A1D] mb-4">{c.title}</div>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-neutral-400 hover:text-white transition-colors" data-interactive>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 pt-8 border-t border-white/5">
          <div className="flex gap-4">
            {site.footer.socials.map((s) => (
              <a key={s} href="#" className="text-xs tracking-[0.3em] uppercase text-neutral-400 hover:text-[#F08A1D]" data-interactive>{s}</a>
            ))}
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-600">{site.footer.legal}</div>
        </div>
      </div>
    </footer>
  );
}
