
import React, { useState, useEffect, useCallback } from 'react';
import { NewsArticle } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface SliderHeroProps {
  articles: NewsArticle[];
  onSelectArticle?: (article: NewsArticle) => void;
}

const SliderHero: React.FC<SliderHeroProps> = ({ articles, onSelectArticle }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % articles.length);
  }, [articles.length]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + articles.length) % articles.length);
  }, [articles.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, isPaused]);

  const handleSelect = (article: NewsArticle) => {
    if (onSelectArticle) {
      onSelectArticle(article);
    }
  };

  if (!articles.length) return null;

  return (
    <div 
      className="relative w-full h-[180px] md:h-[500px] overflow-hidden group rounded-[1.5rem] md:rounded-[3rem] shadow-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {articles.map((article, index) => (
        <div 
          key={article.url}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <div className="w-full h-full relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-20" />
            <img 
              src={article.socialimage || `https://picsum.photos/seed/${index}/1200/600`} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-12 z-30 flex flex-col justify-end h-full">
              <h2 className="text-sm md:text-5xl font-black mb-2 md:mb-6 max-w-4xl leading-tight text-white line-clamp-2 md:line-clamp-none">
                <button 
                  onClick={() => handleSelect(article)} 
                  className="text-left hover:text-blue-300 transition-colors"
                >
                  {article.title}
                </button>
              </h2>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleSelect(article)}
                  className="bg-white text-black px-4 py-2 md:px-8 md:py-3 rounded-lg md:rounded-2xl font-black text-[10px] md:text-sm uppercase tracking-widest whitespace-nowrap hover:bg-blue-50 transition-colors"
                >
                  Read the article
                </button>
                <span className="text-[8px] md:text-sm font-bold text-gray-300 uppercase truncate opacity-80 border-l border-white/20 pl-3">
                  {article.domain}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Indicators - Compact */}
      <div className="absolute bottom-4 md:bottom-8 right-4 md:right-12 z-40 flex gap-1.5 md:gap-2">
        {articles.map((_, i) => (
          <button 
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`h-1 md:h-2 rounded-full transition-all duration-500 ${
              i === activeIndex ? 'w-4 md:w-12 bg-white' : 'w-1 md:w-2 bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default SliderHero;
