import React, { useEffect, useState } from 'react';
import { NewsArticle } from '../types';
import { shareToTwitter, copyToClipboard } from '../utils/helpers';
import { ArrowLeft, ExternalLink, Twitter, Link as LinkIcon, AlertCircle, Loader2, ShieldAlert, FileWarning, Share2 } from 'lucide-react';

interface NewsDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

// Major publishers/platforms known to strict block iframes (X-Frame-Options: DENY/SAMEORIGIN)
const BLOCKED_DOMAINS = [
  'nytimes.com', 'cnn.com', 'bbc.com', 'bbc.co.uk', 'wsj.com', 
  'washingtonpost.com', 'reuters.com', 'bloomberg.com', 'twitter.com', 
  'x.com', 'facebook.com', 'instagram.com', 'youtube.com',
  'cnbc.com', 'forbes.com', 'businessinsider.com', 'usatoday.com',
  'medium.com', 'wired.com', 'theguardian.com'
];

// Custom WebView wrapper to mimic React Native syntax for web compatibility
// Delegating all state handling to parent for consistent error UI
const WebView: React.FC<{ 
  source: { uri: string }; 
  className?: string; 
  onLoad?: () => void;
  onError?: () => void;
}> = ({ source, className, onLoad, onError }) => {
  return (
    <iframe
      src={source.uri}
      title="External Content"
      className={className}
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      onLoad={onLoad}
      onError={onError}
    />
  );
};

const NewsDetail: React.FC<NewsDetailProps> = ({ article, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Check if domain is in the blocked list
  const isBlocked = BLOCKED_DOMAINS.some(d => 
    (article.domain && article.domain.toLowerCase().includes(d)) || 
    article.url.toLowerCase().includes(d)
  );

  useEffect(() => {
    // If domain is known to be blocked, try to open in new tab immediately
    if (isBlocked) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    } else {
      window.scrollTo(0, 0);
    }
  }, [isBlocked, article.url]);

  useEffect(() => {
    // Pre-check logic: Attempt to detect X-Frame-Options or CSP headers
    const checkHeaders = async () => {
      if (isBlocked) return;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout for check

        const response = await fetch(article.url, { 
            method: 'HEAD',
            signal: controller.signal,
            // We use default mode 'cors'. If the server doesn't support CORS, this throws.
            // If it supports CORS, we can check headers.
        });
        
        clearTimeout(timeoutId);

        const xFrame = response.headers.get('X-Frame-Options');
        const csp = response.headers.get('Content-Security-Policy');

        const isForbidden = 
            (xFrame && ['DENY', 'SAMEORIGIN'].includes(xFrame.toUpperCase())) ||
            (csp && (csp.includes("frame-ancestors 'none'") || csp.includes("frame-ancestors 'self'")));

        if (isForbidden) {
            setHasError(true);
            setLoading(false);
        }
      } catch (e) {
         // CORS error or network failure during pre-check.
         // Most news sites block CORS, so this often fails silently.
         // We proceed to try the iframe which has more permissive embedding rules than fetch.
      }
    };

    checkHeaders();
  }, [article.url, isBlocked]);

  useEffect(() => {
    if (!isBlocked && loading) {
      // 1. Soft timeout: Show "Taking too long?" link
      const timer = setTimeout(() => {
        setLoadTimeout(true);
      }, 5000); 
      
      // 2. Hard timeout: Force error state after 15 seconds
      const errorTimer = setTimeout(() => {
        if (loading) {
           setHasError(true);
           setLoading(false);
        }
      }, 15000);

      return () => {
        clearTimeout(timer);
        clearTimeout(errorTimer);
      };
    }
  }, [isBlocked, loading]);

  const onCopyLink = async () => {
    const success = await copyToClipboard(article.url);
    if (success) alert('Link copied to clipboard!');
  };

  const handleOpenExternal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  // 1. Case: Known Blocked Domain -> Show Redirect UI (Simulated Error State)
  if (isBlocked) {
     return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
           <button 
             onClick={onBack}
             className="absolute top-4 left-4 z-50 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
           >
              <ArrowLeft size={24} className="text-gray-900" />
           </button>
           
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
               <div className="relative mb-6">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
                      <ExternalLink size={40} className="text-blue-500" />
                  </div>
               </div>
               
               <h2 className="text-2xl font-black text-gray-900 mb-3">Redirecting...</h2>
               <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
                 <strong className="text-gray-900">{article.domain}</strong> requires being opened in a separate tab.
               </p>
               <button 
                  onClick={handleOpenExternal}
                  className="bg-blue-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95"
               >
                 Open Article Again <ExternalLink size={18} />
               </button>
           </div>
        </div>
     );
  }

  // 2. Case: Try WebView with Floating Controls (Full Screen Mode)
  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Webview Container - Full Height */}
      <div className="flex-1 relative bg-gray-50 w-full h-full overflow-hidden">
         {loading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20">
               <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
               <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Source...</p>
               {loadTimeout && (
                 <div className="mt-4 animate-in fade-in slide-in-from-bottom-2">
                   <button 
                    onClick={handleOpenExternal}
                    className="text-xs text-blue-600 font-bold hover:underline"
                   >
                     Taking too long? Open in browser
                   </button>
                 </div>
               )}
            </div>
         )}
         
         {!hasError && (
           <WebView 
              source={{ uri: article.url }} 
              className="w-full h-full border-0 relative z-10 bg-white"
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setHasError(true);
              }}
           />
         )}

         {/* 3. Case: Explicit Error State */}
         {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20 p-8 text-center animate-in fade-in zoom-in-95">
                <div className="relative mb-8">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <FileWarning size={64} className="text-gray-300" />
                    </div>
                    <div className="absolute -bottom-2 right-1/2 translate-x-12 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-4 border-gray-50 text-red-500">
                        <ShieldAlert size={28} />
                    </div>
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-3">Preview Unavailable</h3>
                <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed text-sm md:text-base font-medium">
                   This article cannot be embedded due to publisher security settings.
                </p>
                <button 
                    onClick={handleOpenExternal}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95 hover:-translate-y-1"
                >
                    <span>Read on {article.domain}</span>
                    <ExternalLink size={20} />
                </button>
            </div>
         )}

         {/* 4. Floating Control Bar (Replaces Top Navbar) */}
         <div className="fixed bottom-8 inset-x-0 flex justify-center z-50 pointer-events-none">
            <div className="bg-gray-900/90 backdrop-blur-xl text-white pl-2 pr-4 py-2 rounded-full shadow-2xl flex items-center gap-2 pointer-events-auto border border-white/10 animate-in slide-in-from-bottom-10 fade-in duration-500">
               <button 
                  onClick={onBack}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Back to Feed"
               >
                  <ArrowLeft size={20} />
               </button>
               
               <div className="flex flex-col px-2 max-w-[140px]">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{article.domain}</span>
                  <span className="text-xs font-bold text-white truncate">{article.title}</span>
               </div>

               <div className="h-6 w-px bg-white/10 mx-1"></div>

               <div className="flex items-center gap-1">
                   <button 
                      onClick={() => shareToTwitter(article.title, article.url)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Share"
                   >
                      <Share2 size={18} />
                   </button>
                   <button 
                      onClick={handleOpenExternal}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Open in Browser"
                   >
                      <ExternalLink size={18} />
                   </button>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
};

export default NewsDetail;