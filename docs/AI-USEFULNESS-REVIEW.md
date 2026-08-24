# AI Collaboration Review

Date: 2026-08-25

## Summary
This workflow is already strong because it keeps work scoped, incremental, and measurable. The main improvement is to make prompts slightly more structured and evidence-driven so AI output stays consistent and easier to verify.

## What is working well
- small, single-item scope
- clear checklist-based tracking
- explicit request for plan before implementation
- emphasis on not going beyond scope
- frequent validation and status checking
- preference for incremental delivery over large refactors

## Best patterns to keep
- Ask for the implementation plan before coding.
- Tie each task to a particular checklist item.
- Keep work small enough to review in one pass.
- State constraints like “do not broaden scope” or “do not refactor unrelated files”.
- Ask for evidence after implementation, including commands and outputs.
- Keep tasks tracked in markdown rather than letting them live only in conversation.

## What to improve
- Add clearer acceptance criteria before implementation.
- Define the exact validation command to run.
- State in-scope vs out-of-scope boundaries explicitly.
- Prefer minimal changes over clever abstractions.
- Ask for a quick risk review before large or deployment-related edits.
- Keep the “done” condition visible and measurable.

## Suggested prompt structure
1. Goal
2. Scope
3. Files involved
4. Constraints
5. Validation
6. Done condition

Example:
- Goal: add a production migration gate
- Scope: only GitHub Actions workflow and checklist
- Files: .github/workflows/deploy-prod.yml, docs/PROD_READINESS_CHECKLIST.md
- Constraints: no app refactor, no new infra modules
- Validation: run Prisma migration status locally and report output
- Done: workflow includes the gate and checklist item is marked done

## Bottom line
The workflow is already efficient because it is narrow, structured, and review-driven. The biggest improvement is to add a little more explicit acceptance criteria and verification detail so the AI stays more deterministic and easier to trust.
