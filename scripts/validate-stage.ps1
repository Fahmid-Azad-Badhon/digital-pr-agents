param(
    [Parameter(Mandatory = $true)]
    [string]$JobName,

    [Parameter(Mandatory = $true)]
    [ValidateSet(
        '00-brief.md',
        '01-study-notes.md',
        '02-insights.md',
        '03-research.md',
        '04-angles.md',
        '05-beats.md',
        '06-journalist-intel.md',
        '07-journalist-coverage.md',
        '08-pitch-draft.md',
        '09-optimized-email.md',
        '10-google-doc.md'
    )]
    [string]$StageFile
)

function Assert-MeaningfulFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "$Label is missing: $Path"
    }

    $raw = Get-Content -LiteralPath $Path -Raw
    $trimmed = $raw.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed)) {
        throw "$Label is empty: $Path"
    }

    $placeholderPatterns = @(
        '(?m)^-\s*$',
        '\|  \|',
        '\[Name\]',
        '\[Selected angle\]',
        '\[Beat query\]',
        '\[Preferred geography\]',
        '\[Preferred outlet tier or type\]',
        '\[Journalist 1\]',
        '\[Outlet\]',
        '\[Primary beat\]',
        '\[available or missing\]',
        '\[Profile URL\]',
        '\[1-10\]',
        '\[Why prioritized\]',
        '\[file path or export note\]',
        '\[Journalist - reason email is missing\]',
        '\[Journalist name\]',
        '\[Beat\]',
        '\[article title\]',
        '\[article URL\]',
        '\[why this coverage matters to the current angle\]',
        '\[coverage-based personalization point\]',
        '\[Hook\]',
        '\[Why this matters now\]',
        '\[Key data point 1\]',
        '\[Key data point 2\]',
        '\[Offer / asset / interview / data availability\]',
        '\[Sender\]',
        '\[Subject option 1\]',
        '\[Subject option 2\]',
        '\[Subject option 3\]',
        '\[What changed in this pass\]',
        '\[Final subject option 1\]',
        '\[Selected angle summary\]',
        '\[Supporting data point\]',
        '\[Personalization hook\]',
        '\[Optional follow-up note\]',
        '(?m)^Title:\s*$',
        '(?m)^URL:\s*$',
        '(?m)^Topic fit:\s*$',
        '(?m)^Takeaway:\s*$',
        '(?m)^Email:\s*$',
        '(?m)^Muck Rack Profile:\s*$'
    )

    foreach ($pattern in $placeholderPatterns) {
        if ($trimmed -match $pattern) {
            throw "$Label still contains placeholder content: $Path"
        }
    }

    $leafName = Split-Path -Leaf $Path
    switch ($leafName) {
        '06-journalist-intel.md' {
            Assert-JournalistIntelStage -Content $trimmed -Path $Path -Label $Label
        }
        '07-journalist-coverage.md' {
            Assert-JournalistCoverageStage -Content $trimmed -Path $Path -Label $Label
        }
        '09-optimized-email.md' {
            Assert-OptimizedEmailStage -Content $trimmed -Path $Path -Label $Label
        }
        '10-google-doc.md' {
            Assert-FinalPackageStage -Content $trimmed -Path $Path -Label $Label
        }
    }
}

function Assert-JournalistIntelStage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    if ($Content -match 'No imported journalists found' -or $Content -match 'No imported Muck Rack source files found') {
        throw "$Label does not contain a usable journalist shortlist: $Path"
    }

    $tableLines = $Content -split "`r?`n" | Where-Object {
        $_.Trim().StartsWith('|') -and $_.Trim().EndsWith('|')
    }

    if ($tableLines.Count -lt 3) {
        throw "$Label is missing the ranked journalist table: $Path"
    }

    $dataLines = $tableLines | Select-Object -Skip 2
    $validRows = 0

    foreach ($line in $dataLines) {
        $cells = $line.Trim('|').Split('|') | ForEach-Object { $_.Trim() }
        if ($cells.Count -lt 8) {
            continue
        }

        $scoreValue = 0
        $scoreValid = [int]::TryParse($cells[6], [ref]$scoreValue)
        $notesLength = $cells[7].Length

        if (
            -not [string]::IsNullOrWhiteSpace($cells[1]) -and
            -not [string]::IsNullOrWhiteSpace($cells[2]) -and
            -not [string]::IsNullOrWhiteSpace($cells[3]) -and
            -not [string]::IsNullOrWhiteSpace($cells[4]) -and
            $scoreValid -and
            $scoreValue -ge 1 -and
            $scoreValue -le 10 -and
            $notesLength -ge 20
        ) {
            $validRows += 1
        }
    }

    if ($validRows -lt 1) {
        throw "$Label does not contain a fully usable journalist ranking row: $Path"
    }

    if ($Content -notmatch '(?ms)## Media List / Export Source\s+-\s+.+') {
        throw "$Label is missing concrete source references for the imported journalist data: $Path"
    }
}

