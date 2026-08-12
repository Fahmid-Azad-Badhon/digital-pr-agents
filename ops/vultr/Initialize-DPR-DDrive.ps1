# Initialize-DPR-DDrive.ps1

# DPR future-use script only.
# DO NOT EXECUTE IN THIS BATCH.
# Run only after Vultr server creation, storage attachment verification, and explicit D-drive initialization gate authorization.

param(
    # REQUIRED: expected size of the target data disk, in GB (the value chosen in the storage
    # plan / Vultr Block Storage order). The script refuses to initialize any RAW disk whose
    # size does not match this value, preventing accidental destruction of the wrong disk.
    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 1048576)]
    [double]$ExpectedDiskSizeGB
)

$ErrorActionPreference = "Stop"

$ExpectedBytes = [math]::Round($ExpectedDiskSizeGB * 1GB)
$ToleranceBytes = [math]::Round($ExpectedBytes * 0.05)

Write-Output "Checking for existing D: volume..."
$existingD = Get-Volume -DriveLetter D -ErrorAction SilentlyContinue
if ($existingD) {
    Write-Output "D: already exists."
    Get-Volume -DriveLetter D | Select-Object DriveLetter, FileSystemLabel, FileSystem, Size, SizeRemaining
    New-Item -ItemType Directory -Path "D:\Codex Folder" -Force | Out-Null
    Get-Item "D:\Codex Folder" | Select-Object FullName, Exists
    exit 0
}

Write-Output "Finding RAW data disk matching expected size $($ExpectedDiskSizeGB) GB ($ExpectedBytes bytes)..."
# RAW-only candidate set; the Windows OS/boot/system disk is never RAW on a fresh
# Windows Server install, but it is excluded explicitly so it can never be chosen.
$disks = Get-Disk | Where-Object { $_.PartitionStyle -eq "RAW" -and -not $_.IsSystem -and -not $_.IsBoot }
$candidates = @($disks | Where-Object { [math]::Abs([int64]$_.Size - $ExpectedBytes) -le $ToleranceBytes })

if ($candidates.Count -eq 0) {
    $sizes = ($disks | ForEach-Object { "disk $($_.Number): $($_.Size) bytes" }) -join "; "
    Write-Error "No RAW disk found matching expected size $($ExpectedDiskSizeGB) GB ($ExpectedBytes bytes). RAW disks found: $sizes. Refusing to initialize an unverified disk. Aborting."
    exit 1
}

if ($candidates.Count -gt 1) {
    $matchSizes = ($candidates | ForEach-Object { "disk $($_.Number): $($_.Size) bytes" }) -join "; "
    Write-Error "Multiple RAW disks match expected size $($ExpectedDiskSizeGB) GB ($ExpectedBytes bytes): $matchSizes. Refusing to choose a disk automatically. Detach the unintended volume or re-run with a unique expected size. Aborting."
    exit 1
}

$disk = $candidates[0]

Write-Output "Identity verified: disk number $($disk.Number), size $($disk.Size) bytes matches expected $ExpectedBytes bytes (within 5% tolerance)."
Write-Output "Initializing disk number $($disk.Number), size $($disk.Size)..."
Initialize-Disk -Number $disk.Number -PartitionStyle GPT

Write-Output "Creating D: partition..."
New-Partition -DiskNumber $disk.Number -DriveLetter D -UseMaximumSize | Out-Null

Write-Output "Formatting D: as NTFS..."
Format-Volume -DriveLetter D -FileSystem NTFS -NewFileSystemLabel "DPRData" -Confirm:$false | Out-Null

Write-Output "Creating D:\Codex Folder..."
New-Item -ItemType Directory -Path "D:\Codex Folder" -Force | Out-Null

Write-Output "Final volume state:"
Get-Volume -DriveLetter D | Select-Object DriveLetter, FileSystemLabel, FileSystem, Size, SizeRemaining

Write-Output "Folder verification:"
Get-Item "D:\Codex Folder" | Select-Object FullName, Exists
