import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchNews, getCachedNews, getMockNews } from './api/newscatcher';
import { NewsArticle, NewsQueryParams, ErrorCode } from './types';
import NewsCard from './components/NewsCard';
import SliderHero from './components/SliderHero';
import WeatherWidget from './components/WeatherWidget';
import Drawer from './components/Drawer';
import NewsDetail from './components/NewsDetail';
import Diagnostics from './components/Diagnostics';
import { getEmojiFlag, getLanguageForCountry, getCountryName } from './utils/helpers';
import { Menu, Search, RefreshCw, Globe, X, Bug, ShieldAlert, Loader2, ArrowLeft, Radio } from 'lucide-react';

const App: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLongLoading, setShowLongLoading] = useState(false); // State for >2s loader
  const [error, setError] = useState<{ code: ErrorCode; message: string } | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  
  // Default language is English initially, but will adjust based on country
  const [filters, setFilters] = useState<NewsQueryParams>({
    query: 'world',
    timespan: '1d',
    maxrecords: 100,
    language: 'en'
  });
  
  const [searchInput, setSearchInput] = useState('');
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<{ name: string; code: string } | null>(null);
  const [weatherLocation, setWeatherLocation] = useState<{ lat: number; lon: number; name: string } | null>(null);
  
  const lastFetchRef = useRef<number>(Date.now());
  const hasInitializedLocation = useRef(false);
  // Fix: Use ReturnType<typeof setTimeout> instead of NodeJS.Timeout to avoid namespace errors in environments without node types
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadNews = useCallback(async (params: NewsQueryParams, isLoadMore = false) => {
    // Clear existing timer if any
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    try {
      if (!isLoadMore) {
        setLoading(true);
        setArticles([]); // Clear immediately to remove old country data
        setShowLongLoading(false);
        
        // Start 2-second timer for long loading indicator
        loadingTimerRef.current = setTimeout(() => {
          setShowLongLoading(true);
        }, 2000);
      }
      
      setError(null);

      let data;
      let targetFips = '';

      if (useMockData) {
        await new Promise(r => setTimeout(r, 800));
        data = getMockNews();
      } else {
        data = await fetchNews(params);
      }
      
      let fetchedArticles = data.articles || [];
      let filteredArticles = fetchedArticles;

      // DOUBLE FALLBACK:
      // If the API returned nothing at all for this country, try global news
      if (filteredArticles.length === 0 && !isLoadMore && params.country && !useMockData) {
         console.warn("No local news found, falling back to global news.");
         // Note: We might want to notify the user, but for now we fallback gracefully
         const globalData = await fetchNews({ ...params, query: 'world', country: undefined, language: 'en' });
         filteredArticles = globalData.articles || [];
      }
      
      if (isLoadMore) {
        setArticles(prev => [...prev, ...filteredArticles]);
      } else {
        setArticles(filteredArticles);
      }
      lastFetchRef.current = Date.now();
    } catch (err: any) {
      console.error('Load News Error:', err);
      const cached = getCachedNews(params);
      if (cached && !isLoadMore) {
        setArticles(cached.articles);
      } else {
        setError({
          code: err.code || ErrorCode.API_ERROR,
          message: err.message || 'News temporarily unavailable.'
        });
      }
    } finally {
      setLoading(false);
      setShowLongLoading(false);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    }
  }, [useMockData]);

  const handleFilterChange = (f: Partial<NewsQueryParams>) => {
    const newFilters = { ...filters, ...f };
    
    // Auto-adjust language if country changed
    if (f.country) {
       const mappedLang = getLanguageForCountry(f.country);
       if (mappedLang) {
         newFilters.language = mappedLang;
       } else {
         // If no mapping found, clear language filter to show all
         newFilters.language = undefined; 
       }
    }

    setFilters(newFilters);
    loadNews(newFilters);
  };

  const handleLogoClick = () => {
    setSelectedArticle(null);
    setSearchInput('');
    setIsMobileSearchOpen(false);

    // Reset to default state (detected country if available, else world)
    const newFilters: NewsQueryParams = {
      query: 'world',
      timespan: '1d',
      maxrecords: 100,
      language: 'en'
    };

    if (detectedCountry) {
      newFilters.country = detectedCountry.code;
      const lang = getLanguageForCountry(detectedCountry.code);
      if (lang) newFilters.language = lang;
    }

    setFilters(newFilters);
    loadNews(newFilters);
  };

  useEffect(() => {
    const detectLocation = async () => {
      if (hasInitializedLocation.current) return;
      hasInitializedLocation.current = true;

      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          if (data.country_code) {
            const countryInfo = { name: data.country_name, code: data.country_code };
            setDetectedCountry(countryInfo);
            setWeatherLocation({
                lat: data.latitude,
                lon: data.longitude,
                name: `${data.city}, ${data.country_code}`
            });
            
            // Get local language for the detected country
            const detectedLang = getLanguageForCountry(data.country_code);

            const newFilters: NewsQueryParams = {
              ...filters,
              query: 'world',
              country: data.country_code,
              language: detectedLang
            };
            setFilters(newFilters);
            loadNews(newFilters);
            return;
          }
        }
      } catch (e) {
        console.warn("Location detection unavailable.");
      }
      loadNews(filters);
    };

    detectLocation();
  }, [loadNews]);

  // Lock body scroll when NewsDetail is open to prevent background scrolling
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedArticle]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFilters = { ...filters, query: searchInput || 'world' };
    setFilters(newFilters);
    setSelectedArticle(null);
    setIsMobileSearchOpen(false);
    loadNews(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      
      {/* Article Detail Overlay */}
      {selectedArticle && (
        <NewsDetail article={selectedArticle} onBack={() => setSelectedArticle(null)} />
      )}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 px-3 md:px-8 h-16 md:h-20 flex items-center justify-between gap-2">
        {isMobileSearchOpen && (
          <div className="absolute inset-0 bg-white z-[60] flex items-center px-4 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <button onClick={() => setIsMobileSearchOpen(false)} className="p-2 text-gray-400"><ArrowLeft size={22} /></button>
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <input autoFocus type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search news..." className="w-full bg-transparent py-2 text-base font-bold focus:outline-none" />
            </form>
            <button onClick={handleSearchSubmit} className="p-2.5 bg-blue-600 text-white rounded-xl"><Search size={20} /></button>
          </div>
        )}

        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          <button onClick={() => setIsDrawerOpen(true)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Menu size={22} />
          </button>
          <button onClick={handleLogoClick} className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
            <h1 className="text-xs md:text-xl font-black text-gray-900 tracking-tighter leading-none uppercase select-none">Simply News</h1>
            {filters.country && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 md:px-2 md:py-1 bg-gray-900 text-white rounded md:rounded-lg shadow-sm">
                 <span className="text-[10px] md:text-sm leading-none">{getEmojiFlag(filters.country)}</span>
                 <span className="text-[8px] md:text-[10px] font-black uppercase tracking-tighter leading-none">{getCountryName(filters.country)}</span>
              </div>
            )}
          </button>
        </div>

        <div className="flex-1 flex justify-center items-center gap-4 max-w-xl">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative group hidden lg:block">
            <div className="relative flex items-center bg-gray-100 rounded-2xl overflow-hidden border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
              <Search className="ml-4 text-gray-400" size={18} />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder={`Search news sources...`} className="flex-1 bg-transparent px-3 py-3 text-sm font-medium focus:outline-none" />
              <button type="submit" className="bg-blue-600 text-white px-6 py-3 text-sm font-bold">Search</button>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-1.5 md:gap-3 flex-shrink-0">
          <button onClick={() => setIsMobileSearchOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-full text-gray-900"><Search size={22} /></button>
          <WeatherWidget 
            lat={weatherLocation?.lat} 
            lon={weatherLocation?.lon} 
            locationName={weatherLocation?.name} 
          />
          <button 
            onClick={() => setDebugMode(true)} 
            className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            title="Run System Diagnostics"
          >
            <Bug size={14} />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 relative">
        {/* Delayed Loader Overlay */}
        {showLongLoading && loading && (
          <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center min-h-[50vh]">
             <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Gathering Global Reports...</p>
             <p className="text-gray-400 text-[10px] mt-2">Connecting to international servers</p>
          </div>
        )}

        {error && !articles.length && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert size={40} />
            </div>
            <h2 className="text-2xl font-black uppercase mb-2">Stream Interrupted</h2>
            <p className="text-gray-500 max-w-sm mb-8">{error.message}</p>
            <button 
              onClick={() => { setUseMockData(true); loadNews(filters); }}
              className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              Use Backup Mock Data
            </button>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Globe className="text-gray-400" size={40} />
             </div>
             <h3 className="text-xl font-bold text-gray-900 mb-2">No News Found</h3>
             <p className="text-gray-500 max-w-xs mx-auto mb-6">We couldn't find any articles matching your current filters.</p>
             <button 
               onClick={handleLogoClick}
               className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
             >
               Reset Filters
             </button>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <section className="mb-6 md:mb-10">
            <SliderHero articles={articles.slice(0, 5)} onSelectArticle={setSelectedArticle} />
          </section>
        )}

        {articles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Radio size={20} />
                </div>
                {filters.country ? `${getCountryName(filters.country)} Headlines` : 'Global Headlines'}
              </h2>
              {filters.language && (
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  Language: {filters.language}
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <NewsCard key={article.url} article={article} onSelect={setSelectedArticle} />
              ))}
            </div>
          </section>
        )}

        {loading && !articles.length && !showLongLoading && (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Updating Live Stream...</p>
          </div>
        )}
      </main>

      <Drawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        detectedCountry={detectedCountry}
        currentCountry={filters.country}
        currentLanguage={filters.language}
        onFilterChange={handleFilterChange} 
      />

      {/* Diagnostics Overlay */}
      {debugMode && (
        <Diagnostics onClose={() => setDebugMode(false)} />
      )}
    </div>
  );
};

export default App;