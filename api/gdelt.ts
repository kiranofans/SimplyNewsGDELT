import { GDELTQueryParams, NewsResponse, ErrorCode } from '../types';

const BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const CACHE_EXPIRY = 5 * 60 * 1000;

// Array of proxy generators to rotate through
const PROXIES = [
  // CorsProxy.io is generally reliable and fast
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  // AllOrigins is a good backup
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
];

let lastRequestTime = 0;
const MIN_REQUEST_GAP = 2000; // 2 seconds gap to avoid rate limits

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCacheKey = (params: GDELTQueryParams) => {
  const country = params.country || 'GLOBAL';
  const query = params.query || 'world';
  const lang = params.language || 'all';
  return `gdelt_cache_${country.toUpperCase()}_${query.toLowerCase().replace(/\s+/g, '_')}_${lang}`;
};

async function fetchWithFailover(targetUrl: string, attempt = 0): Promise<any> {
  if (attempt >= PROXIES.length) {
    throw { code: ErrorCode.NETWORK_ERROR, message: 'Unable to connect to news network.' };
  }

  const buildProxyUrl = PROXIES[attempt];
  const proxiedUrl = buildProxyUrl(targetUrl);

  try {
    const response = await fetch(proxiedUrl);

    if (!response.ok) {
      // If we hit a hard rate limit (429), stopping might be better than retrying immediately,
      // but rotating proxies might bypass IP blocks.
      console.warn(`Proxy ${attempt} failed with status ${response.status}`);
      return await fetchWithFailover(targetUrl, attempt + 1);
    }

    const text = await response.text();

    // Check for GDELT specific text-based errors that return 200 OK
    if (text.includes('Please limit your queries') || text.includes('concurrent queries')) {
       throw { code: ErrorCode.RATE_LIMITED, message: 'Global news feed busy. Please wait a moment.' };
    }

    // Try parsing JSON
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn(`Proxy ${attempt} returned invalid JSON`);
      // Invalid JSON often means an HTML error page or proxy error page
      return await fetchWithFailover(targetUrl, attempt + 1);
    }

  } catch (error: any) {
    if (error.code === ErrorCode.RATE_LIMITED) throw error;
    
    console.warn(`Proxy ${attempt} network error:`, error);
    return await fetchWithFailover(targetUrl, attempt + 1);
  }
}

export const fetchNews = async (params: GDELTQueryParams): Promise<NewsResponse> => {
  const now = Date.now();
  const gap = now - lastRequestTime;
  if (gap < MIN_REQUEST_GAP) {
    await wait(MIN_REQUEST_GAP - gap);
  }
  lastRequestTime = Date.now();

  // Construct the query string
  let finalQuery = params.query || 'world';

  if (params.language) {
    if (!finalQuery.includes('sourcelang:') && !finalQuery.includes('language:')) {
      finalQuery = `${finalQuery} sourcelang:${params.language}`;
    }
  }

  if (params.country && !finalQuery.includes('sourcecountry:')) {
    finalQuery = `${finalQuery} sourcecountry:${params.country}`;
  }

  const urlParams = new URLSearchParams({
    query: finalQuery,
    mode: params.mode || 'artlist',
    maxrecords: (params.maxrecords || 50).toString(),
    format: 'json', 
    sort: 'datedesc',
  });

  if (params.timespan) {
    urlParams.append('timespan', params.timespan);
  }
  
  // Direct GDELT URL
  const targetUrl = `${BASE_URL}?${urlParams.toString()}`;

  try {
    const data = await fetchWithFailover(targetUrl);
    
    const articles = data.articles || [];
    const result = { articles };

    // Cache successful result
    localStorage.setItem(getCacheKey(params), JSON.stringify({
      timestamp: Date.now(),
      data: result
    }));

    return result;

  } catch (error: any) {
    console.error("Fetch News Error:", error);
    
    const cached = getCachedNews(params);
    if (cached) {
      console.warn("Serving cached data due to error");
      return cached;
    }

    throw { 
      code: error.code || ErrorCode.NETWORK_ERROR, 
      message: error.message || 'Failed to connect to news stream.' 
    };
  }
};

