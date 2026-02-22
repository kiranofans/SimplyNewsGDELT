import { NewsQueryParams, NewsResponse, ErrorCode, NewsArticle } from '../types';

const BASE_URL = '/api/news';
const CACHE_EXPIRY = 5 * 60 * 1000;

let lastRequestTime = 0;
const MIN_REQUEST_GAP = 1000; // 1 second gap (NewsCatcher has rate limits)

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getCacheKey = (params: NewsQueryParams) => {
  const country = params.country || 'GLOBAL';
  const query = params.query || 'world';
  const lang = params.language || 'all';
  return `newscatcher_cache_${country.toUpperCase()}_${query.toLowerCase().replace(/\s+/g, '_')}_${lang}`;
};

const getApiKey = () => {
  return import.meta.env.VITE_NEWSCATCHER_API_KEY;
};

export const fetchNews = async (params: NewsQueryParams): Promise<NewsResponse> => {
  // We check if we are in a mock environment or if the key is missing on the server (handled by 500 error)

  const now = Date.now();
  const gap = now - lastRequestTime;
  if (gap < MIN_REQUEST_GAP) {
    await wait(MIN_REQUEST_GAP - gap);
  }
  lastRequestTime = Date.now();

  // Map GDELT params to NewsCatcher params
  const urlParams = new URLSearchParams({
    q: params.query || 'news',
    lang: params.language || 'en',
    sort_by: 'date',
    page_size: (params.maxrecords || 50).toString(),
  });

  if (params.country) {
    urlParams.append('countries', params.country);
  }

  // Handle timespan (GDELT uses '1d', '1w', etc. NewsCatcher uses 'from' date or 'when')
  // Simple mapping for common GDELT timespans
  if (params.timespan) {
    if (params.timespan.includes('d')) {
        urlParams.append('when', '24h'); // Approximation
    } else if (params.timespan.includes('w')) {
        urlParams.append('when', '7d');
    } else if (params.timespan.includes('m')) {
        urlParams.append('when', '30d');
    } else {
        urlParams.append('when', '24h'); // Default
    }
  }

  const targetUrl = `${BASE_URL}?${urlParams.toString()}`;

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      // Try to parse error details from JSON response
      let errorDetails = '';
      try {
        const errorJson = await response.json();
        errorDetails = errorJson.error || errorJson.message || JSON.stringify(errorJson);
      } catch (e) {
        errorDetails = await response.text();
      }

      console.error(`API Error (${response.status}):`, errorDetails);

      if (response.status === 429) {
        throw { code: ErrorCode.RATE_LIMITED, message: 'NewsCatcher rate limit exceeded.' };
      }
      if (response.status === 401 || response.status === 403) {
        console.warn("Invalid API Key detected. Falling back to mock data.");
        return getMockNews();
      }
      if (response.status === 500) {
         if (errorDetails.includes("Missing API Key")) {
             console.warn("API Key missing on server, falling back to mock data");
             return getMockNews();
         }
      }
      throw { 
        code: ErrorCode.API_ERROR, 
        message: `Server returned ${response.status}: ${errorDetails.substring(0, 100)}` 
      };
    }

    const data = await response.json();
    
    // Map NewsCatcher response to NewsArticle interface
    const articles: NewsArticle[] = (data.articles || []).map((article: any) => ({
      url: article.link,
      title: article.title,
      seendate: article.published_date, // Format: "2021-09-02 12:00:00"
      socialimage: article.media || `https://picsum.photos/seed/${encodeURIComponent(article.title)}/800/450`,
      domain: article.clean_url,
      sourcecountry: article.country,
      language: article.language,
      excerpt: article.excerpt || article.summary,
    }));

    const result = { articles };

    if (articles.length > 0) {
      localStorage.setItem(getCacheKey(params), JSON.stringify({
        timestamp: Date.now(),
        data: result
      }));
    }

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
      message: error.message || 'Unable to connect to news network.' 
    };
  }
};

export const getCachedNews = (params: NewsQueryParams): NewsResponse | null => {
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
      title: "NewsCatcher: Regional Media Highlights",
      seendate: new Date().toISOString(),
      socialimage: "https://picsum.photos/seed/news_local/800/450",
      domain: "local-news.com",
      sourcecountry: "CA",
      language: "en",
      excerpt: "Strictly filtered results for your current region (Mock Data)."
    },
    {
      url: "https://example.com/2",
      title: "NewsCatcher: Global Updates",
      seendate: new Date().toISOString(),
      socialimage: "https://picsum.photos/seed/news_global/800/450",
      domain: "world-report.com",
      sourcecountry: "US",
      language: "en",
      excerpt: "International perspective on current affairs (Mock Data)."
    }
  ]
});

// --- DIAGNOSTICS ---

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

  log('API', 'pending', 'Connecting to NewsCatcher...');
  const start = performance.now();
  
  try {
    const response = await fetchNews({ 
        query: `climate`,
        maxrecords: 5,
        language: 'en'
    });
    
    const latency = Math.round(performance.now() - start);
    log('API', 'success', `Response received in ${latency}ms`);
    
    if (response.articles.length === 0) {
        log('SCHEMA', 'warning', 'Valid JSON but 0 articles returned', 'Query returned no results.');
    } else {
        log('SCHEMA', 'success', 'Schema valid', `Sample: "${response.articles[0].title.substring(0, 30)}..."`);
    }

  } catch (e: any) {
    if (e.message && e.message.includes('API Key')) {
        log('API', 'error', 'Missing/Invalid API Key', 'Please add VITE_NEWSCATCHER_API_KEY to .env');
    } else {
        log('API', 'error', 'API Request Failed', e.message);
    }
  }
};
