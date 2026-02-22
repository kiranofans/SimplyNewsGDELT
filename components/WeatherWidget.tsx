
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchWeather, getWeatherIcon } from '../api/weather';
import { WeatherData } from '../types';
import { CloudRain, ChevronDown, ChevronUp, MapPin, CalendarDays } from 'lucide-react';

interface WeatherWidgetProps {
  variant?: 'mini';
  lat?: number;
  lon?: number;
  locationName?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ lat, lon, locationName = 'Ottawa, CA' }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const getWeatherData = async () => {
      setLoading(true);
      setError(false);
      try {
        const weather = await fetchWeather(lat, lon);
        setData(weather);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    getWeatherData();
  }, [lat, lon]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  if (error) {
    return (
      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-400 border border-red-100" title="Weather unavailable">
        <CloudRain size={16} />
      </div>
    );
  }

  if (loading || !data) {
    return <div className="w-10 h-10 bg-gray-100 animate-pulse rounded-full" />;
  }

  const renderMobileContent = () => (
    <div className="fixed top-[64px] left-0 right-0 z-40 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-white shadow-xl border-b border-gray-100 overflow-hidden">
        {/* Compact Label Strip */}
        <div className="px-3 py-1 bg-blue-50/40 flex items-center justify-between border-b border-blue-100/20">
          <div className="flex items-center gap-1">
            <CalendarDays size={9} className="text-blue-600" />
            <span className="text-[7px] font-black uppercase tracking-widest text-blue-700">10-Day Scroll</span>
          </div>
          <span className="text-[7px] font-bold text-gray-400">{locationName}</span>
        </div>

        {/* Scrollable strip - Height reduced further */}
        <div className="flex overflow-x-auto py-2 px-1 scrollbar-hide snap-x">
          {data.daily.time.map((time, i) => {
            const date = new Date(time + 'T00:00:00');
            const isToday = i === 0;
            return (
              <div 
                key={time} 
                className={`flex-shrink-0 w-16 mx-0.5 p-2 rounded-xl flex flex-col items-center snap-center transition-colors ${isToday ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 border border-gray-50'}`}
              >
                <span className={`text-[6px] font-black uppercase mb-0.5 ${isToday ? 'opacity-80' : 'text-gray-400'}`}>
                  {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-xl leading-none my-0.5">{getWeatherIcon(data.daily.weather_code[i])}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] font-black">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                  <span className={`text-[7px] font-bold ${isToday ? 'opacity-50' : 'text-gray-300'}`}>{Math.round(data.daily.temperature_2m_min[i])}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative" ref={popoverRef}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center justify-center p-2 rounded-full border transition-all ${isExpanded ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'}`}
      >
        <span className="text-xl leading-none">{getWeatherIcon(data.daily.weather_code[0])}</span>
      </button>

      {isExpanded && (
        isMobile ? (
          createPortal(
            renderMobileContent(),
            document.body
          )
        ) : (
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between">
              <span className="text-[10px] font-black uppercase text-blue-600">10-Day Forecast</span>
              <span className="text-[10px] font-bold text-gray-400">{locationName}</span>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {data.daily.time.map((time, i) => (
                <div key={time} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                  <span className="text-xs font-bold text-gray-500 w-12">{i === 0 ? 'Today' : new Date(time + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="text-xl">{getWeatherIcon(data.daily.weather_code[i])}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black w-6 text-right">{Math.round(data.daily.temperature_2m_max[i])}°</span>
                    <span className="text-[10px] font-bold text-gray-300 w-6">{Math.round(data.daily.temperature_2m_min[i])}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default WeatherWidget;
