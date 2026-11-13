# Code review process

**Status: Not Defined.** The repository has one commit (`Initial commit from Studio`) and no pull request template, CODEOWNERS file, branch protection record or CI configuration. No review process has been agreed, so none is documented here.

## What exists today

| Item | State |
|------|-------|
| Reviewers / approvers | Not Defined |
| Required approvals | Not Defined |
| PR template, CODEOWNERS | Not present |
| CI checks | Not present |
| Automated local gate | `bun run check` (lint + typecheck) and `bunx vite build` |
| Automated contract review | Done once during development (two High findings fixed); not a formal audit |

## To decide (TBD)

- Who reviews frontend changes and who reviews contract changes.
- Whether contract changes need an independent audit before any redeploy.
- Required checks before merge (the available gates are listed above).
- Whether the checklists in [coding-rules.md](coding-rules.md) become the review checklist.
