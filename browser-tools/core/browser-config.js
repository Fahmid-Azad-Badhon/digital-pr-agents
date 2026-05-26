/**
 * Browser Tools Configuration
 * Central configuration for all browser automation components
 */

const path = require('path');
const fs = require('fs');

// Base directory
const BASE_DIR = path.resolve(__dirname, '..');

// Default configuration
const DEFAULT_CONFIG = {
  // Chrome settings
  chrome: {
    path: null, // Auto-detect
    debugPort: 9222,
    userDataDir: path.join(BASE_DIR, 'profiles', 'default'),
    headless: false,
    launchTimeout: 15000,
    launchArgs: [
      '--remote-debugging-port=9222',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-client-side-phishing-detection',
      '--metrics-recording-only',
      '--disable-metrics',
      '--safebrowsing-disable-auto-update',
      '--ignore-certificate-errors',
      '--allow-running-insecure-content',
      '--disable-crash-reporter',
      '--disable-logging'
    ]
  },

  // CDP settings
  cdp: {
    connectTimeout: 10000,
    commandTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000
  },

  // Page settings
  page: {
    loadTimeout: 30000,
    domReadyTimeout: 5000,
    networkIdleTimeout: 2000,
    maxScrollAttempts: 3,
    scrollDelay: 500
  },

  // Muck Rack settings
  muckrack: {
    baseUrl: 'https://hennessey-digital.muckrack.com',
    searchPath: '/search/',
    pageSize: 25,
    collectionDelay: 2000,
    rateLimitDelay: 500
  },

  // Output settings
  output: {
    logsDir: path.join(BASE_DIR, 'logs'),
    screenshotsDir: path.join(BASE_DIR, 'screenshots'),
    dataDir: path.join(BASE_DIR, 'data'),
    maxLogFiles: 10,
    maxScreenshotFiles: 50
  },

  // Logging
  logging: {
    level: 'info', // debug, info, warn, error
    console: true,
    file: true,
    timestamp: true
  }
};

// Load environment variables and create config
class BrowserConfig {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromEnv();
    this.validate();
  }

  loadFromEnv() {
    // Chrome settings
    if (process.env.CHROME_PATH) {
      this.config.chrome.path = process.env.CHROME_PATH;
    }

    if (process.env.CHROME_DEBUG_PORT) {
      this.config.chrome.debugPort = parseInt(process.env.CHROME_DEBUG_PORT, 10);
    }

    if (process.env.CHROME_USER_DATA_DIR) {
      this.config.chrome.userDataDir = process.env.CHROME_USER_DATA_DIR;
    }

    if (process.env.CHROME_HEADLESS === 'true') {
      this.config.chrome.headless = true;
    }

    if (process.env.CHROME_LAUNCH_TIMEOUT_MS) {
      this.config.chrome.launchTimeout = parseInt(process.env.CHROME_LAUNCH_TIMEOUT_MS, 10);
    }

    // CDP settings
    if (process.env.CDP_CONNECT_TIMEOUT_MS) {
      this.config.cdp.connectTimeout = parseInt(process.env.CDP_CONNECT_TIMEOUT_MS, 10);
    }

    if (process.env.PAGE_LOAD_TIMEOUT_MS) {
      this.config.page.loadTimeout = parseInt(process.env.PAGE_LOAD_TIMEOUT_MS, 10);
    }

    // Muck Rack
    if (process.env.MUCKRACK_BASE_URL) {
      this.config.muckrack.baseUrl = process.env.MUCKRACK_BASE_URL;
    }

    // Logging
    if (process.env.LOG_LEVEL) {
      this.config.logging.level = process.env.LOG_LEVEL;
    }
  }

  validate() {
    // Ensure directories exist
    const dirs = [
      this.config.chrome.userDataDir,
      this.config.output.logsDir,
      this.config.output.screenshotsDir,
      this.config.output.dataDir
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Validate port range
    if (this.config.chrome.debugPort < 1024 || this.config.chrome.debugPort > 65535) {
      throw new Error('Debug port must be between 1024 and 65535');
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    for (const k of keys) {
      value = value[k];
      if (value === undefined) return undefined;
    }
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
  }

  getChromeArgs() {
    const args = [...this.config.chrome.launchArgs];
    
    // Update port
    const portIdx = args.findIndex(a => a.startsWith('--remote-debugging-port='));
    if (portIdx >= 0) {
      args[portIdx] = `--remote-debugging-port=${this.config.chrome.debugPort}`;
    }
    
    // Update user data dir
    const userDataIdx = args.findIndex(a => a.startsWith('--user-data-dir='));
    if (userDataIdx >= 0) {
      args[userDataIdx] = `--user-data-dir=${this.config.chrome.userDataDir}`;
    } else {
      args.push(`--user-data-dir=${this.config.chrome.userDataDir}`);
    }

    return args;
  }
}

// Export singleton
module.exports = new BrowserConfig();
module.exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
module.exports.BrowserConfig = BrowserConfig;