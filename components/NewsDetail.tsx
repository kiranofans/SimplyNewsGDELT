import React, { useEffect, useState } from 'react';
import { NewsArticle } from '../types';
import { copyToClipboard, shareToTwitter } from '../utils/helpers';
import { ArrowLeft, ExternalLink, Link as LinkIcon, Loader2, ShieldAlert, FileWarning, Share2, MoreVertical, RefreshCw } from 'lucide-react';

interface NewsDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

const BLOCKED_DOMAINS = [
  'nytimes.com', 'cnn.com', 'bbc.com', 'bbc.co.uk', 'wsj.com', 
  'washingtonpost.com', 'reuters.com', 'bloomberg.com', 'twitter.com', 
  'x.com', 'facebook.com', 'instagram.com', 'youtube.com',
  'cnbc.com', 'forbes.com', 'businessinsider.com', 'usatoday.com',
  'medium.com', 'wired.com', 'theguardian.com'
];

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
  const [showMenu, setShowMenu] = useState(false);

  const isBlocked = BLOCKED_DOMAINS.some(d => 
    (article.domain && article.domain.toLowerCase().includes(d)) || 
    article.url.toLowerCase().includes(d)
  );

  useEffect(() => {
    if (isBlocked) {
      window.open(article.url, '_blank', 'noopener,noreferrer');
    }
  }, [isBlocked, article.url]);

  useEffect(() => {
    const checkHeaders = async () => {
      if (isBlocked) return;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(article.url, { 
            method: 'HEAD',
            signal: controller.signal,
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
         // Proceed to try iframe
      }
    };

    checkHeaders();
  }, [article.url, isBlocked]);

  useEffect(() => {
    if (!isBlocked && loading) {
      const timer = setTimeout(() => {
        setLoadTimeout(true);
      }, 5000); 
      
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
    setShowMenu(false);
  };

  const handleOpenExternal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
    setShowMenu(false);
  };

  const handleReload = () => {
    setLoading(true);
    setHasError(false);
    const iframe = document.querySelector('iframe');
    if (iframe) {
        iframe.src = iframe.src;
    }
    setShowMenu(false);
  };

  if (isBlocked) {
     return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
           <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-center px-4 z-50 relative">
             <button onClick={onBack} className="absolute left-4 p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
               <ArrowLeft size={24} className="text-gray-900" />
             </button>
             <span className="font-black text-lg uppercase tracking-tight">Simply News</span>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
               <div className="relative mb-6">
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
                      <ExternalLink size={40} className="text-blue-500" />
                  </div>
               </div>
               
               <h2 className="text-2xl font-black text-gray-900 mb-3">Redirecting...</h2>
               <p className="text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
                 <strong className="text-gray-900">{article.domain}</strong> requires being opened in a separate tab.
               </p>

               <div className="mb-8 px-6 py-3 bg-white border border-gray-200 rounded-xl w-full max-w-md mx-auto flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={onCopyLink} title="Click to copy">
                  <LinkIcon size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 truncate font-mono flex-1 text-left">{article.url}</span>
               </div>

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

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      
      {/* Navigation Bar - Fixed Top - Covers iframe content */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-3 md:px-6 z-[60] shadow-sm">
         <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900"
              title="Back"
            >
               <ArrowLeft size={22} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{article.domain}</span>
              <span className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[150px] md:max-w-md">{article.title}</span>
            </div>
         </div>

         <div className="flex items-center gap-1">
            <button 
              onClick={() => shareToTwitter(article.title, article.url)}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors hidden md:block"
              title="Share to Twitter"
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={handleOpenExternal}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors hidden md:block"
              title="Open in Browser"
            >
              <ExternalLink size={20} />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={handleReload} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <RefreshCw size={16} /> Reload Page
                    </button>
                    <button onClick={() => shareToTwitter(article.title, article.url)} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700 md:hidden">
                      <Share2 size={16} /> Share
                    </button>
                    <button onClick={onCopyLink} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <LinkIcon size={16} /> Copy Link
                    </button>
                    <div className="h-px bg-gray-100 my-1"></div>
                    <div className="px-4 py-2 bg-gray-50 m-2 rounded text-[10px] text-gray-500 font-mono break-all select-all">
                      {article.url}
                    </div>
                    <button onClick={handleOpenExternal} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-sm font-bold text-blue-600">
                      <ExternalLink size={16} /> Open in Browser
                    </button>
                  </div>
                </>
              )}
            </div>
         </div>
      </div>

      {/* Webview Container - Full Height */}
      <div className="flex-1 relative bg-gray-50 w-full h-full overflow-hidden">
         {loading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20 pt-16">
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
           <>
             <WebView 
                source={{ uri: article.url }} 
                className="w-full h-full border-0 relative z-10 bg-white"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setHasError(true);
                }}
             />
             {/* Persistent floating button for successful loads (in case of silent white-screen failure) */}
             {!loading && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500 pointer-events-none">
                    <button 
                        onClick={handleOpenExternal}
                        className="pointer-events-auto bg-black/80 hover:bg-black text-white backdrop-blur-md px-5 py-2.5 rounded-full text-xs font-bold shadow-xl border border-white/10 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        Read on {article.domain} <ExternalLink size={12} />
                    </button>
                </div>
             )}
           </>
         )}

         {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-20 p-8 text-center animate-in fade-in zoom-in-95 pt-16">
                <div className="relative mb-6">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <FileWarning size={64} className="text-gray-300" />
                    </div>
                    <div className="absolute -bottom-2 right-1/2 translate-x-12 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.1)] border-4 border-gray-50 text-red-500">
                        <ShieldAlert size={28} />
                    </div>
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-2">Preview Unavailable</h3>
                <p className="text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed text-sm md:text-base font-medium">
                   This page cannot be loaded for now. Please click the link below to view it.
                </p>

                <div className="mb-8 px-6 py-3 bg-white border border-gray-200 rounded-xl w-full max-w-md mx-auto flex items-center gap-3 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={onCopyLink} title="Click to copy">
                    <LinkIcon size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-600 truncate font-mono flex-1 text-left">{article.url}</span>
                </div>

                <button 
                    onClick={handleOpenExternal}
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-transform active:scale-95 hover:-translate-y-1"
                >
                    <span>Read on {article.domain}</span>
                    <ExternalLink size={20} />
                </button>
            </div>
         )}
      </div>
    </div>
  );
};

export default NewsDetail;