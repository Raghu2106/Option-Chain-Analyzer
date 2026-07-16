import { useState, useCallback, DragEvent, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, TrendingUp, Clock, Twitter, Facebook, Instagram, ChevronUp, ChevronDown, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BlogSection from './components/BlogSection';

interface OptionChainRow {
  strikePrice: number;
  callOI: number;
  callChngOI: number;
  callVolume: number;
  callIV: number;
  callChng: number;
  putOI: number;
  putChngOI: number;
  putVolume: number;
  putIV: number;
  putChng: number;
  pcrOI: number;
  pcrVol: number;
  cprOI: number;
  cprVol: number;
  isSupport: boolean;
  isResistance: boolean;
  isCallIVAnomaly: boolean;
  isPutIVAnomaly: boolean;
}

export default function App() {
  const [data, setData] = useState<OptionChainRow[]>([]);
  const [spotPrice, setSpotPrice] = useState<number | null>(null);
  const [liveSpotMap, setLiveSpotMap] = useState<Record<string, number>>({});
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);
  const [timeAgo, setTimeAgo] = useState<string>('');

  const getLiveSpot = useCallback((sym: string | null): number | null => {
    if (!sym) return null;
    const cleanSym = sym.trim().toUpperCase().replace(/[\s\-_]+/g, '');
    if (liveSpotMap[cleanSym] !== undefined) return liveSpotMap[cleanSym];
    if (liveSpotMap[sym.trim().toUpperCase()] !== undefined) return liveSpotMap[sym.trim().toUpperCase()];
    return null;
  }, [liveSpotMap]);

  const updateTimeAgo = useCallback(() => {
    if (!lastLiveUpdate) return;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastLiveUpdate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      setTimeAgo(`Updated ${diffInSeconds}s ago`);
    } else {
      const mins = Math.floor(diffInSeconds / 60);
      setTimeAgo(`Updated ${mins} min${mins > 1 ? 's' : ''} ago`);
    }
  }, [lastLiveUpdate]);

  useEffect(() => {
    const timer = setInterval(updateTimeAgo, 5000); // Update every 5 seconds
    updateTimeAgo();
    return () => clearInterval(timer);
  }, [updateTimeAgo]);

  const [asOfTime, setAsOfTime] = useState<string | null>(null);
  const [symbolName, setSymbolName] = useState<string | null>(null);
  const [ivSentiment, setIvSentiment] = useState<{ skew: number, mood: string } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const homeContainerRef = useRef<HTMLDivElement>(null);

  const [anomalyStrikes, setAnomalyStrikes] = useState<number[]>([]);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'about' | 'blog' | null>(null);
  const [activePage, setActivePage] = useState<'tool' | 'blog'>('tool');
  const [openArticleId, setOpenArticleId] = useState<string | null>(null);

  const selectModal = useCallback((modal: 'privacy' | 'terms' | 'about' | 'blog' | null) => {
    setActiveModal(modal);
    if (modal) {
      window.history.pushState(null, '', `/${modal}`);
    } else {
      const recoveryPath = activePage === 'blog' 
        ? (openArticleId ? `/blog/${openArticleId}` : '/blog') 
        : '/';
      window.history.pushState(null, '', recoveryPath);
    }
  }, [activePage, openArticleId]);

  const selectArticle = useCallback((id: string | null) => {
    setOpenArticleId(id);
    if (id) {
      window.history.pushState(null, '', `/blog/${id}`);
    } else {
      window.history.pushState(null, '', '/blog');
    }
  }, []);

  const selectPage = useCallback((page: 'tool' | 'blog') => {
    setActivePage(page);
    if (page === 'tool') {
      setOpenArticleId(null);
      window.history.pushState(null, '', '/');
    } else if (page === 'blog') {
      window.history.pushState(null, '', '/blog');
    }
  }, []);

  const [logoError, setLogoError] = useState(false);
  const [showScrollPopup, setShowScrollPopup] = useState(false);
  const [hasShownPopupThisSession, setHasShownPopupThisSession] = useState(false);
  const [hasScrolledToSpot, setHasScrolledToSpot] = useState(false);
  const spotRowRef = useRef<HTMLTableRowElement>(null);

  const handleReset = useCallback(() => {
    setData([]);
    setSpotPrice(null);
    setAsOfTime(null);
    setSymbolName(null);
    setIvSentiment(null);
    setAnomalyStrikes([]);
    setError(null);
    setIsHovering(false);
  }, []);

  const handleLogoClick = useCallback(() => {
    selectPage('tool');
    handleReset();
  }, [selectPage, handleReset]);

  const fetchLiveData = useCallback(async () => {
    let csvText = "";

    // 1. Try to fetch directly from Google Sheets (per-user IP, fast & reliable)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 sec timeout for direct
      const directResponse = await fetch(
        `https://docs.google.com/spreadsheets/d/e/2PACX-1vTA7we5_ncvlBlEr4KyFryQxQjFvFJvSOQqXf3LVYyVMzGFpfjkk6P3plCBiUHhml6VCRAkXogedRNs/pub?output=csv&t=${Date.now()}`,
        { 
          signal: controller.signal,
          headers: {
            "Accept": "text/csv,text/plain,*/*"
          }
        }
      );
      clearTimeout(timeoutId);
      if (directResponse.ok) {
        const text = await directResponse.text();
        if (text && text.length > 10) {
          csvText = text;
          console.log("Direct client-side fetch of live spot prices succeeded.");
        }
      }
    } catch (e) {
      console.warn("Direct Google Sheets fetch failed, falling back to server proxy:", e);
    }

    // 2. If direct fetch didn't yield a valid CSV, fall back to our server-side proxy
    if (!csvText) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 sec timeout for proxy
        const proxyResponse = await fetch(
          `/api/live-data?t=${Date.now()}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (proxyResponse.ok) {
          const text = await proxyResponse.text();
          if (text && text.length > 10) {
            csvText = text;
            console.log("Server proxy fetch of live spot prices succeeded.");
          }
        }
      } catch (err) {
        console.error("Both direct fetch and server proxy failed to get live data:", err);
      }
    }

    // If we have valid CSV text, parse it
    if (csvText) {
      Papa.parse(csvText, {
        complete: (results) => {
          const rows = results.data as string[][];
          if (!rows || rows.length === 0) return;

          const newMap: Record<string, number> = {};
          
          const parsePriceStr = (str?: string): number | null => {
            if (!str) return null;
            const cleaned = str.trim().toUpperCase().replace(/,/g, '');
            if (cleaned === '' || cleaned === 'NOT FOUND' || cleaned === '#N/A' || cleaned.includes('N/A')) {
              return null;
            }
            const val = parseFloat(cleaned);
            return isNaN(val) ? null : val;
          };

          rows.forEach(row => {
            if (row && row.length >= 1) {
              const symbol = row[0]?.trim().toUpperCase();
              if (symbol && symbol !== 'NSE SYMBOL' && symbol !== 'SYMBOL') {
                let price = parsePriceStr(row[3]); // Column D is index 3
                if (price === null) {
                  price = parsePriceStr(row[1]); // Fallback Column B index 1
                }
                if (price === null) {
                  price = parsePriceStr(row[2]); // Fallback Column C index 2
                }

                if (price !== null) {
                  newMap[symbol] = price;
                  // Handle key normalization (remove spaces, hyphens, etc)
                  const normalizedSymbol = symbol.replace(/[\s\-_]+/g, '');
                  if (normalizedSymbol !== symbol) {
                    newMap[normalizedSymbol] = price;
                  }
                }
              }
            }
          });

          if (Object.keys(newMap).length > 0) {
            setLiveSpotMap(newMap);
            setLastLiveUpdate(new Date());
          }
        },
        header: false,
        skipEmptyLines: true
      });
    }
  }, []);

  const syncRouteFromUrl = useCallback(() => {
    const rawPath = window.location.pathname;
    const pathname = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');
    const params = new URLSearchParams(window.location.search);

    if (pathname === '/blog') {
      setActivePage('blog');
      setOpenArticleId(null);
      setActiveModal(null);
    } else if (pathname.startsWith('/blog/')) {
      const articleId = pathname.substring(6);
      setActivePage('blog');
      setOpenArticleId(articleId || null);
      setActiveModal(null);
    } else if (pathname === '/about') {
      setActivePage('tool');
      setActiveModal('about');
    } else if (pathname === '/privacy') {
      setActivePage('tool');
      setActiveModal('privacy');
    } else if (pathname === '/terms') {
      setActivePage('tool');
      setActiveModal('terms');
    } else {
      const articleParam = params.get('article');
      const pageParam = params.get('page');
      const modalParam = params.get('modal');

      if (articleParam) {
        setActivePage('blog');
        setOpenArticleId(articleParam);
        setActiveModal(null);
      } else if (pageParam === 'blog') {
        setActivePage('blog');
        setOpenArticleId(null);
        setActiveModal(null);
      } else {
        setActivePage('tool');
        setOpenArticleId(null);

        if (modalParam === 'privacy' || modalParam === 'terms' || modalParam === 'about') {
          setActiveModal(modalParam as 'privacy' | 'terms' | 'about');
        } else {
          setActiveModal(null);
        }
      }
    }
  }, []);

  useEffect(() => {
    syncRouteFromUrl();
    window.addEventListener('popstate', syncRouteFromUrl);
    return () => {
      window.removeEventListener('popstate', syncRouteFromUrl);
    };
  }, [syncRouteFromUrl]);

  useEffect(() => {
    let title = "Option Chain Analyzer - NSE Nifty & Bank Nifty Support/Resistance Tool";
    let desc = "Free NSE Option Chain Analyzer for Nifty and Bank Nifty. Instantly identify resistance and support levels using Open Interest (OI), Volume clusters, PCR, and CPR OI mapping for intraday trading.";
    let canonicalUrl = "https://optionchainanalyzer.in/";

    if (activePage === 'blog') {
      if (openArticleId === 'understanding-max-pain-theory-on-the-option-chain') {
        title = "Understanding Max Pain Theory on the Option Chain: How Option Sellers Position for Expiry";
        desc = "Explore the Max Pain Theory: a derivatives analysis model showing how index/stock prices gravitate towards the strike price where option buyers face the greatest maximum financial loss on expiry day.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/understanding-max-pain-theory-on-the-option-chain";
      } else if (openArticleId === 'understanding-implied-volatility-iv-on-the-option-chain') {
        title = "Understanding Implied Volatility (IV) on the Option Chain: A Practical Guide";
        desc = "Learn what Implied Volatility (IV) is, why it is crucial for pricing options, how to identify high/low IV on an option chain, and how to use it to optimize your options trading strategies.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/understanding-implied-volatility-iv-on-the-option-chain";
      } else if (openArticleId === 'how-traders-identify-support-and-resistance-using-option-chain-data') {
        title = "How Traders Identify Support and Resistance Using Option Chain Data";
        desc = "Learn how traders identify support and resistance levels using option chain data and Open Interest concentrations.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/how-traders-identify-support-and-resistance-using-option-chain-data";
      } else if (openArticleId === 'what-is-an-option-chain-and-why-do-traders-use-it') {
        title = "What Is an Option Chain and Why Do Traders Use It? A complete beginner's guide";
        desc = "If you are learning about options trading, one of the first terms you will encounter is the option chain. Learn how option chains are structured, how to read them, and how experienced traders analyze market sentiment, support levels, and open interest.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/what-is-an-option-chain-and-why-do-traders-use-it";
      } else if (openArticleId === 'what-is-put-call-ratio-pcr') {
        title = "What Is Put Call Ratio (PCR)? Complete Beginner Guide for Option Traders";
        desc = "Learn what Put Call Ratio (PCR) is, how it is calculated, how traders interpret PCR values, common misconceptions, limitations, and how PCR is used in option chain analysis.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/what-is-put-call-ratio-pcr";
      } else if (openArticleId === 'what-is-open-interest-oi') {
        title = "What Is Open Interest (OI)? A Complete Beginner's Guide";
        desc = "Learn what Open Interest (OI) is, how it works, how traders interpret OI changes, the difference between OI and volume, and why Open Interest is important in option chain analysis.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/what-is-open-interest-oi";
      } else if (openArticleId === 'open-interest-vs-volume') {
        title = "Open Interest vs Volume: Understanding the Key Differences";
        desc = "Learn the difference between Open Interest and Volume, how traders use each metric, and why understanding both is important for option chain analysis.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/open-interest-vs-volume";
      } else {
        title = "Market Research & Derivatives Education Blog - Option Chain Analyzer";
        desc = "Learn option chain analysis, Put Call Ratio (PCR), Open Interest (OI) clustering, and other essential derivatives trading metrics with our expert-crafted guides.";
        canonicalUrl = "https://optionchainanalyzer.in/blog";
      }
    } else if (activeModal === 'about') {
      title = "About Us - Option Chain Analyzer";
      desc = "Discover the mission and background of Option Chain Analyzer, our visual support and resistance methodology, and how we help retail traders interpret live NSE option chain data.";
      canonicalUrl = "https://optionchainanalyzer.in/about";
    } else if (activeModal === 'privacy') {
      title = "Privacy Protocol - Option Chain Analyzer";
      desc = "Read our comprehensive privacy policy governing data protection, cookies, and local browser storage security guidelines.";
      canonicalUrl = "https://optionchainanalyzer.in/privacy";
    } else if (activeModal === 'terms') {
      title = "Usage Terms & Legal Agreement - Option Chain Analyzer";
      desc = "Review the usage terms and regulatory disclaimers governing your access to the Option Chain Analyzer software, spreadsheets, and educational blogs.";
      canonicalUrl = "https://optionchainanalyzer.in/terms";
    }

    // Update document title
    document.title = title;

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', canonicalUrl);
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      document.head.appendChild(link);
    }

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', desc);
    }

    // Update og description
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);

    // Update og title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    // Update og url
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);

    // Update twitter description
    let twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', desc);
    let twDescProp = document.querySelector('meta[property="twitter:description"]');
    if (twDescProp) twDescProp.setAttribute('content', desc);

    // Update twitter title
    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);
    let twTitleProp = document.querySelector('meta[property="twitter:title"]');
    if (twTitleProp) twTitleProp.setAttribute('content', title);

    // Update twitter url
    let twUrl = document.querySelector('meta[name="twitter:url"]');
    if (twUrl) twUrl.setAttribute('content', canonicalUrl);
    let twUrlProp = document.querySelector('meta[property="twitter:url"]');
    if (twUrlProp) twUrlProp.setAttribute('content', canonicalUrl);
  }, [activePage, openArticleId, activeModal]);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  useEffect(() => {
    if (data.length > 0 && !hasScrolledToSpot) {
      // Small delay to ensure table is rendered
      const timer = setTimeout(() => {
        if (spotRowRef.current) {
          spotRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHasScrolledToSpot(true);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [data.length, hasScrolledToSpot, symbolName, liveSpotMap]);

  useEffect(() => {
    if (showScrollPopup) {
      const timer = setTimeout(() => {
        setShowScrollPopup(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showScrollPopup]);

  useEffect(() => {
    if (data.length === 0 && homeContainerRef.current) {
      homeContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [data.length]);

  const processCSV = useCallback((file: File, method: 'file_upload' | 'drag_drop' = 'file_upload') => {
    // Initial extraction from filename as hint
    const fileName = file.name.toUpperCase();
    const symbolMatch = fileName.match(/OPTION-CHAIN-ED-([^-]+)/) || fileName.match(/([A-Z]+)/);
    let detectedSymbol: string | null = null;
    
    if (symbolMatch && symbolMatch[1]) {
      detectedSymbol = symbolMatch[1];
    }

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as string[][];
          
          // More aggressive Spot Price & Instrument Detection
          let detectedSpot: number | null = null;
          let detectedInstrument: string | null = null;
          let detectedTime: string | null = null;
          
          for (const row of rawData.slice(0, 30)) { // Check more rows
            const rowStr = row.join(' ');
            
            // Look for Underlying Index/Stock info
            if (/underlying|spot|index|price|as on|value/i.test(rowStr)) {
              // Pre-strip "as on" and "as of" parts to prevent blacklist mismatch on dates
              const cleanRowStr = rowStr.split(/as\s+on|as\s+of/i)[0];
              const nameMatch = cleanRowStr.match(/(?:Index|Stock|Underlying|Instrument|Value|Name|Symbol):\s*([A-Z0-9\s\&]{2,40})/i) || 
                               cleanRowStr.match(/([A-Z\s\&]{2,20})\s+(?:\d{4,})/);
              
              if (nameMatch && nameMatch[1]) {
                const rawName = nameMatch[1].trim().toUpperCase();
                const blacklist = ['ETERNAL', 'TOTAL', 'PRICE', 'SPOT', 'INDEX', 'AS ON', 'OFFLINE', 'SYMBOL', 'UNDERLYING', 'VALUE'];
                if (!blacklist.some(b => rawName === b || rawName === b + 'S') && rawName.length >= 2) {
                  let finalName = rawName.split(/\s{2,}/)[0].split(':')[0].trim();
                  if (finalName.includes('BANK')) detectedInstrument = 'BANKNIFTY';
                  else if (finalName.includes('FIN')) detectedInstrument = 'FINNIFTY';
                  else if (finalName.includes('MID')) detectedInstrument = 'MIDCPNIFTY';
                  else if (finalName.includes('NIFTY')) detectedInstrument = 'NIFTY';
                  else detectedInstrument = finalName.match(/[A-Z0-9]+/)?.[0] || finalName;
                }
              }

              // Robust Price Extraction from current row
              const numbers = rowStr.match(/[\d,]+(?:\.\d+)?/g);
              if (numbers) {
                for (const numStr of numbers) {
                  const cleanNum = numStr.replace(/,/g, '');
                  const val = parseFloat(cleanNum);
                  // Spot prices are usually > 10, check for realistic stock/index values
                  if (val > 5 && val < 500000 && !rowStr.includes(`202${numStr.slice(-1)}`)) {
                    // Avoid matching timestamps or dates if possible
                    if (numStr.length < 10) {
                       detectedSpot = val;
                       break;
                    }
                  }
                }
              }
            }
            
            if (rowStr.toLowerCase().includes('as on')) {
              detectedTime = rowStr.split(/as on/i)[1]?.trim() || detectedTime;
            }

            if (detectedSpot && detectedInstrument) break;
          }

          // Backup: If still no spot, look for it in ANY row before the data starts
          if (!detectedSpot) {
            const dataStartIndex = rawData.findIndex(row => row.some(cell => cell.toLowerCase().includes('strike')));
            for (let i = 0; i < (dataStartIndex > -1 ? dataStartIndex : 20); i++) {
               const rowStr = rawData[i].join(' ');
               const numbers = rowStr.match(/[\d,]+\.\d{2}/g); // Look specifically for 2-decimal floats
               if (numbers) {
                 detectedSpot = parseFloat(numbers[0].replace(/,/g, ''));
                 break;
               }
            }
          }

          if (detectedInstrument) detectedSymbol = detectedInstrument;
          if (detectedSymbol) setSymbolName(detectedSymbol);
          if (detectedSpot) setSpotPrice(detectedSpot);
          if (detectedTime) setAsOfTime(detectedTime);

          const dataStartIndex = rawData.findIndex(row => 
            row.some(cell => cell.toLowerCase().includes('strike'))
          );

          if (dataStartIndex === -1) {
            setError("Could not identify the NSE format. Ensure you're dropping a valid Option Chain CSV.");
            return;
          }

          // Dynamic NSE Column indices detection
          const headerRow = rawData[dataStartIndex];
          let strikeIdx = headerRow.findIndex(cell => (cell || '').toLowerCase().includes('strike'));
          if (strikeIdx === -1) {
            strikeIdx = 11; // fallback
          }

          // Initial guess offsets based on strike location
          let callOIIdx = strikeIdx - 10;
          let callChngOIIdx = strikeIdx - 9;
          let callVolIdx = strikeIdx - 8;
          let callIVIdx = strikeIdx - 7;
          let callChngIdx = strikeIdx - 5;

          let putChngIdx = strikeIdx + 5;
          let putIVIdx = strikeIdx + 7;
          let putVolIdx = strikeIdx + 8;
          let putChngOIIdx = strikeIdx + 9;
          let putOIIdx = strikeIdx + 10;

          // Perform dynamic search on headers for robust matching
          for (let i = 0; i < headerRow.length; i++) {
            const cell = (headerRow[i] || '').trim().toUpperCase();
            if (!cell) continue;

            if (i < strikeIdx) {
              // CALLS (left side of strike)
              if (cell === 'OI' || cell === 'O.I.') {
                callOIIdx = i;
              } else if (
                cell.includes('CHNG IN OI') || 
                cell.includes('CHNG IN O.I') || 
                cell.includes('CHANGE IN OI') || 
                cell.includes('CHG IN OI') || 
                cell.includes('CHNGIN_OI') || 
                cell.includes('CHNG_IN_OI')
              ) {
                callChngOIIdx = i;
              } else if (cell.includes('VOLUME') || cell === 'VOL') {
                callVolIdx = i;
              } else if (cell === 'IV') {
                callIVIdx = i;
              } else if (
                cell === 'CHNG' || 
                cell === 'CHANGE' || 
                cell.includes('NET CHNG') || 
                cell === 'CHG' || 
                cell.includes('NET_CHNG')
              ) {
                callChngIdx = i;
              }
            } else if (i > strikeIdx) {
              // PUTS (right side of strike)
              if (cell === 'OI' || cell === 'O.I.') {
                putOIIdx = i;
              } else if (
                cell.includes('CHNG IN OI') || 
                cell.includes('CHNG IN O.I') || 
                cell.includes('CHANGE IN OI') || 
                cell.includes('CHG IN OI') || 
                cell.includes('CHNGIN_OI') || 
                cell.includes('CHNG_IN_OI')
              ) {
                putChngOIIdx = i;
              } else if (cell.includes('VOLUME') || cell === 'VOL') {
                putVolIdx = i;
              } else if (cell === 'IV') {
                putIVIdx = i;
              } else if (
                cell === 'CHNG' || 
                cell === 'CHANGE' || 
                cell.includes('NET CHNG') || 
                cell === 'CHG' || 
                cell.includes('NET_CHNG')
              ) {
                putChngIdx = i;
              }
            }
          }

          const parseNum = (val: string) => {
            if (!val || val.trim() === '-' || val.trim() === '') return 0;
            return parseFloat(val.replace(/,/g, '')) || 0;
          };

          const rows = rawData.slice(dataStartIndex + 1);
          
          // Calculate average IV near spot for anomaly detection
          let atmCallIV = 0;
          let atmPutIV = 0;
          let atmCount = 0;

          if (detectedSpot) {
            const nearSpotRows = rows.filter(r => {
              const strike = parseNum(r[strikeIdx]);
              return Math.abs(strike - (detectedSpot || 0)) <= 200;
            });
            
            nearSpotRows.forEach(r => {
              atmCallIV += parseNum(r[callIVIdx]);
              atmPutIV += parseNum(r[putIVIdx]);
              atmCount++;
            });

            if (atmCount > 0) {
              atmCallIV /= atmCount;
              atmPutIV /= atmCount;
            }
          }

          const parsedRows: OptionChainRow[] = rows
            .map(row => {
              const strike = parseNum(row[strikeIdx]);
              if (!strike || isNaN(strike)) return null;

              const coi = parseNum(row[callOIIdx]);
              const cchng = parseNum(row[callChngOIIdx]);
              const cvol = parseNum(row[callVolIdx]);
              const civ = parseNum(row[callIVIdx]);
              const cchng_prc = parseNum(row[callChngIdx]);
              
              const poi = parseNum(row[putOIIdx]);
              const pchng = parseNum(row[putChngOIIdx]);
              const pvol = parseNum(row[putVolIdx]);
              const piv = parseNum(row[putIVIdx]);
              const pchng_prc = parseNum(row[putChngIdx]);

              // Logic: PCR for Support (P/C), CPR for Resistance (C/P)
              const pcrOI = coi > 0 ? Number((poi / coi).toFixed(2)) : (poi > 0 ? 999 : 0);
              const pcrVol = cvol > 0 ? Number((pvol / cvol).toFixed(2)) : (pvol > 0 ? 999 : 0);
              const cprOI = poi > 0 ? Number((coi / poi).toFixed(2)) : (coi > 0 ? 999 : 0);
              const cprVol = pvol > 0 ? Number((cvol / pvol).toFixed(2)) : (cvol > 0 ? 999 : 0);

              // Anomaly: 25% higher than ATM average
              const isCallIVAnomaly = atmCallIV > 0 && civ > atmCallIV * 1.25;
              const isPutIVAnomaly = atmPutIV > 0 && piv > atmPutIV * 1.25;

              return {
                strikePrice: strike,
                callOI: coi,
                callChngOI: cchng,
                callVolume: cvol,
                callIV: civ,
                callChng: cchng_prc,
                putOI: poi,
                putChngOI: pchng,
                putVolume: pvol,
                putIV: piv,
                putChng: pchng_prc,
                pcrOI,
                pcrVol,
                cprOI,
                cprVol,
                isSupport: (pcrOI >= 6 || pcrVol >= 6),
                isResistance: (cprOI >= 6 || cprVol >= 6),
                isCallIVAnomaly,
                isPutIVAnomaly
              };
            })
            .filter((r): r is OptionChainRow => r !== null);

          setData(parsedRows.sort((a, b) => a.strikePrice - b.strikePrice));
          setHasScrolledToSpot(false); // Reset for new analysis
          
          if (!hasShownPopupThisSession) {
            setShowScrollPopup(true);
            setHasShownPopupThisSession(true);
          }
          
          const anomalies = parsedRows.filter(r => r.isCallIVAnomaly || r.isPutIVAnomaly).map(r => r.strikePrice);
          const uniqueAnomalies = Array.from(new Set(anomalies)).sort((a, b) => a - b);
          setAnomalyStrikes(uniqueAnomalies);

          // Calculate IV Skew Sentiment
          if (atmCallIV > 0 && atmPutIV > 0) {
            const skew = Number((atmPutIV / atmCallIV).toFixed(2));
            let mood = "Neutral";
            if (skew > 1.15) mood = "Bearish Fear (High Put Skew)";
            else if (skew < 0.85) mood = "Bullish Greed (High Call Skew)";
            setIvSentiment({ skew, mood });
          }

          setError(null);

          // Google Analytics Event
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'analyze_option_chain', {
              'analysis_method': method,
              'status': 'success'
            });
          }
        } catch (err) {
          setError("Processing error. Ensure input matches NSE India CSV format.");
        }
      },
      error: (err) => setError(`CSV Parsing Error: ${err.message}`)
    });
  }, [hasShownPopupThisSession]);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = () => {
    setIsHovering(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsHovering(false);
    const file = e.dataTransfer.files[0];
    if (file) processCSV(file, 'drag_drop');
  };

  const GuideContent = () => (
    <div className="flex flex-col gap-16 text-left w-full py-16 border-t border-slate-200/60 mt-16 bg-white rounded-[2rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
      {/* Decorative ambient elements index */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/[0.015] blur-3xl rounded-full" />
      
      {/* Informative Title Header */}
      <div className="border-b-2 border-brand-teal pb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-teal mb-2 block">TECHNICAL DOCUMENTATION</span>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight uppercase leading-tight">
          Option Chain Analyzer Operational Guide
        </h2>
        <p className="text-xs md:text-sm font-black text-slate-500 uppercase tracking-[0.2em] mt-1.5 leading-relaxed">
          User manual & systematic workflow for interpreting derivative open interest positioning
        </p>
      </div>

      {/* Section 1: User Guide */}
      <section className="space-y-8">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4 leading-none">
          1. Comprehensive Research Guide: Supplementary Analysis alongside Technical Charting
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-semibold bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
          The National Stock Exchange of India (NSE) hosts highly active derivatives segments, with liquid options contracts on major benchmark indices like Nifty 50, Bank Nifty, Financial Services Nifty (FINNIFTY), and Midcap Nifty (MIDCPNIFTY), alongside individual equity stock options. For research analysts, tracking these contracts in dense tabular layouts can be challenging. Our Option Chain Analyzer serves as a supplementary analytical dashboard, converting raw, static CSV files into intuitive, live, color-mapped visualizations. This utility should be used as a corroborative data source alongside your primary price charting platform.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          To analyze and locate potential support and resistance benchmarks as a confluence filter in conjunction with your chart analysis, follow this systematic workflow:
        </p>
        <ul className="space-y-4 text-sm md:text-base text-slate-600 font-medium">
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              1
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>Acquiring Clean Data:</strong> Begin by navigating directly to the official National Stock Exchange of India option chain dashboard (<a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-extrabold hover:scale-105 transition-transform inline-block">www.nseindia.com/option-chain</a>). Select your preferred contract—whether Nifty 50 or Bank Nifty—and click the "Download CSV" link to extract the latest snapshot.
              </p>
            </div>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              2
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>Importing the File:</strong> Simply drag and drop the `.csv` file onto our drop zone on the main page, or click "Upload CSV File" to choose it manually. Our processing engine runs 100% locally in your browser memory, keeping your analytical data private and highly secure.
              </p>
            </div>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              3
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>Locating the Spot Price & ATM Strike:</strong> The tool automatically extracts the current spot value and benchmarks the closest At-The-Money (ATM) strike. The ATM row acts as the key gravity center of the options chain and maps out a prominent highlighted container upon rendering so you never lose track of active market movements.
              </p>
            </div>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              4
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>Reading the Color-Coded Multipliers:</strong> Look at the Call and Put ratio metrics. In corporate risk management and options analysis, heavy concentration of short open interest can signal significant resistance and support layers. If a strike exhibits a Call-to-Put or Put-to-Call ratio of <strong>6.0x or more</strong>, our tool recognizes this as a high probable zone and color-highlights the strike in shades of green (strong Support) or red (strong Resistance).
              </p>
            </div>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              5
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>Tracking Implied Volatility (IV) Anomalies:</strong> Implied Volatility (IV) measures market expectation of future movement. Our analyzer calculates the ATM-centered average IV. When a single strike experiences an IV spike exceeding 25% of this average, it highlights it as an anomaly. These premium spikes are statistical "hot-spots" where market participants are anticipating or hedging against rapid price deviations.
              </p>
            </div>
          </li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium pt-2">
          By referencing these automated, highlighted zones as a supplementary layer alongside primary price action charts, analysts can quickly spot where potential high probable defense structures reside without manual calculations.
        </p>
      </section>

      {/* Section 2: PCR Deep Dive */}
      <section className="space-y-8 pt-4 border-t border-slate-100">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4 leading-none">
          2. Deep Dive Into Put-Call Ratio (PCR): Quantitative Sentiment Mapping
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          The Put-Call Ratio (PCR) is one of the most effective, mathematically derived market sentiment indicators used in derivatives analysis. While basic charts track price history, PCR maps out real-time position accumulation by market participants. In our analytical toolkit, PCR can be calculated across the entire index, or localized strike-by-strike, to show concentrated zones of dominance.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          The core overall index Put-Call Ratio utilizes a simple, clean open interest calculation:
        </p>
        <div className="bg-slate-100/60 p-6 rounded-2xl border border-slate-200/50 my-6 text-center font-mono text-sm text-brand-teal font-extrabold relative shadow-inner overflow-hidden">
          <div className="absolute top-0 left-0 text-[8px] font-black uppercase tracking-widest text-brand-teal/40 bg-white border-r border-b border-slate-200/40 px-2.5 py-0.5">MATH EQUATION</div>
          PCR (Open Interest) = Total Outstanding Put Open Interest / Total Outstanding Call Open Interest
        </div>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Because option writing (selling) requires substantial margin capital under SEBI guidelines—typically averaging over ₹1,00,000 per lot compared to the minimal premium required to buy options—the option chain is traditionally analyzed from the perspective of option writers. Option buyers are generally retail participants who are vulnerable to rapid time decay (theta), whereas option writers are well-capitalized institutions, mutual funds, and large prop desks.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          To simplify complex tabular datasets, our analyzer dynamically calculates strike-specific ratios and automatically highlights Put-Call Ratio (PCR) and Call-Put Ratio (CPR) values of <strong>6.0 and above</strong> as high-probability support and resistance zones:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="bg-emerald-50/50 border border-emerald-100/80 p-6 rounded-2xl shadow-sm hover:scale-[1.01] transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <h4 className="font-extrabold text-emerald-800 text-sm uppercase tracking-wider">High-Probability Support (PCR ≥ 6.0x)</h4>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed font-semibold">
              Highlighted in <strong>Green</strong>. Indicates that outstanding Put Open Interest or Volume is at least 6 times greater than Call Open Interest/Volume at that specific strike. This represents significant concentrated underwriting of put contracts, signaling a high probable support zone or price floor to watch on your charts.
            </p>
          </div>
          <div className="bg-rose-50/50 border border-rose-100/80 p-6 rounded-2xl shadow-sm hover:scale-[1.01] transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
              <h4 className="font-extrabold text-rose-800 text-sm uppercase tracking-wider">High-Probability Resistance (CPR ≥ 6.0x)</h4>
            </div>
            <p className="text-xs text-rose-950 leading-relaxed font-semibold">
              Highlighted in <strong>Red</strong>. Indicates that outstanding Call Open Interest or Volume is at least 6 times greater than Put Open Interest/Volume at that specific strike. This shows massive overhead underwriting of call contracts, signaling a high-probability resistance zone or price ceiling to monitor.
            </p>
          </div>
        </div>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Rather than interpreting overall index-level general sentiment, targeting these specific strike-level multiplier highlights allows you to instantly pinpoint major mathematical barriers which you can match directly against your candlesticks or trendline analysis.
        </p>
      </section>

      {/* Section 3: CPR Dynamics */}
      <section className="space-y-8 pt-4 border-t border-slate-100">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4 leading-none">
          3. Call-Put Ratio (CPR) Dynamics: Sector Resistance & High Probable Overhead Barriers
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          While retail platforms typically focus strictly on Put-Call relationships, experienced market analysts heavily monitor the reciprocal relationship: the **Call-Put Ratio (CPR)**. In our option chain interface, CPR is mapped as a high-conviction resistance indicator.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          When examining option writing trends, the Call-Put Ratio computes exactly how dominant call contracts are over put contracts at any specific strike:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 relative overflow-hidden shadow-inner flex flex-col justify-between">
            <span className="absolute top-0 right-0 text-[7px] font-black uppercase tracking-widest text-brand-teal/40 bg-white px-2 py-0.5 border-l border-b border-slate-100">OPEN INTEREST MATRICES</span>
            <div>
              <span className="block text-xs font-black uppercase text-brand-teal mb-1 tracking-wider">Open Interest Call-Put Ratio (CPR OI)</span>
              <span className="block font-mono text-xs md:text-sm text-slate-800 font-extrabold pb-2 border-b border-slate-100">CPR OI = Call Outstanding Open Interest / Put Outstanding Open Interest</span>
            </div>
            <p className="text-xs text-slate-550 mt-3 font-semibold leading-relaxed">Tracks the build-up of massive overhead blocks. High CPR OI signifies that major funds are heavily underwriting call contracts, predicting the asset will not cross that strike price.</p>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 relative overflow-hidden shadow-inner flex flex-col justify-between">
            <span className="absolute top-0 right-0 text-[7px] font-black uppercase tracking-widest text-brand-teal/40 bg-white px-2 py-0.5 border-l border-b border-slate-100">VOLUME METRICS</span>
            <div>
              <span className="block text-xs font-black uppercase text-brand-teal mb-1 tracking-wider">Volume Call-Put Ratio (CPR Vol)</span>
              <span className="block font-mono text-xs md:text-sm text-slate-800 font-extrabold pb-2 border-b border-slate-100">CPR Vol = Call Traded Volume / Put Traded Volume</span>
            </div>
            <p className="text-xs text-slate-550 mt-3 font-semibold leading-relaxed">Detects real-time volume build-up. Sudden spikes in CPR Vol show rapid resistance formation, often coinciding with capped price breakouts.</p>
          </div>
        </div>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Understanding call option underwriting requires analyzing the premium-capture goals of market-makers. Call sellers pocket options premiums upfront, in exchange for agreeing to sell the underlying asset if requested. Because indices like Nifty or Bank Nifty can rise indefinitely, call writers face high risk. Thus, when high-conviction sellers write a heavy volume of call options at a strike, they do so with deep structural conviction:
        </p>
        <ul className="space-y-4 text-sm md:text-base text-slate-600 font-medium">
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              A
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>The 6.0x Multiplier Benchmark:</strong> When our database monitors a CPR ratio (for Open Interest or Volume) crossing the <strong>6.0x barrier</strong>, our renderer triggers a prominent 3D-effect red highlighted alert. This reveals a heavily guarded high probable wall where sellers outnumber buyers 6-to-1, signaling exceptionally strong resistance.
              </p>
            </div>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              B
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>Breakout and Resistance Validation:</strong> If the index is heading upwards but approaches a strike highlighted with a high CPR OI (such as Bank Nifty nearing a major round number), analysts can check the accompanying CPR Volume. If CPR Vol also exceeds 6.0x, it is a trailing indicator that call writers are actively defending the level. Overcoming this level typically requires a substantial rise in spot-market buyer volume.
              </p>
            </div>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-8 h-8 rounded-full bg-brand-teal text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-sm shadow-brand-teal/20">
              C
            </div>
            <div className="space-y-1">
              <p className="leading-relaxed">
                <strong>Short-Covering Characteristics (Short Squeeze):</strong> If the spot price moves above a high CPR barrier on heavy volume, call writers occasionally buy back their short positions to cap exposure. This dynamic can lead to rapid price expansion as short positions are covered, visible on primary charts.
              </p>
            </div>
          </li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-semibold pt-2">
          By displaying PCR support walls and CPR resistance walls side-by-side with 3D color mapping, our Option Chain Analyzer assists in identifying active market structures to supplement your primary technical charts.
        </p>
      </section>

      {/* Section 4: Risk Management */}
      <section className="space-y-8 pt-4 border-t border-slate-100">
        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4 leading-none">
          4. Professional Risk Management: Mastering Derivatives Volatility
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Futures and Options (F&O) analysis in the Indian stock exchange is inherently high-risk. While structured data analysis like PCR, volume concentration zone analysis, and IV tracking can dramatically improve your understanding of market structure, they are ultimately mathematical probabilities. No data model is infallible, and market conditions can change instantly during major global news events, unexpected macro releases, or sudden block trades by Foreign Institutional Investors (FIIs) and Domestic Institutional Investors (DIIs).
        </p>
        <div className="p-8 bg-rose-50/65 border border-rose-100 rounded-3xl text-rose-850 relative overflow-hidden shadow-inner leading-relaxed">
          <div className="absolute top-0 right-0 text-[7px] font-black uppercase tracking-widest text-rose-500/40 bg-white border-l border-b border-rose-100 px-2.5 py-0.5">REGULATORY DISCLOSURE</div>
          <p className="text-sm md:text-base text-slate-700 leading-relaxed font-semibold">
            Securities regulatory reports (SEBI) reveal a stark statistic for retail derivative traders: <strong className="text-rose-700 font-extrabold">9 out of 10 retail traders lose money in active option trading</strong>, with average losses often wiping out entire accounts. Capital preservation is the core hallmark separating veteran analysts from beginners.
          </p>
        </div>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-extrabold pt-2">
          To safely study the NSE F&O segment, commit to these vital structural rules:
        </p>
        <ul className="space-y-4 text-sm md:text-base text-slate-600 font-medium">
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] shrink-0 mt-2" />
            <p className="leading-relaxed">
              <strong>Use Option Chain Data for Confluence, Not Execution:</strong> This tool is a secondary analytical layer. Always anchor your primary execution decisions on robust charting tools and verified regulatory data streams.
            </p>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] shrink-0 mt-2" />
            <p className="leading-relaxed">
              <strong>Enforce Uncompromising Risk Controls:</strong> Never allocate significant visual conviction to single setups. Maintain strictly conservative risk limits, avoiding leverage or excessive capital commitment regardless of indicator highlighting.
            </p>
          </li>
          <li className="flex gap-4 items-start bg-slate-50/40 p-5 rounded-2xl border border-slate-100/50 hover:bg-slate-50 hover-glow transition-all duration-200">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] shrink-0 mt-2" />
            <p className="leading-relaxed">
              <strong>Watch the Spot Chart:</strong> Option chain data is an accumulation of historical trades. While highly informative, it occasionally lags behind sudden, explosive, news-driven price spikes. Use our analyzer as a compass, but always prioritize actual price action developments on your primary spot charts.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );

  const Logo = ({ className = "w-full h-full" }: { className?: string }) => {
    const [error, setError] = useState(false);
    // Use a versioning param to bust cache
    const logoUrl = "/logo.svg?v=2";

    if (error) {
      return (
        <div className={`${className} bg-brand-teal rounded-lg flex items-center justify-center`}>
          <TrendingUp className="text-white w-2/3 h-2/3" aria-hidden="true" />
        </div>
      );
    }

    return (
      <img 
        src={logoUrl}
        alt="Option Chain Analyzer Logo" 
        className={className} 
        width="48"
        height="48"
        onError={() => setError(true)}
      />
    );
  };

  const FooterContent = () => (
    <footer className="w-full bg-slate-50/80 border-t border-slate-200/60 py-16 px-8 mt-16 rounded-t-[3rem] relative overflow-hidden backdrop-blur-md z-1">
      {/* Decorative ambient elements in footer */}
      <div className="absolute inset-0 dot-grid pointer-events-none z-0 opacity-60" />
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-brand-teal/[0.025] blur-[100px] rounded-full pointer-events-none z-0" />
      
      <div className="max-w-7xl mx-auto relative z-10 font-sans">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 flex flex-col items-start gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl shadow-brand-teal/5 border border-slate-150">
              <Logo />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-tighter text-brand-teal">Option Chain Analyzer</h3>
              <p className="text-[12px] text-slate-500 font-medium leading-relaxed max-w-[200px]">High-probability NSE data mapping and OI visualization tool.</p>
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-150 w-full">
              <a href="https://x.com/opchainanalyzer" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-brand-teal transition-all hover:scale-110" aria-label="Follow us on X">
                <Twitter size={18} />
              </a>
              <a href="https://www.facebook.com/optionchainanalyzer" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-all hover:scale-110" aria-label="Follow us on Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://www.instagram.com/optionchainanalyzer/" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#E4405F] transition-all hover:scale-110" aria-label="Follow us on Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Resources</h4>
            <div className="flex flex-col gap-3">
              <a href="/" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('tool'); handleReset(); } }} className="text-xs font-bold text-slate-650 hover:text-brand-teal transition-all text-left uppercase tracking-wider active:scale-95 cursor-pointer">Reset Platform</a>
              <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-650 hover:text-brand-teal transition-colors uppercase tracking-wider">NSE Official Source</a>
              <a href="/blog" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('blog'); } }} className="text-xs font-bold text-slate-655 hover:text-brand-teal transition-all text-left uppercase tracking-wider active:scale-95 cursor-pointer flex items-center gap-1.5 w-fit">
                <span>Blog</span>
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal animate-pulse" />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Security & Legal</h4>
            <div className="flex flex-col gap-3">
              <a href="/about" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectModal('about'); } }} className="text-xs font-bold text-slate-655 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">About Us</a>
              <a href="/privacy" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectModal('privacy'); } }} className="text-xs font-bold text-slate-655 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">Privacy Protocol</a>
              <a href="/terms" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectModal('terms'); } }} className="text-xs font-bold text-slate-655 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">Usage Terms</a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Support</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:support@optionchainanalyzer.in" className="text-xs font-bold text-slate-655 hover:text-brand-teal transition-colors uppercase tracking-wider">Contact Us</a>
              <span className="text-[11px] text-brand-teal/50 font-black uppercase tracking-widest leading-none">v1.2.0 Stable Build</span>
            </div>
          </div>
        </div>

        {/* Professional Regulatory Footer Disclaimer */}
        <div className="mt-12 pt-8 border-t border-slate-200/50 text-slate-400 space-y-3 font-medium text-[11px] leading-relaxed">
          <p className="uppercase font-black text-slate-500 tracking-wider text-[10px]">
            REGULATORY RISK WARNING &amp; FINANCIAL DISCLAIMER (SEBI COMPLIANT)
          </p>
          <p>
            Derivatives trading (Futures and Options - F&amp;O) in the equity, commodity, or currency segments involves substantial speculative leverage and carries extreme risk of capital loss. Per reports released by the Securities and Exchange Board of India (SEBI), <strong>9 out of 10 individual retail F&amp;O traders incurred net losses</strong>, with the average loss of loss-makers averaging around <strong>₹50,000 per year</strong>. Over and above these net trading losses, loss-makers spent an additional 28% of their trading losses on transaction costs, brokerage fees, and exchange taxes.
          </p>
          <p>
            <strong>OptionChainAnalyzer.in</strong> is an offline-first, browser-local analytical software utility designed strictly for personal, educational, and research purposes. All calculations, highlights (including PCR and CPR multiplier filters of 6.0x or higher), anomaly alerts, or data visualizations are computed automatically based on user-supplied CSV datasets. This tool <strong>does not</strong> provide buy, sell, or hold recommendations, nor does it offer investment, financial, tax, or legal advice. We are not a SEBI-registered advisory entity, broker, or asset management firm. 
          </p>
          <p>
            Users are solely responsible for verifying all parsed metrics, contract details, and strike calculations against official live stock exchange feeds before committing capital. Under no circumstances shall OptionChainAnalyzer.in, its authors, or affiliates be held liable for any financial losses or damages resulting from the use of this tool.
          </p>
        </div>
        
        <div className="pt-8 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-slate-450 font-black tracking-[0.4em] uppercase">
            © 2026 OptionChainAnalyzer.in • All Rights Reserved
          </p>
          <div className="flex gap-8 items-center">
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal/40">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> System Active</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]" /> Data Isolated</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/[0.015] blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />
    </footer>
  );

  return (
    <div 
      className="h-screen bg-slate-50 font-sans text-slate-900 flex flex-col relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Decorative ambient background grid and soft lighting flares */}
      <div className="absolute inset-0 dot-grid pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-teal/[0.02] rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-brand-teal/[0.015] rounded-full blur-[140px] pointer-events-none z-0" />

      {activeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-teal/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[85vh] overflow-auto p-16 premium-shadow relative animate-in fade-in zoom-in duration-300 scrollbar-none">
            <button 
              onClick={() => selectModal(null)} 
              className="absolute top-8 right-8 text-slate-400 hover:text-brand-teal transition-all hover:rotate-90 hover:scale-110 active:scale-95 flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 cursor-pointer" 
              aria-label="Close modal"
            >
              <X size={20} className="stroke-[2.5]" />
            </button>
            <div className="flex items-center gap-8 mb-16">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-3 border border-slate-100 shadow-2xl shadow-brand-teal/10">
                <Logo />
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter text-brand-teal">{activeModal === 'privacy' ? 'Privacy Policy' : activeModal === 'terms' ? 'Terms of Use' : activeModal === 'about' ? 'About Us' : 'Market Research Blog'}</h2>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1 block">{activeModal === 'about' ? 'Utility Information Detail' : activeModal === 'blog' ? 'Educational Insights & Articles' : 'Protocol Document'}</span>
              </div>
            </div>
            <div className="prose prose-slate prose-lg max-w-none">
            {activeModal === 'about' ? (
              <div className="space-y-8 text-base text-slate-600 leading-relaxed font-medium">
                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-2">
                    Our Core Mission
                  </h3>
                  <p>
                    Welcome to <strong>OptionChainAnalyzer.in</strong>. Our mission is to democratize complex derivative data analysis by providing clear, visually intuitive, and highly functional tools for independent financial researchers, retail options traders, and market students. We believe that financial literacy and thorough quantitative analysis are foundational to surviving and thriving in today's sophisticated financial markets.
                  </p>
                  <p>
                    Traditional option chain data can be incredibly overwhelming when viewed in dense, monochrome tables. By converting raw, static spreadsheets into interactive, color-mapped visualization dashboards, we help users see past the noise to identify structural market barriers, capital commitments, and volatility hotspots.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-2">
                    Bespoke High-Probability Mapping Engine
                  </h3>
                  <p>
                    OptionChainAnalyzer.in employs proprietary algorithms designed to compute strike-by-strike open interest (OI) concentration metrics instantly. Our tool focuses on two critical mathematical indexes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>
                      <strong>Put-Call Ratio (PCR):</strong> Calculated as <em>Put Open Interest / Call Open Interest</em> at individual strike levels. Ratios above 6.0x are highlighted in vibrant green, representing powerful put underwriting defense walls that act as statistical support zones.
                    </li>
                    <li>
                      <strong>Call-Put Ratio (CPR):</strong> Calculated as <em>Call Open Interest / Put Open Interest</em> at individual strike levels. Ratios above 6.0x are highlighted in crimson red, representing heavy overhead call underwriting walls that act as overhead resistance barriers.
                    </li>
                  </ul>
                  <p>
                    These highlighted layers serve as mathematical confluences. They are designed to supplement your primary technical analysis (such as support/resistance levels, trendlines, and candlestick charts) and should never be viewed as standalone execution signals.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight border-b border-slate-100 pb-2">
                    Our Commitment to Transparency and Safety
                  </h3>
                  <p>
                    We are dedicated to safety and local privacy. That is why <strong>OptionChainAnalyzer.in</strong> processes 100% of user-uploaded or dragged-and-dropped CSV files entirely client-side, right in your local browser memory. No proprietary financial information, uploaded spreadsheets, or specific ticker symbols are ever transmitted to external servers, ensuring absolute privacy for your research models.
                  </p>
                  <p>
                    We actively promote cautious risk management. Derivatives markets involve substantial speculative risk, which is why we display regulatory statistics, educational articles, and detailed guides prominently throughout our interface. We want our users to stay informed, protect their capital, and analytical tools should be the first step on that journey.
                  </p>
                </section>
              </div>
            ) : activeModal === 'privacy' ? (
              <div className="space-y-8 text-base text-slate-600 leading-relaxed font-medium">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Last Updated: June 30, 2026
                </p>
                
                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    1. Introduction and Scope
                  </h3>
                  <p>
                    This Privacy Policy describes how <strong>OptionChainAnalyzer.in</strong> ("we", "our", or "us") collects, uses, protects, and discloses information when you use our website and local analysis tool. We are fully committed to protecting your privacy and ensuring you have a secure experience when visiting our platform. By accessing or using our website, you consent to the data practices described in this policy.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    2. Local Data Processing (Zero Upload Policy)
                  </h3>
                  <p>
                    Our core application operates on an "offline-first, browser-local" model. When you upload, select, or drag-and-drop an NSE Option Chain CSV file onto our interface, the data is processed entirely in your web browser's local memory. 
                  </p>
                  <p>
                    <strong>We do not upload, transmit, store, or share your CSV files, stock symbols, target strikes, or financial datasets on our servers or with any third party.</strong> Your research remains 100% private, isolated, and confidential to your local machine.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    3. Information We Collect Automatically
                  </h3>
                  <p>
                    Like most standard website operators, we may collect non-personally identifying information of the sort that web browsers and servers typically make available, such as:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>Log Files:</strong> We collect standard internet log files including Internet Protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamps, referring or exit pages, and clickstream data. These are analyzed collectively to understand general usage trends and maintain platform security.</li>
                    <li><strong>Device Metadata:</strong> Basic information regarding your operating system, screen resolution, and language settings to ensure our responsive layout renders properly.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    4. Cookies and Third-Party Advertising (Google AdSense Disclosure)
                  </h3>
                  <p>
                    To keep our comprehensive option mapping utilities and analytical blog free of charge, we partner with third-party networks, including Google AdSense, to display relevant advertisements across our platform.
                  </p>
                  <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                    <p className="text-xs font-black uppercase text-brand-teal tracking-wider">Crucial Cookie Disclosures</p>
                    <ul className="list-disc pl-6 space-y-2 text-xs leading-relaxed text-slate-600">
                      <li>
                        <strong>Third-Party Vendors:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to our website or other websites on the Internet.
                      </li>
                      <li>
                        <strong>DoubleClick DART Cookie:</strong> Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visits to our site and/or other sites on the Internet.
                      </li>
                      <li>
                        <strong>How to Opt-Out:</strong> Users may opt out of personalized advertising by visiting Google's ad setting configurations at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-semibold">https://policies.google.com/technologies/ads</a>. Alternatively, users can opt out of third-party vendors' use of cookies for personalized advertising by visiting <a href="http://www.aboutads.info/choices/" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-semibold">www.aboutads.info/choices</a>.
                      </li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    5. GDPR and CCPA Privacy Rights
                  </h3>
                  <p>
                    We want to ensure you are fully aware of all your data protection rights. Every user is entitled to the following:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>The Right to Access:</strong> You have the right to request copies of your personal data. (Since we do not store your data, we hold no records to provide).</li>
                    <li><strong>The Right to Rectification & Erasure:</strong> You have the right to request that we correct or erase any personal information we may hold.</li>
                    <li><strong>The Right to Object/Restrict Processing:</strong> You have the right to object to or request that we restrict the processing of your data under specific conditions.</li>
                    <li><strong>CCPA "Do Not Sell" Compliance:</strong> Under the California Consumer Privacy Act, users have the right to opt-out of the sale of their personal information. We do not collect or sell any personal data.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    6. Children's Online Privacy Protection
                  </h3>
                  <p>
                    Protecting children's privacy online is of paramount importance to us. <strong>OptionChainAnalyzer.in</strong> does not knowingly collect or solicit any Personally Identifiable Information from children under the age of 13. If you believe that a child has provided us with personal information, please contact us immediately so we can take steps to remove it from our systems.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    7. Contact and Support Information
                  </h3>
                  <p>
                    If you have any questions, clarifications, or concerns regarding this Privacy Policy, please contact our support team at:
                  </p>
                  <p className="font-mono text-sm text-brand-teal font-extrabold">
                    Email: support@optionchainanalyzer.in
                  </p>
                </section>
              </div>
            ) : activeModal === 'terms' ? (
              <div className="space-y-8 text-base text-slate-600 leading-relaxed font-medium">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Last Updated: June 30, 2026
                </p>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    1. Acceptance of Terms
                  </h3>
                  <p>
                    By accessing, browsing, or utilizing the services provided on <strong>OptionChainAnalyzer.in</strong>, you agree to comply with and be bound by these Terms of Use, along with our Privacy Policy. If you do not agree with any part of these terms, you are strictly prohibited from using or accessing this website and must disconnect immediately.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    2. Use License and Limitations
                  </h3>
                  <p>
                    Permission is granted to temporarily use the Option Chain Analyzer mapping tool and read our integrated Knowledge Base materials for personal, non-commercial, and educational research purposes only. This is the grant of a license, not a transfer of title, and under this license you may not:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li>Modify, copy, reverse engineer, or decompile any software code, visualization interfaces, or mathematical highlights of OptionChainAnalyzer.in;</li>
                    <li>Use the materials or mapping tools for any commercial purpose or public display;</li>
                    <li>Sublicense, lease, rent, or redistribute the application layout or algorithmic models;</li>
                    <li>Attempt to breach local sandbox securities, manipulate iframe settings, or run unauthorized scripts.</li>
                  </ul>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight text-rose-600">
                    3. Critical Speculative Risk Warning (SEBI Statistics)
                  </h3>
                  <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-3">
                    <p className="text-xs font-black uppercase text-rose-700 tracking-wider">Regulatory F&amp;O Trading Risk Disclosure</p>
                    <p className="text-xs leading-relaxed text-slate-700 font-semibold">
                      Futures and Options (F&amp;O) trading involves substantial speculative risk and can lead to immediate, irreversible loss of capital. According to reports published by the Securities and Exchange Board of India (SEBI):
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-[11px] leading-relaxed text-slate-650 font-bold">
                      <li>9 out of 10 individual traders in the equity Options segment incurred net losses.</li>
                      <li>On average, loss-makers registered net trading losses close to ₹50,000 per year.</li>
                      <li>Over and above the net trading losses, loss-makers spent an additional 28% of net trading losses as transaction costs.</li>
                      <li>Those with net profits redirected a significant portion of their earnings toward transaction fees and exchange taxes.</li>
                    </ul>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    4. No Investment Advice Disclaimer
                  </h3>
                  <p>
                    <strong>The Option Chain Analyzer does not provide financial, investment, legal, tax, or trading advice.</strong> All calculations, ratios (such as PCR and CPR), color-coded strike indicators, or volatility spikes highlighted by our software are purely mathematical operations on user-supplied parameters. 
                  </p>
                  <p>
                    They are created solely to assist in educational data sorting and should never be construed as recommendations, BUY/SELL signals, or endorsements of any security, index, or strategy. OptionChainAnalyzer.in is not a SEBI-registered advisory entity, broker, or financial custodian. Always perform your own research and consult a certified financial advisor before committing real capital.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    5. Accuracy of User-Supplied Data
                  </h3>
                  <p>
                    This utility relies strictly on static, offline CSV files downloaded and supplied directly by the user from external web databases (such as www.nseindia.com). We do not warrant or guarantee the accuracy, completeness, timeliness, or validity of the files or parsed outputs. It is your sole responsibility to verify all technical metrics, spot prices, and contract values against official live exchange terminals before making decisions.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    6. Absolute Limitation of Liability
                  </h3>
                  <p>
                    Under no circumstances (including negligence) will OptionChainAnalyzer.in, its developers, or affiliates be liable to you or any third party for any direct, indirect, special, incidental, punitive, or consequential damages (including, without limitation, trading losses, lost profits, loss of trading capital, or data corruption) arising from the use of, or inability to use, our mapping engine, even if we have been advised of the possibility of such damages.
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                    7. Indemnification and Governing Law
                  </h3>
                  <p>
                    You agree to indemnify, defend, and hold harmless the site administrators and developers from and against any claims, losses, or expenses resulting from your breach of these terms or your speculative market activities. These Terms of Use shall be governed by and construed in accordance with the laws of India, and any disputes shall be resolved exclusively within the relevant jurisdictions.
                  </p>
                </section>
              </div>
            ) : (
              <div className="space-y-12 text-base">
                <div className="bg-brand-teal/5 border border-brand-teal/10 rounded-3xl p-8 text-center max-w-2xl mx-auto space-y-4">
                  <TrendingUp className="w-12 h-12 text-brand-teal mx-auto animate-pulse" />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide">Publishing Engine Configured!</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    The Option Chain Analyzer Knowledge Base is fully set up and ready to house your educational content. 
                  </p>
                  <div className="p-4 bg-white/80 rounded-2xl border border-slate-100 text-xs text-slate-600 font-semibold space-y-2">
                    <p className="text-brand-teal font-black">Ready for Publication</p>
                    <p>Provide your Articles or Blog text now, and they will be beautifully indexed, styled with bespoke typography, and published here instantly!</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 block mb-6">Preview of Feed Layout</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-2xl space-y-3 opacity-60">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded uppercase">Education</span>
                        <span className="text-[10px] text-slate-400 font-bold">Pending Article #1</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-sm">Understanding Strike-Specific PCR Multipliers</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">How to check support floors using the 6.0x benchmark criteria against live charts...</p>
                    </div>

                    <div className="border border-slate-100 bg-slate-50/50 p-6 rounded-2xl space-y-3 opacity-60">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded uppercase">Strategy</span>
                        <span className="text-[10px] text-slate-400 font-bold">Pending Article #2</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-sm">CPR Interpretation & Sector Resistance Walls</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">Mastering Call-Put Ratios to detect overhead resistance ceilings and market caps...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
      
      <AnimatePresence>
        {showScrollPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="relative flex flex-col items-center gap-4">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]"
              >
                <ChevronUp size={48} strokeWidth={3} />
              </motion.div>
              
              <div className="bg-slate-900/95 border border-white/10 px-6 py-3 rounded shadow-2xl backdrop-blur-md flex flex-col items-center min-w-[200px]">
                <span className="text-white font-black uppercase tracking-[0.25em] text-[10px] leading-tight text-center">
                  Scroll to view
                </span>
                <span className="text-emerald-400 font-bold uppercase tracking-[0.1em] text-[9px] leading-tight text-center mt-0.5">
                  High Probable SR Levels
                </span>
              </div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]"
              >
                <ChevronDown size={48} strokeWidth={3} />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop Overlay */}
      {isHovering && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-12 pointer-events-none">
          <div className="border-4 border-dashed border-white/40 rounded-3xl w-full h-full flex flex-col items-center justify-center text-white">
            <Upload size={80} className="mb-6 animate-bounce" />
            <p className="text-4xl font-bold tracking-tight">Drop NSE CSV to Analyze</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="h-20 border-b border-slate-200/60 bg-white/75 backdrop-blur-md px-8 flex items-center justify-between shrink-0 z-50 relative shadow-sm">
        <div className="flex items-center gap-6">
          <a 
            href="/"
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); handleLogoClick(); } }}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-brand-teal/5 flex items-center justify-center overflow-hidden border border-slate-200 p-1.5 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            aria-label="Back to home"
          >
            <Logo className="w-full h-full object-contain" />
          </a>
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-black tracking-tighter uppercase text-brand-teal leading-none text-left">
              Option Chain Analyzer
            </h1>
            {asOfTime && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Data: {asOfTime}</span>}
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6 ml-auto">
          <a 
            href="/blog" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('blog'); } }} 
            className={`text-xs font-black uppercase tracking-wider transition-all ${activePage === 'blog' && !activeModal ? 'text-brand-teal font-extrabold scale-105' : 'text-slate-600 hover:text-brand-teal'}`}
          >
            Blog
          </a>
          <a 
            href="/about" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectModal('about'); } }} 
            className={`text-xs font-black uppercase tracking-wider transition-all ${activeModal === 'about' ? 'text-brand-teal font-extrabold scale-105' : 'text-slate-600 hover:text-brand-teal'}`}
          >
            About Us
          </a>
          <a 
            href="/privacy" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectModal('privacy'); } }} 
            className={`text-xs font-black uppercase tracking-wider transition-all ${activeModal === 'privacy' ? 'text-brand-teal font-extrabold scale-105' : 'text-slate-600 hover:text-brand-teal'}`}
          >
            Privacy Protocol
          </a>
          <a 
            href="/terms" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectModal('terms'); } }} 
            className={`text-xs font-black uppercase tracking-wider transition-all ${activeModal === 'terms' ? 'text-brand-teal font-extrabold scale-105' : 'text-slate-600 hover:text-brand-teal'}`}
          >
            Terms of Use
          </a>
        </nav>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white shadow-inner">
        {activePage === 'blog' ? (
          <BlogSection 
            onBackToApp={() => selectPage('tool')}
            openArticleId={openArticleId}
            onSelectArticle={selectArticle}
          />
        ) : data.length === 0 ? (
            <div 
              ref={homeContainerRef}
              className="flex-1 flex flex-col items-center overflow-auto scrollbar-thin bg-[#fafafa] p-4 md:p-6"
            >
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center max-w-4xl w-full"
              >
                <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tighter text-brand-teal text-center leading-[1.1] uppercase max-w-3xl">
                  Analyze NSE Option Chain <br className="hidden md:block" /> data effortlessly
                </h2>
                
                <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 max-w-[2xl] text-center font-medium">
                  Upload Option Chain CSVs specifically for <strong className="text-brand-teal">NSE Indices</strong> and <strong className="text-slate-700">F&O-listed Stocks</strong> directly from the official NSE website <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-semibold whitespace-nowrap">https://www.nseindia.com/option-chain</a> to identify high probable Support & Resistance zones based on real-time OI and volume clusters.
                </p>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-black uppercase tracking-widest flex items-center gap-3 mb-6 shadow-sm"
                  >
                    <AlertCircle size={18} /> {error}
                  </motion.div>
                )}
                
                <div className="flex flex-col gap-3 mb-10">
                  <label 
                    className="px-8 py-5 bg-brand-teal text-white rounded-xl text-sm font-black uppercase tracking-[0.3em] transition-all cursor-pointer hover:shadow-lg hover:shadow-brand-teal/20 group active:scale-[0.98] border border-white/10 text-center"
                    aria-label="Upload NSE Option Chain CSV File"
                  >
                    Upload CSV File
                    <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0], 'file_upload')} />
                  </label>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600 text-center">
                    or drop it anywhere on this page
                  </p>
                </div>

                <div className="w-full border-t border-slate-200/60 mt-2 pt-10 px-4">
                  <GuideContent />
                  <FooterContent />
                </div>
              </motion.div>
            </div>

          ) : (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* Fixed Instrument Bar - Stays on top under page header */}
              <div className="bg-white border-b border-slate-200 z-50">
                <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Instrument</span>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black uppercase tracking-tighter text-brand-teal leading-none">
                          {symbolName || "Market Index"}
                        </h3>
                      </div>
                    </div>

                    {/* Live Spot Price Display */}
                    {(symbolName && getLiveSpot(symbolName) !== null) ? (
                      <div className="flex flex-col border-l border-slate-200 pl-6 ml-2">
                        <div className="flex items-center gap-1.5 mb-0.5 group relative">
                          <span className="text-[7px] font-black text-amber-600 uppercase tracking-[0.3em]">Spot Price</span>
                          <div className="relative group">
                            <Info className="w-2 h-2 text-slate-300 cursor-help hover:text-indigo-500 transition-colors" />
                            <div className="absolute left-0 top-full mt-1 w-40 p-2 bg-slate-900 border border-slate-800 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
                              <p className="text-[8px] leading-relaxed text-slate-300 font-medium normal-case tracking-normal">
                                Spot prices refresh periodically. Continuous real-time streaming is currently limited by API provider restrictions to ensure stability.
                              </p>
                              <div className="absolute -top-1 left-3 w-2 h-2 bg-slate-900 border-t border-l border-slate-800 rotate-45"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-black tabular-nums text-slate-900 leading-none tracking-tighter">
                            {getLiveSpot(symbolName)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {spotPrice && (
                            <span className={`text-[10px] font-bold tabular-nums ${(getLiveSpot(symbolName) || 0) >= spotPrice ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {(getLiveSpot(symbolName) || 0) >= spotPrice ? '▲' : '▼'} 
                              {Math.abs((((getLiveSpot(symbolName) || 0) - spotPrice) / spotPrice) * 100).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        <span className="text-[6px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{timeAgo}</span>
                      </div>
                    ) : spotPrice && (
                      <div className="flex flex-col border-l border-slate-200 pl-6 ml-2">
                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5">Static Spot Price</span>
                        <span className="text-lg font-black tabular-nums text-slate-900 leading-none tracking-tighter">
                          {spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    {/* Probable Zones Legend */}
                    <div className="hidden sm:flex flex-col border-l border-slate-200 pl-6 ml-2">
                      <span className="text-[7px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-0.5">Probability Zones</span>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_rgba(244,63,94,0.3)]"></div>
                          <span className="text-[10px] font-black text-rose-700 tracking-tight uppercase">Resistance: CPR ≥ 6</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)]"></div>
                          <span className="text-[10px] font-black text-emerald-700 tracking-tight uppercase">SUPPORT: PCR ≥ 6</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col border-l border-slate-200 pl-6 ml-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[7px] font-black text-amber-500 uppercase tracking-[0.3em]">IV Anomaly Status</span>
                      </div>
                      {anomalyStrikes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {anomalyStrikes.slice(0, 4).map(strike => (
                            <span key={strike} className="text-[9px] font-black text-amber-700 bg-amber-50 px-1 border border-amber-100 rounded tabular-nums">
                              {strike}
                            </span>
                          ))}
                          {anomalyStrikes.length > 4 && (
                            <span className="text-[7px] font-black text-slate-400">+{anomalyStrikes.length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">IV Anomaly not found</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    {ivSentiment && (
                       <div className="hidden lg:flex items-center gap-2.5 bg-white px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm mr-1">
                          <div className="flex flex-col items-end">
                            <span className="text-[6px] font-black text-slate-400 uppercase leading-none mb-0.5">Sentiment</span>
                            <span className={`text-[9px] font-black uppercase tracking-tight ${ivSentiment.mood === 'Bearish' ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {ivSentiment.mood}
                            </span>
                          </div>
                          <div className="w-[1px] h-3.5 bg-slate-100" />
                          <div className="flex flex-col items-end">
                            <span className="text-[6px] font-black text-slate-400 uppercase leading-none mb-0.5">Skew</span>
                            <span className="text-[9px] font-black text-slate-900 tabular-nums">
                              {ivSentiment.skew}
                            </span>
                          </div>
                       </div>
                    )}
                    


                    {asOfTime && (
                      <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-slate-100/50 rounded-lg border border-slate-100 text-[7px] font-bold text-slate-400">
                        <Clock size={8} className="text-slate-300" />
                        <span>Snap: {asOfTime}</span>
                      </div>
                    )}

                    <button 
                      onClick={handleReset}
                      aria-label="Reset Analysis"
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase tracking-wider transition-all hover:bg-rose-100 active:scale-95 rounded-lg shadow-sm flex items-center gap-1 border border-rose-200 cursor-pointer"
                    >
                      <AlertCircle size={11} className="text-rose-500" />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div 
                ref={tableContainerRef}
                className="flex-1 overflow-auto flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300 scroll-smooth bg-slate-50"
              >
                <div className="max-w-[1400px] w-full px-4 md:px-12 py-6">
                  <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/40 relative text-slate-900 rounded-lg overflow-visible">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-teal/5 blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                    <table className="border-separate border-spacing-0 table-fixed min-w-max w-full">
                    <caption className="sr-only">NSE Option Chain Analysis Data Table</caption>
                    <thead className="relative z-40 bg-white">
                    {/* Level 1: Category Header (High Contrast & Opaque) */}
                    <tr className="h-10 text-[10px] font-black uppercase text-white tracking-[0.2em] text-center">
                      <th colSpan={7} className="bg-slate-950 border-r border-white/5 px-4 sticky top-0 z-40 first:rounded-tl-lg">Call Analysis</th>
                      <th rowSpan={2} className="bg-brand-teal border-x border-brand-teal/20 text-white w-28 border-b-4 border-brand-teal/30 text-[11px] font-black sticky top-0 z-50 tracking-tight shadow-lg">
                        <div className="flex flex-col items-center">
                          <span className="text-[7px] text-white/50 tracking-[0.4em] font-black mb-0.5">Pivot</span>
                          Strike Price
                        </div>
                      </th>
                      <th colSpan={7} className="bg-slate-900 text-white px-4 sticky top-0 z-40 last:rounded-tr-lg">Put Analysis</th>
                    </tr>
                    {/* Level 2: Metric Header (Solid & Darker Shadow) */}
                    <tr className="h-10 text-[9px] font-black uppercase text-center bg-slate-200 border-b-2 border-slate-300">
                      <th className="w-16 text-slate-600 sticky top-10 z-30 bg-slate-200 border-r border-slate-300 italic">CHG</th>
                      <th className="w-20 text-slate-800 sticky top-10 z-30 bg-slate-200 border-r border-slate-300">OI</th>
                      <th className="w-20 text-slate-600 sticky top-10 z-30 bg-slate-200 border-r border-slate-300">Volume</th>
                      <th className="w-20 text-slate-800 sticky top-10 z-30 bg-slate-200 border-r border-slate-300">CHG OI</th>
                      <th className="w-16 text-amber-700 sticky top-10 z-30 bg-amber-200 border-r border-slate-300 font-black">IV %</th>
                      <th className="w-12 text-rose-600 sticky top-10 z-30 bg-slate-200 border-r border-slate-300 italic cursor-help" title="Call-Put Ratio (Open Interest) = Call OI / Put OI. Used to show resistance level strength.">CPR OI</th>
                      <th className="w-12 text-rose-700 sticky top-10 z-30 bg-slate-200 border-r-2 border-slate-300 italic font-black cursor-help" title="Call-Put Ratio (Volume) = Call Volume / Put Volume. Used to detect real-time resistance blocks.">CPR VOL</th>
                      <th className="w-12 text-emerald-700 sticky top-10 z-30 bg-slate-200 border-r border-slate-300 italic font-black cursor-help" title="Put-Call Ratio (Volume) = Put Volume / Call Volume. Used to detect real-time support zones.">PCR VOL</th>
                      <th className="w-12 text-emerald-600 sticky top-10 z-30 bg-slate-200 border-r border-slate-300 italic cursor-help" title="Put-Call Ratio (Open Interest) = Put OI / Call OI. Used to show support level strength.">PCR OI</th>
                      <th className="w-16 text-amber-700 sticky top-10 z-30 bg-amber-200 border-r border-slate-300 font-black">IV %</th>
                      <th className="w-20 text-slate-800 sticky top-10 z-30 bg-slate-200 border-r border-slate-300">CHG OI</th>
                      <th className="w-20 text-slate-600 sticky top-10 z-30 bg-slate-200 border-r border-slate-300">Volume</th>
                      <th className="w-20 text-slate-800 sticky top-10 z-30 bg-slate-200 border-r border-slate-300">OI</th>
                      <th className="w-16 text-slate-600 sticky top-10 z-30 bg-slate-200 italic">CHG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                    {(() => {
                      // Use live price if available
                      const livePrice = getLiveSpot(symbolName);
                      const effectiveSpot = livePrice !== null ? livePrice : (spotPrice || 0);
                      
                      // Identify highlight zones for ranking by distance
                      const supportStrikes = data
                        .filter(r => {
                          const isPutOTM = effectiveSpot !== null && r.strikePrice <= effectiveSpot;
                          return isPutOTM && (r.pcrOI >= 6 || r.pcrVol >= 6);
                        })
                        .map(r => ({ strike: r.strikePrice, dist: Math.abs(r.strikePrice - effectiveSpot) }))
                        .sort((a, b) => a.dist - b.dist);

                      const resistanceStrikes = data
                        .filter(r => {
                          const isCallOTM = effectiveSpot !== null && r.strikePrice >= effectiveSpot;
                          return isCallOTM && (r.cprOI >= 6 || r.cprVol >= 6);
                        })
                        .map(r => ({ strike: r.strikePrice, dist: Math.abs(r.strikePrice - effectiveSpot) }))
                        .sort((a, b) => a.dist - b.dist);

                      // Find the strike closest to the spot price for ATM row highlighting
                      let closestStrike = -1;
                      if (effectiveSpot !== null && data.length > 0) {
                        closestStrike = data.reduce((prev, curr) => 
                          Math.abs(curr.strikePrice - effectiveSpot) < Math.abs(prev.strikePrice - effectiveSpot) ? curr : prev
                        ).strikePrice;
                      }

                      return data.map((row) => {
                        const isAtTheMoney = row.strikePrice === closestStrike;
                        const isCallOTM = effectiveSpot !== null && row.strikePrice >= effectiveSpot;
                        const isPutOTM = effectiveSpot !== null && row.strikePrice <= effectiveSpot;
                        
                        // Get ranks for shade selection
                        const sRank = supportStrikes.findIndex(z => z.strike === row.strikePrice);
                        const rRank = resistanceStrikes.findIndex(z => z.strike === row.strikePrice);

                        let strikeHighlightClass = '';
                        if (sRank !== -1) {
                          const sShades = [
                            'bg-emerald-200 text-emerald-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]',
                            'bg-emerald-300 text-emerald-950',
                            'bg-emerald-400 text-white font-black',
                            'bg-emerald-500 text-white font-black'
                          ];
                          const baseClass = sShades[Math.min(sRank, 3)];
                          strikeHighlightClass = sRank === 0 
                            ? `${baseClass} shadow-[0_4px_12px_-2px_rgba(16,185,129,0.25)] z-10 scale-[1.02] ring-1 ring-emerald-300` 
                            : baseClass;
                        } else if (rRank !== -1) {
                          const rShades = [
                            'bg-rose-200 text-rose-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.3)]',
                            'bg-rose-300 text-rose-950',
                            'bg-rose-400 text-white font-black',
                            'bg-rose-500 text-white font-black'
                          ];
                          const baseClass = rShades[Math.min(rRank, 3)];
                          strikeHighlightClass = rRank === 0 
                            ? `${baseClass} shadow-[0_4px_12px_-2px_rgba(225,29,72,0.25)] z-10 scale-[1.02] ring-1 ring-rose-300` 
                            : baseClass;
                        }

                        return (
                            <tr 
                              key={row.strikePrice} 
                              ref={isAtTheMoney ? spotRowRef : null}
                              data-strike={row.strikePrice}
                              className={`group transition-all border-y duration-500 ${
                                isAtTheMoney 
                                  ? 'bg-emerald-50/60 relative z-20 shadow-[0_10px_30px_-10px_rgba(45,212,191,0.3),0_4px_6px_-2px_rgba(45,212,191,0.1)] border-brand-teal ring-2 ring-brand-teal/20 scale-[1.008] -translate-y-[1px]' 
                                  : 'hover:bg-slate-100/50 border-slate-100'
                              }`}
                            >
                            <td className={`text-center border-r border-slate-100 italic font-black ${row.callChng >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>{row.callChng}</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-400 font-medium">{row.callOI.toLocaleString()}</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-400 italic font-bold">{(row.callVolume / 1000).toFixed(1)}k</td>
                            <td className={`text-right px-2 border-r border-slate-100 ${row.callChngOI >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>{row.callChngOI.toLocaleString()}</td>
                            <td className={`text-center border-r border-slate-100 font-black relative ${row.isCallIVAnomaly ? 'bg-amber-100/30' : 'text-amber-400/60 font-black'}`}>
                              {row.isCallIVAnomaly && <div className="absolute inset-y-0 right-0 w-0.5 bg-amber-400/50" />}
                              <span className={row.isCallIVAnomaly ? 'text-amber-800 animate-slow-blink inline-block' : ''}>{row.callIV.toFixed(2)}</span>
                            </td>
                            <td className={`text-center border-r border-slate-100 transition-all duration-300 ${
                              (row.cprOI >= 6 && isCallOTM)
                                ? 'font-black text-[13px] text-rose-700 bg-rose-50 shadow-[0_4px_12px_-2px_rgba(225,29,72,0.15)] ring-1 ring-rose-200 relative z-10' 
                                : 'font-bold text-slate-400'
                            }`}>{row.cprOI}</td>
                            <td className={`text-center border-r-2 border-slate-200 transition-all duration-300 ${
                              (row.cprVol >= 6 && isCallOTM) 
                                ? 'font-black text-[13px] text-rose-700 bg-rose-50 shadow-[0_4px_12px_-2px_rgba(225,29,72,0.15)] ring-1 ring-rose-200 relative z-10' 
                                : 'font-bold text-slate-400'
                            }`}>{row.cprVol}</td>
                            
                            <td className={`text-center font-black border-x border-slate-200 text-[11px] py-2 tracking-tight relative transition-all duration-300 ${
                              isAtTheMoney 
                                ? 'bg-brand-teal text-white ring-1 ring-white/10 z-20 shadow-lg scale-[1.005]' 
                                : strikeHighlightClass
                                  ? strikeHighlightClass
                                  : 'bg-slate-50/80 text-brand-teal/80 group-hover:text-brand-teal transition-colors'
                            }`}>
                               {row.strikePrice.toLocaleString()}
                            </td>
                            
                            <td className={`text-center border-r border-slate-100 transition-all duration-300 ${
                              (row.pcrVol >= 6 && isPutOTM) 
                                ? 'font-black text-[13px] text-emerald-700 bg-emerald-50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)] ring-1 ring-emerald-200 relative z-10' 
                                : 'font-bold text-slate-400'
                            }`}>{row.pcrVol}</td>
                            <td className={`text-center border-r border-slate-100 transition-all duration-300 ${
                              (row.pcrOI >= 6 && isPutOTM)
                                ? 'font-black text-[13px] text-emerald-700 bg-emerald-50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)] ring-1 ring-emerald-200 relative z-10' 
                                : 'font-bold text-slate-400'
                            }`}>{row.pcrOI}</td>
                            <td className={`text-center border-r border-slate-100 font-black relative ${row.isPutIVAnomaly ? 'bg-amber-100/30' : 'text-amber-400/60 font-black'}`}>
                              {row.isPutIVAnomaly && <div className="absolute inset-y-0 left-0 w-0.5 bg-amber-400/50" />}
                              <span className={row.isPutIVAnomaly ? 'text-amber-800 animate-slow-blink inline-block' : ''}>{row.putIV.toFixed(2)}</span>
                            </td>
                            <td className={`text-right px-2 border-r border-slate-100 ${row.putChngOI >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>{row.putChngOI.toLocaleString()}</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-400 italic font-bold">{(row.putVolume / 1000).toFixed(1)}k</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-400 font-medium">{row.putOI.toLocaleString()}</td>
                            <td className={`text-center italic font-black ${row.putChng >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>{row.putChng}</td>
                          </tr>
                        );
                      });
                    })()}
                </tbody>
              </table>
            </div>

            {/* SEBI Compliance Professional Disclaimer */}
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-8 mb-16 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Compliance & Regulatory Notice</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-[12px] font-bold text-slate-600 leading-relaxed uppercase tracking-tight">
                      Standard Disclaimer: Investment in securities market are subject to market risks. Read all the related documents carefully before investing. 
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      This application is an <span className="font-bold text-brand-teal">Analytical Utility</span> provided for educational and data visualization purposes only. It retrieves and processes public domain data from the National Stock Exchange of India (NSE). 
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-white/60 rounded-2xl border border-slate-200/60 shadow-sm">
                      <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                        <strong className="text-slate-800 uppercase text-[9px] mb-1 block tracking-widest">No Investment Advice</strong>
                        The support/resistance levels and IV anomalies identified by this tool are mathematical derivations based on Open Interest trends. These are NOT buy/sell signals. The platform owner is NOT a SEBI Registered Investment Advisor.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                     <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Calculated from NSE CSV Export (As of {asOfTime || 'N/A'})</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em]">Verified Analytical Framework</span>
                   </div>
                </div>
              </div>
              <AlertCircle size={120} className="absolute -bottom-8 -right-8 text-slate-200/30 group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
            </div>

            <div className="max-w-4xl mx-auto px-4">
              <GuideContent />
            </div>
            <FooterContent />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }
