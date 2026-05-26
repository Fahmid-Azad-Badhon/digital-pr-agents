# Templates

Purpose: define the canonical stage files copied into each new pitch job.

Active stage sequence:

1. `00-brief.md`
2. `01-study-notes.md`
3. `02-insights.md`
4. `03-research.md`
5. `04-angles.md`
6. `05-beats.md`
7. `06-journalist-intel.md`
8. `07-journalist-coverage.md`
9. `08-pitch-draft.md`
10. `09-optimized-email.md`
11. `10-google-doc.md`
12. `11-follow-ups.md` optional follow-up sequence for the same confirmed selected angle

Supporting templates:

- `draft-variants/` contains the six stage-08 email variant structures.
- `source-files/` contains raw study, journalist intelligence, selected-angle collection, SERP, Muck Rack, and rejected-source capture structures.

Rules:

- Templates may contain labeled user-supplied fields, but final journalist-facing outputs must not contain unresolved placeholders.
- Every final email body must preserve selected-angle alignment, verified data, newsworthiness proof, and a low-friction CTA.
- Muck Rack and SERP instructions must never imply verified access unless the browser/session was actually tested.
- When required data, journalist evidence, source support, quote status, SERP findings, or Muck Rack results are missing, the stage output must write exactly: `Information unavailable. Verification required before use.`
