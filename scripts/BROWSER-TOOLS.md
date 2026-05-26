# Browser Tools - Digital PR Workflow

## Overview

This directory contains Chrome debug browser tools for the Digital PR workflow, including Muck Rack collection, SERP research, and journalist targeting.

## Scripts

### 1. launch-debug-chrome.ps1 / .cmd

**Purpose:** Launch Chrome with remote debugging enabled

**Actions:**
| Action | Description |
|--------|-------------|
| `launch` | Start debug Chrome (default) |
| `verify` | Verify debug endpoint is accessible |
| `stop` | Stop debug Chrome |
| `status` | Check Chrome status |
| `restart` | Restart debug Chrome |
| `clean` | Clear profile data |

**Options:**
```
-port N        Debug port (default: 9222)
-profile P     Custom profile directory
-headless     Run in headless mode
-force        Force restart if running
```

**Examples:**
```powershell
# Launch with defaults
.\launch-debug-chrome.ps1 -Action Launch

# Verify it's running
.\launch-debug-chrome.cmd verify

# Stop Chrome
.\launch-debug-chrome.cmd stop

# Run on custom port
.\launch-debug-chrome.cmd launch -port 9223
```

---

### 2. chrome-cdp-client.ps1 / .cmd

**Purpose:** Chrome DevTools Protocol client for browser automation

**Actions:**
| Action | Description |
|--------|-------------|
| `navigate` | Navigate to URL |
| `gethtml` | Get page HTML |
| `getelements` | Find elements by CSS selector |
| `screenshot` | Take screenshot |
| `getcookies` | Get browser cookies |
| `execscript` | Execute JavaScript |
| `network` | Get network logs |
| `metrics` | Get performance metrics |

**Options:**
```
-url "URL"       Target URL (for navigate)
-selector "SEL"  CSS selector (for getelements)
-script "JS"     JavaScript code (for execscript)
-port N          Debug port (default: 9222)
-output "PATH"   Output file (for screenshot)
```

**Examples:**
```powershell
# Navigate to URL
.\chrome-cdp-client.ps1 -Action Navigate -Url "https://muckrack.com"

# Get page HTML
.\chrome-cdp-client.cmd gethtml

# Find elements
.\chrome-cdp-client.cmd getelements -selector ".mr-person-card"

# Take screenshot
.\chrome-cdp-client.cmd screenshot -output "page.png"

# Execute JavaScript
.\chrome-cdp-client.cmd execscript -script "document.title"
```

---

### 3. collect-muckrack-journalists.ps1 / .cmd

**Purpose:** Collect journalist profiles from Muck Rack

**Options:**
```
-beat "QUERY"       Search beat/keyword (required)
-count N            Target count (default: 500)
-output "PATH"      Output directory
-port N             Chrome debug port (default: 9222)
-job "SLUG"         Job/campaign identifier
```

**Examples:**
```powershell
# Collect 100 pedestrian safety journalists
.\collect-muckrack-journalists.ps1 -Beat "pedestrian safety" -Count 100

# Collect with custom output
.\collect-muckrack-journalists.cmd -beat "transportation" -count 500 -output "D:\output"

# With job identifier
.\collect-muckrack-journalists.ps1 -Beat "road safety" -Job "my-campaign"
```

---

## Workflow Integration

### Starting a Collection Session

```powershell
# 1. Launch debug Chrome
.\launch-debug-chrome.cmd launch

# 2. Manually log into Muck Rack in the browser window

# 3. Verify connection
.\launch-debug-chrome.cmd verify

# 4. Collect journalists
.\collect-muckrack-journalists.cmd -beat "transportation safety" -count 200

# 5. Stop Chrome when done
.\launch-debug-chrome.cmd stop
```

### Automated Collection (No Manual Login)

```powershell
# For automated scenarios, you would need to:
# 1. Pre-configure Chrome profile with login cookies
# 2. Use CDP to set cookies before collection
# 3. Then run collection

# Set Muck Rack session cookie
.\chrome-cdp-client.cmd getcookies

# Then proceed with collection
```

---

## Configuration

### Chrome Profile

Default profile directory: `D:\Codex Folder\chrome-debug-profile`

The profile persists between sessions, so you only need to log into Muck Rack once.

### Debug Port

Default port: `9222`

If port is in use, the script will try ports 9222-9229 automatically.

---

## Troubleshooting

### Chrome Not Found

```
Error: Chrome installation not found
```

**Solution:** Install Google Chrome at one of these locations:
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
- Or update ChromePaths in the script

### Debug Endpoint Not Reachable

```
Chrome started, but the debug endpoint is not reachable
```

**Solution:**
1. Close all Chrome instances
2. Run: `.\launch-debug-chrome.cmd restart -force`

### Muck Rack Requires Login

```
Browser verification detected before search interaction
```

**Solution:**
1. Launch Chrome: `.\launch-debug-chrome.cmd launch`
2. Manually navigate to muckrack.com
3. Log in with credentials
4. Keep the browser open during collection

---

## Technical Details

### Chrome Flags Used

```
--remote-debugging-port=9222
--user-data-dir=<profile>
--no-first-run
--no-default-browser-check
--disable-default-apps
--disable-extensions
--disable-popup-blocking
--disable-translate
--disable-background-networking
--disable-sync
--ignore-certificate-errors
--allow-running-insecure-content
```

### CDP Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `/json/version` | Get browser version |
| `/json/list` | List open tabs |
| `/json/navigate` | Navigate to URL |
| `/json/source` | Get page HTML |
| `/json/evaluate` | Execute JavaScript |
| `/json/cookies` | Manage cookies |
| `/json/screenshot` | Take screenshot |

---

## File Structure

```
scripts/
├── launch-debug-chrome.ps1       # Main launcher (PowerShell)
├── launch-debug-chrome.cmd       # Main launcher (CMD wrapper)
├── chrome-cdp-client.ps1         # CDP client (PowerShell)
├── chrome-cdp-client.cmd         # CDP client (CMD wrapper)
├── collect-muckrack-journalists.ps1  # Muck Rack collector
├── collect-muckrack-journalists.cmd  # Collector CMD wrapper
└── BROWSER-TOOLS.md              # This documentation
```

---

## Requirements

- Windows PowerShell 5.1+
- Google Chrome installed
- Chrome debug port accessible (9222-9229)
- For Muck Rack: Logged-in session in Chrome profile

---

**Version:** 2.0
**Last Updated:** 2026-05-06