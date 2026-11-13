# Spendry documentation

Source of truth for the Spendry project. Written from the code in this repository as of 2026-11-11. Anything the project has not defined is marked `TBD` or `Not Defined`; nothing is assumed.

## Classification

Every document is either **public** or **internal**.

| Class | Location | Audience | Shown in the app |
|-------|----------|----------|------------------|
| public | `docs/public/<lang>/<slug>.md` | End users and agent integrators | Yes, at `/docs` |
| internal | `docs/internal/*.md` | Developers and AI agents | Never |

Mechanism (not just hidden links):

1. The app bundles only `docs/public/*/*.md` (`import.meta.glob` in `src/lib/docs.ts`). `docs/internal/` is imported nowhere, so it is not in the production build.
2. Each public file must declare `visibility: public` in its frontmatter; the loader skips any file that does not.
3. `vite.config.ts` adds `**/docs/internal/**` and `**/docs/README.md` to `server.fs.deny`, so the dev server refuses to serve them by URL.
4. This index (`docs/README.md`) and any file outside `docs/public/` is internal by location. If you add another internal file outside `docs/internal/`, add it to the deny list too.

Never put a secret in any file under `docs/`: public docs are shipped to browsers and internal docs are committed to git.

## Internal documents (English only)

| File | Topic |
|------|-------|
| [internal/project-overview.md](internal/project-overview.md) | Overview and goals |
| [internal/features.md](internal/features.md) | Feature list and implementation status |
| [internal/feature-specs.md](internal/feature-specs.md) | Detailed feature specifications |
| [internal/tech-stack.md](internal/tech-stack.md) | Tech stack and versions |
| [internal/coding-style.md](internal/coding-style.md) | Coding style |
| [internal/design-system.md](internal/design-system.md) | Design system |
| [internal/ui-ux-guidelines.md](internal/ui-ux-guidelines.md) | UI/UX guidelines |
| [internal/naming-conventions.md](internal/naming-conventions.md) | Naming conventions |
| [internal/coding-rules.md](internal/coding-rules.md) | Coding rules |
| [internal/code-review.md](internal/code-review.md) | Code review process |
| [internal/commit-conventions.md](internal/commit-conventions.md) | Commit conventions |
| [internal/quality-standards.md](internal/quality-standards.md) | Quality standards and known issues |

## Public documents (English and Tiếng Việt)

Served at `/docs/<lang>/<slug>`; `<lang>` is `en` or `vi`.

| Slug | EN | VI |
|------|----|----|
| `overview` | done | done |
| `features` | done | done |
| `getting-started` | done | done |
| `policies` | done | done |
| `agent-guide` | done | done |
| `faq` | done | done |

Not yet translated: none. Both languages cover every slug. The app UI itself (dashboard, sheets) is English only; only the documentation area is bilingual.

## Adding a public page

1. Create `docs/public/en/<slug>.md` and `docs/public/vi/<slug>.md`.
2. Start each with frontmatter: `title`, `description`, `order`, `visibility: public`.
3. Use only the Markdown subset the renderer supports (see [feature-specs.md](internal/feature-specs.md), "Documentation area").
4. Update the table above. A page missing in one language is shown with a "not available in this language" notice, so record it as not translated.

## Open items

| Item | State |
|------|-------|
| Default documentation language when none is chosen | TBD (`/docs` currently opens English as a technical placeholder) |
| Persisting the chosen language across visits | TBD (today the language lives only in the URL) |
| Privacy policy and Terms of Service | Not Defined |
| Code review process, commit convention | Not Defined |
| Automated tests, CI | Not Defined |
