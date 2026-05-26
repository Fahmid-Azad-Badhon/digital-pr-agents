# Truth and Validation Brain

**Brain File:** 02_Validation_And_Truth_Brain.md  
**Version:** 1.0  
**Status:** Active  
**Last Updated:** 2026-05-09  
**Loaded By:** S2, S3, S4A, S9, S10, S11, S13

---

## Core Factual Rules

### No Source, No Claim
Every statistical claim must have source attribution. No exceptions.

### No Verified Claim, No Pitch
Writing agents (S10, S11, S12) must only use claims from:
- verified-findings.json (status: verified)
- claim-ledger.json (status: verified)

### No Invented Journalist Data
Never invent:
- Journalist emails
- Article URLs
- Publication names
- Beat assignments without research

### No Final Readiness Without S13
The final pitch cannot be marked ready until S13 passes all validation checks.

---

## Claim Status Labels

| Status | Meaning | Can Use in Pitch? |
|--------|---------|-------------------|
| verified | Confirmed source, safe | Yes - directly |
| usable_with_soft_language | Needs careful wording | Yes - with softening |
| needs_source | Cannot use without source | No |
| unsupported | Cannot be used | No |
| rejected | Explicitly rejected | No |
| human_review_required | Needs human approval | Pending |

---

## Factual Authority Levels

| Agent | Can Decide | Cannot Decide |
|-------|------------|---------------|
| S2 | Which numbers are present | Which finding is newsworthy |
| S3 | Which sources exist | Which angle is best |
| S4A | Which findings are verified | Which angle to pitch |
| S9 | Which journalist is relevant | Which pitch to send |
| S10 | Email structure, CTA wording | Whether a claim is true |
| S11 | Tone optimization | Whether to change facts |
| S13 | Whether pitch passes | New angles or journalists |

---

## Validation Rules

### S13 Must Check
1. **Source Verification** - Every statistic has a source
2. **Claim Ledger Match** - Claims match verified ledger
3. **No Unsupported Stats** - No invented numbers
4. **No Hallucination** - No invented sources or URLs
5. **Tone Check** - Not salesy or hype
6. **CTA Softness** - Not aggressive

### Claim Rewrite Mode
If a claim is useful but risky, S13 should suggest safer wording:

Example:
- **Risky:** "SUVs are causing a child pedestrian safety crisis."
- **Safer:** "The data suggests larger vehicles are an important part of the pedestrian safety conversation."

---

## Anti-Hallucination Rules

- Do not invent statistics.
- Do not invent sources.
- Do not invent journalist emails.
- Do not invent article URLs.
- Do not infer exact numbers from vague statements.
- Do not convert interpretation into fact.
- Do not say "study found" unless the source actually supports it.
- If unsure, mark as unclear.
- If source is missing, flag it instead of guessing.

---

## Escalation Rules

Escalate to human if:
- Two sources conflict
- Data source is unclear
- Selected angle has high risk
- Journalist emails are missing
- Final pitch uses sensitive claims
- S13 fails twice
- Any model fallback fails all attempts

---

## Input Budget Rules

Priority for factual agents:
1. Required files (verified-findings.json, claim-ledger.json)
2. Current campaign files
3. Approved reusable rules
4. Optional supporting files
5. Never load unrelated campaign history