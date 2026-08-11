# Vultr Sizing and Cost Worksheet — R1

Batch: `DPR-VULTR-PREPARATION-AND-WHOLE-PROJECT-LOCAL-DEBUGGING-R1`

## Purpose

This worksheet documents sizing options and the monthly cost placeholders that must be
filled in from the live Vultr console. No Vultr pricing has been queried and no resources
have been created. All cost values below are placeholders until confirmed in the Vultr
console.

## Cost Placeholders

```
WINDOWS_LICENSE_COST=<CHECK_IN_VULTR_CONSOLE>
INSTANCE_MONTHLY_COST=<CHECK_IN_VULTR_CONSOLE>
BLOCK_STORAGE_MONTHLY_COST=<CHECK_IN_VULTR_CONSOLE>
BACKUP_MONTHLY_COST=<CHECK_IN_VULTR_CONSOLE>
TOTAL_ESTIMATED_MONTHLY_COST=<CALCULATE_AFTER_CONSOLE_SELECTION>
```

## How to Fill In the Worksheet

1. Sign in to the Vultr console.
2. Open **Deploy → Compute**.
3. Select **Windows Server** as the OS.
4. Note the Windows license surcharge shown for the plan.
5. Note the base plan monthly price.
6. If attaching Block Storage, note its monthly price.
7. If enabling backups, note the backup monthly fee.
8. Add them:
   ```
   TOTAL_ESTIMATED_MONTHLY_COST =
     WINDOWS_LICENSE_COST + INSTANCE_MONTHLY_COST +
     BLOCK_STORAGE_MONTHLY_COST + BACKUP_MONTHLY_COST
   ```

## Recommended Sizing Tiers

### Conservative Target (recommended)

```
4 vCPU / 16 GB RAM / 250 GB total storage
```

Suits the Next.js dashboard, Node, Chrome automation, persistent data, and headroom.

### Lower Test Only

```
2 vCPU / 8 GB RAM / 160–250 GB total storage
```

Acceptable only for smoke/validation of individual pieces. Not recommended for sustained
browser automation with the full dashboard.

### Higher Safety

```
6–8 vCPU / 16–32 GB RAM / 300+ GB storage
```

For heavy multi-tab Chrome automation, frequent Muck Rack collection, or parallel stages.

## Notes

- Windows licensing on Vultr is billed as a monthly premium on top of the base Linux plan
  price. Verify the exact figure before deploying.
- Vultr backups are typically a small percentage of the instance cost. Confirm per-plan.
- Block Storage is billed per GB per month; confirm the rate.
- These figures are estimates pending console confirmation. Do not treat them as verified
  costs.

## Marker

```
TOTAL_ESTIMATED_MONTHLY_COST=<NOT_YET_CALCULATED — pending Vultr console review>
```
