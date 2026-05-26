/**
 * Web Search Service
 * 
 * Provides real web search capability using Jina AI Reader API
 * Free tier with API key: 100 RPM (search), 500 RPM (reader)
 * 
 * API: https://r.jina.ai/read/<url>
 * Search: https://s.jina.ai/<query>
 * 
 * Get free API key: https://jina.ai/reader
 */

const JINA_READER_BASE = 'https://r.jina.ai/read/';
const JINA_SEARCH_BASE = 'https://s.jina.ai/';

// Get API key from environment or use default
function getJinaApiKey(): string | undefined {
  return process.env.JINA_API_KEY;
}

/**
 * Fetch web page content using Jina AI Reader
 * @param url - The URL to fetch
 * @returns Extracted text content or null if failed
 */
export async function fetchWebPage(url: string): Promise<string | null> {
  try {
    const encodedUrl = encodeURIComponent(url);
    const apiKey = getJinaApiKey();
    
    const headers: Record<string, string> = {
      'Accept': 'text/plain',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(`${JINA_READER_BASE}${encodedUrl}`, { headers });
    
    if (!response.ok) {
      console.error(`[WebSearch] Failed to fetch ${url}: ${response.status}`);
      return null;
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error(`[WebSearch] Error fetching ${url}:`, error);
    return null;
  }
}

/**
 * Generate Google search URL for a query
 * @param query - Search query
 * @returns Google search URL
 */
export function getGoogleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`;
}

/**
 * Search for relevant news articles using Jina AI Search
 * Uses s.jina.ai which searches web and fetches top 5 results automatically
 * 
 * @param keywords - Array of search keywords
 * @param maxResults - Maximum number of results (default: 5)
 * @returns Array of search result URLs
 */
export async function searchNews(keywords: string[], maxResults: number = 5): Promise<string[]> {
  const query = keywords.join(' ');
  const searchUrl = `${JINA_SEARCH_BASE}${encodeURIComponent(query)}`;
  
  console.log(`[WebSearch] Searching: ${query}`);
  
  try {
    // Use Jina AI Search - returns top 5 results with content already extracted
    const apiKey = getJinaApiKey();
    const headers: Record<string, string> = { 'Accept': 'text/plain' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    
    const response = await fetch(searchUrl, { headers });
    const searchResults = response.ok ? await response.text() : null;
    
    if (!searchResults) {
      console.log('[WebSearch] Search failed, using fallback');
      return getFallbackUrls(keywords, maxResults);
    }
    
    // Parse the search results - Jina returns markdown with URLs
    const urlMatches = searchResults.match(/https?:\/\/[^\s\n]+/gi) || [];
    const uniqueUrls = [...new Set(urlMatches)].slice(0, maxResults);
    
    console.log(`[WebSearch] Found ${uniqueUrls.length} results`);
    return uniqueUrls;
  } catch (error) {
    console.error('[WebSearch] Search error:', error);
    return getFallbackUrls(keywords, maxResults);
  }
}

function getFallbackUrls(keywords: string[], maxResults: number): string[] {
  const query = keywords.join(' ');
  // Fallback to direct news site search URLs
  return [
    `https://news.google.com/search?q=${encodeURIComponent(query)}`,
    `https://www.bing.com/news/search?q=${encodeURIComponent(query)}`,
    `https://www.apnews.com/search?q=${encodeURIComponent(query)}`,
  ].slice(0, maxResults);
}

/**
 * Fetch multiple URLs in parallel
 * @param urls - Array of URLs to fetch
 * @param maxConcurrent - Maximum concurrent requests (default: 3)
 * @returns Array of results with url and content
 */
export async function fetchMultipleUrls(urls: string[], maxConcurrent: number = 3): Promise<Array<{url: string, content: string | null}>> {
  const results: Array<{url: string, content: string | null}> = [];
  
  for (let i = 0; i < urls.length; i += maxConcurrent) {
    const batch = urls.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const content = await fetchWebPage(url);
        return { url, content };
      })
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Extract key information from fetched content
 * @param content - Raw content from web page
 * @returns Extracted key points
 */
export function extractKeyPoints(content: string): string[] {
  const points: string[] = [];
  
  // Look for key sections
  const sections = content.split(/\n\n+/).filter(s => s.trim().length > 50);
  
  for (const section of sections.slice(0, 5)) {
    const lines = section.split('\n').filter(l => l.trim().length > 20);
    if (lines.length > 0) {
      points.push(lines[0].substring(0, 200));
    }
  }
  
  return points;
}

/**
 * Research a topic with web search
 * Main entry point for research enrichment
 * Uses Jina AI Search (s.jina.ai) which fetches top 5 results automatically
 * 
 * @param topic - Main topic to research
 * @param keywords - Additional keywords
 * @returns Research findings
 */
export async function performWebResearch(topic: string, keywords: string[] = []): Promise<{
  success: boolean;
  findings: string[];
  sources: string[];
  error?: string;
}> {
  try {
    const allKeywords = [topic, ...keywords].slice(0, 5);
    const query = allKeywords.join(' ');
    
    console.log(`[WebSearch] Researching: ${query}`);
    
    // Use Jina AI Search - returns results with content already extracted!
    const searchUrl = `${JINA_SEARCH_BASE}${encodeURIComponent(query)}`;
    const apiKey = getJinaApiKey();
    const headers: Record<string, string> = { 'Accept': 'text/plain' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    
    const response = await fetch(searchUrl, { headers });
    const searchResults = response.ok ? await response.text() : null;
    
    if (!searchResults || searchResults.length < 50) {
      console.log('[WebSearch] No search results found');
      return {
        success: false,
        findings: [],
        sources: [],
        error: 'No search results'
      };
    }
    
    // Parse results - Jina returns markdown with title, content, url for each result
    const results = parseJinaSearchResults(searchResults);
    
    console.log(`[WebSearch] Found ${results.length} results with content`);
    
    // Extract key findings from each result
    const findings: string[] = [];
    const sources: string[] = [];
    
    for (const result of results.slice(0, 5)) {
      if (result.content && result.content.length > 50) {
        // Get first meaningful paragraph
        const paragraphs = result.content.split('\n').filter(p => p.trim().length > 30);
        if (paragraphs.length > 0) {
          findings.push(paragraphs[0].substring(0, 300));
        }
        sources.push(result.url);
      }
    }
    
    console.log(`[WebSearch] Extracted ${findings.length} findings`);
    
    return {
      success: findings.length > 0,
      findings: findings.slice(0, 10),
      sources: sources.slice(0, 5)
    };
  } catch (error) {
    console.error('[WebSearch] Research failed:', error);
    return {
      success: false,
      findings: [],
      sources: [],
      error: String(error)
    };
  }
}

/**
 * Parse Jina AI Search results from markdown format
 */
function parseJinaSearchResults(markdown: string): Array<{title: string; content: string; url: string}> {
  const results: Array<{title: string; content: string; url: string}> = [];
  
  // Split by "---" which separates results
  const sections = markdown.split(/^---$/m);
  
  for (const section of sections) {
    const lines = section.trim().split('\n');
    let title = '';
    let content = '';
    let url = '';
    
    for (const line of lines) {
      if (line.startsWith('## ')) {
        title = line.replace('## ', '').trim();
      } else if (line.startsWith('**URL:**')) {
        url = line.replace('**URL:**', '').trim();
      } else if (line.trim().length > 20 && !line.startsWith('**')) {
        content += line + '\n';
      }
    }
    
    if (url) {
      results.push({ title, content: content.trim(), url });
    }
  }
  
  return results;
}