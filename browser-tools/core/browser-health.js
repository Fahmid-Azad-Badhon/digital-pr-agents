/**
 * Browser Health Checker
 * Validates browser state and connection health
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ChromeLauncher = require('./chrome-launcher');
const TabManager = require('./tab-manager');
const config = require('./browser-config');
const logger = require('../utils/logger');

class BrowserHealthChecker {
  constructor() {
    this.log = new logger('HealthCheck');
    this.port = config.get('chrome.debugPort');
    this.chromePath = null;
  }

  /**
   * Run all health checks
   */
  async checkAll() {
    const results = {
      timestamp: new Date().toISOString(),
      port: this.port,
      checks: {}
    };

    // Check 1: Chrome process
    results.checks.chromeProcess = await this.checkChromeProcess();

    // Check 2: Debug port reachable
    results.checks.debugPort = await this.checkDebugPort();

    // Check 3: DevTools endpoint
    results.checks.devToolsEndpoint = await this.checkDevToolsEndpoint();

    // Check 4: Target listing
    results.checks.targetListing = await this.checkTargetListing();

    // Check 5: Tab creation
    results.checks.tabCreation = await this.checkTabCreation();

    // Check 6: Navigation
    results.checks.navigation = await this.checkNavigation();

    // Check 7: Profile directory
    results.checks.profileDirectory = await this.checkProfileDirectory();

    // Summary
    const passed = Object.values(results.checks).filter(c => c.status === 'pass').length;
    const total = Object.keys(results.checks).length;
    
    results.summary = {
      passed,
      total,
      status: passed === total ? 'healthy' : 'degraded'
    };

    return results;
  }

  /**
   * Check if Chrome process is running
   */
  async checkChromeProcess() {
    try {
      const chromeLauncher = new ChromeLauncher();
      const chromePath = await chromeLauncher.findChrome();
      this.chromePath = chromePath;
      
      return {
        status: 'pass',
        message: `Chrome found at: ${chromePath}`,
        details: { path: chromePath }
      };
    } catch (e) {
      return {
        status: 'fail',
        message: e.message,
        details: {}
      };
    }
  }

  /**
   * Check if debug port is reachable
   */
  async checkDebugPort() {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${this.port}`, { timeout: 5000 }, (res) => {
        res.resume();
        resolve({
          status: 'pass',
          message: `Debug port ${this.port} is reachable`,
          details: { port: this.port, statusCode: res.statusCode }
        });
      });
      
      req.on('error', (e) => {
        resolve({
          status: 'fail',
          message: `Debug port ${this.port} not reachable: ${e.code}`,
          details: { port: this.port, error: e.code }
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'fail',
          message: `Debug port ${this.port} timeout`,
          details: { port: this.port }
        });
      });
    });
  }

  /**
   * Check DevTools JSON endpoint
   */
  async checkDevToolsEndpoint() {
    try {
      const data = await this.httpGet(`/json/version`);
      
      return {
        status: 'pass',
        message: `DevTools accessible: ${data.Browser}`,
        details: {
          browser: data.Browser,
          webSocket: data.webSocketDebuggerUrl
        }
      };
    } catch (e) {
      return {
        status: 'fail',
        message: `DevTools endpoint not accessible: ${e.message}`,
        details: { error: e.message }
      };
    }
  }

  /**
   * Check if targets can be listed
   */
  async checkTargetListing() {
    try {
      const targets = await this.httpGet('/json/list');
      
      const pages = targets.filter(t => t.type === 'page');
      
      return {
        status: 'pass',
        message: `Found ${pages.length} page(s), ${targets.length} total target(s)`,
        details: {
          total: targets.length,
          pages: pages.length
        }
      };
    } catch (e) {
      return {
        status: 'fail',
        message: `Failed to list targets: ${e.message}`,
        details: { error: e.message }
      };
    }
  }

  /**
   * Check if new tab can be created
   */
  async checkTabCreation() {
    try {
      const tm = new TabManager(this.port);
      await tm.initialize();
      
      const tab = await tm.createTab('about:blank');
      
      await tm.closeTab(tab.targetId);
      tm.disconnect();
      
      return {
        status: 'pass',
        message: 'Tab creation successful',
        details: { targetId: tab.targetId }
      };
    } catch (e) {
      return {
        status: 'fail',
        message: `Tab creation failed: ${e.message}`,
        details: { error: e.message }
      };
    }
  }

  /**
   * Check navigation
   */
  async checkNavigation() {
    try {
      const tm = new TabManager(this.port);
      await tm.initialize();
      
      // Create new tab and navigate
      const tab = await tm.createTab('about:blank');
      await tm.navigate('https://example.com');
      
      const html = await tm.getPageHTML();
      const hasContent = html && html.length > 100;
      
      await tm.closeTab(tab.targetId);
      tm.disconnect();
      
      return {
        status: hasContent ? 'pass' : 'fail',
        message: hasContent ? 'Navigation and content retrieval successful' : 'Navigation succeeded but no content',
        details: { contentLength: html ? html.length : 0 }
      };
    } catch (e) {
      return {
        status: 'fail',
        message: `Navigation failed: ${e.message}`,
        details: { error: e.message }
      };
    }
  }

  /**
   * Check profile directory
   */
  async checkProfileDirectory() {
    const profileDir = config.get('chrome.userDataDir');
    const exists = fs.existsSync(profileDir);
    
    if (!exists) {
      // Try to create it
      try {
        fs.mkdirSync(profileDir, { recursive: true });
        return {
          status: 'pass',
          message: `Profile directory created: ${profileDir}`,
          details: { path: profileDir, created: true }
        };
      } catch (e) {
        return {
          status: 'fail',
          message: `Cannot access profile directory: ${e.message}`,
          details: { path: profileDir }
        };
      }
    }
    
    const stats = fs.statSync(profileDir);
    
    return {
      status: 'pass',
      message: `Profile directory accessible: ${profileDir}`,
      details: {
        path: profileDir,
        size: stats.size,
        writable: this.isWritable(profileDir)
      }
    };
  }

  /**
   * Check if directory is writable
   */
  isWritable(dir) {
    try {
      const testFile = path.join(dir, '.write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * HTTP GET helper
   */
  httpGet(path) {
    const url = `http://127.0.0.1:${this.port}${path}`;
    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
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
      req.on('error', reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Print results nicely
   */
  printResults(results) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         Browser Health Check Results                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    for (const [check, result] of Object.entries(results.checks)) {
      const symbol = result.status === 'pass' ? '✓' : '✗';
      const color = result.status === 'pass' ? '\x1b[32m' : '\x1b[31m';
      
      console.log(`${color}${symbol}\x1b[0m ${this.formatCheckName(check)}`);
      console.log(`    ${result.message}\n`);
    }

    console.log('─────────────────────────────────────────────────────────────');
    const summaryColor = results.summary.status === 'healthy' ? '\x1b[32m' : '\x1b[33m';
    console.log(`${summaryColor}Status: ${results.summary.status.toUpperCase()}\x1b[0m`);
    console.log(`Checks: ${results.summary.passed}/${results.summary.total} passed`);
    console.log('─────────────────────────────────────────────────────────────\n');
  }

  formatCheckName(name) {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase());
  }
}

module.exports = BrowserHealthChecker;