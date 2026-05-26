/**
 * Chrome DevTools Protocol Client
 * Reusable CDP client for browser automation
 */

const http = require('http');
const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('../utils/logger');
const config = require('./browser-config');
const { retry, withTimeout } = require('../utils/retry');

class CDPClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.webSocketUrl = options.webSocketUrl;
    this.port = options.port || config.get('chrome.debugPort');
    this.timeout = options.timeout || config.get('cdp.commandTimeout');
    this.maxRetries = options.maxRetries || config.get('cdp.maxRetries');
    
    this.ws = null;
    this.messageId = 0;
    this.pending = new Map();
    this.targetId = null;
    this.connected = false;
    
    this.log = new logger('CDPClient');
  }

  /**
   * Connect to Chrome via WebSocket
   */
  async connect() {
    if (this.connected && this.ws) {
      return true;
    }

    // Get the websocket URL
    if (!this.webSocketUrl) {
      await this.connectToTarget();
    }

    return this._openWebSocket();
  }

  /**
   * Open the current websocket URL and resolve only after the socket is ready.
   */
  _openWebSocket() {
    return new Promise((resolve, reject) => {
      this.log.debug(`Connecting to: ${this.webSocketUrl}`);
      
      this.ws = new WebSocket(this.webSocketUrl);
      let settled = false;
      
      this.ws.on('open', () => {
        this.connected = true;
        this.log.info('CDP connected');
        this.emit('connected');
        settled = true;
        resolve(true);
      });
      
      this.ws.on('message', (data) => {
        this._handleMessage(JSON.parse(data));
      });
      
      this.ws.on('error', (error) => {
        this.log.error('WebSocket error:', error.message);
        this.emit('error', error);
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
      
      this.ws.on('close', () => {
        this.connected = false;
        this.log.info('CDP disconnected');
        this.emit('disconnected');
      });
    });
  }

  /**
   * Connect to a specific target (tab)
   */
  async connectToTarget(targetId = null) {
    let targets = await this.listTargets();
    
    if (!targetId) {
      // Find the first page target
      const pageTarget = targets.find(t =>
        t.type === 'page' &&
        t.webSocketDebuggerUrl &&
        !String(t.url || '').startsWith('chrome://')
      );
      if (!pageTarget) {
        throw new Error('No debuggable page target found');
      } else {
        targetId = pageTarget.id;
      }
    }
    
    // Get the websocket URL for this target
    let target = targets.find(t => t.id === targetId);
    if (!target) {
      await new Promise(resolve => setTimeout(resolve, 500));
      targets = await this.listTargets();
      target = targets.find(t => t.id === targetId);
    }

    if (target && target.webSocketDebuggerUrl) {
      const previousUrl = this.webSocketUrl;
      this.webSocketUrl = target.webSocketDebuggerUrl;
      this.targetId = targetId;
      this.log.debug(`Target URL: ${this.webSocketUrl}`);

      if (this.connected && this.ws && previousUrl !== this.webSocketUrl) {
        this.ws.close();
        this.ws = null;
        this.connected = false;
        this.pending.forEach(({ reject }) => reject(new Error('CDP target switched before command completed')));
        this.pending.clear();
        await this._openWebSocket();
      }
    } else {
      throw new Error('Target not found');
    }
  }

  /**
   * List available targets
   */
  async listTargets() {
    const data = await this.httpGet(`/json/list`);
    return data || [];
  }

  /**
   * HTTP GET to DevTools endpoint
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
   * Send CDP command
   */
  sendCommand(method, params = {}) {
    if (!this.connected) {
      throw new Error('Not connected to CDP');
    }

    return new Promise((resolve, reject) => {
      const id = ++this.messageId;
      const message = { id, method, params };
      
      this.pending.set(id, { resolve, reject });
      
      this.ws.send(JSON.stringify(message));
      
      // Set timeout
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Command ${method} timed out`));
        }
      }, this.timeout);
    });
  }

  /**
   * Handle incoming CDP messages
   */
  _handleMessage(message) {
    // Handle response
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      
      if (message.result) {
        resolve(message.result);
      } else if (message.error) {
        reject(new Error(message.error.message || 'CDP error'));
      }
      return;
    }
    
    // Handle events
    if (message.method) {
      this.emit(message.method, message.params);
    }
  }

  /**
   * Create a new target/tab
   */
  async createTarget(url) {
    return this.sendCommand('Target.createTarget', { url });
  }

  /**
   * Close a target/tab
   */
  async closeTarget(targetId) {
    return this.sendCommand('Target.closeTarget', { targetId });
  }

  /**
   * Attach to a target
   */
  async attachToTarget(targetId) {
    return this.sendCommand('Target.attachToTarget', { targetId, flatten: true });
  }

  /**
   * Navigate to URL
   */
  async navigate(url) {
    const result = await this.sendCommand('Page.navigate', { url });
    await this.waitForLoad();
    return result;
  }

  /**
   * Get page content (HTML)
   */
  async getHTML() {
    const result = await this.sendCommand('DOM.getDocument');
    const rootNodeId = result.root.nodeId;
    const html = await this.sendCommand('DOM.getOuterHTML', { nodeId: rootNodeId });
    return html.outerHTML;
  }

  /**
   * Get content via Runtime.evaluate
   */
  async evaluate(expression) {
    const result = await this.sendCommand('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.exceptionDetails) {
      const text = result.exceptionDetails.text || 'Runtime.evaluate failed';
      const description = result.exceptionDetails.exception?.description || '';
      throw new Error(`${text}${description ? ': ' + description : ''}`);
    }
    return result.result;
  }

  /**
   * Find elements by CSS selector
   */
  async querySelector(selector) {
    const result = await this.sendCommand('DOM.getDocument');
    const rootNodeId = result.root.nodeId;
    
    const queryResult = await this.sendCommand('DOM.querySelector', {
      nodeId: rootNodeId,
      selector
    });
    
    if (queryResult.nodeId === 0) {
      return null;
    }
    
    return queryResult.nodeId;
  }

  /**
   * Get element text
   */
  async getElementText(nodeId) {
    const result = await this.sendCommand('DOM.getAttributes', { nodeId });
    const textIdx = result.attributes?.indexOf('textContent');
    return textIdx >= 0 ? result.attributes[textIdx + 1] : '';
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(options = {}) {
    const result = await this.sendCommand('Page.captureScreenshot', {
      format: options.format || 'png',
      quality: options.quality || 80,
      clip: options.clip
    });
    return result.data;
  }

  /**
   * Enable network tracking
   */
  async enableNetworkTracking() {
    await this.sendCommand('Network.enable');
  }

  /**
   * Disable network tracking
   */
  async disableNetworkTracking() {
    await this.sendCommand('Network.disable');
  }

  /**
   * Get network requests
   */
  async getNetworkRequests() {
    return this.sendCommand('Network.getAllCookies');
  }

  /**
   * Set cookie
   */
  async setCookie(name, value, domain) {
    return this.sendCommand('Network.setCookie', {
      name,
      value,
      domain,
      path: '/'
    });
  }

  /**
   * Get cookies
   */
  async getCookies() {
    const result = await this.sendCommand('Network.getAllCookies');
    return result.cookies;
  }

  /**
   * Clear cookies
   */
  async clearCookies() {
    return this.sendCommand('Network.clearBrowserCookies');
  }

  /**
   * Wait for page load
   */
  async waitForLoad(timeout = 30000) {
    return new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  }

  /**
   * Wait for selector
   */
  async waitForSelector(selector, timeout = 10000) {
    return withTimeout(
      new Promise(async (resolve, reject) => {
        const checkSelector = async () => {
          try {
            const nodeId = await this.querySelector(selector);
            if (nodeId) {
              resolve(nodeId);
              return true;
            }
          } catch (e) {
            // Ignore
          }
          return false;
        };

        // Check immediately
        if (await checkSelector()) return;

        // Poll
        const startTime = Date.now();
        const poll = setInterval(async () => {
          if (await checkSelector()) {
            clearInterval(poll);
          }
          if (Date.now() - startTime > timeout) {
            clearInterval(poll);
            reject(new Error(`Selector ${selector} not found within ${timeout}ms`));
          }
        }, 500);
      }),
      timeout + 2000,
      'Selector wait timeout'
    );
  }

  /**
   * Get frame tree
   */
  async getFrameTree() {
    return this.sendCommand('Page.getFrameTree');
  }

  /**
   * Get document
   */
  async getDocument() {
    return this.sendCommand('DOM.getDocument');
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.emit('disconnected');
  }
}

module.exports = CDPClient;
