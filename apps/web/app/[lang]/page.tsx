import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";
import { LanguageToggle } from "./_components/LanguageToggle";

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const d = getDictionary(locale);

  return (
    <main>
      <nav className="nav">
        <div className="brand">
          <b>OSTENTACULUS</b>
          <span>{d.brandTag}</span>
        </div>
        <LanguageToggle current={locale} />
      </nav>

      <header className="hero">
        <div className="eyebrow">{d.eyebrow}</div>
        {/* slogan carries a single trusted <span class="accent"> from our own dictionary */}
        <h1 className="slogan" dangerouslySetInnerHTML={{ __html: d.slogan }} />
        <div className="live"><span className="dot" />{d.live}</div>
        <p className="lede">{d.lede}</p>
        <div className="cta-row">
          <a className="btn btn-gold" href="#contact">{d.ctaPrimary}</a>
          <a className="btn btn-ghost" href="#vectors">{d.ctaSecondary}</a>
        </div>
      </header>
      {/* Full styled sections (7 vectors, moat, retainers) live in the design
          artifact; wire them here pulling from the dictionary matrix. */}
    </main>
  );
}
