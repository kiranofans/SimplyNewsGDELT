
// Mapping between ISO 3166-1 (2-letter) and FIPS 10-4 (2-letter) codes
// GDELT uses FIPS 10-4 for sourcecountry and metadata.
export const ISO_TO_FIPS: Record<string, string> = {
  'AD': 'AN', 'AE': 'TC', 'AF': 'AF', 'AG': 'AC', 'AI': 'AV', 'AL': 'AL', 'AM': 'AM', 'AO': 'AO', 'AQ': 'AY', 'AR': 'AR',
  'AS': 'AQ', 'AT': 'AU', 'AU': 'AS', 'AW': 'AA', 'AX': 'FI', 'AZ': 'AJ', 'BA': 'BK', 'BB': 'BB', 'BD': 'BG', 'BE': 'BE',
  'BF': 'UV', 'BG': 'BU', 'BH': 'BA', 'BI': 'BY', 'BJ': 'DM', 'BL': 'RN', 'BM': 'BD', 'BN': 'BX', 'BO': 'BL', 'BQ': 'NL',
  'BR': 'BR', 'BS': 'BF', 'BT': 'BT', 'BV': 'BV', 'BW': 'BC', 'BY': 'BO', 'BZ': 'BH', 'CA': 'CA', 'CC': 'CK', 'CD': 'CG',
  'CF': 'CT', 'CG': 'CF', 'CH': 'SZ', 'CI': 'IV', 'CK': 'CW', 'CL': 'CI', 'CM': 'CM', 'CN': 'CH', 'CO': 'CO', 'CR': 'CS',
  'CU': 'CU', 'CV': 'CV', 'CW': 'UC', 'CX': 'KT', 'CY': 'CY', 'CZ': 'EZ', 'DE': 'GM', 'DJ': 'DJ', 'DK': 'DA', 'DM': 'DO',
  'DO': 'DR', 'DZ': 'AG', 'EC': 'EC', 'EE': 'EN', 'EG': 'EG', 'EH': 'WI', 'ER': 'ER', 'ES': 'SP', 'ET': 'ET', 'FI': 'FI',
  'FJ': 'FJ', 'FK': 'FK', 'FM': 'FM', 'FO': 'FO', 'FR': 'FR', 'GA': 'GB', 'GB': 'UK', 'GD': 'GJ', 'GE': 'GG', 'GF': 'FR',
  'GG': 'GK', 'GH': 'GH', 'GI': 'GI', 'GL': 'GL', 'GM': 'GA', 'GN': 'GV', 'GP': 'GP', 'GQ': 'EK', 'GR': 'GR', 'GS': 'SX',
  'GT': 'GT', 'GU': 'GQ', 'GW': 'PU', 'GY': 'GY', 'HK': 'HK', 'HM': 'HM', 'HN': 'HO', 'HR': 'HR', 'HT': 'HA', 'HU': 'HU',
  'ID': 'ID', 'IE': 'EI', 'IL': 'IS', 'IM': 'IM', 'IN': 'IN', 'IO': 'IO', 'IQ': 'IZ', 'IR': 'IR', 'IS': 'IC', 'IT': 'IT',
  'JE': 'JE', 'JM': 'JM', 'JO': 'JO', 'JP': 'JA', 'KE': 'KE', 'KG': 'KG', 'KH': 'CB', 'KI': 'KR', 'KM': 'CN', 'KN': 'SC',
  'KP': 'KN', 'KR': 'KS', 'KW': 'KU', 'KY': 'CJ', 'KZ': 'KZ', 'LA': 'LA', 'LB': 'LE', 'LC': 'ST', 'LI': 'LS', 'LK': 'CE',
  'LR': 'LI', 'LS': 'LT', 'LT': 'LH', 'LU': 'LU', 'LV': 'LG', 'LY': 'LY', 'MA': 'MO', 'MC': 'MN', 'MD': 'MD', 'ME': 'MJ',
  'MF': 'RN', 'MG': 'MA', 'MH': 'RM', 'MK': 'MK', 'ML': 'ML', 'MM': 'BM', 'MN': 'MG', 'MO': 'MC', 'MP': 'CQ', 'MQ': 'MB',
  'MR': 'MR', 'MS': 'MH', 'MT': 'MT', 'MU': 'MP', 'MV': 'MV', 'MW': 'MI', 'MX': 'MX', 'MY': 'MY', 'MZ': 'MZ', 'NA': 'WA',
  'NC': 'NC', 'NE': 'NG', 'NF': 'NF', 'NG': 'NI', 'NI': 'NU', 'NL': 'NL', 'NO': 'NO', 'NP': 'NP', 'NR': 'NR', 'NU': 'NE',
  'NZ': 'NZ', 'OM': 'MU', 'PA': 'PM', 'PE': 'PE', 'PF': 'FP', 'PG': 'PP', 'PH': 'RP', 'PK': 'PK', 'PL': 'PL', 'PM': 'SB',
  'PN': 'PC', 'PR': 'RQ', 'PS': 'WE', 'PT': 'PO', 'PW': 'PS', 'PY': 'PA', 'QA': 'QA', 'RE': 'RE', 'RO': 'RO', 'RS': 'RI',
  'RU': 'RS', 'RW': 'RW', 'SA': 'SA', 'SB': 'BP', 'SC': 'SE', 'SD': 'SU', 'SE': 'SW', 'SG': 'SN', 'SH': 'SH', 'SI': 'SI',
  'SJ': 'SV', 'SK': 'LO', 'SL': 'SL', 'SM': 'SM', 'SN': 'SG', 'SO': 'SO', 'SR': 'NS', 'SS': 'OD', 'ST': 'TP', 'SV': 'ES',
  'SX': 'NN', 'SY': 'SY', 'SZ': 'WZ', 'TC': 'TI', 'TD': 'CD', 'TF': 'FS', 'TG': 'TO', 'TH': 'TH', 'TJ': 'TI', 'TK': 'TL',
  'TL': 'TT', 'TM': 'TX', 'TN': 'TS', 'TO': 'TN', 'TR': 'TU', 'TT': 'TD', 'TV': 'TV', 'TW': 'TW', 'TZ': 'TZ', 'UA': 'UP',
  'UG': 'UG', 'UM': 'FQ', 'US': 'US', 'UY': 'UY', 'UZ': 'UZ', 'VA': 'VT', 'VC': 'VC', 'VE': 'VE', 'VG': 'VI', 'VI': 'VQ',
  'VN': 'VM', 'VU': 'NH', 'WF': 'WF', 'WS': 'WS', 'YE': 'YM', 'YT': 'MF', 'ZA': 'SF', 'ZM': 'ZA', 'ZW': 'ZI'
};

