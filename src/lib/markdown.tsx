/**
 * Small Markdown renderer for the documentation area.
 *
 * Supported subset: # ## ### headings, paragraphs, - / 1. lists, > quotes,
 * fenced code, tables, --- rules, and inline `code`, **bold**, *italic*, links.
 * Output is React elements (never raw HTML), and link targets are limited to
 * "/…", "#…" and http(s) URLs.
 */
import { useMemo, type ReactNode } from "react";
import { isPlainClick, navigate } from "@/lib/nav";

type Block =
  | { t: "h"; level: 1 | 2 | 3; text: string }
  | { t: "p"; text: string }
  | { t: "list"; ordered: boolean; items: string[] }
  | { t: "quote"; text: string }
  | { t: "code"; code: string }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "hr" };

const FENCE = /^```/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const HR = /^-{3,}\s*$/;
const LIST_ITEM = /^\s*([-*]|\d+\.)\s+(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/;

function startsBlock(line: string, next: string | undefined): boolean {
  return (
    FENCE.test(line) ||
    HEADING.test(line) ||
    HR.test(line) ||
    LIST_ITEM.test(line) ||
    line.startsWith(">") ||
    (line.trim().startsWith("|") && next !== undefined && TABLE_SEP.test(next))
  );
}

function splitRow(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function parseBlocks(src: string): Block[] {
  const lines = src.split(/\r?\n/);
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }

    if (FENCE.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++]);
      i++; // closing fence
      blocks.push({ t: "code", code: code.join("\n") });
      continue;
    }

    const h = HEADING.exec(line);
    if (h) {
      blocks.push({ t: "h", level: h[1].length as 1 | 2 | 3, text: h[2].trim() });
      i++;
      continue;
    }

    if (HR.test(line)) { blocks.push({ t: "hr" }); i++; continue; }

    if (line.trim().startsWith("|") && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const head = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(splitRow(lines[i++]));
      blocks.push({ t: "table", head, rows });
      continue;
    }

    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push({ t: "quote", text: quote.join(" ") });
      continue;
    }

    const li = LIST_ITEM.exec(line);
    if (li) {
      const ordered = /\d/.test(li[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const m = LIST_ITEM.exec(lines[i]);
        if (m) { items.push(m[2]); i++; continue; }
        // Indented continuation of the previous item.
        if (/^\s{2,}\S/.test(lines[i]) && items.length > 0) { items[items.length - 1] += " " + lines[i].trim(); i++; continue; }
        break;
      }
      blocks.push({ t: "list", ordered, items });
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && (para.length === 0 || !startsBlock(lines[i], lines[i + 1]))) {
      para.push(lines[i++].trim());
    }
    blocks.push({ t: "p", text: para.join(" ") });
  }

  return blocks;
}

// ── Inline ────────────────────────────────────────────────────────────────────

const INLINE_SOURCE = "(`[^`\\n]+`)|(\\*\\*[^*\\n]+\\*\\*)|(\\[[^\\]\\n]+\\]\\([^)\\s]+\\))|(\\*[^*\\s][^*\\n]*\\*)";
const SAFE_URL = /^(\/(?!\/)|#|https?:\/\/)/;

const LINK_STYLE = { color: "var(--accent)" } as const;

function renderLink(label: string, url: string, key: number): ReactNode {
  if (!SAFE_URL.test(url)) return label; // never emit javascript:, data:, etc.
  const text = renderInline(label);

  if (url.startsWith("/")) {
    return (
      <a
        key={key}
        href={url}
        style={LINK_STYLE}
        className="underline underline-offset-2 decoration-[rgba(172,198,233,0.4)] hover:decoration-current rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
        onClick={(e) => {
          if (isPlainClick(e)) { e.preventDefault(); navigate(url); }
        }}
      >
        {text}
      </a>
    );
  }

  const external = url.startsWith("http");
  return (
    <a
      key={key}
      href={url}
      style={LINK_STYLE}
      className="underline underline-offset-2 decoration-[rgba(172,198,233,0.4)] hover:decoration-current rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {text}
    </a>
  );
}

function renderInline(text: string): ReactNode[] {
  const re = new RegExp(INLINE_SOURCE, "g");
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];

    if (m[1]) {
      out.push(
        <code
          key={key++}
          className="mono rounded-md px-1.5 py-0.5 text-[0.85em]"
          style={{ background: "var(--surface-muted)", color: "var(--ink-2)" }}
        >
          {tok.slice(1, -1)}
        </code>,
      );
    } else if (m[2]) {
      out.push(<strong key={key++} style={{ color: "var(--ink)", fontWeight: 600 }}>{renderInline(tok.slice(2, -2))}</strong>);
    } else if (m[3]) {
      const close = tok.indexOf("](");
      out.push(renderLink(tok.slice(1, close), tok.slice(close + 2, -1), key++));
    } else {
      out.push(<em key={key++}>{renderInline(tok.slice(1, -1))}</em>);
    }
    last = m.index + tok.length;
  }

  if (last < text.length) out.push(text.slice(last));
  return out;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Blocks ────────────────────────────────────────────────────────────────────

