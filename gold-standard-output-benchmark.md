# Gold-Standard Journalist Email Benchmark

Version: 1.0
Last Updated: 2026-05-02
Status: active
Owner: email-quality-reviewer-agent
Change History: see `CHANGELOG.md`.

Purpose: define the minimum quality bar for a final journalist outreach email.

Status: active.

Every final email must pass all conditions below before it can be packaged or used for outreach.

| Benchmark Condition | Pass Rule | Failure Action |
|---|---|---|
| Subject line works in a newsroom inbox | Clear, specific, data-led or beat-relevant; no hype or fake urgency | Rewrite subject set |
| News hook appears within first 2-3 lines | Journalist can identify the story quickly | Rewrite opening |
| One clear story idea | Email does not pitch multiple competing stories | Narrow to selected angle |
| Strongest data point appears early | Primary number or comparison appears before deep context | Move strongest evidence upward |
| Data is accurate and sourced | Claim has source, timeframe, geography, and caveat | Remove, verify, or downgrade |
| Journalist beat relevance is obvious | Beat fit is visible without long explanation | Rewrite framing or retarget |
| Copy is concise and natural | 500-600 words only when user requires; no robotic filler | Tighten copy |
| No sales language | No promotional, brand-first, or self-congratulatory phrasing | Remove sales wording |
| No hype language | No exaggerated adjectives, false urgency, or inflated claims | Rewrite with evidence |
| No fake personalization | Personalization is verified or safely beat-level | Remove or label beat-level |
| CTA is low-pressure | Easy reply path such as data, table, methodology, or comment offer | Rewrite CTA |
| Readable in under 10 seconds | First screen communicates story, data, and relevance | Improve scan structure |
| Gives journalist a usable story angle | Contains headline-capable hook and publishable evidence | Reframe angle |
| Stands alone | Journalist can understand without long context or attachments | Add concise context |
| Claims are ethical and verifiable | No unsupported legal, health, safety, or causation claim | Remove or caveat |
| Analytical table included when required | Markdown table appears inside email body | Add or repair table |
| Final score passes | Email quality average is at least 8.5/10 | Rewrite until passing |

## Required Final Decision

- `PASS`: all benchmark conditions are met and validators pass.
- `FAIL`: any critical condition fails.
- `MANUAL ACTION REQUIRED`: a required source, journalist detail, browser result, Muck Rack result, or claim cannot be verified.

Do not mark an email as final unless it passes this benchmark and the stage validator.
