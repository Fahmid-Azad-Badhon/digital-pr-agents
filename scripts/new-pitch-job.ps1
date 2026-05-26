param(
    [Parameter(Mandatory = $true)]
    [string]$Name
)

function ConvertTo-Slug {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $slug = $Value.ToLowerInvariant()
    $slug = [System.Text.RegularExpressions.Regex]::Replace($slug, '[^a-z0-9]+', '-')
    $slug = $slug.Trim('-')
    return $slug
}

if ($Name.Contains('..') -or $Name.Contains('\') -or $Name.Contains('/')) {
    throw "Pitch job name must not contain path separators or '..'."
}

$slug = ConvertTo-Slug -Value $Name
if ([string]::IsNullOrWhiteSpace($slug)) {
    throw "Pitch job name must contain letters or numbers."
}

$root = Split-Path -Parent $PSScriptRoot
$templateDir = Join-Path $root 'templates'
$jobsDir = Join-Path $root 'pitch-jobs'
$jobDir = Join-Path $jobsDir $slug
$resolvedJobsDir = [System.IO.Path]::GetFullPath($jobsDir)
$resolvedJobDir = [System.IO.Path]::GetFullPath($jobDir)

if (-not $resolvedJobDir.StartsWith($resolvedJobsDir, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved pitch job path escapes pitch-jobs: $resolvedJobDir"
}

if (Test-Path -LiteralPath $jobDir) {
    throw "Pitch job already exists: $jobDir"
}

New-Item -ItemType Directory -Path $jobsDir -Force | Out-Null
New-Item -ItemType Directory -Path $jobDir -Force | Out-Null

Get-ChildItem -LiteralPath $templateDir | ForEach-Object {
    $destination = Join-Path $jobDir $_.Name
    if ($_.PSIsContainer) {
        Copy-Item -LiteralPath $_.FullName -Destination $destination -Recurse
    }
    else {
        Copy-Item -LiteralPath $_.FullName -Destination $destination
    }
}

Write-Output "Created $jobDir"
