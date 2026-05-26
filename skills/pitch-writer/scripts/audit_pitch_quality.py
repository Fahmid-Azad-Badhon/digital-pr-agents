#!/usr/bin/env python3
"""Audit Stage 08 pitch files for Digital PR outreach quality.

This script is intentionally dependency-free. It checks structure and common
copy risks that are easy to miss when a draft sounds polished but is weak for a
journalist inbox.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path


VARIANT_FILES = [
    "draft-variants/08a-straight-news.md",
    "draft-variants/08b-short-punchy.md",
    "draft-variants/08c-data-heavy.md",
    "draft-variants/08d-journalist-personalized.md",
    "draft-variants/08e-storytelling-narrative.md",
    "draft-variants/08f-localized.md",
]

FINAL_FILE = "08-pitch-draft.md"
BODY_WORD_MIN = 500
BODY_WORD_MAX = 600

REQUIRED_FINAL_SECTIONS = [
    "## Selected Variant",
    "## Selected Outreach Angle",
    "## Target Journalist / Target Type",
    "## Pitch Construction Blueprint",
    "## Subject Line Options",
    "## Draft",
    "## Evidence Used",
    "## Newsworthiness And Publication Path",
    "## Ethical Psychological Trigger Review",
    "## Personalization Note",
    "## Caveats / Claims To Avoid",
    "## Variant Comparison Summary",
    "## Inbox Quality Review",
    "## Stage 09 Handoff",
]

REQUIRED_VARIANT_SECTIONS = [
    "## Variant",
    "## Selected Outreach Angle",
    "## Target Journalist / Target Type",
    "## Pitch Construction Blueprint",
    "## Subject Line Options",
    "## Draft",
    "## Evidence Used",
    "## Newsworthiness Notes",
    "## Ethical Psychological Trigger Review",
    "## Personalization Basis",
    "## Caveats / Claims To Avoid",
    "## Inbox Quality Review",
    "## QA Notes",
]

BANNED_AI_OR_PR_PHRASES = [
    "i hope you're well",
    "i hope you are well",
    "i wanted to reach out",
    "thought this might be of interest",
    "this might be of interest",
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
    "dive into",
    "landscape",
    "pivotal",
    "crucial",
    "sheds light",
    "paint a picture",
    "paints a picture",
    "underscores the importance",
    "highlights the importance",
    "serves as a reminder",
    "your readers will love",
    "perfect for your audience",
    "you should cover",
    "you need to see",
    "must see",
]

FAKE_PRESSURE_PHRASES = [
    "urgent",
    "last chance",
    "only available today",
    "cannot afford to ignore",
    "everyone is talking about",
    "you won't believe",
    "you will not believe",
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
    "quote",
    "comment",
]

NEWSWORTHINESS_SIGNALS = [
    "impact",
    "timing",
    "timeliness",
    "proximity",
    "novelty",
    "tension",
    "magnitude",
    "human consequence",
    "utility",
    "authority",
    "continuity",
    "publication path",
    "audience value",
    "news hook",
    "why a journalist would publish",
]

PLACEHOLDER_PATTERN = re.compile(r"\[[^\]\n]{2,120}\](?!\()", re.IGNORECASE)

ANGLE_FIELD_PATTERN = re.compile(
    r"^-\s*(Angle|Beat|Category|Outlet scale|Geography|Collection lane|Evidence support):[ \t]*(.*)$",
    re.MULTILINE,
)


@dataclass
class Finding:
    file: str
    level: str
    check: str
    message: str


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="replace")


def section_text(text: str, heading: str) -> str:
    pattern = re.compile(
        rf"^{re.escape(heading)}\s*$([\s\S]*?)(?=^##\s+|\Z)",
        re.MULTILINE,
    )
    match = pattern.search(text)
    return match.group(1).strip() if match else ""


def subject_lines(text: str) -> list[str]:
    section = section_text(text, "## Subject Line Options")
    lines = []
    for raw in section.splitlines():
        stripped = raw.strip()
        if stripped.startswith("- "):
            value = stripped[2:].strip()
            if value and not value.startswith("[Subject option"):
                lines.append(value)
    return lines


def draft_body(text: str) -> str:
    return section_text(text, "## Draft")


def word_count(text: str) -> int:
    return len(re.findall(r"\b[\w'-]+\b", text))


def has_analytical_table(text: str) -> bool:
    lowered = lower(text)
    table_lines = [line.strip() for line in text.splitlines() if line.strip().startswith("|") and line.strip().endswith("|")]
    if "analytical table" not in lowered:
        return False
    if len(table_lines) < 5:
        return False
    header_text = " ".join(table_lines[:2]).lower()
    return (
        "analytical" in header_text
        or "data" in header_text
        or "evidence" in header_text
    ) and ("coverage" in header_text or "journalist" in header_text or "matters" in header_text)


def has_number(text: str) -> bool:
    return bool(re.search(r"\b\d+(?:\.\d+)?%?\b", text))


def lower(text: str) -> str:
    return text.lower()


def add(findings: list[Finding], file: str, level: str, check: str, message: str) -> None:
    findings.append(Finding(file=file, level=level, check=check, message=message))


def check_required_sections(
    findings: list[Finding],
    rel_file: str,
    text: str,
    required: list[str],
) -> None:
    for heading in required:
        if heading not in text:
            add(findings, rel_file, "fail", "required-section", f"Missing section: {heading}")


def check_placeholders(findings: list[Finding], rel_file: str, text: str) -> None:
    matches = PLACEHOLDER_PATTERN.findall(text)
    if matches:
        add(
            findings,
            rel_file,
            "fail",
            "unresolved-placeholder",
            "Unresolved bracket placeholders remain in the pitch file.",
        )


def check_colon_fields(
    findings: list[Finding],
    rel_file: str,
    section: str,
    labels: list[str],
    check_name: str,
) -> None:
    for label in labels:
        if label not in section:
            add(findings, rel_file, "fail", check_name, f"Missing field: {label}")
        elif not re.search(rf"{re.escape(label)}[ \t]*\S", section):
            add(findings, rel_file, "fail", check_name, f"Field is blank: {label}")


def selected_angle_fields(text: str) -> dict[str, str]:
    section = section_text(text, "## Selected Outreach Angle")
    fields: dict[str, str] = {}
    for key, value in ANGLE_FIELD_PATTERN.findall(section):
        fields[key.lower()] = value.strip()
    return fields


def check_selected_angle_fields(findings: list[Finding], rel_file: str, text: str) -> None:
    fields = selected_angle_fields(text)
    for key in ["angle", "beat", "category", "outlet scale", "geography", "collection lane"]:
        value = fields.get(key, "")
        if not value:
            add(findings, rel_file, "fail", "selected-angle-field", f"Selected Outreach Angle field is blank: {key}")
        elif value.startswith("[") and value.endswith("]"):
            add(
                findings,
                rel_file,
                "fail",
                "selected-angle-field",
                f"Selected Outreach Angle field is unresolved placeholder: {key}",
            )


def check_subjects(findings: list[Finding], rel_file: str, text: str) -> None:
    subjects = subject_lines(text)
    if len(subjects) < 3:
        add(findings, rel_file, "fail", "subject-count", "Fewer than 3 subject line options found.")
        return

    strong_count = 0
    for subject in subjects[:3]:
        wc = word_count(subject)
        subject_l = lower(subject)
        if wc > 14:
            add(findings, rel_file, "warn", "subject-length", f"Subject may be too long: {subject}")
        if any(p in subject_l for p in ["interesting", "must see", "you need", "shocking"]):
            add(findings, rel_file, "fail", "subject-hype", f"Subject sounds vague or hypey: {subject}")
        for phrase in BANNED_AI_OR_PR_PHRASES:
            if phrase in subject_l:
                add(findings, rel_file, "fail", "subject-ai-or-pr-phrase", f"Remove weak phrase from subject: {phrase}")
        for phrase in FAKE_PRESSURE_PHRASES:
            if phrase in subject_l:
                add(findings, rel_file, "warn", "subject-pressure-language", f"Check pressure or urgency in subject: {phrase}")
        if has_number(subject) or ":" in subject or any(
            term in subject_l for term in ["data", "study", "analysis", "county", "state", "local", "risk", "rank"]
        ):
            strong_count += 1

    if strong_count == 0:
        add(findings, rel_file, "fail", "subject-specificity", "No subject line has a clear data, study, local, or story signal.")


def check_draft_body(findings: list[Finding], rel_file: str, text: str) -> None:
    body = draft_body(text)
    if not body:
        add(findings, rel_file, "fail", "draft-body", "Missing draft body.")
        return

    body_l = lower(body)
    wc = word_count(body)
    if wc < BODY_WORD_MIN:
        add(findings, rel_file, "fail", "body-length", f"Draft body must be at least {BODY_WORD_MIN} words; found {wc}.")
    if wc > BODY_WORD_MAX:
        add(findings, rel_file, "fail", "body-length", f"Draft body must be no more than {BODY_WORD_MAX} words; found {wc}.")
    if not has_analytical_table(body):
        add(findings, rel_file, "fail", "analytical-table", "Draft body must include an analytical Markdown table inside the email body.")

    first_content_line = ""
    for raw in body.splitlines():
        stripped = raw.strip()
        if stripped and not stripped.lower().startswith("hi "):
            first_content_line = stripped
            break
    if first_content_line:
        first_l = lower(first_content_line)
        if any(
            phrase in first_l
            for phrase in ["i hope", "i wanted to reach out", "thought this might", "i'm reaching out"]
        ):
            add(findings, rel_file, "fail", "first-line", "First content line starts with filler.")
        if not (has_number(first_content_line) or any(term in first_l for term in ["data", "study", "analysis", "coverage", "reporting", "found", "county", "state", "local", "risk", "rank"])):
            add(findings, rel_file, "warn", "first-line-specificity", "First content line may not prove relevance quickly.")

    if not any(signal in body_l for signal in CTA_SIGNALS):
        add(findings, rel_file, "fail", "cta", "No clear low-friction CTA or asset offer detected.")

    if not has_number(body):
        add(findings, rel_file, "fail", "data-density", "No numeric data detected in the draft body.")

    for phrase in BANNED_AI_OR_PR_PHRASES:
        if phrase in body_l:
            add(findings, rel_file, "fail", "ai-or-pr-phrase", f"Remove weak or AI-sounding phrase: {phrase}")

    for phrase in FAKE_PRESSURE_PHRASES:
        if phrase in body_l:
            add(findings, rel_file, "warn", "pressure-language", f"Check pressure or urgency language: {phrase}")


def check_final_quality_sections(findings: list[Finding], rel_file: str, text: str) -> None:
    blueprint = section_text(text, "## Pitch Construction Blueprint")
    if blueprint:
        check_colon_fields(
            findings,
            rel_file,
            blueprint,
            [
                "Selected-angle fingerprint:",
                "Primary hook:",
                "Supporting evidence:",
                "Analytical table purpose:",
                "Audience consequence:",
                "Ethical pull:",
                "Asset offer:",
                "Claim boundary:",
            ],
            "blueprint-field",
        )

    news = section_text(text, "## Newsworthiness And Publication Path")
    if not news:
        return
    news_l = lower(news)
    signal_count = sum(1 for signal in NEWSWORTHINESS_SIGNALS if signal in news_l)
    if signal_count < 4:
        add(
            findings,
            rel_file,
            "fail",
            "newsworthiness-depth",
            "Newsworthiness section does not show enough publication rationale.",
        )
    check_colon_fields(
        findings,
        rel_file,
        news,
        [
            "Primary news hook:",
            "Why a journalist would publish this:",
            "Audience value:",
            "Publication path:",
            "Useful asset offered:",
        ],
        "newsworthiness-field",
    )

    triggers = section_text(text, "## Ethical Psychological Trigger Review")
    if triggers:
        triggers_l = lower(triggers)
        if "fake urgency" in triggers_l or "false scarcity" in triggers_l:
            add(findings, rel_file, "warn", "trigger-risk", "Psychological trigger review mentions urgency/scarcity; verify it rejects pressure tactics.")
        if "supported" not in triggers_l and "evidence" not in triggers_l:
            add(findings, rel_file, "fail", "trigger-evidence", "Trigger review does not explain evidence support.")
        check_colon_fields(
            findings,
            rel_file,
            triggers,
            ["Triggers used:", "Why they are supported:", "Pressure or manipulation risk:", "Final trigger safety decision:"],
            "trigger-field",
        )

    selected = section_text(text, "## Selected Variant")
    if selected:
        check_colon_fields(
            findings,
            rel_file,
            selected,
            ["Format:", "Source:", "Why selected:"],
            "selected-variant-field",
        )

    handoff = section_text(text, "## Stage 09 Handoff")
    if handoff:
        check_colon_fields(
            findings,
            rel_file,
            handoff,
            ["Ready for optimization:", "Optimization focus:", "Subject line direction:", "CTA direction:", "Remaining risk:"],
            "stage09-handoff-field",
        )

    comparison = section_text(text, "## Variant Comparison Summary")
    if comparison and comparison.count("|") < 20:
        add(findings, rel_file, "fail", "variant-comparison", "Variant comparison table appears incomplete.")

    inbox = section_text(text, "## Inbox Quality Review")
    if inbox:
        check_colon_fields(
            findings,
            rel_file,
            inbox,
            ["Ten-second deletion test:", "Newsworthiness gate:", "Publishability score:", "Data density check:", "Non-AI writing check:"],
            "inbox-field",
        )


def check_variant_quality_sections(findings: list[Finding], rel_file: str, text: str) -> None:
    blueprint = section_text(text, "## Pitch Construction Blueprint")
    if blueprint:
        check_colon_fields(
            findings,
            rel_file,
            blueprint,
            [
                "Selected-angle fingerprint:",
                "Primary hook:",
                "Supporting evidence:",
                "Analytical table purpose:",
                "Audience consequence:",
                "Ethical pull:",
                "Asset offer:",
                "Claim boundary:",
            ],
            "variant-blueprint-field",
        )

    news = section_text(text, "## Newsworthiness Notes")
    if news:
        check_colon_fields(
            findings,
            rel_file,
            news,
            ["Primary news hook:", "Why a journalist would publish this:", "Audience value:", "Publication path:", "Useful asset offered:"],
            "variant-newsworthiness-field",
        )

    triggers = section_text(text, "## Ethical Psychological Trigger Review")
    if triggers:
        check_colon_fields(
            findings,
            rel_file,
            triggers,
            ["Triggers used:", "Why they are supported:", "Pressure or manipulation risk:", "Final trigger safety decision:"],
            "variant-trigger-field",
        )

    inbox = section_text(text, "## Inbox Quality Review")
    if inbox:
        check_colon_fields(
            findings,
            rel_file,
            inbox,
            ["Ten-second deletion test:", "Newsworthiness gate:", "Data density check:", "Non-AI writing check:"],
            "variant-inbox-field",
        )

    variant = section_text(text, "## Variant")
    expected_selector = Path(rel_file).stem.split("-", 1)[1] if Path(rel_file).stem.startswith("08") and "-" in Path(rel_file).stem else ""
    if expected_selector and f"Selector key: {expected_selector}" not in variant:
        add(findings, rel_file, "fail", "variant-selector", f"Selector key does not match expected: {expected_selector}")


def check_angle_consistency(findings: list[Finding], file_texts: dict[str, str]) -> None:
    baseline_file = FINAL_FILE if FINAL_FILE in file_texts else next(iter(file_texts), "")
    if not baseline_file:
        return
    baseline = selected_angle_fields(file_texts[baseline_file])
    for key in ["angle", "beat", "category", "outlet scale", "geography", "collection lane"]:
        baseline_value = baseline.get(key, "")
        if not baseline_value:
            continue
        for rel_file, text in file_texts.items():
            current = selected_angle_fields(text).get(key, "")
            if current and current != baseline_value:
                add(
                    findings,
                    rel_file,
                    "fail",
                    "selected-angle-consistency",
                    f"Selected angle field mismatch for {key}: expected {baseline_value!r}, found {current!r}",
                )


def audit(job_dir: Path) -> tuple[list[Finding], dict[str, object]]:
    findings: list[Finding] = []
    files_checked = 0
    file_texts: dict[str, str] = {}

    for rel in VARIANT_FILES:
        path = job_dir / rel
        if not path.exists():
            add(findings, rel, "fail", "missing-file", "Expected variant file is missing.")
            continue
        files_checked += 1
        text = read_text(path)
        file_texts[rel] = text
        check_required_sections(findings, rel, text, REQUIRED_VARIANT_SECTIONS)
        check_placeholders(findings, rel, text)
        check_selected_angle_fields(findings, rel, text)
        check_subjects(findings, rel, text)
        check_draft_body(findings, rel, text)
        check_variant_quality_sections(findings, rel, text)

    final_path = job_dir / FINAL_FILE
    if not final_path.exists():
        add(findings, FINAL_FILE, "fail", "missing-file", "Expected final Stage 08 pitch draft is missing.")
    else:
        files_checked += 1
        text = read_text(final_path)
        file_texts[FINAL_FILE] = text
        check_required_sections(findings, FINAL_FILE, text, REQUIRED_FINAL_SECTIONS)
        check_placeholders(findings, FINAL_FILE, text)
        check_selected_angle_fields(findings, FINAL_FILE, text)
        check_subjects(findings, FINAL_FILE, text)
        check_draft_body(findings, FINAL_FILE, text)
        check_final_quality_sections(findings, FINAL_FILE, text)

    check_angle_consistency(findings, file_texts)

    fail_count = sum(1 for f in findings if f.level == "fail")
    warn_count = sum(1 for f in findings if f.level == "warn")
    summary = {
        "job_dir": str(job_dir),
        "files_checked": files_checked,
        "fail_count": fail_count,
        "warn_count": warn_count,
        "status": "pass" if fail_count == 0 else "fail",
    }
    return findings, summary


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description="Audit Digital PR Stage 08 pitch draft quality.")
    parser.add_argument("job_dir", help="Path to a pitch-jobs/<slug> folder.")
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of text.")
    args = parser.parse_args(argv)

    job_dir = Path(args.job_dir).resolve()
    if not job_dir.exists() or not job_dir.is_dir():
        print(f"ERROR: job_dir does not exist or is not a directory: {job_dir}", file=sys.stderr)
        return 2

    findings, summary = audit(job_dir)

    if args.json:
        print(json.dumps({"summary": summary, "findings": [asdict(f) for f in findings]}, indent=2))
    else:
        print(f"Stage 08 pitch quality audit: {summary['status'].upper()}")
        print(f"Job: {summary['job_dir']}")
        print(f"Files checked: {summary['files_checked']}")
        print(f"Failures: {summary['fail_count']}")
        print(f"Warnings: {summary['warn_count']}")
        if findings:
            print("")
            for finding in findings:
                print(f"[{finding.level.upper()}] {finding.file} :: {finding.check} :: {finding.message}")

    return 0 if summary["status"] == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
