#!/usr/bin/env python3
"""Audit Stage 10 final Google Doc package quality."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


FINAL_FILE = "10-google-doc.md"
STAGE09_FILE = "09-optimized-email.md"
BODY_WORD_MIN = 500
BODY_WORD_MAX = 600

REQUIRED_SECTIONS = [
    "# Final Digital PR Outreach Package",
    "## Package Status",
    "## Campaign Snapshot",
    "## Selected Outreach Angle",
    "## Target Journalist / Target Type",
    "## Final Subject Line Recommendation",
    "## Final Subject Line Options",
    "## Final Email",
    "## Analytical Table Confirmation",
    "## Evidence And Source Notes",
    "## Newsworthiness Proof",
    "## Pitch Angle Alignment Proof",
    "## Personalization Basis",
    "## Ethical Psychological Trigger Review",
    "## Claims To Avoid",
    "## Assets Available For Outreach",
    "## Methodology And Caveats",
    "## Outreach Readiness Checklist",
    "## Google Docs Export Handoff",
    "## Final QA Decision",
]

PACKAGE_STATUS_FIELDS = [
    "Stage 10 status:",
    "Source optimized email:",
    "Selected angle preserved:",
    "Final email body length:",
    "Analytical table present in final email:",
    "Ready for Google Docs export:",
]

CAMPAIGN_FIELDS = [
    "Client / brand:",
    "Campaign goal:",
    "Audience:",
    "Geography:",
    "Study or dataset type:",
    "Primary public-interest issue:",
    "Strongest evidence:",
    "Final outreach objective:",
]

ANGLE_FIELDS = [
    "Selected pitch angle:",
    "Category:",
    "Journalist beat:",
    "Outlet scale:",
    "Geography:",
    "Collection lane:",
    "Evidence support:",
    "Why this angle was selected:",
]

TARGET_FIELDS = [
    "Name:",
    "Outlet:",
    "Beat:",
    "Email status:",
    "Contact route:",
    "Muck Rack profile or source URL:",
    "Personalization level:",
    "Target confidence:",
]

SUBJECT_RECOMMENDATION_FIELDS = [
    "Recommended subject line:",
    "Why this subject is strongest:",
    "Selected-angle alignment:",
    "Risk check:",
]

TABLE_CONFIRMATION_FIELDS = [
    "Table location:",
    "Rows:",
    "Columns:",
    "Main finding row:",
    "Comparison / context row:",
    "Audience value row:",
    "Evidence verified:",
    "Supports selected angle:",
    "Table risk:",
]

NEWSWORTHINESS_FIELDS = [
    "Timeliness:",
    "Impact:",
    "Proximity:",
    "Novelty or tension:",
    "Magnitude:",
    "Human or reader consequence:",
    "Utility:",
    "Authority:",
    "Realistic publication path:",
]

ALIGNMENT_FIELDS = [
    "Subject line alignment:",
    "Opening hook alignment:",
    "Body thesis alignment:",
    "Analytical table alignment:",
    "Evidence alignment:",
    "CTA alignment:",
    "Journalist beat alignment:",
    "Secondary angle drift check:",
    "Final alignment decision:",
]

PERSONALIZATION_FIELDS = [
    "Recent coverage hook:",
    "Beat-fit reason:",
    "Outlet-fit reason:",
    "Geography-fit reason:",
    "Target-type fallback:",
    "Over-personalization risk:",
]

TRIGGER_FIELDS = [
    "Triggers used:",
    "Why each trigger is evidence-backed:",
    "Manipulation risk:",
    "Final trigger safety decision:",
]

METHODOLOGY_FIELDS = [
    "Source dataset:",
    "Data period:",
    "Sample / denominator / scope:",
    "Calculation method:",
    "Limitations:",
    "Assumptions:",
    "What the study can say:",
    "What the study cannot say:",
]

EXPORT_FIELDS = [
    "Local package path:",
    "Export command:",
    "Suggested Google Doc title:",
    "Expected output file:",
    "Expected metadata file:",
    "Export readiness decision:",
]

FINAL_QA_FIELDS = [
    "Final package status:",
    "Audit result:",
    "Validate-stage result:",
    "Human review required:",
    "Next step:",
]

PLACEHOLDER_PATTERN = re.compile(r"\[[^\]\n]{2,140}\](?!\()", re.IGNORECASE)
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
    if clean.lower() in {
        "ready / blocked",
        "yes / no",
        "pass/fail/needs review",
        "available / unavailable / needs confirmation",
        "direct / derived / contextual",
        "yes/no",
        "low / medium / high",
        "ready / blocked / needs human review",
    }:
        return True
    return bool(PLACEHOLDER_PATTERN.search(clean))


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def table_lines(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.strip().startswith("|") and line.strip().endswith("|")]


def has_analytical_table(text: str) -> bool:
    lowered = text.lower()
    lines = table_lines(text)
    if "analytical table" not in lowered:
        return False
    if len(lines) < 5:
        return False
    header = " ".join(lines[:2]).lower()
    return (
        ("analytical" in header or "data" in header or "evidence" in header)
        and ("coverage" in header or "journalist" in header or "matters" in header)
    )


def add(findings: list[Finding], level: str, check: str, message: str) -> None:
    findings.append(Finding(FINAL_FILE, level, check, message))


def check_required_sections(findings: list[Finding], text: str) -> None:
    for section in REQUIRED_SECTIONS:
        if section not in text:
            add(findings, "fail", "required-section", f"Missing required section: {section}")


def check_placeholders(findings: list[Finding], text: str) -> None:
    if PLACEHOLDER_PATTERN.search(text):
        add(findings, "fail", "unresolved-placeholder", "Unresolved bracket placeholders remain.")
    if re.search(r"(?m)^-\s*$", text):
        add(findings, "fail", "blank-bullet", "Blank bullet remains in final package.")


def check_fields(findings: list[Finding], text: str, fields: list[str], check_name: str) -> None:
    for field in fields:
        if is_blankish(field_value(text, field)):
            add(findings, "fail", check_name, f"Field is blank or unresolved: {field}")


def subject_lines(text: str) -> list[str]:
    section = section_text(text, "## Final Subject Line Options")
    lines = []
    for raw in section.splitlines():
        stripped = raw.strip()
        if stripped.startswith("- "):
            value = stripped[2:].strip()
            if value and not PLACEHOLDER_PATTERN.search(value):
                lines.append(value)
    return lines


def check_subjects(findings: list[Finding], text: str) -> None:
    subjects = subject_lines(text)
    if len(subjects) < 5:
        add(findings, "fail", "subject-count", "Final package must include at least five subject line options.")
    recommended = field_value(text, "Recommended subject line:")
    if is_blankish(recommended):
        add(findings, "fail", "recommended-subject", "Recommended subject line is missing.")
    elif subjects and recommended not in subjects:
        add(findings, "warn", "recommended-subject", "Recommended subject line is not repeated verbatim in subject options.")


def check_final_email(findings: list[Finding], text: str) -> None:
    body = section_text(text, "## Final Email")
    if not body:
        add(findings, "fail", "final-email", "Final Email section is empty.")
        return
    wc = word_count(body)
    if wc < BODY_WORD_MIN:
        add(findings, "fail", "email-length", f"Final email must be at least {BODY_WORD_MIN} words; found {wc}.")
    if wc > BODY_WORD_MAX:
        add(findings, "fail", "email-length", f"Final email must be no more than {BODY_WORD_MAX} words; found {wc}.")
    if not has_analytical_table(body):
        add(findings, "fail", "analytical-table", "Final email must include the analytical Markdown table inside the body.")
    lowered = body.lower()
    for phrase in ["already sent", "sent this email", "emailed the journalist", "outreach has been sent"]:
        if phrase in lowered:
            add(findings, "fail", "outreach-claim", f"Final package implies outreach happened: {phrase}")


def check_tables(findings: list[Finding], text: str) -> None:
    evidence = section_text(text, "## Evidence And Source Notes")
    if len(table_lines(evidence)) < 3:
        add(findings, "fail", "evidence-table", "Evidence And Source Notes must include a filled table.")
    assets = section_text(text, "## Assets Available For Outreach")
    if len(table_lines(assets)) < 3:
        add(findings, "fail", "assets-table", "Assets Available For Outreach must include a filled table.")
    readiness = section_text(text, "## Outreach Readiness Checklist")
    readiness_lines = table_lines(readiness)
    if len(readiness_lines) < 17:
        add(findings, "fail", "readiness-checklist", "Outreach Readiness Checklist is incomplete.")
    readiness_lower = readiness.lower()
    if re.search(r"\|\s*fail\s*\|", readiness_lower):
        add(findings, "fail", "readiness-fail", "Outreach Readiness Checklist contains a fail status.")


def check_status_decisions(findings: list[Finding], text: str) -> None:
    stage_status = (field_value(text, "Stage 10 status:") or "").lower()
    ready_export = (field_value(text, "Ready for Google Docs export:") or "").lower()
    final_status = (field_value(text, "Final package status:") or "").lower()
    table_present = (field_value(text, "Analytical table present in final email:") or "").lower()
    angle_preserved = (field_value(text, "Selected angle preserved:") or "").lower()
    if not stage_status.startswith("ready"):
        add(findings, "fail", "stage-status", "Stage 10 status must be ready.")
    if not ready_export.startswith("yes"):
        add(findings, "fail", "export-ready", "Ready for Google Docs export must be yes.")
    if not final_status.startswith("ready"):
        add(findings, "fail", "final-status", "Final package status must be ready.")
    if not table_present.startswith("yes"):
        add(findings, "fail", "table-present-field", "Analytical table present field must be yes.")
    if not angle_preserved.startswith("yes"):
        add(findings, "fail", "angle-preserved-field", "Selected angle preserved field must be yes.")


def check_stage09_alignment(findings: list[Finding], job_dir: Path, text: str) -> None:
    stage09 = job_dir / STAGE09_FILE
    if not stage09.exists():
        add(findings, "fail", "stage09-missing", "09-optimized-email.md is missing; cannot verify package source.")
        return
    source = read_text(stage09)
    if "Ready for final packaging:" in source and not re.search(r"(?i)Ready for final packaging:\s*yes", source):
        add(findings, "fail", "stage09-not-ready", "Stage 09 is not marked ready for final packaging.")
    package_angle = field_value(text, "Selected pitch angle:")
    source_angle = field_value(source, "Selected angle:")
    if package_angle and source_angle and package_angle.strip() != source_angle.strip():
        add(
            findings,
            "fail",
            "selected-angle-mismatch",
            f"Package selected angle does not match Stage 09: {package_angle!r} vs {source_angle!r}",
        )


def audit(path: Path) -> list[Finding]:
    if path.is_dir():
        job_dir = path
        target = path / FINAL_FILE
    else:
        job_dir = path.parent
        target = path

    findings: list[Finding] = []
    if not target.exists():
        return [Finding(FINAL_FILE, "fail", "missing-file", f"Missing Stage 10 package: {target}")]

    text = read_text(target)
    if not text.strip():
        return [Finding(FINAL_FILE, "fail", "empty-file", "Stage 10 package is empty.")]

    check_required_sections(findings, text)
    check_placeholders(findings, text)
    check_fields(findings, text, PACKAGE_STATUS_FIELDS, "package-status-field")
    check_fields(findings, text, CAMPAIGN_FIELDS, "campaign-field")
    check_fields(findings, text, ANGLE_FIELDS, "angle-field")
    check_fields(findings, text, TARGET_FIELDS, "target-field")
    check_fields(findings, text, SUBJECT_RECOMMENDATION_FIELDS, "subject-recommendation-field")
    check_fields(findings, text, TABLE_CONFIRMATION_FIELDS, "table-confirmation-field")
    check_fields(findings, text, NEWSWORTHINESS_FIELDS, "newsworthiness-field")
    check_fields(findings, text, ALIGNMENT_FIELDS, "alignment-field")
    check_fields(findings, text, PERSONALIZATION_FIELDS, "personalization-field")
    check_fields(findings, text, TRIGGER_FIELDS, "trigger-field")
    check_fields(findings, text, METHODOLOGY_FIELDS, "methodology-field")
    check_fields(findings, text, EXPORT_FIELDS, "export-field")
    check_fields(findings, text, FINAL_QA_FIELDS, "final-qa-field")
    check_subjects(findings, text)
    check_final_email(findings, text)
    check_tables(findings, text)
    check_status_decisions(findings, text)
    check_stage09_alignment(findings, job_dir, text)
    return findings


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Audit Stage 10 final Digital PR package quality.")
    parser.add_argument("path", help="Pitch job directory or 10-google-doc.md file")
    parser.add_argument("--json", action="store_true", help="Emit JSON findings")
    args = parser.parse_args(argv)

    findings = audit(Path(args.path).resolve())
    failures = [finding for finding in findings if finding.level == "fail"]
    warnings = [finding for finding in findings if finding.level == "warn"]

    if args.json:
        print(json.dumps([asdict(finding) for finding in findings], indent=2))
    else:
        status = "PASS" if not failures else "FAIL"
        print(f"Stage 10 final package audit: {status}")
        print(f"Findings: {len(findings)}")
        print(f"Failures: {len(failures)}")
        print(f"Warnings: {len(warnings)}")
        for finding in findings:
            print(f"[{finding.level.upper()}] {finding.file} :: {finding.check} :: {finding.message}")

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
