# Initialize-DPR-DDrive.ps1

# DPR future-use script only.
# DO NOT EXECUTE IN THIS BATCH.
# Run only after Vultr server creation, storage attachment verification, and explicit D-drive initialization gate authorization.

$ErrorActionPreference = "Stop"

Write-Output "Checking for existing D: volume..."
$existingD = Get-Volume -DriveLetter D -ErrorAction SilentlyContinue
if ($existingD) {
    Write-Output "D: already exists."
    Get-Volume -DriveLetter D | Select-Object DriveLetter, FileSystemLabel, FileSystem, Size, SizeRemaining
    New-Item -ItemType Directory -Path "D:\Codex Folder" -Force | Out-Null
    Get-Item "D:\Codex Folder" | Select-Object FullName, Exists
    exit 0
}

Write-Output "Finding RAW data disk..."
$disk = Get-Disk | Where-Object { $_.PartitionStyle -eq "RAW" } | Sort-Object Size -Descending | Select-Object -First 1

if (-not $disk) {
    Write-Error "No RAW disk found for D: initialization. Confirm Vultr Block Storage is attached or use an approved larger persistent disk strategy."
    exit 1
}

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