function Assert-JournalistCoverageStage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $blockedPhrases = @(
        '## No Imported Coverage',
        'No imported coverage items were available',
        'Potential personalization hook based on this recent story title',
        'Imported recent coverage to compare against the selected angle'
    )

    foreach ($phrase in $blockedPhrases) {
        if ($Content -match [regex]::Escape($phrase)) {
            throw "$Label still contains fallback or generic coverage text: $Path"
        }
    }

    $articleMatches = [regex]::Matches(
        $Content,
        '(?ms)^\d+\.\s+Title:\s+(.+?)\r?\n\s+URL:\s+(https?://\S+)\r?\n\s+Topic fit:\s+(.+?)\r?\n\s+Takeaway:\s+(.+?)$'
    )

    if ($articleMatches.Count -lt 1) {
        throw "$Label is missing at least one concrete recent coverage item with a real URL: $Path"
    }

    $hookMatches = [regex]::Matches($Content, '(?m)^-\s+.+$')
    if ($hookMatches.Count -lt 1) {
        throw "$Label is missing usable personalization hooks: $Path"
    }
}

function Get-StageSection {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$Heading
    )

    $escapedHeading = [regex]::Escape($Heading)
    $match = [regex]::Match($Content, "(?ms)^$escapedHeading\s*(.*?)(?=^##\s+|\z)")
    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }

    return ''
}

function Assert-OptimizedEmailField {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$FieldName,
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $escapedField = [regex]::Escape($FieldName)
    $match = [regex]::Match($Content, "(?m)^-\s+$escapedField\s*(.+)$")
    if (-not $match.Success) {
        throw "$Label is missing required field '$FieldName' in $Path"
    }

    $value = $match.Groups[1].Value.Trim()
    if (
        [string]::IsNullOrWhiteSpace($value) -or
        $value -match '\[[^\]\r\n]{2,120}\](?!\()' -or
        $value -in @('yes / no', 'ready / blocked', 'pass / fail plus reason', 'low / medium / high plus reason')
    ) {
        throw "$Label has unresolved field '$FieldName' in $Path"
    }
}

