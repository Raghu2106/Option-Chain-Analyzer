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
      window.history.replaceState(null, '', `?modal=${modal}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const selectArticle = useCallback((id: string | null) => {
    setOpenArticleId(id);
    if (id) {
      window.history.replaceState(null, '', `?article=${id}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const selectPage = useCallback((page: 'tool' | 'blog') => {
    setActivePage(page);
    if (page === 'tool') {
      setOpenArticleId(null);
      window.history.replaceState(null, '', window.location.pathname);
    } else if (page === 'blog') {
      window.history.replaceState(null, '', `?page=blog`);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const article = params.get('article');
    const page = params.get('page');
    const modal = params.get('modal');

    if (article) {
      setActivePage('blog');
      setOpenArticleId(article);
    } else if (page === 'blog') {
      setActivePage('blog');
      setOpenArticleId(null);
    }

    if (modal === 'privacy' || modal === 'terms' || modal === 'about') {
      setActiveModal(modal as 'privacy' | 'terms' | 'about');
    }
  }, []);

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

          // NSE Column indices
          const strikeIdx = 11;
          const callOIIdx = 1;
          const callChngOIIdx = 2;
          const callVolIdx = 3;
          const callIVIdx = 4;
          const callChngIdx = 6;
          const putChngIdx = 16;
          const putIVIdx = 18;
          const putVolIdx = 19;
          const putChngOIIdx = 20;
          const putOIIdx = 21;

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
    <div className="flex flex-col gap-12 text-left w-full py-12 border-t border-slate-200/80 mt-12 bg-white">
      {/* Informative Title Header */}
      <div className="border-b-2 border-brand-teal pb-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
          Option Chain Analyzer Operational Guide
        </h2>
        <p className="text-xs md:text-sm font-black text-brand-teal uppercase tracking-[0.25em] mt-1">
          User manual & systematic workflow for interpreting derivative open interest positioning
        </p>
      </div>

      {/* Section 1: User Guide */}
      <section className="space-y-6">
        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
          1. Comprehensive Research Guide: Supplementary Analysis alongside Technical Charting
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-semibold">
          The National Stock Exchange of India (NSE) hosts highly active derivatives segments, with liquid options contracts on major benchmark indices like Nifty 50, Bank Nifty, Financial Services Nifty (FINNIFTY), and Midcap Nifty (MIDCPNIFTY), alongside individual equity stock options. For research analysts, tracking these contracts in dense tabular layouts can be challenging. Our Option Chain Analyzer serves as a supplementary analytical dashboard, converting raw, static CSV files into intuitive, live, color-mapped visualizations. This utility should be used as a corroborative data source alongside your primary price charting platform.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          To analyze and locate potential support and resistance benchmarks as a confluence filter in conjunction with your chart analysis, follow this systematic workflow:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-sm md:text-base text-slate-600 font-medium">
          <li>
            <strong>Acquiring Clean Data:</strong> Begin by navigating directly to the official National Stock Exchange of India option chain dashboard (<a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-extrabold hover:scale-105 transition-transform inline-block">www.nseindia.com/option-chain</a>). Select your preferred contract—whether Nifty 50 or Bank Nifty—and click the "Download CSV" link to extract the latest snapshot.
          </li>
          <li>
            <strong>Importing the File:</strong> Simply drag and drop the `.csv` file onto our drop zone on the main page, or click "Upload CSV File" to choose it manually. Our processing engine runs 100% locally in your browser memory, keeping your analytical data private and highly secure.
          </li>
          <li>
            <strong>Locating the Spot Price & ATM Strike:</strong> The tool automatically extracts the current spot value and benchmarks the closest At-The-Money (ATM) strike. The ATM row acts as the key gravity center of the options chain and maps out a prominent highlighted container upon rendering so you never lose track of active market movements.
          </li>
          <li>
            <strong>Reading the Color-Coded Multipliers:</strong> Look at the Call and Put ratio metrics. In corporate risk management and options analysis, heavy concentration of short open interest can signal significant resistance and support layers. If a strike exhibits a Call-to-Put or Put-to-Call ratio of <strong>6.0x or more</strong>, our tool recognizes this as a high probable zone and color-highlights the strike in shades of green (strong Support) or red (strong Resistance).
          </li>
          <li>
            <strong>Tracking Implied Volatility (IV) Anomalies:</strong> Implied Volatility (IV) measures market expectation of future movement. Our analyzer calculates the ATM-centered average IV. When a single strike experiences an IV spike exceeding 25% of this average, it highlights it as an anomaly. These premium spikes are statistical "hot-spots" where market participants are anticipating or hedging against rapid price deviations.
          </li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          By referencing these automated, highlighted zones as a supplementary layer alongside primary price action charts, analysts can quickly spot where potential high probable defense structures reside without manual calculations.
        </p>
      </section>

      {/* Section 2: PCR Deep Dive */}
      <section className="space-y-6">
        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
          2. Deep Dive Into Put-Call Ratio (PCR): Quantitative Sentiment Mapping
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          The Put-Call Ratio (PCR) is one of the most effective, mathematically derived market sentiment indicators used in derivatives analysis. While basic charts track price history, PCR maps out real-time position accumulation by market participants. In our analytical toolkit, PCR can be calculated across the entire index, or localized strike-by-strike, to show concentrated zones of dominance.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          The core overall index Put-Call Ratio utilizes a simple, clean open interest calculation:
        </p>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 my-4 text-center font-mono text-sm text-slate-800">
          PCR (Open Interest) = Total Outstanding Put Open Interest / Total Outstanding Call Open Interest
        </div>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Because option writing (selling) requires substantial margin capital under SEBI guidelines—typically averaging over ₹1,00,000 per lot compared to the minimal premium required to buy options—the option chain is traditionally analyzed from the perspective of option writers. Option buyers are generally retail participants who are vulnerable to rapid time decay (theta), whereas option writers are well-capitalized institutions, mutual funds, and large prop desks.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          To simplify complex tabular datasets, our analyzer dynamically calculates strike-specific ratios and automatically highlights Put-Call Ratio (PCR) and Call-Put Ratio (CPR) values of <strong>6.0 and above</strong> as high-probability support and resistance zones:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
            <h4 className="font-bold text-emerald-800 text-sm uppercase tracking-wide mb-2">High-Probability Support (PCR ≥ 6.0x)</h4>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Highlighted in <strong>Green</strong>. Indicates that outstanding Put Open Interest or Volume is at least 6 times greater than Call Open Interest/Volume at that specific strike. This represents significant concentrated underwriting of put contracts, signaling a high probable support zone or price floor to watch on your charts.
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl">
            <h4 className="font-bold text-rose-800 text-sm uppercase tracking-wide mb-2">High-Probability Resistance (CPR ≥ 6.0x)</h4>
            <p className="text-xs text-rose-950 leading-relaxed">
              Highlighted in <strong>Red</strong>. Indicates that outstanding Call Open Interest or Volume is at least 6 times greater than Put Open Interest/Volume at that specific strike. This shows massive overhead underwriting of call contracts, signaling a high-probability resistance zone or price ceiling to monitor.
            </p>
          </div>
        </div>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Rather than interpreting overall index-level general sentiment, targeting these specific strike-level multiplier highlights allows you to instantly pinpoint major mathematical barriers which you can match directly against your candlesticks or trendline analysis.
        </p>
      </section>

      {/* Section 3: CPR Dynamics */}
      <section className="space-y-6">
        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
          3. Call-Put Ratio (CPR) Dynamics: Sector Resistance & High Probable Overhead Barriers
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          While retail platforms typically focus strictly on Put-Call relationships, experienced market analysts heavily monitor the reciprocal relationship: the **Call-Put Ratio (CPR)**. In our option chain interface, CPR is mapped as a high-conviction resistance indicator.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          When examining option writing trends, the Call-Put Ratio computes exactly how dominant call contracts are over put contracts at any specific strike:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="block text-xs font-black uppercase text-brand-teal mb-1">Open Interest Call-Put Ratio (CPR OI)</span>
            <span className="block font-mono text-[13px] text-slate-800 font-bold">CPR OI = Call Outstanding Open Interest / Put Outstanding Open Interest</span>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Tracks the build-up of massive overhead blocks. High CPR OI signifies that major funds are heavily underwriting call contracts, predicting the asset will not cross that strike price.</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="block text-xs font-black uppercase text-brand-teal mb-1">Volume Call-Put Ratio (CPR Vol)</span>
            <span className="block font-mono text-[13px] text-slate-800 font-bold">CPR Vol = Call Traded Volume / Put Traded Volume</span>
            <p className="text-[11px] text-slate-500 mt-2 font-medium">Detects real-time volume build-up. Sudden spikes in CPR Vol show rapid resistance formation, often coinciding with capped price breakouts.</p>
          </div>
        </div>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Understanding call option underwriting requires analyzing the premium-capture goals of market-makers. Call sellers pocket options premiums upfront, in exchange for agreeing to sell the underlying asset if requested. Because indices like Nifty or Bank Nifty can rise indefinitely, call writers face high risk. Thus, when high-conviction sellers write a heavy volume of call options at a strike, they do so with deep structural conviction:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-sm md:text-base text-slate-600 font-medium pb-2">
          <li>
            <strong>The 6.0x Multiplier Benchmark:</strong> When our database monitors a CPR ratio (for Open Interest or Volume) crossing the <strong>6.0x barrier</strong>, our renderer triggers a prominent 3D-effect red highlighted alert. This reveals a heavily guarded high probable wall where sellers outnumber buyers 6-to-1, signaling exceptionally strong resistance.
          </li>
          <li>
            <strong>Breakout and Resistance Validation:</strong> If the index is heading upwards but approaches a strike highlighted with a high CPR OI (such as Bank Nifty nearing a major round number), analysts can check the accompanying CPR Volume. If CPR Vol also exceeds 6.0x, it is a trailing indicator that call writers are actively defending the level. Overcoming this level typically requires a substantial rise in spot-market buyer volume.
          </li>
          <li>
            <strong>Short-Covering Characteristics (Short Squeeze):</strong> If the spot price moves above a high CPR barrier on heavy volume, call writers occasionally buy back their short positions to cap exposure. This dynamic can lead to rapid price expansion as short positions are covered, visible on primary charts.
          </li>
        </ul>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-semibold">
          By displaying PCR support walls and CPR resistance walls side-by-side with 3D color mapping, our Option Chain Analyzer assists in identifying active market structures to supplement your primary technical charts.
        </p>
      </section>

      {/* Section 4: Risk Management */}
      <section className="space-y-6">
        <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
          4. Professional Risk Management: Mastering Derivatives Volatility
        </h3>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Futures and Options (F&O) analysis in the Indian stock exchange is inherently high-risk. While structured data analysis like PCR, volume concentration zone analysis, and IV tracking can dramatically improve your understanding of market structure, they are ultimately mathematical probabilities. No data model is infallible, and market conditions can change instantly during major global news events, unexpected macro releases, or sudden block trades by Foreign Institutional Investors (FIIs) and Domestic Institutional Investors (DIIs).
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-medium">
          Securities regulatory reports (SEBI) reveal a stark statistic for retail derivative traders: <strong>9 out of 10 retail traders lose money in active option trading</strong>, with average losses often wiping out entire accounts. Capital preservation is the core hallmark separating veteran analysts from beginners.
        </p>
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-bold">
          To safely study the NSE F&O segment, commit to these vital structural rules:
        </p>
        <ul className="list-disc pl-6 space-y-3 text-sm md:text-base text-slate-600 font-medium">
          <li>
            <strong>Use Option Chain Data for Confluence, Not Execution:</strong> This tool is a secondary analytical layer. Always anchor your primary execution decisions on robust charting tools and verified regulatory data streams.
          </li>
          <li>
            <strong>Enforce Uncompromising Risk Controls:</strong> Never allocate significant visual conviction to single setups. Maintain strictly conservative risk limits, avoiding leverage or excessive capital commitment regardless of indicator highlighting.
          </li>
          <li>
            <strong>Watch the Spot Chart:</strong> Option chain data is an accumulation of historical trades. While highly informative, it occasionally lags behind sudden, explosive, news-driven price spikes. Use our analyzer as a compass, but always prioritize actual price action developments on your primary spot charts.
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
    <footer className="w-full bg-slate-50 border-t border-slate-200 py-16 px-8 mt-16 rounded-t-[3rem] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 flex flex-col items-start gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl shadow-brand-teal/5 border border-slate-200">
              <Logo />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-tighter text-brand-teal">Option Chain Analyzer</h3>
              <p className="text-[12px] text-slate-600 font-medium leading-relaxed max-w-[200px]">High-probability NSE data mapping and OI visualization tool.</p>
            </div>
            <div className="flex gap-4 pt-4 border-t border-slate-200/50 w-full">
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
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Resources</h4>
            <div className="flex flex-col gap-3">
              <button onClick={() => { selectPage('tool'); handleReset(); }} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-all text-left uppercase tracking-wider active:scale-95">Reset Platform</button>
              <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">NSE Official Source</a>
              <button onClick={() => selectPage('blog')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-all text-left uppercase tracking-wider active:scale-95">Blog Articles</button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Security & Legal</h4>
            <div className="flex flex-col gap-3">
              <button onClick={() => selectModal('about')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">About Us</button>
              <button onClick={() => selectModal('privacy')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Privacy Protocol</button>
              <button onClick={() => selectModal('terms')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Usage Terms</button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Support</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:support@optionchainanalyzer.in" className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">Contact Us</a>
              <span className="text-[11px] text-brand-teal/50 font-black uppercase tracking-widest">v1.2.0 Stable Build</span>
            </div>
          </div>
        </div>
        
        <div className="pt-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-slate-500 font-black tracking-[0.4em] uppercase">
            © 2026 OptionChainAnalyzer.in • All Rights Reserved
          </p>
          <div className="flex gap-8 items-center">
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-brand-teal/40">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> System Active</span>
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Data Isolated</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal/[0.02] blur-[100px] rounded-full -mr-48 -mt-48" />
    </footer>
  );

  return (
    <div 
      className="h-screen bg-slate-100 font-sans text-slate-900 flex flex-col relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
              <div className="space-y-12 text-base">
                <p className="font-bold border-b pb-1">Our Mission</p>
                <p className="mt-4 leading-relaxed text-slate-600">
                  The <strong>Option Chain Analyzer</strong> is built with a simple objective: to transform highly dense, static spreadsheet datasets from the National Stock Exchange of India (NSE) into human-friendly, high-probability visualizations.
                </p>
                <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">How We Optimize Your Research</h3>
                <p className="leading-relaxed text-slate-600">
                  Derivatives analysis can be challenging when viewing standard option tables. Our analyzer parses real-time Open Interest (OI) and Traded Volume values, calculating Put-to-Call (PCR) and Call-to-Put (CPR) ratios strike-by-strike. When a multiplier of <strong>6.0x or higher</strong> is detected, the platform automatically color-codes that level to pinpoint prominent defense zones.
                </p>
                <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">A Secondary Layer of Confluence</h3>
                <p className="leading-relaxed text-slate-600 font-medium">
                  We recommend using this analyzer as a supportive, corroborative filter in conjunction with your primary price charting tools. Check your candlesticks, verify your trendlines, and use our color-mapped highlights to see if they align with high-probability support or resistance levels.
                </p>
                <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">Privacy & Security Built-In</h3>
                <p className="leading-relaxed text-slate-600">
                  No database synchronization, no server uploads, and no tracking. All uploaded or proxied CSV values are processed entirely client-side in your local browser, keeping your workspace private and secure.
                </p>
              </div>
            ) : activeModal === 'privacy' ? (
              <div className="space-y-12 text-base">
                <p className="font-bold border-b pb-1">Last Updated: April 23, 2026</p>
                <p className="mt-4">Your privacy is important to us. It is NSE Option Chain Analyzer's policy to respect your privacy regarding any information we may collect from you across our website.</p>
                <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">1. Local Processing Only</h3>
                <p className="leading-relaxed text-slate-600">The application analyzes data strictly locally in your browser. CSV files are not uploaded to any server. Proprietary financial data remains on your machine.</p>
                <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">2. Cookies & Ads</h3>
                <p className="leading-relaxed text-slate-600">Third-party advertising services (Google AdSense) may be used to keep this tool free. These services may use cookies to serve personalized ads based on web browsing history.</p>
                <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">3. Anonymous Usage</h3>
                <p className="leading-relaxed text-slate-600">PII (Personally Identifiable Information) is not collected. No sign-up or email is required to use the mapper.</p>
              </div>
            ) : activeModal === 'terms' ? (
              <div className="space-y-12 text-base">
                <p className="font-bold border-b-2 pb-2 text-slate-900 border-brand-teal inline-block">Legal Agreement</p>
                <p className="mt-6 text-slate-600 leading-relaxed font-medium">By using optionchainanalyzer.in, users agree to comply with the following terms:</p>
                <h3 className="font-black text-brand-teal mt-10 mb-4 uppercase tracking-[0.2em] border-l-4 border-brand-teal pl-4">1. License for Personal Use</h3>
                <p className="leading-relaxed text-slate-600">The tool is under temporary license for personal, non-commercial education. This tool is intended to simplify manual OI analysis.</p>
                <h3 className="font-black text-brand-teal mt-10 mb-4 uppercase tracking-[0.2em] border-l-4 border-brand-teal pl-4">2. Risk Disclosure</h3>
                <p className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-bold leading-relaxed shadow-sm">Financial markets involve high risk. Option trading is speculative. The levels generated by this tool are mathematical projections and not investment advice.</p>
                <h3 className="font-black text-brand-teal mt-10 mb-4 uppercase tracking-[0.2em] border-l-4 border-brand-teal pl-4">3. No Liability</h3>
                <p className="leading-relaxed text-slate-600">There is no liability for financial decisions or trading losses based on the output of this application. Always verify data with official exchange sources.</p>
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
      <header className="h-20 border-b border-slate-200 bg-slate-100 px-8 flex items-center justify-between shrink-0 z-50 relative shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleLogoClick}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-brand-teal/5 flex items-center justify-center overflow-hidden border border-slate-200 p-1.5 transition-all hover:scale-105 active:scale-95 group cursor-pointer"
            aria-label="Back to home"
          >
            <Logo className="w-full h-full object-contain" />
          </button>
          <div className="flex flex-col items-start">
            <h1 className="text-xl font-black tracking-tighter uppercase text-brand-teal leading-none text-left">
              Option Chain Analyzer
            </h1>
            {asOfTime && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Data: {asOfTime}</span>}
          </div>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            <button 
              onClick={handleReset}
              aria-label="Reset Analysis"
              className="px-6 py-3 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-100 active:scale-95 rounded-xl shadow-sm shadow-rose-100/50 flex items-center gap-2 border border-rose-200"
            >
              <AlertCircle size={14} className="text-rose-500" />
              Reset
            </button>
          </div>
        )}
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
              className="flex-1 flex flex-col items-center overflow-auto scrollbar-none bg-[#fafafa] p-4 md:p-6"
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
                  Upload Option Chain CSVs specifically for <strong className="text-brand-teal">NSE Indices</strong> and <strong className="text-slate-700">F&O-listed Stocks</strong> directly from the official <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-semibold">NSE website</a> to identify high probable Support & Resistance zones based on real-time OI and volume clusters.
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
