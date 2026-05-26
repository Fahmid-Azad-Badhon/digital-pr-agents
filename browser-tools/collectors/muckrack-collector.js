const CDPClient = require('../core/cdp-client');
const config = require('../core/browser-config');

const WAIT_AFTER_NAVIGATION_MS = 7000;
const WAIT_BETWEEN_SCROLLS_MS = 900;
const DEFAULT_TARGET_COUNT = 500;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanQuery(query) {
  return String(query || '')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function hasBooleanOperators(query) {
  return /(?:^|\s|\()(?:"[^"]+"|\S+)?\s*\b(?:AND|OR|NOT)\b\s*(?:"[^"]+"|\S+)?/i.test(query);
}

function buildSearchUrl(baseUrl, query, page) {
  const url = new URL('/search/results', baseUrl);
  url.searchParams.set('sort', 'relevance');
  url.searchParams.set('q', cleanQuery(query));
  url.searchParams.set('result_type', 'person');
  url.searchParams.set('page', String(page || 1));
  return url.toString();
}

function normalizeProfileUrl(profileUrl) {
  try {
    const url = new URL(profileUrl);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return String(profileUrl || '').split('#')[0].split('?')[0].replace(/\/$/, '');
  }
}

function deriveOutlet(title, outlet) {
  const cleanOutlet = String(outlet || '').trim();
  if (cleanOutlet && !/^verified$/i.test(cleanOutlet)) {
    return cleanOutlet;
  }

  const titleText = String(title || '').trim();
  if (titleText.includes(',')) {
    return titleText.split(',').slice(1).join(',').trim();
  }

  return cleanOutlet === 'Verified' ? '' : cleanOutlet;
}

class MuckRackCollector {
  constructor(options = {}) {
    this.port = options.port || config.get('chrome.debugPort');
    this.baseUrl = options.baseUrl || config.get('muckrack.baseUrl');
    this.debug = Boolean(options.debug);
    this.client = null;
    this.ownedTargetId = null;
  }

  async initialize() {
    this.log('Starting CDP session');
    this.client = new CDPClient({ port: this.port });

    const target = await this.findBestTarget();
    if (target) {
      await this.client.connectToTarget(target.id);
    }

    await this.client.connect();
    const ownedTarget = await this.client.createTarget('about:blank');
    this.ownedTargetId = ownedTarget.targetId;
    await this.client.connectToTarget(this.ownedTargetId);
    await this.enablePageDomains();
    this.log(`Connected to target: ${this.client.targetId || 'default page'}`);
    return this;
  }

  async findBestTarget() {
    const targets = await this.client.listTargets();
    const pages = targets.filter(target =>
      target.type === 'page' &&
      target.webSocketDebuggerUrl &&
      !String(target.url || '').startsWith('chrome://')
    );

    return (
      pages.find(target => String(target.url || '').includes('muckrack.com')) ||
      pages.find(target => String(target.url || '') === 'about:blank') ||
      pages[0] ||
      null
    );
  }

  async enablePageDomains() {
    await this.safeCommand('Page.enable');
    await this.safeCommand('Runtime.enable');
    await this.safeCommand('DOM.enable');
  }

  async safeCommand(method, params = {}) {
    try {
      return await this.client.sendCommand(method, params);
    } catch (error) {
      this.log(`Non-fatal CDP command failure for ${method}: ${error.message}`);
      return null;
    }
  }

  async collectBeat(beat, targetCount = DEFAULT_TARGET_COUNT) {
    const query = cleanQuery(beat);
    const requestedCount = Number.isFinite(Number(targetCount)) ? Number(targetCount) : DEFAULT_TARGET_COUNT;
    const searchMode = hasBooleanOperators(query) ? 'boolean' : 'keyword';
    const allJournalists = [];
    const seen = new Set();
    let page = 1;
    let emptyPages = 0;

    this.log(`Collecting ${requestedCount} journalists for query: ${query}`);
    this.log(`Search mode: ${searchMode}`);

    while (allJournalists.length < requestedCount && page <= Math.ceil(requestedCount / 20) + 3) {
      const url = buildSearchUrl(this.baseUrl, query, page);
      this.log(`Opening page ${page}: ${url}`);

      await this.client.navigate(url);
      await sleep(WAIT_AFTER_NAVIGATION_MS);
      await this.scrollResults();

      const state = await this.inspectPageState();
      this.log(`Page state: title="${state.title}" url="${state.url}" anchors=${state.anchorCount}`);

      if (state.accessBlocked) {
        throw new Error(`Muck Rack access blocked: ${state.blockReason}`);
      }

      const journalists = await this.extractJournalistsFromPage(query);
      this.log(`Extracted ${journalists.length} candidate journalists from page ${page}`);

      let addedThisPage = 0;
      for (const journalist of journalists) {
        const key = normalizeProfileUrl(journalist.profileUrl || journalist.url);
        if (!key || seen.has(key)) {
          continue;
        }

        seen.add(key);
        allJournalists.push({
          name: journalist.name,
          profileUrl: key,
          outlet: deriveOutlet(journalist.title, journalist.outlet),
          title: journalist.title || '',
          location: journalist.location || '',
          bio: journalist.bio || '',
          beats: journalist.beats || query,
          query,
          searchMode,
          page,
          verified: Boolean(journalist.verified),
          collectedAt: new Date().toISOString()
        });
        addedThisPage += 1;

        if (allJournalists.length >= requestedCount) {
          break;
        }
      }

      this.log(`Added ${addedThisPage}; total ${allJournalists.length}/${requestedCount}`);

      if (addedThisPage === 0) {
        emptyPages += 1;
        if (emptyPages >= 2) {
          break;
        }
      } else {
        emptyPages = 0;
      }

      page += 1;
    }

    return {
      beat: query,
      query,
      searchMode,
      journalists: allJournalists.slice(0, requestedCount),
      count: allJournalists.length,
      pages: page - 1
    };
  }

  async scrollResults() {
    for (let i = 0; i < 6; i += 1) {
      await this.client.evaluate('window.scrollBy(0, Math.max(600, Math.floor(window.innerHeight * 0.8)))');
      await sleep(WAIT_BETWEEN_SCROLLS_MS);
    }
  }

  async inspectPageState() {
    const result = await this.client.evaluate(`(() => {
      const bodyText = document.body ? document.body.innerText : '';
      const lowerText = bodyText.toLowerCase();
      const title = document.title || '';
      const url = location.href;
      const blockers = [
        ['cloudflare_or_human_verification', /just a moment|verify you are human|checking your browser|cf-browser-verification/i],
        ['login_required', /log in to muck rack|sign in to muck rack|email address\\s+password/i],
        ['permission_or_subscription_required', /permission required|upgrade your plan|you do not have access/i]
      ];
      const matched = blockers.find(([, pattern]) => pattern.test(bodyText));
      return {
        title,
        url,
        anchorCount: document.querySelectorAll('a[href]').length,
        bodyLength: bodyText.length,
        accessBlocked: Boolean(matched),
        blockReason: matched ? matched[0] : '',
        hasSearchResultsText: /search results|people|journalists|results/i.test(bodyText),
        sample: bodyText.slice(0, 500)
      };
    })()`);
    return result.value || {};
  }

  async extractJournalistsFromPage(query) {
    const result = await this.client.evaluate(`(() => {
      const clean = value => String(value || '').replace(/\\s+/g, ' ').trim();
      const abs = href => {
        try { return new URL(href, location.href).toString(); } catch { return ''; }
      };
      const isBadPath = path => [
        '/search',
        '/dashboard',
        '/media-outlets',
        '/media-outlet',
        '/articles',
        '/blog',
        '/press',
        '/pricing',
        '/login',
        '/sign-in',
        '/featured-searches',
        '/medialists',
        '/outlet-lists',
        '/relationship-owners',
        '/custom-contacts',
        '/contact-lists',
        '/job-updates',
        '/inbound',
        '/coverage-reports',
        '/key-messages',
        '/daily',
        '/rankings',
        '/trending',
        '/reports',
        '/pitches',
        '/press-releases',
        '/monitoring',
        '/saved-searches',
        '/teams',
        '/sources',
        '/topics',
        '/beats',
        '/locations',
        '/users',
        '/account',
        '/settings',
        '/alerts',
        '/reports',
        '/contact',
        '/about'
      ].some(bad => path === bad || path.startsWith(bad + '/'));
      const isLikelyName = text =>
        /^[A-Z][A-Za-z'.-]+(?:\\s+[A-Z][A-Za-z'.-]+){1,4}$/.test(text) &&
        !/^(Search Results|Muck Rack|Hennessey Digital|View Profile|Read More|Journalist|Reporter|Editor)$/i.test(text);
      const isLikelyProfile = href => {
        const full = abs(href);
        if (!full) return false;
        const url = new URL(full);
        if (!/muckrack\\.com$/i.test(url.hostname) && !/\\.muckrack\\.com$/i.test(url.hostname)) return false;
        const path = url.pathname.replace(/\\/$/, '');
        if (!path || isBadPath(path)) return false;
        if (/\\.(jpg|jpeg|png|gif|webp|svg|pdf)$/i.test(path)) return false;
        if (/\\/journalists\\//i.test(path)) return true;
        return path.split('/').filter(Boolean).length === 1;
      };
      const usefulLines = text => String(text || '').split(/\\n|\\r|\\s{3,}/).map(clean).filter(Boolean);
      const pickLine = (lines, predicates) => {
        for (const predicate of predicates) {
          const found = lines.find(predicate);
          if (found) return found;
        }
        return '';
      };
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      const results = [];

      for (const anchor of anchors) {
        const href = abs(anchor.getAttribute('href'));
        const anchorText = clean(anchor.innerText || anchor.textContent || anchor.getAttribute('aria-label'));
        if (!href || !isLikelyProfile(href) || !isLikelyName(anchorText)) continue;

        let card = anchor;
        for (let depth = 0; depth < 7 && card.parentElement; depth += 1) {
          card = card.parentElement;
          const text = clean(card.innerText || card.textContent || '');
          if (text.length > 120 || /followers|articles|beats|verified|staff writer|reporter|editor|correspondent/i.test(text)) {
            break;
          }
        }

        const cardText = clean(card.innerText || card.textContent || anchorText);
        if (!/followers|reporter|editor|correspondent|journalist|writer|producer|columnist|contributor|verified|@\\w/i.test(cardText)) {
          continue;
        }
        const lines = usefulLines(card.innerText || card.textContent || '');
        const name = anchorText;
        const title = pickLine(lines, [
          line => /\\b(reporter|editor|writer|correspondent|journalist|anchor|producer|columnist|contributor|staff)\\b/i.test(line) && line !== name,
          line => / at /.test(line) && line !== name
        ]);
        const outlet = pickLine(lines, [
          line => / at /.test(line) && line !== name ? clean(line.split(/ at /i).pop()) : '',
          line => line !== name && line !== title && line.length < 80 && !/followers|articles|view profile/i.test(line)
        ]);
        const location = pickLine(lines, [
          line => /\\b[A-Z][a-z]+,\\s*[A-Z]{2}\\b/.test(line),
          line => /\\b(United States|USA|New York|California|Texas|Florida|Washington|Chicago|Boston|Philadelphia|Los Angeles|San Francisco)\\b/i.test(line)
        ]);
        const bio = lines
          .filter(line => line !== name && line !== title && line !== outlet && line !== location)
          .filter(line => line.length > 35 && !/view profile|followers/i.test(line))
          .slice(0, 2)
          .join(' ');

        results.push({
          name,
          profileUrl: href,
          outlet,
          title,
          location,
          bio,
          beats: ${JSON.stringify(query)},
          verified: /verified/i.test(cardText)
        });
      }

      const seen = new Set();
      return results.filter(result => {
        const key = result.profileUrl.replace(/[?#].*$/, '').replace(/\\/$/, '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    })()`);

    if (this.debug) {
      this.log(`Raw evaluate type: ${result.type}`);
    }
    return Array.isArray(result.value) ? result.value : [];
  }

  log(message) {
    console.log(`[MuckRack] ${message}`);
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  async dispose() {
    if (this.client && this.ownedTargetId) {
      try {
        await this.client.httpGet(`/json/close/${this.ownedTargetId}`);
      } catch (error) {
        this.log(`Non-fatal target cleanup failure: ${error.message}`);
      }
      this.ownedTargetId = null;
    }
    this.disconnect();
  }

  static async runCollection(beat, targetCount, options = {}) {
    const collector = new MuckRackCollector(options);
    try {
      await collector.initialize();
      return await collector.collectBeat(beat, targetCount);
    } finally {
      await collector.dispose();
    }
  }
}

module.exports = MuckRackCollector;
module.exports.runCollection = MuckRackCollector.runCollection;
