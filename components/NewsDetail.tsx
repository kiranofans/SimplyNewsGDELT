import React from 'react';
import { NewsArticle } from '../types';
import { ArrowLeft, Share2, ExternalLink, Calendar, Globe } from 'lucide-react';
import { shareToTwitter } from '../utils/helpers';

interface NewsDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

const NewsDetail: React.FC<NewsDetailProps> = ({ article, onBack }) => {
  const handleOpenExternal = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = new Date(article.seendate).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="sticky top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 z-50">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900"
          aria-label="Go back"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => shareToTwitter(article.title, article.url)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            aria-label="Share to Twitter"
          >
            <Share2 size={20} />
          </button>
          <button 
            onClick={handleOpenExternal}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            aria-label="Open in browser"
          >
            <ExternalLink size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-20">
        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
          <div className="flex items-center gap-1">
            <Globe size={14} />
            <span className="font-medium text-gray-900">{article.domain}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Hero Image */}
        {article.socialimage && (
          <div className="w-full aspect-video rounded-2xl overflow-hidden mb-8 shadow-sm bg-gray-100">
            <img 
              src={article.socialimage} 
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Excerpt / Content */}
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <p>{article.excerpt || "No summary available for this article."}</p>
        </div>

        {/* Read Full Article Button */}
        <div className="mt-10 pt-6 border-t border-gray-100">
          <button 
            onClick={handleOpenExternal}
            className="w-full md:w-auto px-8 py-4 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            <span>Read Full Article on {article.domain}</span>
            <ExternalLink size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsDetail;