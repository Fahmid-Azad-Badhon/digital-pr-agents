# BROWSER-TOOLS.md

## 1. Overview

The **Debuggable Chrome Browser System** is a comprehensive browser automation layer designed to support Digital PR workflows, SERP research, journalist discovery, and Muck Rack data collection. This system provides a reliable, production-ready foundation for all browser-based automation tasks within the Digital PR agent workflow.

### What This System Is

- A modular Chrome launcher with session reuse capabilities
- A complete Chrome DevTools Protocol (CDP) client for browser control
- A tab manager for handling multiple browser tabs
- A health check system for validating browser state
- An integrated Muck Rack collector for journalist data extraction
- A retry and timeout system for reliable operations
- Structured logging for debugging and monitoring

### Why It Exists

The Digital PR workflow requires browser automation for:
- Muck Rack journalist profile collection
- SERP research and analysis
- Media database queries
- Page content extraction
- Screenshot capture for debugging
- Network request monitoring

This system solves the challenges of:
- Manual Chrome launching
- Fragile browser automation scripts
- Session loss and re-login requirements
- Duplicate browser instances
- Failed CDP connections
- Poor debugging visibility

---

## 2. Purpose of the Browser Tools Layer

### Digital PR Workflow Support

The browser tools layer is the foundation for:
1. **Journalist Discovery** - Collecting journalist profiles from Muck Rack based on beats/topics
2. **SERP Research** - Analyzing search engine results for coverage opportunities
3. **Media Database Research** - Querying media databases and journalist directories
4. **Content Extraction** - Extracting DOM content from various web sources
5. **Debugging** - Taking screenshots and monitoring network requests for troubleshooting

### Key Capabilities

- Fast Chrome launch with automatic reuse of existing sessions
- Reliable CDP connection with retry logic
- Persistent Chrome profile for login session preservation
- Stable tab management
- Muck Rack Collector integration
- Strong debugging support with structured logging

---

## 3. Core Goals

| Goal | Description |
|------|-------------|
| **Fast Chrome Launch** | Launch Chrome in under 5 seconds |
| **Reliable CDP Connection** | Connect to Chrome with automatic retry |
| **Session Reuse** | Reuse existing Chrome sessions when possible |
| **Stable Tab Management** | Create, find, navigate, and close tabs reliably |
| **Muck Rack Integration** | Deep integration with Muck Rack collector |
| **Strong Debugging** | Structured logging and health checks |
| **Modular Design** | Reusable components for future automation |

---

## 4. What This System Solves

| Problem | Solution |
|---------|-----------|
| Manual Chrome launching | Automatic launch with `npm run browser:start` |
| Fragile browser automation | Robust CDP client with retry and timeout |
| Session loss | Persistent Chrome profile for login reuse |
| Duplicate instances | Detection and reuse of existing debug Chrome |
| Failed connections | Retry logic with exponential backoff |
| Muck Rack interruptions | Integrated collector with session handling |
| Poor debugging | Structured logs and health checks |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Developer Commands                             │
│   npm run browser:start | stop | health | collect                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      Browser Launcher                              │
│   - Chrome discovery                                               │
│   - Process management                                             │
│   - Port allocation                                                │
│   - Session reuse                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Debuggable Chrome Instance                        │
│   - Remote debugging enabled                                       │
│   - Persistent profile (login sessions preserved)                  │
│   - DevTools WebSocket available                                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│               Chrome DevTools Protocol (CDP) Layer                 │
│   - CDP Client (WebSocket connection)                               │
│   - Tab Manager (tab discovery/creation)                          │
│   - Browser Health Checker (state validation)                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌──────────────┴──────────────┐
              ↓                                 ↓
┌─────────────────────────┐     ┌─────────────────────────────────┐
│    Tab Operations        │     │      Collector Integration       │
│   - Page navigation      │     │   - Muck Rack Collector         │
│   - DOM extraction       │     │   - Journalist profile extraction│
│   - JavaScript execution│     │   - Search result parsing       │
│   - Screenshot capture  │     │   - Data export (JSON/CSV)       │
│   - Network monitoring   │     │                                 │
└─────────────────────────┘     └─────────────────────────────────┘
```

---

## 6. Folder Structure

```
/browser-tools
├── /core
│   ├── browser-config.js      # Configuration loader
│   ├── chrome-launcher.js     # Chrome launch and management
│   ├── cdp-client.js          # CDP WebSocket client
│   ├── tab-manager.js         # Tab operations
│   └── browser-health.js      # Health checks
│
├── /collectors
│   ├── muckrack-collector.js  # Muck Rack collection
│   └── muckrack-parser.js     # Data parsing
│
├── /utils
│   ├── logger.js              # Structured logging
│   └── retry.js              # Retry and circuit breaker
│
├── /scripts
│   └── (npm commands mapped)
│
├── /logs                      # Log files
├── /screenshots              # Screenshot captures
├── /profiles                 # Chrome user profiles
├── /data                     # Collected data
│
├── index.js                   # Main entry point
├── package.json              # NPM configuration
└── BROWSER-TOOLS.md         # This documentation
```

---

## 7. File-by-File Explanation

### Core Files

**browser-config.js**
- Purpose: Central configuration for all browser automation components
- Loads: Environment variables, defaults, validation
- Exports: Config singleton with get/set methods
- Dependencies: fs, path

**chrome-launcher.js**
- Purpose: Launch Chrome with remote debugging, manage lifecycle
- Functions: findChrome(), launch(), stop(), isRunning(), killDebugChrome()
- Features: Auto-detect Chrome, port checking, session reuse
- Dependencies: http, fs, spawn, config, logger

**cdp-client.js**
- Purpose: WebSocket client for Chrome DevTools Protocol
- Functions: connect(), sendCommand(), navigate(), getHTML(), evaluate(), etc.
- Features: Command timeout, event handling, page load waiting
- Dependencies: ws, EventEmitter, config, logger

**tab-manager.js**
- Purpose: Tab discovery, creation, and management
- Functions: listTabs(), findTabByUrl(), createTab(), navigate(), executeScript()
- Features: Muck Rack tab detection, selector waiting
- Dependencies: cdp-client, config, logger

**browser-health.js**
- Purpose: Validate browser state and connection
- Functions: checkAll(), checkChromeProcess(), checkDebugPort(), etc.
- Output: JSON results with pass/fail status
- Dependencies: http, fs, ChromeLauncher, TabManager

### Collector Files

**muckrack-collector.js**
- Purpose: Collect journalist profiles from Muck Rack
- Functions: initialize(), collectBeat(), collectProfile(), saveResults()
- Features: Login detection, pagination, deduplication
- Dependencies: TabManager, logger, config

### Utility Files

**logger.js**
- Purpose: Structured logging with file rotation
- Features: Log levels (debug, info, warn, error), file output, console colors
- Output: `browser-tools-YYYY-MM-DD.log`

**retry.js**
- Purpose: Retry logic with exponential backoff
- Functions: retry(), retryable(), withTimeout(), CircuitBreaker
- Features: Custom retry conditions, timeout handling

---

## 8. Execution Flow Summary

```
1. Developer runs command (e.g., npm run browser:start)
       ↓
2. index.js parses command and calls appropriate handler
       ↓
3. ChromeLauncher.findChrome() - locates Chrome executable
       ↓
4. ChromeLauncher.launch() - checks for existing debug Chrome
       ↓
   ├─ If found → Reuse existing (return WebSocket URL)
   └─ If not → Launch new Chrome with debug port
       ↓
5. Wait for DevTools endpoint to become available
       ↓
6. CDP Client connects via WebSocket
       ↓
7. Tab Manager finds/creates required tab
       ↓
8. For Muck Rack collection:
   - Navigate to search results
   - Extract journalist cards
   - Save to JSON/CSV
       ↓
