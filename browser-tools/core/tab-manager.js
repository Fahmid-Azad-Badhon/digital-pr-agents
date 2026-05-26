/**
 * Tab Manager - Tab discovery, creation, and management
 */

const CDPClient = require('./cdp-client');
const logger = require('../utils/logger');
const config = require('./browser-config');

class TabManager {
  constructor(port) {
    this.port = port || config.get('chrome.debugPort');
    this.log = new logger('TabManager');
    this.client = null;
    this.activeTabId = null;
  }

  /**
   * Initialize connection to Chrome
   */
  async initialize(wsUrl = null) {
    this.client = new CDPClient({
      port: this.port,
      webSocketUrl: wsUrl
    });
    
    await this.client.connect();
    return this.client;
  }

  /**
   * List all available tabs
   */
  async listTabs() {
    const targets = await this.client.listTargets();
    return targets.filter(t => t.type === 'page').map(t => ({
      id: t.id,
      url: t.url,
      title: t.title,
      type: t.type
    }));
  }

  /**
   * Find tab by URL pattern
   */
  async findTabByUrl(pattern) {
    const tabs = await this.listTabs();
    
    if (typeof pattern === 'string') {
      return tabs.find(t => t.url.includes(pattern) || t.title.includes(pattern));
    }
    
    if (pattern instanceof RegExp) {
      return tabs.find(t => pattern.test(t.url) || pattern.test(t.title));
    }
    
    if (typeof pattern === 'function') {
      return tabs.find(pattern);
    }
    
    return tabs[0];
  }

  /**
   * Find Muck Rack tab
   */
  async findMuckRackTab() {
    return this.findTabByUrl(url => 
      url.includes('muckrack.com') || url.includes('muck rack')
    );
  }

  /**
   * Create new tab
   */
  async createTab(url = 'about:blank') {
    this.log.info(`Creating new tab: ${url}`);
    
    const result = await this.client.createTarget(url);
    const targetId = result.targetId;
    
    // Wait for the new tab to be available
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reconnect to the new tab
    await this.client.connectToTarget(targetId);
    
    this.activeTabId = targetId;
    
    return {
      targetId,
      url
    };
  }

  /**
   * Navigate existing tab
   */
  async navigate(url) {
    if (!this.client || !this.client.connected) {
      throw new Error('Not connected to browser');
    }
    
    this.log.info(`Navigating to: ${url}`);
    const result = await this.client.navigate(url);
    await this.client.waitForLoad();
    
    return result;
  }

  /**
   * Get current page HTML
   */
  async getPageHTML() {
    if (!this.client || !this.client.connected) {
      throw new Error('Not connected to browser');
    }
    
    return await this.client.getHTML();
  }

  /**
   * Execute JavaScript in page context
   */
  async executeScript(script) {
    if (!this.client || !this.client.connected) {
      throw new Error('Not connected to browser');
    }
    
    return await this.client.evaluate(script);
  }

  /**
   * Find elements by selector
   */
  async querySelector(selector) {
    return await this.client.querySelector(selector);
  }

  /**
   * Wait for selector
   */
  async waitForSelector(selector, timeout) {
    return await this.client.waitForSelector(selector, timeout);
  }

  /**
   * Take screenshot
   */
  async takeScreenshot(options = {}) {
    return await this.client.takeScreenshot(options);
  }

  /**
   * Get cookies
   */
  async getCookies() {
    return await this.client.getCookies();
  }

  /**
   * Set cookie
   */
  async setCookie(name, value, domain) {
    return await this.client.setCookie(name, value, domain);
  }

  /**
   * Close tab
   */
  async closeTab(targetId) {
    if (!targetId) {
      targetId = this.activeTabId;
    }
    
    if (targetId) {
      await this.client.closeTarget(targetId);
      this.activeTabId = null;
    }
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}

module.exports = TabManager;