function Assert-OptimizedEmailStage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $requiredSections = @(
        '## Stage 09 Status',
        '## Source Integrity Check',
        '## Optimization Pass Log',
        '## Final Subject Line Options',
        '## Recommended Subject Line',
        '## Final Email',
        '## Evidence Included',
        '## Personalization Used',
        '## Newsworthiness Proof',
        '## Pitch Angle Alignment Review',
        '## Ethical Psychological Trigger Review',
        '## Inbox Quality Review',
        '## Claims To Avoid',
        '## Stage 10 Handoff'
    )

    foreach ($section in $requiredSections) {
        if ($Content -notmatch [regex]::Escape($section)) {
            throw "$Label is missing required optimized-email section '$section' in $Path"
        }
    }

    if ($Content -match '\[[^\]\r\n]{2,120}\](?!\()') {
        throw "$Label still contains unresolved bracket placeholders: $Path"
    }

    $requiredFields = @(
        'Source draft:',
        'Selected angle:',
        'Selected beat:',
        'Target journalist / target type:',
        'Optimization status:',
        'Publishability score:',
        'Selected Stage 08 variant used:',
        'Claims preserved:',
        'Claims tightened:',
        'Claims removed:',
        'Caveats carried forward:',
        'Angle drift check:',
        'Primary data point:',
        'Supporting data point:',
        'Source or dataset:',
        'Timeliness:',
        'Impact:',
        'Proximity:',
        'Novelty or tension:',
        'Publication path:',
        'Subject line alignment:',
        'Opening hook alignment:',
        'Body thesis alignment:',
        'Analytical table alignment:',
        'Evidence alignment:',
        'CTA alignment:',
        'Drift risk:',
        'Final alignment decision:',
        'Triggers used:',
        'Why they are evidence-backed:',
        'Pressure or manipulation risk:',
        'Final trigger safety decision:',
        'Ten-second deletion test:',
        'First-line strength:',
        'Subject-line strength:',
        'Data density check:',
        'Non-AI writing check:',
        'CTA clarity:',
        'Preview text strength:',
        'Mobile scan readability:',
        'Deliverability risk:',
        'Red-team objection:',
        'Fix applied:',
        'Final publishability decision:',
        'Ready for final packaging:',
        'Recommended subject line for package:',
        'Final email version:',
        'Assets to include:',
        'Remaining caveats:'
    )

    foreach ($field in $requiredFields) {
        Assert-OptimizedEmailField -Content $Content -FieldName $field -Path $Path -Label $Label
    }

    $subjectSection = Get-StageSection -Content $Content -Heading '## Final Subject Line Options'
    $subjectLines = [regex]::Matches($subjectSection, '(?m)^-\s+.+$')
    if ($subjectLines.Count -lt 5) {
        throw "$Label must contain at least five final subject line options: $Path"
    }

    $passLog = Get-StageSection -Content $Content -Heading '## Optimization Pass Log'
    for ($i = 0; $i -le 11; $i++) {
        if ($passLog -notmatch "Pass $i") {
            throw "$Label is missing optimization Pass $i in the pass log: $Path"
        }
    }

    $scoreMatch = [regex]::Match($Content, 'Publishability score:\s*(\d{1,3})')
    if (-not $scoreMatch.Success) {
        throw "$Label is missing a numeric publishability score: $Path"
    }

    $score = [int]$scoreMatch.Groups[1].Value
    if ($score -lt 85 -or $score -gt 100) {
        throw "$Label publishability score must be between 85 and 100: $Path"
    }

    $emailBody = Get-StageSection -Content $Content -Heading '## Final Email'
    if ([string]::IsNullOrWhiteSpace($emailBody)) {
        throw "$Label is missing the final optimized email body: $Path"
    }

    $wordMatches = [regex]::Matches($emailBody, "\b[\w'-]+\b")
    if ($wordMatches.Count -lt 500 -or $wordMatches.Count -gt 600) {
        throw "$Label final email body must be 500-600 words; found $($wordMatches.Count): $Path"
    }

    $tableLines = $emailBody -split "`r?`n" | Where-Object {
        $_.Trim().StartsWith('|') -and $_.Trim().EndsWith('|')
    }

    if ($emailBody -notmatch '(?i)analytical table' -or $tableLines.Count -lt 5) {
        throw "$Label final email body is missing an analytical Markdown table: $Path"
    }

    if ($emailBody -notmatch '(\b\d+([.,]\d+)?%?\b|\bNo\.\s*\d+\b|\btop\s+\d+\b)') {
        throw "$Label final email body does not contain numeric data: $Path"
    }

    if ($emailBody -notmatch '(?i)(happy to send|i can send|i can share|would this be useful|would you like|methodology|full dataset|full table|local breakdown|county breakdown|state breakdown|rankings|quote|comment)') {
        throw "$Label final email body is missing a low-friction CTA or asset offer: $Path"
    }

    $linkMatches = [regex]::Matches($emailBody, 'https?://')
    if ($linkMatches.Count -gt 1) {
        throw "$Label final email body contains too many URLs for a first outreach email: $Path"
    }

    if ($emailBody -match '!!') {
        throw "$Label final email body contains repeated exclamation marks: $Path"
    }

    $blockedPhrases = @(
        "i hope you're well",
        'i hope you are well',
        'i wanted to reach out',
        'thought this might be of interest',
        'new study',
        'interesting insights',
        'valuable insights',
        "in today's fast-paced world",
        'game-changing',
        'groundbreaking',
        'leverage',
        'unlock',
        'delve',
        'seamless',
        'robust',
        'your readers will love',
        'you should cover',
        'please cover this',
        'let me know if interested'
    )

    foreach ($phrase in $blockedPhrases) {
        if ($emailBody.ToLowerInvariant().Contains($phrase)) {
            throw "$Label final email contains banned AI or PR phrase '$phrase': $Path"
        }
    }

    $inboxSection = Get-StageSection -Content $Content -Heading '## Inbox Quality Review'
    if ($inboxSection -match '(?i)\bfail\b|revise before outreach') {
        throw "$Label inbox review is not ready for outreach: $Path"
    }

    if ($inboxSection -match '(?i)Deliverability risk:\s*high') {
        throw "$Label deliverability risk is marked high: $Path"
    }

    $alignmentSection = Get-StageSection -Content $Content -Heading '## Pitch Angle Alignment Review'
    if ($alignmentSection -match '(?i)revise before outreach|not aligned|Drift risk:\s*high') {
        throw "$Label pitch angle alignment review is not approved: $Path"
    }

    $handoffSection = Get-StageSection -Content $Content -Heading '## Stage 10 Handoff'
    if ($handoffSection -notmatch '(?i)Ready for final packaging:\s*yes') {
        throw "$Label Stage 10 handoff is not marked ready: $Path"
    }
}

