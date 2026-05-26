/**
 * Chrome Launcher - Core browser launch and management
 * Handles Chrome startup, reuse, and lifecycle management
 */

const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');
const config = require('./browser-config');
const logger = require('../utils/logger');

class ChromeLauncher {
  constructor() {
    this.process = null;
    this.debugPort = config.get('chrome.debugPort');
    this.userDataDir = config.get('chrome.userDataDir');
    this.launchTimeout = config.get('chrome.launchTimeout');
    this.log = new logger('ChromeLauncher');
    
    // Chrome paths to try
    this.chromePaths = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files\\Google\\Chrome Beta\\Application\\chrome.exe'
    ];
  }

  /**
   * Find Chrome executable
   */
  async findChrome() {
    // Check environment variable first
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
      return process.env.CHROME_PATH;
    }

    // Try predefined paths
    for (const chromePath of this.chromePaths) {
      if (fs.existsSync(chromePath)) {
        return chromePath;
      }
    }

    // Try registry (Windows)
    try {
      const chromePath = await this.findChromeViaRegistry();
      if (chromePath) return chromePath;
    } catch (e) {
      this.log.debug('Registry search failed:', e.message);
    }

    throw new Error('Chrome not found. Please install Google Chrome.');
  }

  /**
   * Find Chrome via Windows registry
   */
  findChromeViaRegistry() {
    return new Promise((resolve) => {
      exec('reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe" /ve', 
        (error, stdout) => {
          if (error || !stdout) {
            resolve(null);
            return;
          }
          
          const match = stdout.match(/"([^"]+)"/);
          if (match && fs.existsSync(match[1])) {
            resolve(match[1]);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Check if Chrome is running with debug port
   */
  async isDebugChromeRunning() {
    try {
      const response = await this.httpGet(`http://127.0.0.1:${this.debugPort}/json/version`, 3000);
      return response !== null;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get Chrome info if running
   */
  async getChromeInfo() {
    try {
      const data = await this.httpGet(`http://127.0.0.1:${this.debugPort}/json/version`, 5000);
      if (data) {
        return {
          browser: data.Browser,
          webSocket: data.webSocketDebuggerUrl,
          protocol: data['Protocol-Version'],
          port: this.debugPort
        };
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  /**
   * HTTP GET helper
   */
  httpGet(url, timeout = 5000) {
    return new Promise((resolve) => {
      const req = http.get(url, { timeout }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      });
      
      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
    });
  }

  /**
   * Launch Chrome or reuse existing session
   */
  async launch(options = {}) {
    const forceNew = options.forceNew || false;
    
    // Check for existing debug Chrome
    if (!forceNew) {
      this.log.info('Checking for existing debug Chrome...');
      const existingInfo = await this.getChromeInfo();
      
      if (existingInfo) {
        this.log.info(`Reusing existing Chrome: ${existingInfo.browser}`);
        this.log.info(`WebSocket: ${existingInfo.webSocket}`);
        this.log.info(`Profile: ${this.userDataDir}`);
        
        return {
          reuse: true,
          ...existingInfo,
          userDataDir: this.userDataDir
        };
      }
    }

    // Ensure profile directory exists
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
      this.log.info(`Created profile directory: ${this.userDataDir}`);
    }

    // Kill any existing chrome on this port if forcing new
    if (forceNew) {
      await this.killDebugChrome();
    }

    // Find Chrome
    const chromePath = await this.findChrome();
    this.log.info(`Found Chrome: ${chromePath}`);

    // Build arguments
    const args = [
      `--remote-debugging-port=${this.debugPort}`,
      `--user-data-dir=${this.userDataDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-default-apps',
      '--disable-extensions',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-background-networking',
      '--disable-sync',
      '--metrics-recording-only',
      '--disable-metrics',
      '--ignore-certificate-errors',
      '--allow-running-insecure-content',
      '--disable-crash-reporter',
      '--disable-logging'
    ];

    if (config.get('chrome.headless')) {
      args.push('--headless=new');
      args.push('--disable-gpu');
      args.push('--window-size=1920,1080');
    }

    this.log.info('Launching Chrome...');
    this.log.debug('Port:', this.debugPort);
    this.log.debug('Profile:', this.userDataDir);

    // Launch Chrome
    this.process = spawn(chromePath, args, {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    // Handle process events
    this.process.on('error', (err) => {
      this.log.error('Process error:', err.message);
    });

    this.process.on('exit', (code) => {
      this.log.info(`Chrome process exited with code: ${code}`);
    });

    // Wait for debug endpoint
    const chromeInfo = await this.waitForDebugEndpoint(this.launchTimeout);
    
    this.log.info(`Chrome launched: ${chromeInfo.browser}`);
    this.log.info(`WebSocket: ${chromeInfo.webSocket}`);
    
    return {
      reuse: false,
      ...chromeInfo,
      userDataDir: this.userDataDir
    };
  }

  /**
   * Wait for Chrome debug endpoint to become available
   */
  async waitForDebugEndpoint(timeout) {
    const startTime = Date.now();
    const endpoint = `http://127.0.0.1:${this.debugPort}/json/version`;
    
    while (Date.now() - startTime < timeout) {
      try {
        const data = await this.httpGet(endpoint, 3000);
        if (data) {
          return {
            browser: data.Browser,
            webSocket: data.webSocketDebuggerUrl,
            protocol: data['Protocol-Version']
          };
        }
      } catch (e) {
        // Connection refused or timeout, keep waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    throw new Error(`Chrome debug endpoint not available after ${timeout}ms`);
  }

  /**
   * Kill debug Chrome on the configured port
   */
  async killDebugChrome() {
    this.log.info('Stopping existing debug Chrome...');
    
    return new Promise((resolve) => {
      // Find processes using the debug port
      exec(`netstat -ano | findstr :${this.debugPort}`, (err, stdout) => {
        if (err || !stdout) {
          this.log.info('No process found on port');
          resolve();
          return;
        }

        // Extract PIDs
        const pids = new Set();
        const lines = stdout.split('\n');
        for (const line of lines) {
          const match = line.match(/\s+(\d+)\s*$/);
          if (match) {
            pids.add(parseInt(match[1]));
          }
        }

        // Kill each process
        for (const pid of pids) {
          try {
            process.kill(pid, 'SIGKILL');
            this.log.info(`Killed process ${pid}`);
          } catch (e) {
            // Process may have already exited
          }
        }

        // Also try to kill chrome.exe on this user data dir
        exec(`taskkill /F /FI "WINDOWTITLE eq *chrome*" /T`, () => {});
        
        setTimeout(resolve, 1000);
      });
    });
  }

  /**
   * Stop Chrome gracefully
   */
  async stop() {
    if (this.process) {
      this.log.info('Stopping Chrome...');
      
      return new Promise((resolve) => {
        this.process.once('exit', () => {
          this.log.info('Chrome stopped');
          this.process = null;
          resolve();
        });
        
        // Try graceful first
        this.process.kill('SIGTERM');
        
        // Force after 3 seconds
        setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
          resolve();
        }, 3000);
      });
    }
  }

  /**
   * Check if Chrome is running
   */
  isRunning() {
    return this.process && !this.process.killed;
  }
}

module.exports = ChromeLauncher;