export const FIPS_TO_ISO: Record<string, string> = Object.fromEntries(
  Object.entries(ISO_TO_FIPS).map(([iso, fips]) => [fips, iso])
);

export const isoToFips = (iso: string) => ISO_TO_FIPS[iso.toUpperCase()] || iso.toUpperCase();
export const fipsToIso = (fips: string) => FIPS_TO_ISO[fips.toUpperCase()] || fips.toUpperCase();

export const isEnglishSpeakingCountry = (countryCode: string) => {
  const code = countryCode.toUpperCase();
  // US, UK (GB), Canada, Australia, New Zealand, Ireland, Singapore, South Africa, India
  return ['US', 'GB', 'UK', 'CA', 'AU', 'NZ', 'IE', 'SG', 'ZA', 'IN'].includes(code);
};

export const getLanguageForCountry = (countryCode: string): string | undefined => {
  const code = countryCode.toUpperCase();
  // Map of Country ISO code to GDELT language identifier
  const languageMap: Record<string, string> = {
    // English Speaking / Official (using English as primary news language)
    'US': 'english', 'GB': 'english', 'CA': 'english', 'AU': 'english', 'NZ': 'english', 
    'IE': 'english', 'SG': 'english', 'ZA': 'english', 'PH': 'english', 'NG': 'english', 
    'GH': 'english', 'KE': 'english', 'IN': 'english', 
    
    // European
    'FR': 'french', 'MC': 'french', 'CD': 'french', 'CI': 'french', 'SN': 'french',
    'DE': 'german', 'AT': 'german', 'CH': 'german',
    'ES': 'spanish', 'MX': 'spanish', 'AR': 'spanish', 'CO': 'spanish', 'CL': 'spanish', 'PE': 'spanish', 'VE': 'spanish', 'GT': 'spanish', 'EC': 'spanish', 'CU': 'spanish', 'BO': 'spanish', 'DO': 'spanish', 'HN': 'spanish', 'PY': 'spanish', 'SV': 'spanish', 'NI': 'spanish', 'CR': 'spanish', 'PA': 'spanish', 'UY': 'spanish',
    'IT': 'italian',
    'PT': 'portuguese', 'BR': 'portuguese', 'AO': 'portuguese', 'MZ': 'portuguese',
    'RU': 'russian', 'BY': 'russian', 'KZ': 'russian',
    'NL': 'dutch', 'BE': 'dutch',
    'SE': 'swedish',
    'NO': 'norwegian',
    'DK': 'danish',
    'FI': 'finnish',
    'PL': 'polish',
    'UA': 'ukrainian',
    'RO': 'romanian',
    'CZ': 'czech',
    'HU': 'hungarian',
    'GR': 'greek',
    
    // Asian / Middle Eastern
    'CN': 'chinese', 'TW': 'chinese', 'HK': 'chinese',
    'JP': 'japanese',
    'KR': 'korean',
    'TR': 'turkish',
    'IL': 'hebrew',
    'SA': 'arabic', 'EG': 'arabic', 'AE': 'arabic', 'IQ': 'arabic', 'JO': 'arabic', 'LB': 'arabic', 'KW': 'arabic', 'OM': 'arabic', 'QA': 'arabic', 'SY': 'arabic', 'YE': 'arabic', 'MA': 'arabic', 'DZ': 'arabic', 'TN': 'arabic', 'LY': 'arabic', 'SD': 'arabic',
    'IR': 'persian',
    'ID': 'indonesian',
    'MY': 'malay',
    'TH': 'thai',
    'VN': 'vietnamese'
  };

  return languageMap[code];
};

export const getCountryName = (code: string) => {
  return code.toUpperCase();
};

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z'));
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

export const getEmojiFlag = (countryCode: string) => {
  if (!countryCode) return '';
  // Ensure we are using ISO for flag display
  const isoCode = ISO_TO_FIPS[countryCode.toUpperCase()] ? countryCode.toUpperCase() : fipsToIso(countryCode);
  const codePoints = isoCode
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const shareToTwitter = (title: string, url: string) => {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
};

export const shareToTumblr = (title: string, url: string) => {
  window.open(`https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

export const checkImage = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

export const handleWebShare = async (title: string, url: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return true;
    } catch (e) {
      return false;
    }
  }
  return false;
};
