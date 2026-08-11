# Vultr Manual Deployment Runbook — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

A beginner-friendly click-by-click runbook for the user to create a Vultr Windows VPS.
This runbook is for the **user only**. OpenCode does not create the server.

## Prerequisites

- Vultr account with billing configured.
- The Vultr preparation package externally reviewed and accepted.
- Decision made on plan size, storage layout, and firewall model.

## Manual Steps

1. Sign in to the Vultr console: `https://my.vultr.com/`
2. Open **Deploy → Compute** (top navigation).
3. Choose a **Location/Region**. Pick a region close to you (e.g., Atlanta, Dallas, New
   York, or another available region).
4. Choose **Server Type** → **Windows** → **Windows Server** (2019 or 2022).
5. Choose a **Plan** that provides at least 4 vCPU / 16 GB RAM / 250 GB storage.
   - Note the monthly price, including the Windows license surcharge.
6. In **Server Features / Settings**:
   - Give the instance a label, e.g., `DPR-Windows-VM-Staging`.
   - Enable **Backups** or scheduled snapshots if desired.
   - Attach a **Firewall Group** that denies RDP by default (see security plan).
   - Attach **Block Storage** if that is the chosen `D:` strategy.
7. Review the **Deploy Now** summary. Confirm the total monthly price.
8. **STOP before clicking Deploy** unless the next Vultr manual deployment gate is
   authorized.
9. After deployment (in a later, authorized gate):
   - Retrieve the Administrator password from the Vultr instance page.
   - Do not paste the password anywhere.
   - Connect via RDP using the restricted access model from the security plan.

## Result Form

After the server is created, fill in and return this form:

```text
DPR VULTR WINDOWS VPS CREATION RESULT

1. Vultr instance label:
<DPR-Windows-VM-Staging or exact label>

2. Vultr region/location:
<actual location>

3. Operating system:
<Windows Server version>

4. Plan selected:
<plan name>

5. vCPU:
<number>

6. RAM:
<number>

7. Root/local storage:
<size>

8. Additional Block Storage:
<YES/NO + size>

9. Public IP:
<IP address>

10. Firewall group attached:
<YES/NO>

11. RDP rule:
<restricted to my IP / open / not checked>

12. Backups enabled:
<YES/NO>

13. Monthly estimated cost shown by Vultr:
<amount>

14. Server status:
<running / installing / stopped / unknown>

15. Administrator password retrieved:
<YES/NO, do not paste password>

16. Did you log in through RDP?
<YES/NO>

17. Any warning/error:
<NONE or exact message>
```

## Stop Rule

Do not proceed to RDP configuration, D: initialization, software installation, or any
application setup until this result form is returned and externally reviewed.
