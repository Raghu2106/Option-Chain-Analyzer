import { useState, useCallback, DragEvent, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, TrendingUp, Clock, Twitter, Facebook, Instagram, ChevronUp, ChevronDown, Info, X, Menu, X as CloseIcon, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BlogSection from './components/BlogSection';
import { ContactPage, DisclaimerPage, AboutPage, PrivacyPage, TermsPage } from './components/StaticPages';

export interface OptionChainRow {
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

export type AppPage = 'tool' | 'blog' | 'about' | 'contact' | 'disclaimer' | 'privacy' | 'terms';

export default function App() {
  const [data, setData] = useState<OptionChainRow[]>([]);
  const [spotPrice, setSpotPrice] = useState<number | null>(null);
  const [symbolName, setSymbolName] = useState<string | null>(null);
  const [asOfTime, setAsOfTime] = useState<string | null>(null);
  const [ivSentiment, setIvSentiment] = useState<{ skew: number, mood: string } | null>(null);
  const [anomalyStrikes, setAnomalyStrikes] = useState<number[]>([]);
  const [liveSpotMap, setLiveSpotMap] = useState<Record<string, number>>({});
  const [lastLiveUpdate, setLastLiveUpdate] = useState<Date | null>(null);
  const [isSyncingSpot, setIsSyncingSpot] = useState(false);

  const getLiveSpot = useCallback((sym: string | null): number | null => {
    if (!sym) return null;
    const cleanSym = sym.trim().toUpperCase().replace(/[\s\-_]+/g, '');
    if (liveSpotMap[cleanSym] !== undefined) return liveSpotMap[cleanSym];
    if (liveSpotMap[sym.trim().toUpperCase()] !== undefined) return liveSpotMap[sym.trim().toUpperCase()];
    return null;
  }, [liveSpotMap]);

  const formattedLastSync = lastLiveUpdate
    ? `Synced ${lastLiveUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';

  const [isHovering, setIsHovering] = useState(false);
  const [isGuideExpanded, setIsGuideExpanded] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const homeContainerRef = useRef<HTMLDivElement>(null);

  const [activePage, setActivePage] = useState<AppPage>(() => {
    if (typeof window === 'undefined') return 'tool';
    const rawPath = window.location.pathname;
    const pathname = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');
    if (pathname === '/blog' || pathname.startsWith('/blog/')) return 'blog';
    if (pathname === '/about') return 'about';
    if (pathname === '/contact') return 'contact';
    if (pathname === '/disclaimer') return 'disclaimer';
    if (pathname === '/privacy' || pathname === '/privacy-policy') return 'privacy';
    if (pathname === '/terms' || pathname === '/terms-of-service') return 'terms';
    return 'tool';
  });

  const [openArticleId, setOpenArticleId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const rawPath = window.location.pathname;
    const pathname = rawPath === '/' ? '/' : rawPath.replace(/\/$/, '');
    if (pathname.startsWith('/blog/')) {
      return pathname.substring(6) || null;
    }
    const params = new URLSearchParams(window.location.search);
    return params.get('article') || null;
  });

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'about' | 'blog' | null>(null);

  const selectPage = useCallback((page: AppPage) => {
    setActivePage(page);
    setActiveModal(null);
    setIsMobileMenuOpen(false);
    if (page === 'tool') {
      setOpenArticleId(null);
      window.history.pushState(null, '', '/');
    } else if (page === 'blog') {
      window.history.pushState(null, '', '/blog');
    } else {
      setOpenArticleId(null);
      window.history.pushState(null, '', `/${page}`);
    }
    homeContainerRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const selectArticle = useCallback((id: string | null) => {
    setOpenArticleId(id);
    setIsMobileMenuOpen(false);
    if (id) {
      window.history.pushState(null, '', `/blog/${id}`);
    } else {
      window.history.pushState(null, '', '/blog');
    }
  }, []);

  const selectModal = useCallback((modal: 'privacy' | 'terms' | 'about' | 'blog' | null) => {
    if (modal === 'about' || modal === 'privacy' || modal === 'terms') {
      selectPage(modal);
      return;
    }
    if (modal === 'blog') {
      selectPage('blog');
      return;
    }
    selectPage('tool');
  }, [selectPage]);

  const [logoError, setLogoError] = useState(false);
  const [showScrollPopup, setShowScrollPopup] = useState(false);
  const [hasShownPopupThisSession, setHasShownPopupThisSession] = useState(false);
  const [hasScrolledToSpot, setHasScrolledToSpot] = useState(false);
  const spotRowRef = useRef<HTMLTableRowElement>(null);
  const spotStrikeCellRef = useRef<HTMLTableCellElement>(null);
  const lastScrolledStrikeRef = useRef<number | null>(null);

  const handleReset = useCallback(() => {
    setData([]);
    setSpotPrice(null);
    setAsOfTime(null);
    setSymbolName(null);
    setIvSentiment(null);
    setAnomalyStrikes([]);
    setError(null);
    setIsHovering(false);
    setHasScrolledToSpot(false);
    lastScrolledStrikeRef.current = null;
  }, []);

  const handleLogoClick = useCallback(() => {
    selectPage('tool');
    setIsMobileMenuOpen(false);
  }, [selectPage]);

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
      setActivePage('about');
      setOpenArticleId(null);
      setActiveModal(null);
    } else if (pathname === '/contact') {
      setActivePage('contact');
      setOpenArticleId(null);
      setActiveModal(null);
    } else if (pathname === '/disclaimer') {
      setActivePage('disclaimer');
      setOpenArticleId(null);
      setActiveModal(null);
    } else if (pathname === '/privacy' || pathname === '/privacy-policy') {
      setActivePage('privacy');
      setOpenArticleId(null);
      setActiveModal(null);
    } else if (pathname === '/terms' || pathname === '/terms-of-service') {
      setActivePage('terms');
      setOpenArticleId(null);
      setActiveModal(null);
    } else {
      const articleParam = params.get('article');
      const pageParam = params.get('page');

      if (articleParam) {
        setActivePage('blog');
        setOpenArticleId(articleParam);
        setActiveModal(null);
      } else if (pageParam === 'blog') {
        setActivePage('blog');
        setOpenArticleId(null);
        setActiveModal(null);
      } else if (pageParam === 'about' || pageParam === 'contact' || pageParam === 'disclaimer' || pageParam === 'privacy' || pageParam === 'terms') {
        setActivePage(pageParam as AppPage);
        setOpenArticleId(null);
        setActiveModal(null);
      } else {
        setActivePage('tool');
        setOpenArticleId(null);
        setActiveModal(null);
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
    let title = "Option Chain Analyzer - NSE Nifty & Bank Nifty Educational Tool";
    let desc = "Free NSE Option Chain Analyzer for Nifty and Bank Nifty. Visualize Put-Call Ratio (PCR), Call-Put Ratio (CPR), Open Interest clusters, and Implied Volatility locally in your browser.";
    let canonicalUrl = "https://optionchainanalyzer.in/";

    if (activePage === 'blog') {
      if (openArticleId === 'global-central-bank-liquidity-shifts-nse-derivatives') {
        title = "Global Central Bank Liquidity Cycles: How Macro Shocks Transmit to NSE Option Chain";
        desc = "An educational overview of how policy rate decisions by major central banks alter cross-border capital flows and Implied Volatility on Indian benchmark indices.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/global-central-bank-liquidity-shifts-nse-derivatives";
      } else if (openArticleId === 'geopolitical-trade-corridor-disruptions-market-volatility') {
        title = "Geopolitical Developments & Global Trade Disruptions: Reading Derivatives Sentiment on the NSE";
        desc = "An educational guide on how geopolitical events, global supply chain bottlenecks, and trade policy updates impact energy inputs, India VIX, and option chain structures.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/geopolitical-trade-corridor-disruptions-market-volatility";
      } else if (openArticleId === 'nasdaq-tech-earnings-wall-street-cues-nifty-opening-gaps') {
        title = "Overnight Wall Street & Global Cues: Understanding Opening Price Adjustments on the NSE";
        desc = "How overnight US index moves, global technology earnings, and Gift Nifty pricing shape domestic opening gaps and early-session open interest updates on the NSE.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/nasdaq-tech-earnings-wall-street-cues-nifty-opening-gaps";
      } else if (openArticleId === 'what-is-an-option-chain-and-why-do-traders-use-it') {
        title = "What Is an Option Chain? Understanding Calls, Puts, and Strike Structure";
        desc = "A clear beginner guide explaining how NSE option chains organize strike prices, Calls, Puts, Last Traded Price (LTP), and Open Interest in a single tabular matrix.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/what-is-an-option-chain-and-why-do-traders-use-it";
      } else if (openArticleId === 'open-interest-vs-volume') {
        title = "Open Interest vs. Trading Volume: How Exchange Participation Is Measured";
        desc = "Understand the difference between Open Interest (active unsettled contracts) and Volume (daily transaction count), and how both metrics work together in derivatives data.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/open-interest-vs-volume";
      } else if (openArticleId === 'what-is-put-call-ratio-pcr') {
        title = "Put-Call Ratio (PCR) & Max Pain: Analytical Concepts Explained";
        desc = "Learn how Put-Call Ratio (PCR), Call-Put Ratio (CPR), and Max Pain formulas are calculated from exchange open interest data, along with their mathematical limitations.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/what-is-put-call-ratio-pcr";
      } else if (openArticleId === 'understanding-implied-volatility-iv-on-the-option-chain') {
        title = "Implied Volatility (IV) & Option Greeks: Educational Risk Awareness";
        desc = "An introduction to Implied Volatility (IV) and the four core Option Greeks—Delta, Gamma, Theta, and Vega—explaining how time decay and volatility impact option pricing risk.";
        canonicalUrl = "https://optionchainanalyzer.in/blog/understanding-implied-volatility-iv-on-the-option-chain";
      } else {
        title = "Educational Derivatives & Global Macro Blog - Option Chain Analyzer";
        desc = "Concise, non-advisory guides explaining NSE option chain structure, global macro transmission, Put-Call Ratios, and derivatives risk literacy.";
        canonicalUrl = "https://optionchainanalyzer.in/blog";
      }
    } else if (activePage === 'about') {
      title = "About Us - Option Chain Analyzer";
      desc = "Discover the mission and background of Option Chain Analyzer, our visual support and resistance methodology, and how we help retail traders interpret live NSE option chain data.";
      canonicalUrl = "https://optionchainanalyzer.in/about";
    } else if (activePage === 'contact') {
      title = "Contact Us - Option Chain Analyzer Help & Support";
      desc = "Get in touch with the Option Chain Analyzer Helpdesk for feedback, CSV parsing questions, or technical support.";
      canonicalUrl = "https://optionchainanalyzer.in/contact";
    } else if (activePage === 'disclaimer') {
      title = "SEBI Compliance & Financial Risk Disclaimer - Option Chain Analyzer";
      desc = "Review statutory SEBI regulatory disclosures, retail loss studies, and the non-advisory educational status of the Option Chain Analyzer software.";
      canonicalUrl = "https://optionchainanalyzer.in/disclaimer";
    } else if (activePage === 'privacy') {
      title = "Privacy Protocol - Option Chain Analyzer";
      desc = "Read our comprehensive privacy policy governing data protection, cookies, and local browser storage security guidelines.";
      canonicalUrl = "https://optionchainanalyzer.in/privacy";
    } else if (activePage === 'terms') {
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

  const handleManualSpotSync = useCallback(async () => {
    setIsSyncingSpot(true);
    try {
      await fetchLiveData();
    } finally {
      setIsSyncingSpot(false);
    }
  }, [fetchLiveData]);

  useEffect(() => {
    if (activePage !== 'tool') {
      setHasScrolledToSpot(false);
      lastScrolledStrikeRef.current = null;
      return;
    }

    if (data.length === 0) return;

    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        const container = tableContainerRef.current;
        const row = spotRowRef.current;
        const strikeCell = spotStrikeCellRef.current;
        if (!container || !row) return;

        const currentStrike = row.dataset.strike ? Number(row.dataset.strike) : null;
        if (hasScrolledToSpot && currentStrike !== null && lastScrolledStrikeRef.current === currentStrike) {
          return;
        }

        const containerRect = container.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const stickyHeaderHeight = 80; // Two sticky header rows (h-10 + h-10)
        const visibleHeight = Math.max(100, container.clientHeight - stickyHeaderHeight);
        const targetTop = Math.max(
          0,
          container.scrollTop + (rowRect.top - containerRect.top) - stickyHeaderHeight - (visibleHeight - rowRect.height) / 2
        );

        let targetLeft = container.scrollLeft;
        if (strikeCell) {
          const cellRect = strikeCell.getBoundingClientRect();
          targetLeft = Math.max(
            0,
            container.scrollLeft + (cellRect.left - containerRect.left) - (container.clientWidth - cellRect.width) / 2
          );
        }

        container.scrollTo({
          top: targetTop,
          left: targetLeft,
          behavior: 'smooth',
        });

        setHasScrolledToSpot(true);
        lastScrolledStrikeRef.current = currentStrike;
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [activePage, data, hasScrolledToSpot, symbolName, spotPrice, liveSpotMap]);

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

  const processCSV = useCallback((fileOrContent: File | string, method: 'file_upload' | 'drag_drop' | 'sample_data' = 'file_upload') => {
    // Initial extraction from filename as hint
    let detectedSymbol: string | null = null;
    if (typeof fileOrContent !== 'string') {
      const fileName = fileOrContent.name.toUpperCase();
      const symbolMatch = fileName.match(/OPTION-CHAIN-ED-([^-]+)/) || fileName.match(/([A-Z]+)/);
      if (symbolMatch && symbolMatch[1]) {
        detectedSymbol = symbolMatch[1];
      }
    } else {
      detectedSymbol = 'NIFTY';
    }

    Papa.parse(fileOrContent as any, {
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
            const dataStartIndex = rawData.findIndex(row => row.some(cell => String(cell || '').toLowerCase().includes('strike')));
            for (let i = 0; i < (dataStartIndex > -1 ? dataStartIndex : 20); i++) {
               const rowStr = (rawData[i] || []).join(' ');
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
            row.some(cell => String(cell || '').toLowerCase().includes('strike'))
          );

          if (dataStartIndex === -1) {
            setError("Could not identify the NSE format. Ensure you're dropping a valid Option Chain CSV.");
            return;
          }

          // Dynamic NSE Column indices detection
          const headerRow = rawData[dataStartIndex];
          let strikeIdx = headerRow.findIndex(cell => String(cell || '').toLowerCase().includes('strike'));
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

          // Perform dynamic search on headers for robust matching across single or dual header structures
          const headerRowsToSearch = [rawData[dataStartIndex]];
          if (dataStartIndex + 1 < rawData.length) {
            headerRowsToSearch.push(rawData[dataStartIndex + 1]);
          }

          headerRowsToSearch.forEach(hRow => {
            for (let i = 0; i < hRow.length; i++) {
              const cell = (hRow[i] || '').trim().toUpperCase();
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
          });

          const parseNum = (val: any) => {
            if (val === undefined || val === null) return 0;
            const strVal = String(val).trim();
            if (strVal === '-' || strVal === '') return 0;
            const parsed = parseFloat(strVal.replace(/,/g, ''));
            return isNaN(parsed) ? 0 : parsed;
          };

          let dataStartIndexActual = dataStartIndex + 1;
          if (dataStartIndex + 1 < rawData.length) {
            const nextRowStr = rawData[dataStartIndex + 1].join(' ').toLowerCase();
            if (nextRowStr.includes('oi') || nextRowStr.includes('ltp') || nextRowStr.includes('volume') || nextRowStr.includes('bid')) {
              dataStartIndexActual = dataStartIndex + 2;
            }
          }

          const rows = rawData.slice(dataStartIndexActual);
          
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

          fetchLiveData();
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
  }, [hasShownPopupThisSession, fetchLiveData]);

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
    <div className="flex flex-col text-left w-full border border-slate-200 mt-12 bg-white rounded-2xl shadow-xs relative overflow-hidden transition-all duration-300">
      {/* Clickable Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsGuideExpanded(!isGuideExpanded)}
        className="w-full text-left p-6 md:p-8 flex items-center justify-between gap-4 transition-colors hover:bg-slate-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal select-none group cursor-pointer"
        aria-expanded={isGuideExpanded}
        aria-label="Toggle User Guide and How to Use Option Chain Analyzer"
      >
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-teal block">
              User Guide &amp; Reference
            </span>
            <span className="text-[9px] font-bold text-slate-500 bg-slate-100 group-hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200/80 transition-colors uppercase tracking-wider">
              {isGuideExpanded ? "Click to collapse ▲" : "Click to expand ▼"}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase leading-snug group-hover:text-brand-teal transition-colors">
            How to Use Option Chain Analyzer
          </h2>
          <p className="text-xs md:text-sm font-semibold text-slate-500 mt-1">
            A concise guide to analyzing NSE Open Interest, Put-Call Ratios, and Volatility anomalies
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 transition-all duration-200 shrink-0 group-hover:bg-slate-200 group-hover:text-brand-teal">
          {isGuideExpanded ? (
            <ChevronUp size={20} className="text-brand-teal" />
          ) : (
            <ChevronDown size={20} className="text-slate-600" />
          )}
        </div>
      </button>

      {/* Collapsible Content Section */}
      <AnimatePresence initial={false}>
        {isGuideExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-slate-200"
          >
            <div className="flex flex-col gap-10 p-6 md:p-10 pt-8">
              {/* Section 1: Quick Start Workflow */}
              <section className="space-y-4">
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100">
                  1. Quick Start Workflow
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Option Chain Analyzer processes official National Stock Exchange of India (NSE) option chain CSV exports directly in your browser. All computations run 100% locally in your device memory—no data is uploaded or stored on any external server.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-teal text-white flex items-center justify-center text-xs font-black">1</div>
                    <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Download Official CSV</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Visit <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">nseindia.com/option-chain</a>, select your index or stock, and download the CSV snapshot.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-teal text-white flex items-center justify-center text-xs font-black">2</div>
                    <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Upload or Drop File</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Drag and drop the CSV into the upload area above, or click "Upload CSV File". The parser automatically extracts spot prices and contract strikes.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="w-7 h-7 rounded-lg bg-brand-teal text-white flex items-center justify-center text-xs font-black">3</div>
                    <h4 className="text-xs font-bold uppercase text-slate-900 tracking-wider">Analyze Key Levels</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Examine the At-The-Money (ATM) strike, automated Support (PCR ≥ 6.0x) and Resistance (CPR ≥ 6.0x) zones, and IV anomaly tags.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 2: Key Indicators Explained */}
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100">
                  2. Key Derivatives Indicators Explained
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-brand-teal tracking-wider">Open Interest (OI) &amp; Change in OI</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Open Interest represents the total active, unsettled option contracts. High OI at specific strikes reflects institutional positioning. Increasing OI confirms new positions, while decreasing OI signals position unwinding or profit booking.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-brand-teal tracking-wider">At-The-Money (ATM) Strike</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      The strike price closest to the underlying spot price. It serves as the market pivot point where gamma and volatility changes have the most immediate impact on option prices.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-brand-teal tracking-wider">Put-Call Ratio (PCR)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Calculated as <code className="font-semibold text-slate-800">Put Open Interest ÷ Call Open Interest</code>. A high PCR indicates stronger put open interest relative to calls, signaling that option writers are establishing support floors.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-brand-teal tracking-wider">Call-Put Ratio (CPR)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Calculated as <code className="font-semibold text-slate-800">Call Open Interest ÷ Put Open Interest</code>. A high CPR indicates heavy call open interest relative to puts, signaling strong overhead resistance from option writers.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 3: Interpreting Support & Resistance Multipliers */}
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100">
                  3. Automated Support &amp; Resistance Highlights (6.0x Rule)
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Writing options requires substantial margin capital under exchange guidelines. Consequently, strikes with massive open interest concentrations often act as reference boundaries defended by institutional writers:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-emerald-900 tracking-wider">Support Concentration (PCR ≥ 6.0x)</h4>
                    <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                      Highlighted in <strong>Green</strong>. Indicates Put Open Interest is at least 6 times greater than Call Open Interest at that strike, identifying an institutional put-writing floor.
                    </p>
                  </div>
                  <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
                    <h4 className="text-xs font-bold uppercase text-rose-900 tracking-wider">Resistance Concentration (CPR ≥ 6.0x)</h4>
                    <p className="text-xs text-rose-950 leading-relaxed font-medium">
                      Highlighted in <strong>Red</strong>. Indicates Call Open Interest is at least 6 times greater than Put Open Interest at that strike, identifying a heavy call-writing ceiling.
                    </p>
                  </div>
                </div>
              </section>

              {/* Section 4: Risk Management & Compliance */}
              <section className="space-y-4 pt-2 border-t border-slate-100">
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide pb-2 border-b border-slate-100">
                  4. Risk Management &amp; SEBI Compliance
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                  Derivatives trading carries significant financial risk. According to research published by the Securities and Exchange Board of India (SEBI), <strong>9 out of 10 individual retail traders in the equity futures and options segment incur net financial losses</strong>.
                </p>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600 leading-relaxed font-medium">
                  <p>
                    <strong>Educational Study Only:</strong> Option chain open interest distribution should always be studied alongside official exchange records and primary price data rather than treated as standalone forecasts.
                  </p>
                  <p>
                    <strong>No Investment Advice:</strong> Option Chain Analyzer is an independent analytical tool built strictly for educational and informational purposes. We do not provide trading recommendations, buy/sell calls, or financial advice.
                  </p>
                </div>
              </section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
    <footer className="w-full bg-slate-50/90 border-t border-slate-200 py-14 px-6 md:px-8 mt-14 relative z-10">
      <div className="max-w-7xl mx-auto font-sans">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1 flex flex-col items-start gap-5">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2 shadow-sm border border-slate-200">
              <Logo />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-tight text-brand-teal">Option Chain Analyzer</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-[240px]">
                Independent NSE derivatives data visualization and educational open interest reference utility operated from Bengaluru, India.
              </p>
            </div>
            <div className="flex gap-4 pt-3 border-t border-slate-200 w-full">
              <a href="https://x.com/opchainanalyzer" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-brand-teal transition-colors p-1" aria-label="Follow us on X">
                <Twitter size={18} />
              </a>
              <a href="https://www.facebook.com/optionchainanalyzer" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#1877F2] transition-colors p-1" aria-label="Follow us on Facebook">
                <Facebook size={18} />
              </a>
              <a href="https://www.instagram.com/optionchainanalyzer/" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-[#E4405F] transition-colors p-1" aria-label="Follow us on Instagram">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Resources</h4>
            <div className="flex flex-col gap-2.5">
              <a href="/" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('tool'); } }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">Analyzer Platform</a>
              <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">NSE Official Source</a>
              <a href="/blog" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('blog'); } }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">Blog</a>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Legal &amp; Publisher</h4>
            <div className="flex flex-col gap-2.5">
              <a href="/about" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('about'); } }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">About Us</a>
              <a href="/contact" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('contact'); } }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">Contact Us</a>
              <a href="/disclaimer" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('disclaimer'); } }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">SEBI Disclaimer</a>
              <a href="/privacy" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('privacy'); } }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">Privacy Policy</a>
              <a href="/terms" onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('terms'); } }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider cursor-pointer">Terms of Use</a>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Help &amp; Support</h4>
            <div className="flex flex-col gap-2">
              <a href="mailto:opchainanalyzer@gmail.com" className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors lowercase">opchainanalyzer@gmail.com</a>
              <p className="text-[11px] text-slate-500 font-medium pt-1">
                Helpdesk · Bengaluru, India
              </p>
            </div>
          </div>
        </div>

        {/* Professional Regulatory Footer Disclaimer */}
        <div className="pt-8 border-t border-slate-200 text-slate-500 space-y-3 font-medium text-[11px] leading-relaxed">
          <p className="uppercase font-black text-slate-600 tracking-wider text-[10px]">
            Regulatory Risk Warning &amp; Financial Disclaimer (SEBI Compliant)
          </p>
          <p>
            Derivatives trading (Futures and Options - F&amp;O) in equity, commodity, or currency segments carries substantial risk of capital loss. According to research published by the Securities and Exchange Board of India (SEBI), <strong>9 out of 10 individual retail F&amp;O traders incurred net losses</strong>, with loss-makers spending significant additional capital on brokerage and statutory taxes.
          </p>
          <p>
            <strong>OptionChainAnalyzer.in</strong> is a browser-local analytical utility designed strictly for personal, educational, and informational purposes. Calculations, ratio highlights (PCR/CPR ≥ 6.0x), and IV outlier tags are derived purely from CSV datasets and public exchange feeds. This platform <strong>does not</strong> provide buy, sell, or hold recommendations, nor financial, tax, or legal advice.
          </p>
        </div>
        
        <div className="pt-6 mt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[11px] text-slate-500 font-bold tracking-wider uppercase text-center sm:text-left">
            © 2026 OptionChainAnalyzer.in · Educational Use Only
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">
            Not a SEBI-Registered Advisory Entity
          </p>
        </div>
      </div>
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

      {/* Header — Strict 3-zone navigation with accessible mobile drawer */}
      <header className="h-16 md:h-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0 z-50 relative">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <a 
            href="/"
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); handleLogoClick(); } }}
            className="w-10 h-10 bg-white rounded-xl shadow-xs flex items-center justify-center overflow-hidden border border-slate-200 p-1.5 transition-colors hover:border-brand-teal/50 shrink-0 cursor-pointer"
            aria-label="Back to home"
          >
            <Logo className="w-full h-full object-contain" />
          </a>
          <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-brand-teal leading-none whitespace-nowrap">
            Option Chain Analyzer
          </h1>
        </div>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-5 lg:gap-6">
          <a 
            href="/" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('tool'); } }} 
            className={`text-xs font-extrabold uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors ${activePage === 'tool' ? 'text-brand-teal border-brand-teal' : 'text-slate-600 border-transparent hover:text-brand-teal'}`}
          >
            Analyzer
          </a>
          <a 
            href="/blog" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('blog'); } }} 
            className={`text-xs font-extrabold uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors ${activePage === 'blog' ? 'text-brand-teal border-brand-teal' : 'text-slate-600 border-transparent hover:text-brand-teal'}`}
          >
            Blog
          </a>
          <a 
            href="/about" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('about'); } }} 
            className={`text-xs font-extrabold uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors ${activePage === 'about' ? 'text-brand-teal border-brand-teal' : 'text-slate-600 border-transparent hover:text-brand-teal'}`}
          >
            About Us
          </a>
          <a 
            href="/contact" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('contact'); } }} 
            className={`text-xs font-extrabold uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors ${activePage === 'contact' ? 'text-brand-teal border-brand-teal' : 'text-slate-600 border-transparent hover:text-brand-teal'}`}
          >
            Contact
          </a>
          <a 
            href="/disclaimer" 
            onClick={(e) => { if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) { e.preventDefault(); selectPage('disclaimer'); } }} 
            className={`text-xs font-extrabold uppercase tracking-wider whitespace-nowrap py-1 border-b-2 transition-colors ${activePage === 'disclaimer' ? 'text-brand-teal border-brand-teal' : 'text-slate-600 border-transparent hover:text-brand-teal'}`}
          >
            Disclaimer
          </a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <label 
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-xl text-[11px] font-black uppercase tracking-wider cursor-pointer hover:bg-brand-teal/90 transition-colors shrink-0 whitespace-nowrap"
            aria-label="Upload NSE Option Chain CSV"
          >
            <Upload size={14} />
            <span>Upload CSV</span>
            <input 
              type="file" 
              className="hidden" 
              accept=".csv" 
              onChange={(e) => { 
                if (e.target.files?.[0]) { 
                  processCSV(e.target.files[0], 'file_upload'); 
                  selectPage('tool');
                  e.target.value = '';
                } 
              }} 
            />
          </label>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="md:hidden w-11 h-11 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:text-brand-teal hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <CloseIcon size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.nav
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="md:hidden bg-white border-b border-slate-200 shadow-lg z-40 overflow-hidden shrink-0"
          >
            <div className="px-4 py-3 flex flex-col gap-1">
              {[
                { page: 'tool' as AppPage, href: '/', label: 'Analyzer' },
                { page: 'blog' as AppPage, href: '/blog', label: 'Blog' },
                { page: 'about' as AppPage, href: '/about', label: 'About Us' },
                { page: 'contact' as AppPage, href: '/contact', label: 'Contact Us' },
                { page: 'disclaimer' as AppPage, href: '/disclaimer', label: 'SEBI Disclaimer' },
                { page: 'privacy' as AppPage, href: '/privacy', label: 'Privacy Policy' },
                { page: 'terms' as AppPage, href: '/terms', label: 'Terms of Use' },
              ].map((item) => (
                <a
                  key={item.page}
                  href={item.href}
                  onClick={(e) => {
                    if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                      e.preventDefault();
                      selectPage(item.page);
                    }
                  }}
                  className={`min-h-[44px] px-3 rounded-xl flex items-center justify-between text-xs font-black uppercase tracking-wider transition-colors ${
                    activePage === item.page
                      ? 'bg-brand-teal/10 text-brand-teal'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-brand-teal'
                  }`}
                >
                  <span>{item.label}</span>
                  {activePage === item.page && <span className="text-[10px] text-brand-teal">Active</span>}
                </a>
              ))}
              <label 
                className="min-h-[44px] mt-2 px-4 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                aria-label="Upload NSE Option Chain CSV"
              >
                <Upload size={15} />
                <span>Upload NSE CSV</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv" 
                  onChange={(e) => { 
                    if (e.target.files?.[0]) { 
                      processCSV(e.target.files[0], 'file_upload'); 
                      selectPage('tool');
                      e.target.value = '';
                    } 
                  }} 
                />
              </label>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white shadow-inner">
        {activePage === 'blog' ? (
          <BlogSection 
            onBackToApp={() => selectPage('tool')}
            openArticleId={openArticleId}
            onSelectArticle={selectArticle}
          />
        ) : activePage === 'about' ? (
          <div className="flex-1 overflow-auto bg-[#fafafa]">
            <AboutPage 
              onBackToApp={() => selectPage('tool')}
              onNavigateBlog={() => selectPage('blog')}
              onNavigatePage={selectPage}
            />
            <FooterContent />
          </div>
        ) : activePage === 'contact' ? (
          <div className="flex-1 overflow-auto bg-[#fafafa]">
            <ContactPage 
              onBackToApp={() => selectPage('tool')}
              onNavigateBlog={() => selectPage('blog')}
              onNavigatePage={selectPage}
            />
            <FooterContent />
          </div>
        ) : activePage === 'disclaimer' ? (
          <div className="flex-1 overflow-auto bg-[#fafafa]">
            <DisclaimerPage 
              onBackToApp={() => selectPage('tool')}
              onNavigateBlog={() => selectPage('blog')}
              onNavigatePage={selectPage}
            />
            <FooterContent />
          </div>
        ) : activePage === 'privacy' ? (
          <div className="flex-1 overflow-auto bg-[#fafafa]">
            <PrivacyPage 
              onBackToApp={() => selectPage('tool')}
              onNavigateBlog={() => selectPage('blog')}
              onNavigatePage={selectPage}
            />
            <FooterContent />
          </div>
        ) : activePage === 'terms' ? (
          <div className="flex-1 overflow-auto bg-[#fafafa]">
            <TermsPage 
              onBackToApp={() => selectPage('tool')}
              onNavigateBlog={() => selectPage('blog')}
              onNavigatePage={selectPage}
            />
            <FooterContent />
          </div>
        ) : data.length === 0 ? (
          <div 
            ref={homeContainerRef}
            className="flex-1 flex flex-col items-center overflow-auto scrollbar-thin scrollbar-thumb-slate-300 scroll-smooth bg-[#fafafa] p-4 md:p-6"
          >
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center max-w-[1400px] w-full"
            >
              <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tighter text-brand-teal text-center leading-[1.1] uppercase max-w-3xl">
                Analyze NSE Option Chain <br className="hidden md:block" /> data effortlessly
              </h2>
              
              <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 max-w-2xl text-center font-medium mx-auto">
                Upload Option Chain CSVs of <strong className="text-brand-teal">NSE Indices</strong> and <strong className="text-slate-700">F&O Stocks</strong> directly from the official NSE website <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-semibold whitespace-nowrap">https://www.nseindia.com/option-chain</a> to identify high probable Support & Resistance zones based on real-time OI and volume clusters.
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
              
              <div className="flex justify-center mb-3 w-full max-w-md">
                <label 
                  className="w-full py-4 px-5 bg-brand-teal text-white rounded-xl text-xs font-black uppercase tracking-[0.18em] transition-all cursor-pointer hover:bg-brand-teal/90 active:scale-[0.98] text-center flex items-center justify-center gap-2 min-h-[48px]"
                  aria-label="Upload NSE Option Chain CSV File"
                >
                  <Upload size={16} />
                  <span>Upload CSV File</span>
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => { if (e.target.files?.[0]) { processCSV(e.target.files[0], 'file_upload'); e.target.value = ''; } }} />
                </label>
              </div>

              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center mb-8">
                Or Drop Any Official NSE CSV Anywhere on the Screen
              </p>

              <div className="w-full max-w-4xl mx-auto px-4 mt-2">
                <GuideContent />
              </div>
              
              <FooterContent />
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
            {/* Fixed Instrument Bar - Wraps cleanly on mobile viewports */}
            <div className="bg-white border-b border-slate-200 z-30">
                <div className="max-w-[1400px] mx-auto px-4 md:px-12 py-2.5 flex flex-wrap items-center justify-between gap-3 md:gap-6">
                  <div className="flex flex-wrap items-center gap-4 md:gap-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Instrument</span>
                      <h3 className="text-base md:text-lg font-black uppercase tracking-tighter text-brand-teal leading-none">
                        {symbolName || "Market Index"}
                      </h3>
                    </div>

                    {/* Spot Price Display (Static CSV or Manual On-Demand Sync) */}
                    {(symbolName && getLiveSpot(symbolName) !== null) ? (
                      <div className="flex flex-col border-l border-slate-200 pl-4 md:pl-5">
                        <div className="flex items-center gap-1.5 mb-0.5 relative">
                          <span className="text-[9px] font-black text-amber-700 uppercase tracking-[0.2em]">Spot Price</span>
                          <div className="relative group">
                            <Info className="w-3 h-3 text-slate-400 cursor-help hover:text-brand-teal transition-colors" />
                            <div className="absolute left-0 top-full mt-1 w-48 p-2.5 bg-slate-900 border border-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
                              <p className="text-[10px] leading-relaxed text-slate-200 font-medium normal-case tracking-normal">
                                Spot prices sync manually on demand via "Sync Spot" or upon custom CSV upload.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base md:text-lg font-black tabular-nums text-slate-900 leading-none tracking-tighter">
                            {getLiveSpot(symbolName)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {spotPrice && (
                            <span className={`text-[10px] font-bold tabular-nums ${(getLiveSpot(symbolName) || 0) >= spotPrice ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {(getLiveSpot(symbolName) || 0) >= spotPrice ? '▲' : '▼'} 
                              {Math.abs((((getLiveSpot(symbolName) || 0) - spotPrice) / spotPrice) * 100).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{formattedLastSync || 'Synced Spot'}</span>
                      </div>
                    ) : spotPrice && (
                      <div className="flex flex-col border-l border-slate-200 pl-4 md:pl-5">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">CSV Spot Price</span>
                        <span className="text-base md:text-lg font-black tabular-nums text-slate-900 leading-none tracking-tighter">
                          {spotPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{formattedLastSync || 'Snapshot Value'}</span>
                      </div>
                    )}

                    {/* Probable Zones Legend */}
                    <div className="hidden sm:flex flex-col border-l border-slate-200 pl-4 md:pl-5">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Zone Reference</span>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-rose-700 tracking-tight uppercase">Resistance: CPR ≥ 6</span>
                        <span className="text-[10px] font-black text-emerald-700 tracking-tight uppercase">Support: PCR ≥ 6</span>
                      </div>
                    </div>

                    <div className="flex flex-col border-l border-slate-200 pl-4 md:pl-5">
                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-[0.2em] mb-0.5">IV Outlier Strikes</span>
                      {anomalyStrikes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {anomalyStrikes.slice(0, 4).map(strike => (
                            <span key={strike} className="text-[10px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded tabular-nums">
                              {strike}
                            </span>
                          ))}
                          {anomalyStrikes.length > 4 && (
                            <span className="text-[9px] font-black text-slate-500 self-center">+{anomalyStrikes.length - 4}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">No IV Outlier Detected</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {ivSentiment && (
                       <div className="hidden lg:flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 mr-1">
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-0.5">IV Skew Mood</span>
                            <span className={`text-[10px] font-black uppercase tracking-tight ${ivSentiment.mood.includes('Bearish') ? 'text-rose-700' : ivSentiment.mood.includes('Bullish') ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {ivSentiment.mood}
                            </span>
                          </div>
                          <div className="w-[1px] h-4 bg-slate-200" />
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black text-slate-500 uppercase leading-none mb-0.5">Put/Call IV</span>
                            <span className="text-[10px] font-black text-slate-900 tabular-nums">
                              {ivSentiment.skew}
                            </span>
                          </div>
                       </div>
                    )}

                    {asOfTime && (
                      <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-600">
                        <Clock size={11} className="text-slate-500" />
                        <span>CSV: {asOfTime}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleManualSpotSync}
                      disabled={isSyncingSpot}
                      aria-label="Sync Live Spot Price on Demand"
                      className="px-3 py-1.5 bg-white text-slate-700 text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-slate-50 hover:text-brand-teal active:scale-95 rounded-lg border border-slate-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw size={11} className={isSyncingSpot ? 'animate-spin text-brand-teal' : 'text-slate-500'} />
                      <span>{isSyncingSpot ? 'Syncing...' : 'Sync Spot'}</span>
                    </button>

                    <button 
                      type="button"
                      onClick={handleReset}
                      aria-label="Clear Table and Return to CSV Uploader"
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider transition-colors hover:bg-rose-100 active:scale-95 rounded-lg flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                    >
                      <AlertCircle size={11} className="text-rose-600" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Container */}
              <div 
                ref={tableContainerRef}
                className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 bg-slate-50"
              >
                <div className="max-w-[1400px] mx-auto w-full px-4 md:px-12 py-6">
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
                  <tbody className="divide-y divide-slate-100 font-mono text-[10px] tabular-nums">
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
                            <td className={`text-center border-r border-slate-100 italic font-black ${row.callChng >= 0 ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>{row.callChng}</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-600 font-medium">{row.callOI.toLocaleString()}</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-500 italic font-bold">{(row.callVolume / 1000).toFixed(1)}k</td>
                            <td className={`text-right px-2 border-r border-slate-100 ${row.callChngOI >= 0 ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>{row.callChngOI.toLocaleString()}</td>
                            <td className={`text-center border-r border-slate-100 font-black relative ${row.isCallIVAnomaly ? 'bg-amber-100/70' : 'text-amber-700/70 font-semibold'}`}>
                              <span className={row.isCallIVAnomaly ? 'text-amber-900 font-extrabold inline-block' : ''}>{row.callIV.toFixed(2)}</span>
                            </td>
                            <td className={`text-center border-r border-slate-100 transition-all duration-300 ${
                              (row.cprOI >= 6 && isCallOTM)
                                ? 'font-black text-[13px] text-rose-700 bg-rose-50 shadow-[0_4px_12px_-2px_rgba(225,29,72,0.15)] ring-1 ring-rose-200 relative z-10' 
                                : 'font-bold text-slate-500'
                            }`}>{row.cprOI}</td>
                            <td className={`text-center border-r-2 border-slate-200 transition-all duration-300 ${
                              (row.cprVol >= 6 && isCallOTM) 
                                ? 'font-black text-[13px] text-rose-700 bg-rose-50 shadow-[0_4px_12px_-2px_rgba(225,29,72,0.15)] ring-1 ring-rose-200 relative z-10' 
                                : 'font-bold text-slate-500'
                            }`}>{row.cprVol}</td>
                            
                            <td 
                              ref={isAtTheMoney ? spotStrikeCellRef : null}
                              className={`text-center font-black border-x border-slate-200 text-[11px] py-2 tracking-tight relative transition-all duration-300 ${
                              isAtTheMoney 
                                ? 'bg-brand-teal text-white ring-1 ring-white/10 z-20 shadow-lg scale-[1.005]' 
                                : strikeHighlightClass
                                  ? strikeHighlightClass
                                  : 'bg-slate-50/80 text-brand-teal group-hover:text-brand-teal transition-colors'
                            }`}>
                               {row.strikePrice.toLocaleString()}
                            </td>
                            
                            <td className={`text-center border-r border-slate-100 transition-all duration-300 ${
                              (row.pcrVol >= 6 && isPutOTM) 
                                ? 'font-black text-[13px] text-emerald-700 bg-emerald-50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)] ring-1 ring-emerald-200 relative z-10' 
                                : 'font-bold text-slate-500'
                            }`}>{row.pcrVol}</td>
                            <td className={`text-center border-r border-slate-100 transition-all duration-300 ${
                              (row.pcrOI >= 6 && isPutOTM)
                                ? 'font-black text-[13px] text-emerald-700 bg-emerald-50 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)] ring-1 ring-emerald-200 relative z-10' 
                                : 'font-bold text-slate-500'
                            }`}>{row.pcrOI}</td>
                            <td className={`text-center border-r border-slate-100 font-black relative ${row.isPutIVAnomaly ? 'bg-amber-100/70' : 'text-amber-700/70 font-semibold'}`}>
                              <span className={row.isPutIVAnomaly ? 'text-amber-900 font-extrabold inline-block' : ''}>{row.putIV.toFixed(2)}</span>
                            </td>
                            <td className={`text-right px-2 border-r border-slate-100 ${row.putChngOI >= 0 ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>{row.putChngOI.toLocaleString()}</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-500 italic font-bold">{(row.putVolume / 1000).toFixed(1)}k</td>
                            <td className="text-right px-2 border-r border-slate-100 text-slate-600 font-medium">{row.putOI.toLocaleString()}</td>
                            <td className={`text-center italic font-black ${row.putChng >= 0 ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>{row.putChng}</td>
                          </tr>
                        );
                      });
                    })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* SEBI Compliance Professional Disclaimer */}
          <div className="w-full max-w-[1400px] bg-white rounded-3xl border border-slate-200 p-6 md:p-8 my-8 relative overflow-hidden shadow-xs">
            <div className="relative z-10">
              <div className="mb-5 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">Compliance &amp; Regulatory Notice</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700 leading-relaxed uppercase tracking-tight">
                    Standard Disclaimer: Investments in the securities market are subject to market risks. Read all related documents carefully before investing. 
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    This application is an <span className="font-bold text-brand-teal">Analytical Utility</span> provided strictly for educational and data visualization purposes. It computes ratios directly from NSE-formatted CSV snapshots in your browser. 
                  </p>
                </div>
                <div>
                  <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      <strong className="text-slate-900 uppercase text-[10px] mb-1 block tracking-wider">No Investment Advice</strong>
                      The Put-Call ratios and IV anomalies displayed by this utility are purely mathematical derivations. They are NOT buy/sell trading signals. OptionChainAnalyzer.in is NOT a SEBI Registered Investment Advisor.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                 <span>Dataset Snapshot: {asOfTime || 'Uploaded CSV'}</span>
                 <span>OptionChainAnalyzer.in · Educational Derivatives Utility</span>
              </div>
            </div>
          </div>

          <FooterContent />
        </div>
      </div>
    )}
  </main>
</div>
  );
}
