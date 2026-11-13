import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Globe, Menu, X } from "lucide-react";
import { SpendryLogo } from "./SpendryLogo";
import { Markdown } from "@/lib/markdown";
import {
  DEFAULT_LANG,
  LANGS,
  LANG_NAME,
  STRINGS,
  firstSlug,
  getDoc,
  getDocs,
  isLang,
  otherLang,
  slugExists,
  type Lang,
} from "@/lib/docs";
import { isPlainClick, navigate } from "@/lib/nav";

const docPath = (lang: Lang, slug: string) => `/docs/${lang}/${slug}`;

/** Anchor that navigates in-app on a plain click and keeps the browser default otherwise. */
function NavLink({
  to, className, style, current, children, onNavigate,
}: {
  to: string;
  className?: string;
  style?: CSSProperties;
  current?: boolean;
  children: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <a
      href={to}
      aria-current={current ? "page" : undefined}
      className={className}
      style={style}
      onClick={(e) => {
        if (!isPlainClick(e)) return;
        e.preventDefault();
        navigate(to);
        onNavigate?.();
      }}
    >
      {children}
    </a>
  );
}

function LanguageSwitch({ lang, slug }: { lang: Lang; slug: string | undefined }) {
  return (
    <div className="flex items-center gap-2">
      <Globe className="size-4 hidden sm:block" style={{ color: "var(--subtle)" }} aria-hidden="true" />
      <div
        role="group"
        aria-label={STRINGS[lang].language}
        className="flex rounded-xl p-0.5"
        style={{ background: "var(--surface-strong)", border: "1px solid var(--border)" }}
      >
        {LANGS.map((l) => {
          const active = l === lang;
          return (
            <button
              key={l}
              type="button"
              lang={l}
              aria-pressed={active}
              title={LANG_NAME[l]}
              aria-label={LANG_NAME[l]}
              onClick={() => navigate(docPath(l, slug && getDoc(l, slug) ? slug : (firstSlug(l) ?? "")))}
              className="rounded-[10px] px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
              style={{
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#0a1525" : "var(--muted)",
              }}
            >
              {l.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Notice({ title, body, linkTo, linkLabel }: { title: string; body: string; linkTo: string; linkLabel: string }) {
  return (
    <div className="rounded-3xl p-10 text-center max-w-md mx-auto mt-10" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h1 className="display text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>{title}</h1>
      {body && <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>{body}</p>}
      <NavLink to={linkTo} className="text-sm font-medium underline underline-offset-2" style={{ color: "var(--accent)" }}>
        {linkLabel}
      </NavLink>
    </div>
  );
}

export function DocsPage({ path }: { path: string }) {
  const parts = path.split("/").filter(Boolean); // ["docs", lang?, slug?, ...]
  const rawLang = parts[1];
  const slug = parts[2];

  // Language comes from the URL. A bare /docs has none, so DEFAULT_LANG (TBD) applies.
  const lang: Lang | null = rawLang === undefined ? DEFAULT_LANG : isLang(rawLang) ? rawLang : null;
  const uiLang: Lang = lang ?? DEFAULT_LANG;
  const t = STRINGS[uiLang];

  const redirectTo =
    lang && parts.length <= 2 && firstSlug(lang) ? docPath(lang, firstSlug(lang) ?? "") : null;

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true });
  }, [redirectTo]);

  const docs = lang ? getDocs(lang) : [];
  const doc = lang && slug && parts.length === 3 ? getDoc(lang, slug) : undefined;

  // Keep <html lang> and the tab title in step with the language being read.
  useEffect(() => {
    const prevTitle = document.title;
    const prevLang = document.documentElement.lang;
    document.documentElement.lang = uiLang;
    document.title = doc ? `${doc.title} · Spendry` : `${t.docs} · Spendry`;
    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang || "en";
    };
  }, [uiLang, doc, t.docs]);

  const index = doc ? docs.findIndex((d) => d.slug === doc.slug) : -1;
  const prev = index > 0 ? docs[index - 1] : undefined;
  const next = index >= 0 && index < docs.length - 1 ? docs[index + 1] : undefined;

  let content: ReactNode;
  if (redirectTo) {
    content = null;
  } else if (!lang || parts.length > 3) {
    content = <Notice title={t.notFoundTitle} body={t.notFoundBody} linkTo="/docs" linkLabel={t.backToDocs} />;
  } else if (doc) {
    content = (
      <>
        <Markdown source={doc.body} />
        {(prev || next) && (
          <nav aria-label={t.pages} className="mt-12 grid gap-3 sm:grid-cols-2">
            {prev ? (
              <NavLink to={docPath(lang, prev.slug)} className="group rounded-2xl p-4 transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider" style={{ color: "var(--subtle)" }}>
                  <ArrowLeft className="size-3" aria-hidden="true" />{t.previous}
                </span>
                <span className="display mt-1 block text-sm font-semibold" style={{ color: "var(--ink)" }}>{prev.title}</span>
              </NavLink>
            ) : <span />}
            {next ? (
              <NavLink to={docPath(lang, next.slug)} className="group rounded-2xl p-4 text-right transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <span className="flex items-center justify-end gap-1.5 text-[11px] uppercase tracking-wider" style={{ color: "var(--subtle)" }}>
                  {t.next}<ArrowRight className="size-3" aria-hidden="true" />
                </span>
                <span className="display mt-1 block text-sm font-semibold" style={{ color: "var(--ink)" }}>{next.title}</span>
              </NavLink>
            ) : <span />}
          </nav>
        )}
      </>
    );
  } else if (slug && slugExists(slug)) {
    // The page exists, but not in this language yet.
    const other = otherLang(lang);
    content = (
      <Notice title={t.notTranslated} body="" linkTo={docPath(other, slug)} linkLabel={STRINGS[lang].readIn} />
    );
  } else {
    content = <Notice title={t.notFoundTitle} body={t.notFoundBody} linkTo={docPath(lang, firstSlug(lang) ?? "")} linkLabel={t.backToDocs} />;
  }

  const navList = (
    <nav aria-label={t.pages} className="flex flex-col gap-0.5">
      {docs.map((d) => {
        const active = d.slug === doc?.slug;
        return (
          <NavLink
            key={d.slug}
            to={docPath(d.lang, d.slug)}
            current={active}
            onNavigate={() => setMenuOpen(false)}
            className="rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            style={{
              color: active ? "var(--accent)" : "var(--muted)",
              background: active ? "rgba(172,198,233,0.08)" : "transparent",
            }}
          >
            {d.title}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--bg-gradient)" }}>
      <a
        href="#doc-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2 focus:text-sm"
        style={{ background: "var(--accent)", color: "#0a1525" }}
      >
        {t.skip}
      </a>

      <header
        className="sticky top-0 z-30 border-b"
        style={{ background: "rgba(13,27,47,0.88)", backdropFilter: "blur(20px)", borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.06] lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
            style={{ color: "var(--muted)" }}
            aria-label={t.menu}
            aria-expanded={menuOpen}
            aria-controls="docs-nav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          <NavLink to="/docs" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]">
            <SpendryLogo variant="primary" size={26} gradId="sgl-docs" />
            <span className="hidden items-center gap-1.5 border-l pl-3 text-sm font-medium sm:flex" style={{ color: "var(--muted)", borderColor: "var(--border)" }}>
              <BookOpen className="size-3.5" aria-hidden="true" />{t.docs}
            </span>
          </NavLink>

          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitch lang={uiLang} slug={slug} />
            <NavLink
              to="/"
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-transform hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
              style={{ background: "var(--accent)", color: "#0a1525" }}
            >
              {t.openApp}
            </NavLink>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
        <aside id="docs-nav" className={`${menuOpen ? "block" : "hidden"} mb-6 lg:block lg:mb-0`}>
          <div className="lg:sticky lg:top-24">{navList}</div>
        </aside>

        <main>
          <article id="doc-content" tabIndex={-1} className="max-w-3xl outline-none">
            {content}
          </article>
        </main>
      </div>

      <footer className="border-t" style={{ borderColor: "var(--border)" }}>
        <p className="mx-auto max-w-6xl px-4 py-4 text-[11px] sm:px-6" style={{ color: "var(--subtle)" }}>
          &copy; {new Date().getFullYear()} Spendry &middot; {t.footer} &middot; {LANG_NAME[uiLang]}
        </p>
      </footer>
    </div>
  );
}