function Assert-FinalPackageField {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$FieldName,
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $escapedField = [regex]::Escape($FieldName)
    $match = [regex]::Match($Content, "(?m)^-\s+$escapedField\s*(.+)$")
    if (-not $match.Success) {
        throw "$Label is missing required field '$FieldName' in $Path"
    }

    $value = $match.Groups[1].Value.Trim()
    if (
        [string]::IsNullOrWhiteSpace($value) -or
        $value -match '\[[^\]\r\n]{2,140}\](?!\()' -or
        $value -in @('ready / blocked', 'yes / no', 'pass/fail/needs review', 'available / unavailable / needs confirmation', 'direct / derived / contextual', 'yes/no', 'low / medium / high', 'ready / blocked / needs human review')
    ) {
        throw "$Label field '$FieldName' is blank or unresolved in $Path"
    }
}

function Assert-FinalPackageStage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Content,
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Label
    )

    $requiredSections = @(
        '# Final Digital PR Outreach Package',
        '## Package Status',
        '## Campaign Snapshot',
        '## Selected Outreach Angle',
        '## Target Journalist / Target Type',
        '## Final Subject Line Recommendation',
        '## Final Subject Line Options',
        '## Final Email',
        '## Analytical Table Confirmation',
        '## Evidence And Source Notes',
        '## Newsworthiness Proof',
        '## Pitch Angle Alignment Proof',
        '## Personalization Basis',
        '## Ethical Psychological Trigger Review',
        '## Claims To Avoid',
        '## Assets Available For Outreach',
        '## Methodology And Caveats',
        '## Outreach Readiness Checklist',
        '## Google Docs Export Handoff',
        '## Final QA Decision'
    )

    foreach ($section in $requiredSections) {
        if ($Content -notmatch [regex]::Escape($section)) {
            throw "$Label is missing required final-package section '$section' in $Path"
        }
    }

    $requiredFields = @(
        'Stage 10 status:',
        'Source optimized email:',
        'Selected angle preserved:',
        'Final email body length:',
        'Analytical table present in final email:',
        'Ready for Google Docs export:',
        'Client / brand:',
        'Campaign goal:',
        'Audience:',
        'Geography:',
        'Study or dataset type:',
        'Primary public-interest issue:',
        'Strongest evidence:',
        'Final outreach objective:',
        'Selected pitch angle:',
        'Category:',
        'Journalist beat:',
        'Outlet scale:',
        'Collection lane:',
        'Evidence support:',
        'Why this angle was selected:',
        'Name:',
        'Outlet:',
        'Beat:',
        'Email status:',
        'Contact route:',
        'Muck Rack profile or source URL:',
        'Personalization level:',
        'Target confidence:',
        'Recommended subject line:',
        'Why this subject is strongest:',
        'Selected-angle alignment:',
        'Risk check:',
        'Table location:',
        'Rows:',
        'Columns:',
        'Main finding row:',
        'Comparison / context row:',
        'Audience value row:',
        'Evidence verified:',
        'Supports selected angle:',
        'Table risk:',
        'Timeliness:',
        'Impact:',
        'Proximity:',
        'Novelty or tension:',
        'Magnitude:',
        'Human or reader consequence:',
        'Utility:',
        'Authority:',
        'Realistic publication path:',
        'Subject line alignment:',
        'Opening hook alignment:',
        'Body thesis alignment:',
        'Analytical table alignment:',
        'Evidence alignment:',
        'CTA alignment:',
        'Journalist beat alignment:',
        'Secondary angle drift check:',
        'Final alignment decision:',
        'Recent coverage hook:',
        'Beat-fit reason:',
        'Outlet-fit reason:',
        'Geography-fit reason:',
        'Target-type fallback:',
        'Over-personalization risk:',
        'Triggers used:',
        'Why each trigger is evidence-backed:',
        'Manipulation risk:',
        'Final trigger safety decision:',
        'Source dataset:',
        'Data period:',
        'Sample / denominator / scope:',
        'Calculation method:',
        'Limitations:',
        'Assumptions:',
        'What the study can say:',
        'What the study cannot say:',
        'Local package path:',
        'Export command:',
        'Suggested Google Doc title:',
        'Expected output file:',
        'Expected metadata file:',
        'Export readiness decision:',
        'Final package status:',
        'Audit result:',
        'Validate-stage result:',
        'Human review required:',
        'Next step:'
    )

    foreach ($field in $requiredFields) {
        Assert-FinalPackageField -Content $Content -FieldName $field -Path $Path -Label $Label
    }

    $subjectSection = Get-StageSection -Content $Content -Heading '## Final Subject Line Options'
    $subjectLines = [regex]::Matches($subjectSection, '(?m)^-\s+.+$')
    if ($subjectLines.Count -lt 5) {
        throw "$Label must contain at least five final subject line options: $Path"
    }

    $emailBody = Get-StageSection -Content $Content -Heading '## Final Email'
    if ([string]::IsNullOrWhiteSpace($emailBody)) {
        throw "$Label is missing final email body: $Path"
    }

    $wordMatches = [regex]::Matches($emailBody, "\b[\w'-]+\b")
    if ($wordMatches.Count -lt 500 -or $wordMatches.Count -gt 600) {
        throw "$Label final email body must be 500-600 words; found $($wordMatches.Count): $Path"
    }

    $tableLines = $emailBody -split "`r?`n" | Where-Object {
        $_.Trim().StartsWith('|') -and $_.Trim().EndsWith('|')
    }

    if ($emailBody -notmatch '(?i)analytical table' -or $tableLines.Count -lt 5) {
        throw "$Label final email body is missing an analytical Markdown table: $Path"
    }

    $readinessSection = Get-StageSection -Content $Content -Heading '## Outreach Readiness Checklist'
    if ($readinessSection -match '(?i)\|\s*fail\s*\|') {
        throw "$Label outreach readiness checklist contains a fail status: $Path"
    }

    if ($Content -notmatch '(?i)Stage 10 status:\s*ready') {
        throw "$Label Stage 10 status is not ready: $Path"
    }

    if ($Content -notmatch '(?i)Ready for Google Docs export:\s*yes') {
        throw "$Label is not marked ready for Google Docs export: $Path"
    }

    if ($Content -notmatch '(?i)Final package status:\s*ready') {
        throw "$Label final QA decision is not ready: $Path"
    }
}

