# Commit conventions

**Status: Not Defined.**

Evidence: `git log` contains a single commit, `Initial commit from Studio`. There is no commitlint, husky, `.gitmessage`, or contributing guide.

| Item | State |
|------|-------|
| Message format (for example Conventional Commits) | Not Defined |
| Branch naming | Not Defined |
| Commit signing | Not Defined |
| Versioning / changelog / tags | Not Defined (`package.json` version is `0.0.0`) |

## Constraints that already apply

- Never commit secrets: `.env`, private keys, recovery files.
- Do not commit local runtime files: `traces.jsonl`, `console.jsonl`, `dist/`, `*.db*`. (A `.gitignore` is missing and `flowgate.db` is currently tracked; see [quality-standards.md](quality-standards.md).)