function renderBlock(b: Block, key: number): ReactNode {
  switch (b.t) {
    case "h": {
      if (b.level === 1) {
        return (
          <h1 key={key} className="display text-3xl font-bold mb-4" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {renderInline(b.text)}
          </h1>
        );
      }
      if (b.level === 2) {
        return (
          <h2 key={key} id={slugify(b.text)} className="display text-xl font-bold mt-10 mb-3 scroll-mt-24" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
            {renderInline(b.text)}
          </h2>
        );
      }
      return (
        <h3 key={key} id={slugify(b.text)} className="display text-base font-semibold mt-6 mb-2 scroll-mt-24" style={{ color: "var(--ink-2)" }}>
          {renderInline(b.text)}
        </h3>
      );
    }
    case "p":
      return <p key={key} className="text-[15px] leading-7 mb-4" style={{ color: "var(--muted)" }}>{renderInline(b.text)}</p>;
    case "list": {
      const items = b.items.map((it, n) => <li key={n} className="pl-1">{renderInline(it)}</li>);
      const cls = "text-[15px] leading-7 mb-4 ml-5 space-y-1.5 marker:text-[var(--subtle)]";
      return b.ordered
        ? <ol key={key} className={`${cls} list-decimal`} style={{ color: "var(--muted)" }}>{items}</ol>
        : <ul key={key} className={`${cls} list-disc`} style={{ color: "var(--muted)" }}>{items}</ul>;
    }
    case "quote":
      return (
        <blockquote key={key} className="mb-4 rounded-r-xl border-l-2 px-4 py-2 text-[15px] leading-7" style={{ borderColor: "var(--accent)", background: "var(--surface)", color: "var(--muted)" }}>
          {renderInline(b.text)}
        </blockquote>
      );
    case "code":
      return (
        <pre key={key} className="mono mb-5 overflow-x-auto rounded-xl p-4 text-[13px] leading-6" style={{ background: "rgba(0,0,0,0.30)", border: "1px solid var(--border)", color: "var(--ink-2)" }}>
          <code>{b.code}</code>
        </pre>
      );
    case "table":
      return (
        <div key={key} className="mb-5 overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
            <thead style={{ background: "rgba(0,0,0,0.15)" }}>
              <tr>
                {b.head.map((c, n) => (
                  <th key={n} scope="col" className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--subtle)", borderBottom: "1px solid var(--border)" }}>
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, n) => (
                <tr key={n}>
                  {r.map((c, m) => (
                    <td key={m} className="px-4 py-2.5 align-top leading-6" style={{ color: "var(--muted)", borderTop: n === 0 ? undefined : "1px solid var(--border)" }}>
                      {renderInline(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "hr":
      return <hr key={key} className="my-8" style={{ borderColor: "var(--border)" }} />;
  }
}

export function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => parseBlocks(source), [source]);
  return <div>{blocks.map((b, n) => renderBlock(b, n))}</div>;
}
