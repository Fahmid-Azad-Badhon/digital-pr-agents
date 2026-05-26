#!/usr/bin/env python3
"""Audit Stage 09 optimized email output for Digital PR workflow quality."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


FINAL_FILE = "09-optimized-email.md"
BODY_WORD_MIN = 500
BODY_WORD_MAX = 600

REQUIRED_SECTIONS = [
    "## Stage 09 Status",
    "## Source Integrity Check",
    "## Optimization Pass Log",
    "## Final Subject Line Options",
    "## Recommended Subject Line",
    "## Final Email",
    "## Evidence Included",
    "## Personalization Used",
    "## Newsworthiness Proof",
    "## Pitch Angle Alignment Review",
    "## Ethical Psychological Trigger Review",
    "## Inbox Quality Review",
    "## Claims To Avoid",
    "## Stage 10 Handoff",
]

STATUS_FIELDS = [
    "Source draft:",
    "Selected angle:",
    "Selected beat:",
    "Target journalist / target type:",
    "Optimization status:",
    "Publishability score:",
]

SOURCE_FIELDS = [
    "Selected Stage 08 variant used:",
    "Claims preserved:",
    "Claims tightened:",
    "Claims removed:",
    "Caveats carried forward:",
    "Angle drift check:",
]

EVIDENCE_FIELDS = [
    "Primary data point:",
    "Supporting data point:",
    "Source or dataset:",
]

NEWSWORTHINESS_FIELDS = [
    "Timeliness:",
    "Impact:",
    "Proximity:",
    "Novelty or tension:",
    "Publication path:",
]

ANGLE_ALIGNMENT_FIELDS = [
    "Selected angle:",
    "Subject line alignment:",
    "Opening hook alignment:",
    "Body thesis alignment:",
    "Analytical table alignment:",
    "Evidence alignment:",
    "CTA alignment:",
    "Drift risk:",
    "Final alignment decision:",
]

TRIGGER_FIELDS = [
    "Triggers used:",
    "Why they are evidence-backed:",
    "Pressure or manipulation risk:",
    "Final trigger safety decision:",
]

INBOX_FIELDS = [
    "Ten-second deletion test:",
    "First-line strength:",
    "Subject-line strength:",
    "Data density check:",
    "Non-AI writing check:",
    "CTA clarity:",
    "Preview text strength:",
    "Mobile scan readability:",
    "Deliverability risk:",
    "Red-team objection:",
    "Fix applied:",
    "Final publishability decision:",
]

HANDOFF_FIELDS = [
    "Ready for final packaging:",
    "Recommended subject line for package:",
    "Final email version:",
    "Assets to include:",
    "Remaining caveats:",
]

BANNED_PHRASES = [
    "i hope you're well",
    "i hope you are well",
    "i wanted to reach out",
    "thought this might be of interest",
    "this might be of interest",
    "new study",
    "interesting insights",
    "valuable insights",
    "in today's world",
    "in today's fast-paced world",
    "rapidly evolving",
    "game-changing",
    "groundbreaking",
    "seamless",
    "robust",
    "leverage",
    "unlock",
    "delve",
    "landscape",
    "pivotal",
    "crucial",
    "sheds light",
    "underscores",
    "your readers will love",
    "perfect for your audience",
    "you should cover",
    "you need to see",
    "please cover this",
    "let me know if interested",
]

PRESSURE_PHRASES = [
    "urgent",
    "last chance",
    "only available today",
    "cannot afford to ignore",
    "everyone is talking about",
    "you won't believe",
    "you will not believe",
    "exclusive opportunity",
    "limited time",
    "act now",
]

RISKY_CLAIM_PHRASES = [
    "proves",
    "guarantees",
    "record high",
    "first ever",
    "never before seen",
    "caused by",
    "causes",
    "the worst",
    "the best",
]

CTA_SIGNALS = [
    "happy to send",
    "i can send",
    "i can share",
    "would this be useful",
    "would you like",
    "methodology",
    "full dataset",
    "full table",
    "local breakdown",
    "county breakdown",
    "state breakdown",
    "rankings",
    "quote",
    "comment",
]

LINK_PATTERN = re.compile(r"https?://", re.IGNORECASE)

PLACEHOLDER_PATTERN = re.compile(r"\[[^\]\n]{2,120}\](?!\()", re.IGNORECASE)
NUMERIC_PATTERN = re.compile(r"(\b\d+([.,]\d+)?%?\b|\bNo\.\s*\d+\b|\btop\s+\d+\b)", re.IGNORECASE)
FIELD_PATTERN_TEMPLATE = r"(?m)^-\s+{field}[ \t]*(.+)$"


@dataclass
class Finding:
    file: str
    level: str
    check: str
    message: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def section_text(text: str, heading: str) -> str:
    pattern = re.compile(rf"^{re.escape(heading)}\s*$([\s\S]*?)(?=^##\s+|\Z)", re.MULTILINE)
    match = pattern.search(text)
    return match.group(1).strip() if match else ""


def field_value(text: str, field: str) -> str | None:
    pattern = re.compile(FIELD_PATTERN_TEMPLATE.format(field=re.escape(field)))
    match = pattern.search(text)
    return match.group(1).strip() if match else None


def is_blankish(value: str | None) -> bool:
    if value is None:
        return True
    clean = value.strip()
    if not clean:
        return True
    if clean.lower() in {"yes / no", "ready / blocked", "pass / fail plus reason", "low / medium / high plus reason"}:
        return True
    if PLACEHOLDER_PATTERN.search(clean):
        return True
    return False


def subject_lines(text: str) -> list[str]:
    section = section_text(text, "## Final Subject Line Options")
    lines: list[str] = []
    for raw in section.splitlines():
        stripped = raw.strip()
        if stripped.startswith("- "):
            value = stripped[2:].strip()
            if value and not PLACEHOLDER_PATTERN.search(value):
                lines.append(value)
    return lines


def email_body(text: str) -> str:
    return section_text(text, "## Final Email")


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def has_analytical_table(text: str) -> bool:
    lowered = text.lower()
    table_lines = [line.strip() for line in text.splitlines() if line.strip().startswith("|") and line.strip().endswith("|")]
    if "analytical table" not in lowered:
        return False
    if len(table_lines) < 5:
        return False
    header = " ".join(table_lines[:2]).lower()
    return (
        "analytical" in header
        or "data" in header
        or "evidence" in header
    ) and ("coverage" in header or "journalist" in header or "matters" in header)


def check_required_sections(findings: list[Finding], rel_file: str, text: str) -> None:
    for section in REQUIRED_SECTIONS:
        if section not in text:
            findings.append(Finding(rel_file, "fail", "required-section", f"Missing required section: {section}"))


def check_placeholders(findings: list[Finding], rel_file: str, text: str) -> None:
    if PLACEHOLDER_PATTERN.search(text):
        findings.append(Finding(rel_file, "fail", "unresolved-placeholder", "Unresolved bracket placeholders remain."))


def check_fields(findings: list[Finding], rel_file: str, text: str, fields: list[str], check_name: str) -> None:
    for field in fields:
        value = field_value(text, field)
        if is_blankish(value):
            findings.append(Finding(rel_file, "fail", check_name, f"Field is blank or unresolved: {field}"))


def check_subjects(findings: list[Finding], rel_file: str, text: str) -> None:
    subjects = subject_lines(text)
    if len(subjects) < 5:
        findings.append(Finding(rel_file, "fail", "subject-count", "Fewer than five final subject line options found."))
    for subject in subjects:
        words = word_count(subject)
        lowered = subject.lower()
        if words > 13:
            findings.append(Finding(rel_file, "warn", "subject-length", f"Subject may be too long: {subject}"))
        if any(phrase in lowered for phrase in BANNED_PHRASES):
            findings.append(Finding(rel_file, "fail", "subject-ai-phrase", f"Subject contains banned phrase: {subject}"))
        if "!" in subject:
            findings.append(Finding(rel_file, "warn", "subject-punctuation", f"Subject uses exclamation mark: {subject}"))
    recommended = section_text(text, "## Recommended Subject Line")
    if "Subject:" not in recommended or PLACEHOLDER_PATTERN.search(recommended):
        findings.append(Finding(rel_file, "fail", "recommended-subject", "Recommended subject line is missing or unresolved."))


def check_email_body(findings: list[Finding], rel_file: str, text: str) -> None:
    body = email_body(text)
    if not body:
        findings.append(Finding(rel_file, "fail", "email-body", "Final Email section is empty."))
        return

    words = word_count(body)
    lowered = body.lower()

    if words < BODY_WORD_MIN:
        findings.append(Finding(rel_file, "fail", "body-length", f"Final email must be at least {BODY_WORD_MIN} words; found {words}."))
    if words > BODY_WORD_MAX:
        findings.append(Finding(rel_file, "fail", "body-length", f"Final email must be no more than {BODY_WORD_MAX} words; found {words}."))
    if not has_analytical_table(body):
        findings.append(Finding(rel_file, "fail", "analytical-table", "Final email body must include an analytical Markdown table."))
    if not NUMERIC_PATTERN.search(body):
        findings.append(Finding(rel_file, "fail", "data-density", "Final email body contains no numeric data."))
    if not any(signal in lowered for signal in CTA_SIGNALS):
        findings.append(Finding(rel_file, "fail", "cta", "Final email has no clear low-friction CTA or asset offer."))
    link_count = len(LINK_PATTERN.findall(body))
    if link_count > 1:
        findings.append(Finding(rel_file, "warn", "link-count", f"Final email contains more than one URL ({link_count})."))
    if "!!" in body:
        findings.append(Finding(rel_file, "fail", "punctuation", "Final email contains repeated exclamation marks."))

    for phrase in BANNED_PHRASES:
        if phrase in lowered:
            findings.append(Finding(rel_file, "fail", "ai-or-pr-phrase", f"Final email contains banned phrase: {phrase}"))

    for phrase in PRESSURE_PHRASES:
        if phrase in lowered:
            findings.append(Finding(rel_file, "fail", "pressure-phrase", f"Final email contains pressure phrase: {phrase}"))

    for phrase in RISKY_CLAIM_PHRASES:
        if phrase in lowered:
            findings.append(Finding(rel_file, "warn", "risky-claim-phrase", f"Final email contains a claim that may need source support: {phrase}"))

    content_lines = [line.strip() for line in body.splitlines() if line.strip()]
    first_meaningful = ""
    for line in content_lines:
        if line.lower().startswith(("hi ", "hello ", "dear ")):
            continue
        first_meaningful = line
        break
    if not first_meaningful:
        findings.append(Finding(rel_file, "fail", "opening-line", "No meaningful opening line after greeting."))
    elif len(first_meaningful.split()) < 8 or not NUMERIC_PATTERN.search(first_meaningful + " " + body[:400]):
        findings.append(Finding(rel_file, "warn", "opening-line", "Opening may not prove relevance and data value quickly."))


def check_pass_log(findings: list[Finding], rel_file: str, text: str) -> None:
    log = section_text(text, "## Optimization Pass Log")
    pass_lines = [line for line in log.splitlines() if line.strip().startswith("- Pass ")]
    if len(pass_lines) < 12:
        findings.append(Finding(rel_file, "fail", "pass-log", "Optimization pass log must include Pass 0 through Pass 11."))
    for idx in range(12):
        if f"Pass {idx}" not in log:
            findings.append(Finding(rel_file, "fail", "pass-log", f"Missing Pass {idx} in optimization log."))


def check_publishability(findings: list[Finding], rel_file: str, text: str) -> None:
    score_value = field_value(text, "Publishability score:")
    if score_value:
        match = re.search(r"\b(\d{1,3})\b", score_value)
        if not match:
            findings.append(Finding(rel_file, "fail", "publishability-score", "Publishability score is not numeric."))
        else:
            score = int(match.group(1))
            if score < 85:
                findings.append(Finding(rel_file, "fail", "publishability-score", f"Publishability score is below 85: {score}"))
            if score > 100:
                findings.append(Finding(rel_file, "fail", "publishability-score", f"Publishability score is above 100: {score}"))

    inbox = section_text(text, "## Inbox Quality Review").lower()
    if "fail" in inbox:
        findings.append(Finding(rel_file, "fail", "inbox-review", "Inbox Quality Review still contains a fail decision."))
    if "revise before outreach" in inbox:
        findings.append(Finding(rel_file, "fail", "inbox-review", "Final publishability decision says revise before outreach."))
    deliverability = field_value(text, "Deliverability risk:") or ""
    if deliverability.lower().startswith("high"):
        findings.append(Finding(rel_file, "fail", "deliverability", "Deliverability risk is marked high."))
    alignment = section_text(text, "## Pitch Angle Alignment Review").lower()
    if "revise before outreach" in alignment or "not aligned" in alignment:
        findings.append(Finding(rel_file, "fail", "angle-alignment", "Pitch angle alignment review is not approved."))
    drift_value = field_value(text, "Drift risk:") or ""
    if drift_value.lower().startswith("high"):
        findings.append(Finding(rel_file, "fail", "angle-drift-risk", "Pitch angle drift risk is marked high."))

    handoff = section_text(text, "## Stage 10 Handoff").lower()
    ready_value = field_value(text, "Ready for final packaging:") or ""
    if "ready for final packaging:" in handoff and "yes" not in ready_value.lower():
        findings.append(Finding(rel_file, "fail", "stage10-handoff", "Stage 10 handoff is not marked ready."))


def audit(path: Path) -> list[Finding]:
    if path.is_dir():
        target = path / FINAL_FILE
        rel_file = FINAL_FILE
    else:
        target = path
        rel_file = target.name

    findings: list[Finding] = []
    if not target.exists():
        return [Finding(rel_file, "fail", "missing-file", f"Missing Stage 09 file: {target}")]

    text = read_text(target)
    if not text.strip():
        return [Finding(rel_file, "fail", "empty-file", "Stage 09 file is empty.")]

    check_required_sections(findings, rel_file, text)
    check_placeholders(findings, rel_file, text)
    check_fields(findings, rel_file, text, STATUS_FIELDS, "status-field")
    check_fields(findings, rel_file, text, SOURCE_FIELDS, "source-field")
    check_fields(findings, rel_file, text, EVIDENCE_FIELDS, "evidence-field")
    check_fields(findings, rel_file, text, NEWSWORTHINESS_FIELDS, "newsworthiness-field")
    check_fields(findings, rel_file, text, ANGLE_ALIGNMENT_FIELDS, "angle-alignment-field")
    check_fields(findings, rel_file, text, TRIGGER_FIELDS, "trigger-field")
    check_fields(findings, rel_file, text, INBOX_FIELDS, "inbox-field")
    check_fields(findings, rel_file, text, HANDOFF_FIELDS, "handoff-field")
    check_subjects(findings, rel_file, text)
    check_email_body(findings, rel_file, text)
    check_pass_log(findings, rel_file, text)
    check_publishability(findings, rel_file, text)
    return findings


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Audit Stage 09 optimized email quality.")
    parser.add_argument("path", help="Pitch job directory or 09-optimized-email.md file")
    parser.add_argument("--json", action="store_true", help="Emit JSON findings")
    args = parser.parse_args(argv)

    findings = audit(Path(args.path))
    failures = [finding for finding in findings if finding.level == "fail"]
    warnings = [finding for finding in findings if finding.level == "warn"]

    if args.json:
        print(json.dumps([asdict(finding) for finding in findings], indent=2))
    else:
        status = "PASS" if not failures else "FAIL"
        print(f"Stage 09 optimized email audit: {status}")
        print(f"Findings: {len(findings)}")
        print(f"Failures: {len(failures)}")
        print(f"Warnings: {len(warnings)}")
        for finding in findings:
            print(f"[{finding.level.upper()}] {finding.file} :: {finding.check} :: {finding.message}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
