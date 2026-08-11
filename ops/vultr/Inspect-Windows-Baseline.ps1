# Inspect-Windows-Baseline.ps1

# DPR future-use read-only inspection script.
# DO NOT EXECUTE IN THIS BATCH.

$ErrorActionPreference = "SilentlyContinue"

Write-Output "=== COMPUTER INFO ==="
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, WindowsBuildLabEx, OsName, OsVersion, OsArchitecture, CsProcessorCount, CsTotalPhysicalMemory, CsModel | Format-List

Write-Output "=== VOLUMES ==="
Get-Volume | Select-Object DriveLetter, FileSystemLabel, FileSystem, Size, SizeRemaining | Format-Table -AutoSize

Write-Output "=== DISKS ==="
Get-Disk | Select-Object Number, FriendlyName, Size, PartitionStyle, OperationalStatus | Format-Table -AutoSize

Write-Output "=== FIREWALL PROFILES ==="
Get-NetFirewallProfile | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction | Format-Table -AutoSize

Write-Output "=== RDP SERVICE (TermService) ==="
Get-Service -Name TermService | Select-Object Name, DisplayName, Status, StartType | Format-Table -AutoSize

Write-Output "=== LOCAL USERS ==="
Get-LocalUser | Select-Object Name, Enabled, LastLogon, PasswordRequired, PasswordLastSet | Format-Table -AutoSize