$root = Split-Path -Parent $PSScriptRoot
$jobDir = Join-Path (Join-Path $root 'pitch-jobs') $JobName

if (-not (Test-Path -LiteralPath $jobDir)) {
    throw "Pitch job does not exist: $jobDir"
}

$stageOrder = @(
    '00-brief.md',
    '01-study-notes.md',
    '02-insights.md',
    '03-research.md',
    '04-angles.md',
    '05-beats.md',
    '06-journalist-intel.md',
    '07-journalist-coverage.md',
    '08-pitch-draft.md',
    '09-optimized-email.md',
    '10-google-doc.md'
)

$targetIndex = [Array]::IndexOf($stageOrder, $StageFile)
if ($targetIndex -lt 0) {
    throw "Unknown stage file: $StageFile"
}

for ($i = 0; $i -lt $targetIndex; $i++) {
    $requiredPath = Join-Path $jobDir $stageOrder[$i]
    Assert-MeaningfulFile -Path $requiredPath -Label "Prerequisite $($stageOrder[$i])"
}

$targetPath = Join-Path $jobDir $StageFile
if (Test-Path -LiteralPath $targetPath) {
    Assert-MeaningfulFile -Path $targetPath -Label "Target stage $StageFile"
}

Write-Output "Stage validation passed for $StageFile in $jobDir"
