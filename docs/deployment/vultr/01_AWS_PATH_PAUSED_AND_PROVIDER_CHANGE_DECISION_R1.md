# AWS Path Paused and Provider Change Decision — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Decision Record

The AWS EC2 deployment path for the DPR Debugging / Digital PR Agents project is **paused**
and the provider target has changed to a **Vultr Windows VPS**.

## AWS Path State

```
AWS_PATH=PAUSED
AWS_STACK_DEPLOYED=NO
AWS_RESOURCES_CREATED=NO
EC2_CREATED=NO
SSM_VERIFIED=NO
D_DRIVE_INITIALIZED=NO
APP_DEPLOYED=NO
OPENCODE_ACTION=STAND_DOWN_FROM_AWS
```

## What Happened on the AWS Path

- A repaired CloudFormation template was created and locally parsed for a Windows Server 2022
  EC2 instance (region us-east-1, t3.xlarge, 50 GB encrypted root, 200 GB encrypted data
  volume, SSM-first access, zero inbound rules, conditional Elastic IP).
- The template was locally verified and classified `READY_FOR_USER_MANUAL_AWS_DEPLOYMENT`.
- The user was provided a manual AWS Console deployment runbook and a 1–15 result form.
- **No AWS stack was ever created.** No EC2 instance was launched. No AWS resources were
  created. The AWS path was manually paused by the user before deployment.

## Reason for Pausing AWS

- The AWS Windows EC2 route is cost- and complexity-heavy for a local-first project.
- The project's runtime depends on persistent local Windows files, a `D:\Codex Folder`
  layout, parent-directory access, `.cmd`/`.ps1` scripts, and Chrome/browser automation,
  which is not a natural fit for AWS-managed EC2 workflows.
- Vultr Windows VPS offers a simpler, predictable monthly-cost Windows Server VM with
  persistent block storage, which matches the project's Windows-native runtime model.

## Reason Vultr Was Selected

- Windows Server on a VPS preserves the exact Windows-native runtime assumptions.
- Persistent local storage on a dedicated data disk can map to `D:\`.
- Restricted RDP and optional Tailscale provide a pragmatic access model.
- Predictable flat monthly cost simplifies budgeting.
- Manual, user-owned deployment keeps the process auditable.

## OpenCode Constraints

- OpenCode must not use AWS under any circumstances in this batch.
- OpenCode must not create a Vultr account, call the Vultr API, create a server, or create
  billing resources.
- The CloudFormation template remains **unused and stored locally**:
  `%TEMP%\dpr-windows-vm-baseline-repaired.yaml`. It is preserved but not part of the Vultr
  path.

## New Provider Target

```
PROVIDER_TARGET=VULTR_WINDOWS_VPS
```

## Marker

```
AWS_PATH=PAUSED
STACK_DEPLOYED=NO
PROVIDER_TARGET=VULTR_WINDOWS_VPS
```
