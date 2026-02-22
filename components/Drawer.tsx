
import React from 'react';
import { X, Globe, Filter, Newspaper, MapPin, Radio } from 'lucide-react';
import { getEmojiFlag } from '../utils/helpers';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onFilterChange: (filters: { query?: string; country?: string; lang?: string; language?: string }) => void;
  detectedCountry?: { name: string; code: string } | null;
  currentCountry?: string;
  currentLanguage?: string;
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, onFilterChange, detectedCountry, currentCountry, currentLanguage }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-white z-[70] transform transition-transform duration-300 ease-out p-6 shadow-2xl flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <Newspaper className="text-blue-600" size={24} />
            <h2 className="text-xl font-black tracking-tighter uppercase">Simply News</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {detectedCountry && (
            <section className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <MapPin size={12} /> Detected Location
              </h3>
              <button 
                onClick={() => { onFilterChange({ country: detectedCountry.code }); onClose(); }}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${currentCountry === detectedCountry.code ? 'bg-white shadow-sm ring-1 ring-blue-200' : 'hover:bg-blue-100/50'}`}
              >
                <span className="text-3xl">{getEmojiFlag(detectedCountry.code)}</span>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-black text-gray-900 leading-none">{detectedCountry.name}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{detectedCountry.code} • Media Edition</span>
                </div>
              </button>
            </section>
          )}

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Radio size={14} /> Source Editions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'USA', val: 'US' },
                { label: 'UK', val: 'GB' }, // Changed to GB (ISO) for correct mapping
                { label: 'Canada', val: 'CA' },
                { label: 'Australia', val: 'AU' },
                { label: 'India', val: 'IN' },
                { label: 'France', val: 'FR' },
                { label: 'Germany', val: 'DE' },
                { label: 'Japan', val: 'JP' }
              ].map(c => (
                <button 
                  key={c.val}
                  onClick={() => { onFilterChange({ country: c.val }); onClose(); }}
                  className={`px-3 py-3 border rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 ${
                    currentCountry === c.val 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-md hover:border-blue-200 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{getEmojiFlag(c.val)}</span>
                  {c.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={14} /> Languages
            </h3>
            <div className="space-y-1">
              {[
                { label: 'English', val: 'en' },
                { label: 'Chinese (Simplified)', val: 'zh' },
                { label: 'Chinese (Traditional)', val: 'zh' },
                { label: 'French', val: 'fr' },
                { label: 'Spanish', val: 'es' },
                { label: 'German', val: 'de' },
                { label: 'Japanese', val: 'ja' }
              ].map((l, idx) => (
                <button 
                  key={`${l.val}-${idx}`}
                  onClick={() => { onFilterChange({ language: l.val }); onClose(); }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    currentLanguage === l.val 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-[10px]">NC</div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-none">Powered by</span>
              <span className="text-[10px] font-bold text-gray-800">NewsCatcher API</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Drawer;
