"use client";
import { useRouter, usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/config";

const LABEL: Record<Locale, string> = { "pt-BR": "PT", es: "ES", en: "EN" };

/** Text-only luxury switcher: PT | ES | EN. Active = champagne gold + teal dot.
 *  Persists the manual choice in a cookie so it survives future visits. */
export function LanguageToggle({ current }: { current: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    const rest = pathname.replace(/^\/(pt-BR|es|en)/, "");
    router.push(`/${next}${rest || ""}`);
  }

  return (
    <div className="lang" role="group" aria-label="Language">
      {LOCALES.map((l, i) => (
        <span key={l}>
          {i > 0 && <span className="sep" aria-hidden="true">|</span>}
          <button
            type="button"
            aria-pressed={l === current}
            onClick={() => switchTo(l)}
          >
            {LABEL[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