9. Disconnect or keep open for next operation
```

---

## 9. How the Debuggable Chrome Browser Works

### Launch Process

1. **Chrome Detection**: Searches predefined paths and registry for Chrome executable
2. **Profile Setup**: Creates/uses persistent Chrome profile directory
3. **Port Check**: Verifies debug port availability (default: 9222)
4. **Chrome Launch**: Spawns Chrome with remote debugging flags
5. **Endpoint Wait**: Polls DevTools JSON endpoint until available
6. **Connection**: Returns WebSocket URL for CDP client

### Chrome Launch Flags

| Flag | Purpose |
|------|----------|
| `--remote-debugging-port=9222` | Enable remote debugging |
| `--user-data-dir=...` | Persistent profile location |
| `--no-first-run` | Skip Chrome first-run |
| `--no-default-browser-check` | Skip default browser prompt |
| `--disable-extensions` | Disable extensions |
| `--disable-popup-blocking` | Allow popups |
| `--ignore-certificate-errors` | Allow self-signed certs |
| `--disable-sync` | Disable Chrome sync |

### Session Reuse

The launcher checks if Chrome is already running on the debug port before launching new Chrome. This:
- Preserves login sessions
- Speeds up subsequent operations
- Reduces resource usage
- Prevents duplicate windows

---

## 10. Why Chrome DevTools Protocol Is Used

### CDP vs Alternatives

| Approach | Pros | Cons |
|----------|------|------|
| **CDP (This system)** | Full control, tab inspection, network monitoring | Requires Chrome |
| Puppeteer/Playwright | Feature-rich, well-tested | Additional dependencies |
| Selenium | Cross-browser | Less control, heavier |
| Basic HTTP | Simple | No JavaScript execution |
| Puppeteer-like wrapper | Good abstraction | Less customizable |

### CDP Capabilities

- **Tab Management**: Create, close, attach to tabs
- **Navigation**: Navigate to URLs, wait for load
- **DOM Access**: Query selectors, get HTML, extract text
- **JavaScript**: Execute scripts in page context
- **Network**: Monitor requests, capture responses
- **Console**: Read console logs
- **Screenshots**: Capture visual state
- **Cookies**: Read/set/clear cookies
- **Storage**: Access localStorage/sessionStorage

---

## 11. Chrome Launch Flags

| Flag | Description | Required |
|------|-------------|----------|
| `--remote-debugging-port=9222` | Debug port | Yes |
| `--user-data-dir=...` | Profile directory | Yes |
| `--no-first-run` | Skip first-run | Yes |
| `--no-default-browser-check` | Skip default check | Yes |
| `--disable-default-apps` | Disable default apps | Yes |
| `--disable-extensions` | Disable extensions | Yes |
| `--disable-popup-blocking` | Allow popups | Yes |
| `--disable-translate` | Disable translate | Yes |
| `--disable-background-networking` | Reduce network | Yes |
| `--disable-sync` | Disable sync | Yes |
| `--metrics-recording-only` | Reduce metrics | Yes |
| `--ignore-certificate-errors` | Allow self-signed | Yes |
| `--disable-crash-reporter` | Reduce noise | Yes |
| `--disable-logging` | Reduce logging | Yes |
| `--headless=new` | Headless mode | Optional |
| `--window-size=1920,1080` | Window size | Optional |

---

## 12. Chrome Profile and Session Handling

### Profile Location

Default: `./browser-tools/profiles/default`

This is SEPARATE from your normal Chrome profile to:
- Preserve Muck Rack login session
- Avoid conflicts with normal browsing
- Enable automated operations

### Session Preservation

When Chrome is launched with a persistent user data directory:
- Cookies persist between launches
- Login sessions are preserved
- Local storage is maintained
- You only need to log in once

### Profile Reset

If profile becomes corrupted or locked:
```bash
npm run browser:start -- --force  # Force new browser
# Or manually delete profiles/default directory
```

---

## 13. Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| CHROME_PATH | No | auto-detect | Path to Chrome executable |
| CHROME_DEBUG_PORT | No | 9222 | Debug port |
| CHROME_USER_DATA_DIR | No | ./profiles/default | Profile directory |
| CHROME_HEADLESS | No | false | Run headless |
| CHROME_LAUNCH_TIMEOUT_MS | No | 15000 | Launch timeout (ms) |
| CDP_CONNECT_TIMEOUT_MS | No | 10000 | CDP connection timeout |
| PAGE_LOAD_TIMEOUT_MS | No | 30000 | Page load timeout |
| MUCKRACK_BASE_URL | No | https://hennessey-digital.muckrack.com | Muck Rack URL |
| LOG_LEVEL | No | info | Logging level |

---

## 14. Configuration Loading

Configuration is loaded in order:

1. **Default values** (in browser-config.js DEFAULT_CONFIG)
2. **Environment variables** (process.env)
3. **Validation** (directory creation, port range check)

Example `.env` file:
```bash
CHROME_DEBUG_PORT=9222
CHROME_USER_DATA_DIR=./browser-tools/profiles/default
LOG_LEVEL=debug
MUCKRACK_BASE_URL=https://hennessey-digital.muckrack.com
```

---

## 15. Installation Requirements

### Runtime Requirements

- **Node.js**: 14+ (tested with 18+)
- **Chrome/Chromium**: Latest stable version
- **Windows**: 10/11 (primary), macOS/Linux (compatible)

### Dependencies (package.json)

```json
{
  "dependencies": {
    "ws": "^8.0.0"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
```

### Chrome Installation Paths Checked

1. `C:\Program Files\Google\Chrome\Application\chrome.exe`
2. `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
3. `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`
4. `C:\Program Files\Google\Chrome Beta\Application\chrome.exe`

---

## 16. Setup Instructions

### Quick Start

```bash
# Install dependencies
npm install

# Start browser
npm run browser:start

# Check health
npm run browser:health

# Run Muck Rack collector
npm run muckrack:collect -- --beat "pedestrian safety" --count 100
```

### Configuration

Create `.env` file in browser-tools directory:
```bash
CHROME_DEBUG_PORT=9222
LOG_LEVEL=info
```

---

## 17. Available Commands

| Command | Description |
|---------|-------------|
| `npm run browser:start` | Start debug Chrome |
| `npm run browser:stop` | Stop debug Chrome |
| `npm run browser:restart` | Restart debug Chrome |
| `npm run browser:health` | Run health check |
| `npm run browser:test-cdp` | Test CDP connection |
| `npm run muckrack:collect` | Run Muck Rack collector |

### Command Options

**browser:start**
```bash
npm run browser:start              # Launch/reuse
npm run browser:start -- --force   # Force new browser
```

**muckrack:collect**
```bash
npm run muckrack:collect -- --beat "safety"              # Default 500
npm run muckrack:collect -- --beat "safety" --count 100 # Custom count
npm run muckrack:collect -- --beat "safety" --port 9223 # Custom port
```

---

## 18. Browser Launch Workflow

```
1. Check if debug Chrome already running on port
   └─ If yes → Return existing WebSocket URL
   └─ If no → Continue to launch
   
2. Find Chrome executable
   ├─ Check CHROME_PATH env
   ├─ Check predefined paths
   └─ Check Windows registry
   
3. Create profile directory if needed
4. Kill existing Chrome on port (if force)
5. Launch Chrome with debug flags
6. Wait for DevTools endpoint (max 15s)
7. Return connection info
```

---

## 19. Existing Browser Reuse Logic

The system checks:
1. **Port availability**: Can we connect to localhost:9222?
2. **DevTools endpoint**: Does /json/version respond?
3. **Target listing**: Can we list tabs?

If ALL pass → Reuse existing browser
If ANY fail → Launch new browser

Use `--force` flag to bypass reuse and launch fresh instance.

---

## 20. Browser Shutdown Workflow

```
1. Stop signal received (Ctrl+C or command)
2. Send SIGTERM to Chrome process
3. Wait 3 seconds for graceful exit
4. If still running → SIGKILL
5. Clean up WebSocket connection
6. Log shutdown complete
```

**Important**: This stops ONLY the debug Chrome, not your normal Chrome.

---

## 21. Chrome DevTools Protocol Connection Workflow

```
1. Get WebSocket URL from /json/version endpoint
2. Create WebSocket connection
3. Wait for 'open' event
4. Send commands with unique ID
5. Listen for responses (match by ID)
6. Listen for events (Page.loadEventFired, etc.)
7. Handle disconnection/reconnection
```

---

## 22. CDP Client Responsibilities

The CDP client handles:

- **Connection Management**: WebSocket connect/disconnect
- **Command Sending**: Send CDP commands with parameters
- **Response Handling**: Parse responses, resolve/reject promises
- **Event Listening**: Forward browser events to subscribers
- **Timeout Management**: Auto-reject after timeout
- **Error Handling**: Convert CDP errors to JavaScript errors

### Reusable Actions

```javascript
cdp.navigate(url)           // Navigate to URL
cdp.getHTML()               // Get page HTML
cdp.evaluate(script)        // Execute JavaScript
cdp.querySelector(sel)       // Find element
cdp.waitForSelector(sel)    // Wait for element
cdp.takeScreenshot()        // Capture screenshot
cdp.getCookies()            // Get cookies
cdp.setCookie(name, val)    // Set cookie
```

---

## 23. Tab Discovery and Attachment Logic

```javascript
// List all tabs
const tabs = await tabManager.listTabs();

// Find Muck Rack tab
const muckRackTab = await tabManager.findMuckRackTab();

// Create new tab
const newTab = await tabManager.createTab('https://muckrack.com');

// Attach to specific tab
await tabManager.navigate(tab.url);
```

### Tab Selection Priority

1. **URL pattern match**: Find tab by URL contains 'muckrack.com'
2. **Title match**: Find tab by title
3. **First available**: Use first available page tab
4. **Create new**: Create new tab if none found

---

## 24. Page Navigation Workflow

```javascript
await tabManager.navigate('https://muckrack.com/search?q=safety');
await tabManager.waitForLoad();           // Wait for load event
await tabManager.waitForSelector('.results'); // Wait for elements
```

### Navigation Flow

1. Send `Page.navigate` command with URL
2. Wait for `Page.loadEventFired` event
3. Optionally wait for network idle
4. Optionally wait for specific selector
5. Return control to caller

---

## 25. Selector Waiting Strategy

```javascript
// Wait up to 10 seconds for selector
await tabManager.waitForSelector('.journalist-card', 10000);

// Polling interval: 500ms
// Max attempts: 20 (10s / 500ms)
```

If selector not found:
- Throw error with timeout message
- Caller can catch and retry

---

## 26. DOM Extraction Workflow

### Get Full HTML
```javascript
const html = await tabManager.getPageHTML();
```

### Execute Custom Script
```javascript
const names = await tabManager.executeScript(`
  Array.from(document.querySelectorAll('.name'))
    .map(el => el.innerText)
`);
```

### Extract Specific Elements
```javascript
const card = await tabManager.querySelector('.journalist-card');
const text = await tabManager.getElementText(card);
```

---

## 27. Runtime JavaScript Evaluation

```javascript
// Simple expression
const title = await cdp.evaluate('document.title');

// Complex extraction
const data = await cdp.evaluate(`
  (function() {
    return {
      name: document.querySelector('h1').innerText,
      articles: Array.from(document.querySelectorAll('.article a'))
        .slice(0,5)
        .map(a => a.href)
    };
  })()
`);

// Handle errors
try {
  await cdp.evaluate('nonexistentFunction()');
} catch (e) {
  console.log('Script error:', e.message);
}
```

---

## 28. Network Monitoring Workflow

```javascript
// Enable network tracking
await cdp.enableNetworkTracking();

// Wait for navigation
await cdp.navigate(url);

// Get all cookies (includes network state)
const cookies = await cdp.getCookies();

// Disable when done
await cdp.disableNetworkMonitoring();
```

### What Gets Monitored

- Page loads
- AJAX requests
- API calls
- Resource loads (images, scripts, etc.)
- Failed requests (4xx, 5xx)

---

## 29. Console Log Capture

```javascript
// Listen to console events
cdp.on('Runtime.consoleAPICalled', (params) => {
  console.log('Console:', params.type, params.args);
});

cdp.on('Runtime.exceptionThrown', (params) => {
  console.log('Error:', params.exceptionDetails);
});
```

---

## 30. Screenshot and Debugging Workflow

```javascript
// Take screenshot (returns base64)
const screenshot = await cdp.takeScreenshot();

// Save to file
const fs = require('fs');
fs.writeFileSync('screenshot.png', 
  Buffer.from(screenshot, 'base64')
);

// Clip specific area
const clipped = await cdp.takeScreenshot({
  clip: { x: 0, y: 0, width: 800, height: 600 }
});
```

### Screenshot Storage

Default: `./browser-tools/screenshots/`

Format: `screenshot-YYYYMMDD-HHmmss.png`

---

## 31. Muck Rack Collector Integration

### Collection Flow

```javascript
const collector = new MuckRackCollector({ port: 9222 });

// Initialize (connects to browser)
await collector.initialize();

// Check login state
if (!collector.isLoggedIn) {
  console.log('Please log into Muck Rack manually');
}

// Navigate to search results
await collector.navigateToSearch('transportation safety', 1);

// Extract journalists
const journalists = await collector.extractJournalistsFromPage();

// Save results
await collector.saveResults(results, outputDir);
```

### Collection Output

```json
{
  "beat": "transportation safety",
  "count": 150,
  "journalists": [
    {
      "name": "John Smith",
      "outlet": "The Times",
      "profileUrl": "https://muckrack.com/john-smith",
      "beats": ["transportation", "safety"],
      "followers": "5000",
      "verified": true
    }
  ],
  "pages": 3
}
```

---

## 32. Muck Rack Session Handling

### Login State Detection

```javascript
// Check for logged-in indicators
const loginIndicators = [
  'data-test="user-menu"',
  'class="mr-user-menu"',
  'user-avatar'
];

const isLoggedIn = loginIndicators.some(
  indicator => html.includes(indicator)
);
```

### Session Preservation

- Profile stored in `./browser-tools/profiles/default`
- Cookies persist between launches
- Login required only once
- Manual login in browser required

### Login Required Scenario

If Muck Rack requires login:
1. Launch browser: `npm run browser:start`
2. Open Chrome to muckrack.com manually
3. Log in
4. Keep browser open
5. Run collector (uses existing session)

---

## 33. Muck Rack Page Types Supported

| Page Type | URL Pattern | Data Extracted |
|-----------|-------------|----------------|
| Search Results | `/search/results?q=...` | Journalist cards |
| Journalist Profile | `/person/[name]` | Bio, beats, articles |
| Outlet Page | `/outlet/[name]` | Contact info |
| Article Page | `/article/[name]` | Metadata |

---

## 34. Muck Rack Data Extraction Fields

| Field | Description | Example |
|-------|-------------|---------|
| name | Journalist name | "John Smith" |
| outlet | Publication | "The New York Times" |
| profileUrl | Muck Rack URL | "https://muckrack.com/john-smith" |
| beats | Topic areas | ["transportation", "safety"] |
| followers | Follower count | "5.2K" |
| verified | Verification status | true/false |
| location | Geographic location | "New York, NY" |

---

## 35. Muck Rack Collector Output Format

### JSON Output
Filename: `{beat}-{timestamp}.json`

```json
{
  "beat": "safety",
  "count": 100,
  "journalists": [...],
  "pages": 4,
  "collectedAt": "2026-05-06T10:30:00Z"
}
```

### CSV Output
Filename: `{beat}-{timestamp}.csv`

```csv
name,outlet,profileUrl,beats,followers
John Smith,The Times,https://...,transportation;safety,5000
```

---

## 36. Data Validation and Cleaning

| Validation | Action |
|------------|--------|
| Empty name | Skip row |
| Duplicate URL | Deduplicate |
| Invalid URL | Flag as invalid |
| Missing beats | Set to empty array |
| Null values | Replace with empty string |

---

## 37. Rate Limiting and Responsible Usage

### Best Practices

- **Delay between pages**: 2000ms (configurable)
- **Delay between requests**: 500ms (configurable)
- **Max per session**: 500 journalists
- **Reuse sessions**: Don't re-login unnecessarily

### What to Avoid

- Aggressive scraping (too fast)
- Repeated identical queries
- Loading too many pages
- Creating too many tabs

---

## 38. Logging System

### Log Levels

- **debug**: Detailed diagnostics
- **info**: Normal operations
- **warn**: Issues that don't stop execution
- **error**: Failures

### Log Output

```javascript
// Programmatic
log.debug('Debug info');
log.info('Operation status');
log.warn('Warning message');
log.error('Error:', error);

// Structured
log.logOperation('Launch', 'success', 'Chrome ready');
log.logData('Collected', 150);
log.logError('Navigation', error);
```

### Log Files

Location: `./browser-tools/logs/`
Format: `browser-tools-YYYY-MM-DD.log`
Rotation: Keep last 10 files

---

## 39. Error Handling Strategy

| Error Type | Handling |
|------------|-----------|
| Chrome not found | Throw clear error with install instructions |
| Port in use | Try next port 9223-9229 or warn |
| CDP connection fail | Retry 3 times with backoff |
| Tab not found | Create new tab |
| Navigation timeout | Retry once, then fail |
| Selector not found | Throw with timeout details |
| Extraction error | Skip problematic rows |

---

## 40. Retry and Timeout Strategy

### Retry Configuration

```javascript
{
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
}
```

### Timeout Configuration

| Operation | Default |
|-----------|---------|
| Chrome launch | 15,000ms |
| CDP connection | 10,000ms |
| Page load | 30,000ms |
| Selector wait | 10,000ms |
| Command execute | 5,000ms |

---

## 41. Browser Health Checks

### Health Check List

| Check | Description |
|-------|-------------|
| chromeProcess | Chrome executable found |
| debugPort | Port reachable |
| devToolsEndpoint | JSON endpoint responds |
| targetListing | Can list tabs |
| tabCreation | Can create new tab |
| navigation | Can navigate to URL |
| profileDirectory | Profile dir accessible |

### Run Health Check

```bash
npm run browser:health
```

### Output

```
✓ Chrome process running
✓ Debug port reachable
✓ DevTools endpoint reachable
✓ CDP connection successful
✓ Test tab created
✓ Navigation test passed

Status: HEALTHY
Checks: 6/6 passed
```

---

## 42. Common Failure Scenarios and Fixes

### Chrome does not launch

```
Error: Chrome not found
```

**Fix**: Install Google Chrome at one of:
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Or set CHROME_PATH environment variable

### Debugging port is blocked

```
Error: Port 9222 already in use
```

**Fix**: 
```bash
# Find what's using the port
netstat -ano | findstr 9222

# Kill the process or use different port
set CHROME_DEBUG_PORT=9223
npm run browser:start
```

### Browser opens but CDP does not connect

```
Error: Connection timeout
```

**Fix**:
```bash
# Force restart
npm run browser:start -- --force
```

### Muck Rack tab is not detected

```
Warning: No Muck Rack tab found
```

**Fix**:
1. Open muckrack.com in the debug browser
2. Log in if needed
3. Keep the tab open

### User profile is locked

```
Error: Cannot lock profile directory
```

**Fix**:
```bash
# Close all Chrome instances
taskkill /F /IM chrome.exe

# Or force new browser
npm run browser:start -- --force
```

### Page loads slowly

```
Error: Navigation timeout
```

**Fix**: Increase timeout in config:
```bash
set PAGE_LOAD_TIMEOUT_MS=60000
```

### DOM extraction returns empty

**Fix**:
1. Take screenshot to see actual page state
2. Wait for specific selector before extracting
3. Check if page requires scroll to load

### Collector loses connection

**Fix**:
1. Keep browser open during collection
2. Check network connectivity
3. Increase delays in config

---

## 43. Developer Workflow

### Typical Development Session

```bash
# 1. Start browser (reuses if running)
npm run browser:start

# 2. Verify health
npm run browser:health

# 3. Open Muck Rack manually if needed
# (Browser window should be visible)

# 4. Run collector
npm run muckrack:collect -- --beat "safety" --count 50

# 5. Review results in ./browser-tools/data/

# 6. Check logs if issues
# ./browser-tools/logs/

# 7. Stop when done
npm run browser:stop
```

### Debugging Issues

```bash
# Check Chrome running
npm run browser:test-cdp

# Take screenshot manually
# (Requires code: await cdp.takeScreenshot())

# Review logs
type .\browser-tools\logs\browser-tools-2026-05-06.log
```

---

## 44. Security Notes

### What to Protect

- **Browser profile**: Contains cookies/sessions
- **Login credentials**: Log in manually, don't embed
- **API keys**: Never put in code or config files
- **Output data**: Review before sharing

### Git Ignore

Add to `.gitignore`:
```
browser-tools/logs/
browser-tools/screenshots/
browser-tools/data/
browser-tools/profiles/
.env
```

---

## 45. Compliance and Platform Respect

- **Terms of Service**: Don't bypass access controls
- **Rate Limits**: Use delays between requests
- **Authentication**: Only use your own logged-in session
- **Data Usage**: Only collect what's needed for PR campaigns

---

## 46. Version History

| Version | Date | Change | Author |
|---------|------|--------|--------|
| v1.0 | 2026-05-06 | Initial browser tools documentation | OpenCode |

---

## 47. Known Limitations

- Requires Chrome/Chromium (no Firefox/Safari)
- Debug port access required (not available on some corporate networks)
- Muck Rack layout changes may require selector updates
- Logged-out sessions require manual login
- Headless mode may behave differently from visible mode

---

## 48. Future Improvements

### Planned Features

- [ ] Multi-tab orchestration for parallel collection
- [ ] Queue-based collection with job system
- [ ] Proxy support for IP rotation
- [ ] Screenshot diffing for layout change detection
- [ ] Session snapshots for state preservation
- [ ] Selector auto-healing when layout changes
- [ ] Headless CI support
- [ ] Browser pool manager for high-volume operations
- [ ] Rate-limit controller
- [ ] Integration with journalist scoring system
- [ ] SERP collector for search result tracking
- [ ] AI-assisted page content summarization

---

## 49. Quick Start

```bash
# Install
cd browser-tools
npm install

# Start browser
npm run browser:start

# Check health
npm run browser:health

# Collect journalists
npm run muckrack:collect -- --beat "pedestrian safety" --count 100

# View results
dir browser-tools\data

# Stop browser
npm run browser:stop
```

---

## 50. Glossary

| Term | Definition |
|------|-------------|
| CDP | Chrome DevTools Protocol - Chrome's remote debugging API |
| DevTools | Chrome's developer tools (accessible at localhost:9222) |
| Debug port | Port where Chrome exposes remote debugging (default: 9222) |
| User data directory | Chrome profile folder containing cookies/sessions |
| Tab target | Individual page/tab that can be attached to |
| WebSocket | Real-time connection protocol for CDP |
| Selector | CSS selector for finding DOM elements |
| DOM | Document Object Model - page structure |
| Headless | Running Chrome without visible UI |

---

## 51. Appendix

### Example: Manual CDP Connection

```javascript
const CDPClient = require('./browser-tools/core/cdp-client');

const cdp = new CDPClient({ port: 9222 });

await cdp.connect();

// Navigate
await cdp.navigate('https://example.com');

// Get title
const title = await cdp.evaluate('document.title');

// Close
cdp.disconnect();
```

### Example: Extract Specific Data

```javascript
const script = `
  (function() {
    return Array.from(document.querySelectorAll('.journalist'))
      .map(card => ({
        name: card.querySelector('.name').innerText,
        outlet: card.querySelector('.outlet').innerText,
        beats: Array.from(card.querySelectorAll('.beat'))
          .map(b => b.innerText)
      }));
  })()
`;

const data = await cdp.evaluate(script);
console.log(data);
```

### Configuration File Location

```
browser-tools/
├── core/
│   └── browser-config.js    # Default config
├── .env                     # Your overrides
└── profiles/
    └── default/             # Chrome profile
```

---

**End of BROWSER-TOOLS.md**