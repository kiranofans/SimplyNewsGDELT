
export interface NewsArticle {
  url: string;
  url_mobile?: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  sourcecountry: string;
  language: string;
  excerpt?: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
}

export interface WeatherData {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
  };
}

export interface GDELTQueryParams {
  query?: string;
  country?: string;
  language?: string;
  timespan?: string;
  maxrecords?: number;
  mode?: 'artlist' | 'timelinevol' | 'artgallery';
}

export enum ErrorCode {
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  CORS_BLOCKED = 'CORS_BLOCKED'
}
