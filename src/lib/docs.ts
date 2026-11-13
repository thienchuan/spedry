/**
 * Public documentation loader.
 *
 * Only `docs/public/<lang>/<slug>.md` is bundled. `docs/internal/` is never
 * imported anywhere, so it cannot reach the production build, and a file
 * without `visibility: public` in its frontmatter is ignored even if it sits
 * in the public folder.
 */

export type Lang = "en" | "vi";

export const LANGS: readonly Lang[] = ["en", "vi"];

/**
 * Language used when the URL has none (bare /docs).
 * TBD: the project has not decided a default or how to remember the choice.
 * English is a technical placeholder; the choice is not persisted.
 */
export const DEFAULT_LANG: Lang = "en";

export const LANG_NAME: Record<Lang, string> = { en: "English", vi: "Tiếng Việt" };

export interface Doc {
  lang: Lang;
  slug: string;
  title: string;
  description: string;
  order: number;
  body: string;
}

/** Every string in the documentation chrome, in both languages. */
export interface DocsStrings {
  docs: string;
  openApp: string;
  language: string;
  menu: string;
  pages: string;
  previous: string;
  next: string;
  notTranslated: string;
  readIn: string;
  notFoundTitle: string;
  notFoundBody: string;
  backToDocs: string;
  footer: string;
  skip: string;
}

export const STRINGS: Record<Lang, DocsStrings> = {
  en: {
    docs: "Documentation",
    openApp: "Open app",
    language: "Language",
    menu: "Menu",
    pages: "Pages",
    previous: "Previous",
    next: "Next",
    notTranslated: "This page is not available in English yet.",
    readIn: "Read it in Tiếng Việt",
    notFoundTitle: "Page not found",
    notFoundBody: "This documentation page does not exist.",
    backToDocs: "Back to documentation",
    footer: "Spendry documentation",
    skip: "Skip to content",
  },
  vi: {
    docs: "Tài liệu",
    openApp: "Mở ứng dụng",
    language: "Ngôn ngữ",
    menu: "Menu",
    pages: "Trang",
    previous: "Trước",
    next: "Tiếp",
    notTranslated: "Trang này chưa có bản tiếng Việt.",
    readIn: "Đọc bản English",
    notFoundTitle: "Không tìm thấy trang",
    notFoundBody: "Trang tài liệu này không tồn tại.",
    backToDocs: "Quay lại tài liệu",
    footer: "Tài liệu Spendry",
    skip: "Bỏ qua tới nội dung",
  },
};

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const PATH = /\/docs\/public\/(en|vi)\/([a-z0-9-]+)\.md$/;

function parse(path: string, raw: string): Doc | null {
  const loc = PATH.exec(path);
  const fm = FRONTMATTER.exec(raw);
  if (!loc || !fm) return null;

  const meta: Record<string, string> = {};
  for (const line of fm[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }

  // Defense in depth: the folder alone does not make a file public.
  if (meta.visibility !== "public" || !meta.title) return null;

  return {
    lang: loc[1] as Lang,
    slug: loc[2],
    title: meta.title,
    description: meta.description ?? "",
    order: Number(meta.order) || 0,
    body: raw.slice(fm[0].length),
  };
}

const files = import.meta.glob("../../docs/public/*/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const ALL: Doc[] = Object.entries(files)
  .map(([path, raw]) => parse(path, raw))
  .filter((d): d is Doc => d !== null)
  .sort((a, b) => a.order - b.order);

export function isLang(value: string | undefined): value is Lang {
  return value === "en" || value === "vi";
}

export function getDocs(lang: Lang): Doc[] {
  return ALL.filter((d) => d.lang === lang);
}

export function getDoc(lang: Lang, slug: string): Doc | undefined {
  return ALL.find((d) => d.lang === lang && d.slug === slug);
}

/** True if any language has this slug (used to tell "not translated" from "not found"). */
export function slugExists(slug: string): boolean {
  return ALL.some((d) => d.slug === slug);
}

/** The other language's version of a slug, if it exists. */
export function otherLang(lang: Lang): Lang {
  return lang === "en" ? "vi" : "en";
}

/** Slugs in order, taken from the first language that has them. */
export function firstSlug(lang: Lang): string | undefined {
  return getDocs(lang)[0]?.slug ?? ALL[0]?.slug;
}