export const getCachedNews = (params: GDELTQueryParams): NewsResponse | null => {
  const key = getCacheKey(params);
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const { timestamp, data } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_EXPIRY) return null;
    return data;
  } catch (e) {
    return null;
  }
};

export const getMockNews = (): NewsResponse => ({
  articles: [
    {
      url: "https://example.com/1",
      title: "Regional Media Highlights: New Local Reports",
      seendate: "20231027T120000Z",
      socialimage: "https://picsum.photos/seed/news_local/800/450",
      domain: "local-news.com",
      sourcecountry: "CA",
      language: "english",
      excerpt: "Strictly filtered results for your current region."
    },
    {
      url: "https://example.com/2",
      title: "Global Updates: Worldwide Coverage",
      seendate: "20231027T120500Z",
      socialimage: "https://picsum.photos/seed/news_global/800/450",
      domain: "world-report.com",
      sourcecountry: "US",
      language: "english",
      excerpt: "International perspective on current affairs."
    }
  ]
});

// --- DIAGNOSTICS & AUTOMATION TESTS ---

export interface DiagnosticLog {
  id: string;
  stage: 'DNS' | 'NETWORK' | 'API' | 'SCHEMA' | 'PERFORMANCE';
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

/**
 * Runs a comprehensive automation test on the GDELT connection.
 * Used for system health checks and debugging.
 */
export const runSystemHealthCheck = async (logger: (log: DiagnosticLog) => void) => {
  const log = (stage: DiagnosticLog['stage'], status: DiagnosticLog['status'], message: string, details?: string) => {
    logger({
      id: Math.random().toString(36).substr(2, 9),
      stage,
      status,
      message,
      details
    });
  };

  // 1. Network Connectivity
  log('NETWORK', 'pending', 'Checking network connectivity...');
  await wait(500); // UI visual pace
  if (!navigator.onLine) {
    log('NETWORK', 'error', 'Offline', 'Browser reports offline status');
    return;
  }
  log('NETWORK', 'success', 'Online', 'Navigator connectivity verified');

  // 2. API Latency & Logic
  log('API', 'pending', 'Connecting to GDELT (bypassing cache)...');
  const start = performance.now();
  
  try {
    // Unique query to bypass cache for true connectivity test
    // "climate" is a stable topic, minus a random string to force new results
    const response = await fetchNews({ 
        query: `climate -"test${Date.now()}"`,
        maxrecords: 5,
        language: 'english'
    });
    
    const latency = Math.round(performance.now() - start);
    log('API', 'success', `Response received in ${latency}ms`);
    
    // 3. Performance Check
    log('PERFORMANCE', 'pending', 'Analyzing latency...');
    if (latency < 1500) {
      log('PERFORMANCE', 'success', `Latency: ${latency}ms`, 'Optimal connection speed');
    } else if (latency < 3500) {
      log('PERFORMANCE', 'warning', `Latency: ${latency}ms`, 'Connection is slower than average');
    } else {
      log('PERFORMANCE', 'warning', `Latency: ${latency}ms`, 'High latency detected');
    }

    // 4. Schema Validation
    log('SCHEMA', 'pending', 'Validating data structure...');
    await wait(300); 

    if (!response || !Array.isArray(response.articles)) {
        throw new Error('Invalid JSON structure: missing articles array');
    }
    
    if (response.articles.length === 0) {
        log('SCHEMA', 'warning', 'Valid JSON but 0 articles returned', 'Query returned no results, but connection is good.');
    } else {
        const sample = response.articles[0];
        const missingFields: string[] = [];
        if (!sample.title) missingFields.push('title');
        if (!sample.url) missingFields.push('url');
        if (!sample.domain) missingFields.push('domain');
        
        if (missingFields.length > 0) {
            log('SCHEMA', 'error', 'Missing required fields', `Missing: ${missingFields.join(', ')}`);
        } else {
            log('SCHEMA', 'success', 'Schema valid', `Sample validated: "${sample.title.substring(0, 30)}..."`);
        }
    }

  } catch (e: any) {
    log('API', 'error', 'API Request Failed', e.message);
  }
};
