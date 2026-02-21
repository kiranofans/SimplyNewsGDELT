import { GDELTQueryParams, NewsResponse, ErrorCode } from '../types';

const BASE_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const CACHE_EXPIRY = 5 * 60 * 1000;

let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // 1 second gap

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCacheKey = (params: GDELTQueryParams) => {
  const country = params.country || 'GLOBAL';
  const query = params.query || 'world';
  const lang = params.language || 'all';
  return `gdelt_cache_${country.toUpperCase()}_${query.toLowerCase().replace(/\s+/g, '_')}_${lang}`;
};

export const fetchNews = async (params: GDELTQueryParams): Promise<NewsResponse> => {
  const now = Date.now();
  const gap = now - lastRequestTime;
  if (gap < MIN_REQUEST_GAP) {
    await wait(MIN_REQUEST_GAP - gap);
  }
  lastRequestTime = Date.now();

  // Construct the query string
  let finalQuery = params.query || 'world';

  // Ensure strict deduplication of query params
  if (params.language) {
    const langParam = `sourcelang:${params.language}`;
    if (!finalQuery.includes('sourcelang:') && !finalQuery.includes('language:')) {
      finalQuery = `${finalQuery} ${langParam}`;
    }
  }

  if (params.country) {
    const countryParam = `sourcecountry:${params.country}`;
    if (!finalQuery.includes('sourcecountry:')) {
      finalQuery = `${finalQuery} ${countryParam}`;
    }
  }

  const urlParams = new URLSearchParams({
    query: finalQuery.trim(),
    mode: params.mode || 'artlist',
    maxrecords: (params.maxrecords || 50).toString(),
    format: 'json', 
    sort: 'datedesc',
  });

  if (params.timespan) {
    urlParams.append('timespan', params.timespan);
  }
  
  const targetUrl = `${BASE_URL}?${urlParams.toString()}`;

  let lastError: any;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      // Increase timeout to 60 seconds to be very generous against slow GDELT responses
      const id = setTimeout(() => controller.abort(), 60000); 

      const response = await fetch(targetUrl, { 
        signal: controller.signal,
        credentials: 'omit', // Helps with some CORS/privacy configurations
        headers: {
            'Accept': 'application/json'
        }
      });
      
      clearTimeout(id);

      if (!response.ok) {
        throw { code: ErrorCode.API_ERROR, message: `GDELT returned ${response.status}` };
      }

      const text = await response.text();

      // Check for GDELT specific text-based errors that return 200 OK
      if (text.includes('Please limit your queries') || text.includes('concurrent queries')) {
         throw { code: ErrorCode.RATE_LIMITED, message: 'Service busy. Please try again momentarily.' };
      }

      // Attempt to parse JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw { code: ErrorCode.API_ERROR, message: 'Invalid response format from server.' };
      }
      
      // GDELT structure: { articles: [...] } or just empty for no results
      const articles = data.articles || [];
      const result = { articles };

      // Only cache if we got results
      if (articles.length > 0) {
        localStorage.setItem(getCacheKey(params), JSON.stringify({
          timestamp: Date.now(),
          data: result
        }));
      }

      return result;

    } catch (error: any) {
      lastError = error;
      
      const isAbort = error.name === 'AbortError' || (error.message && error.message.includes('aborted'));
      const isNetwork = error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'));
      
      // Stop retrying if we hit the limit or if it's a non-retryable error (unless it's network/abort)
      if (attempt === maxAttempts) break;
      
      if (isAbort || isNetwork) {
         console.warn(`Fetch attempt ${attempt} failed, retrying...`);
         await wait(1500 * attempt); // Exponential backoff
         continue;
      }

      // If it's a logic error (parse error, etc), break immediately
      break; 
    }
  }

  // Handle Final Error
  // Only log unexpected errors. Abort/Timeout is expected behavior under poor network conditions.
  if (lastError?.name !== 'AbortError' && !lastError?.message?.includes('aborted')) {
    console.error("Fetch News Error (Final):", lastError);
  }
  
  const cached = getCachedNews(params);
  if (cached) {
    console.warn("Serving cached data due to error");
    return cached;
  }

  // Handle Timeout / AbortError
  if (lastError?.name === 'AbortError' || (lastError?.message && lastError.message.includes('aborted'))) {
    throw { code: ErrorCode.NETWORK_ERROR, message: 'Connection timed out. Please try again later.' };
  }

  // Handle Network/CORS errors
  if (lastError?.message && (lastError.message.includes('Failed to fetch') || lastError.message.includes('NetworkError'))) {
     throw { code: ErrorCode.NETWORK_ERROR, message: 'Unable to connect to news network. Please try again later.' };
  }

  throw { 
    code: lastError?.code || ErrorCode.NETWORK_ERROR, 
    message: lastError?.message || 'Unable to connect to news network. Please try again later.' 
  };
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

  log('NETWORK', 'pending', 'Checking network connectivity...');
  await wait(500); 
  if (!navigator.onLine) {
    log('NETWORK', 'error', 'Offline', 'Browser reports offline status');
    return;
  }
  log('NETWORK', 'success', 'Online', 'Navigator connectivity verified');

  log('API', 'pending', 'Connecting to GDELT (Direct)...');
  const start = performance.now();
  
  try {
    // Simple test query
    const response = await fetchNews({ 
        query: `climate`,
        maxrecords: 5,
        language: 'english'
    });
    
    const latency = Math.round(performance.now() - start);
    log('API', 'success', `Response received in ${latency}ms`);
    
    log('PERFORMANCE', 'pending', 'Analyzing latency...');
    if (latency < 1000) {
      log('PERFORMANCE', 'success', `Latency: ${latency}ms`, 'Excellent connection speed');
    } else if (latency < 5000) {
      log('PERFORMANCE', 'warning', `Latency: ${latency}ms`, 'Connection is slower than average');
    } else {
      log('PERFORMANCE', 'warning', `Latency: ${latency}ms`, 'High latency detected');
    }

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
    if (e.message && e.message.includes('CORS')) {
      log('API', 'error', 'CORS Error', 'Direct browser access blocked by GDELT. A proxy is usually required.');
    } else {
      log('API', 'error', 'API Request Failed', e.message);
    }
  }
};