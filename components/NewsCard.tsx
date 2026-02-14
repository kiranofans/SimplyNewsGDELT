import React, { useState, useEffect } from 'react';
import { NewsArticle } from '../types';
import { formatDate, shareToTwitter, shareToTumblr, copyToClipboard, handleWebShare, checkImage, fipsToIso } from '../utils/helpers';
import { Share2, Twitter, Link as LinkIcon, MessageSquare, ImageOff } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
  onSelect?: (article: NewsArticle) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onSelect }) => {
  const [imageValid, setImageValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (article.socialimage) {
      checkImage(article.socialimage).then(setImageValid);
    } else {
      setImageValid(false);
    }
  }, [article.socialimage]);

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(article.url);
    if (success) alert('Link copied to clipboard!');
  };

  const onShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shared = await handleWebShare(article.title, article.url);
    if (!shared) {
      // Fallback
    }
  };

  const handleTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareToTwitter(article.title, article.url);
  };

  const handleTumblr = (e: React.MouseEvent) => {
    e.stopPropagation();
    shareToTumblr(article.title, article.url);
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(article);
    }
  };

  const renderImage = () => {
    if (imageValid === true) {
      return (
        <div className="aspect-video w-full overflow-hidden bg-gray-200 cursor-pointer" onClick={handleSelect}>
          <img 
            src={article.socialimage} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            onError={() => setImageValid(false)}
          />
        </div>
      );
    }
    
    return (
      <div 
        className="aspect-video w-full bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-4 cursor-pointer" 
        onClick={handleSelect}
      >
        <ImageOff size={32} className="mb-2 opacity-20" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Preview Unavailable</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-md">
      {renderImage()}
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{article.domain}</span>
          <span className="text-gray-300">•</span>
          <span className="text-xs text-gray-500">{formatDate(article.seendate)}</span>
        </div>

        <h3 className="text-lg font-bold leading-tight mb-2 line-clamp-2">
          <button 
            onClick={handleSelect}
            className="text-left hover:text-blue-600 transition-colors"
          >
            {article.title}
          </button>
        </h3>

        <div className="flex flex-wrap gap-1 mb-3">
          {article.sourcecountry && (
            <span className="px-2 py-0.5 bg-gray-100 text-[10px] rounded-full text-gray-600 font-medium">
              📍 {fipsToIso(article.sourcecountry)}
            </span>
          )}
          {article.language && (
            <span className="px-2 py-0.5 bg-gray-100 text-[10px] rounded-full text-gray-600 font-medium">
              🌐 {article.language}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleTwitter}
              className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-400 rounded-full transition-colors"
              title="Share on Twitter"
            >
              <Twitter size={18} />
            </button>
            <button 
              onClick={handleTumblr}
              className="p-1.5 hover:bg-indigo-50 text-gray-400 hover:text-indigo-400 rounded-full transition-colors"
              title="Share on Tumblr"
            >
              <MessageSquare size={18} />
            </button>
            <button 
              onClick={onCopy}
              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-full transition-colors"
              title="Copy link"
            >
              <LinkIcon size={18} />
            </button>
          </div>
          
          <button 
            onClick={onShare}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 md:hidden"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;