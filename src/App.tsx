import { useState, useCallback, DragEvent, useRef, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, TrendingUp, ArrowUpCircle, ArrowDownCircle, Twitter, Facebook, Instagram } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [asOfTime, setAsOfTime] = useState<string | null>(null);
  const [ivSentiment, setIvSentiment] = useState<{ skew: number, mood: string } | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const hasShownHintInSession = useRef(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const homeContainerRef = useRef<HTMLDivElement>(null);

  const [anomalyStrikes, setAnomalyStrikes] = useState<number[]>([]);
  const [showAnomalyPopup, setShowAnomalyPopup] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [logoError, setLogoError] = useState(false);

  const handleReset = useCallback(() => {
    setData([]);
    setSpotPrice(null);
    setAsOfTime(null);
    setIvSentiment(null);
    setAnomalyStrikes([]);
    setError(null);
    setIsHovering(false);
    setShowAnomalyPopup(false);
    setShowScrollHint(false);
    // Ensure we scroll back to top
    if (homeContainerRef.current) {
      homeContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (data.length === 0 && homeContainerRef.current) {
      homeContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [data.length]);

  const processCSV = useCallback((file: File, method: 'file_upload' | 'drag_drop' = 'file_upload') => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as string[][];
          
          // Detect Spot Price (Usually in the top few rows like "Underlying Index: NIFTY 19674.25")
          let detectedSpot: number | null = null;
          let detectedTime: string | null = null;
          for (const row of rawData.slice(0, 5)) {
            for (const cell of row) {
              if (cell && (cell.includes('Underlying Index') || cell.includes('Spot Price'))) {
                const match = cell.match(/[\d,.]+/g);
                if (match) {
                  const val = parseFloat(match[match.length - 1].replace(/,/g, ''));
                  if (!isNaN(val)) detectedSpot = val;
                }
              }
              if (cell && cell.includes('As on')) {
                detectedTime = cell.replace('As on', '').trim();
              }
            }
          }
          setSpotPrice(detectedSpot);
          setAsOfTime(detectedTime);

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
                isSupport: pcrOI >= 6 && pcrVol >= 6,
                isResistance: cprOI >= 6 && cprVol >= 6,
                isCallIVAnomaly,
                isPutIVAnomaly
              };
            })
            .filter((r): r is OptionChainRow => r !== null);

          setData(parsedRows.sort((a, b) => a.strikePrice - b.strikePrice));
          
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

          // Handle table auto-scroll and hint sequence
          const showHint = !hasShownHintInSession.current;
          const scrollHintDuration = 2500;
          const anomalyPopupDelay = showHint ? scrollHintDuration + 500 : 0;

          setTimeout(() => {
            if (tableContainerRef.current) {
              const container = tableContainerRef.current;
              const scrollTarget = (container.scrollHeight / 2) - (container.clientHeight / 2);
              container.scrollTo({ top: scrollTarget, behavior: 'instant' });
            }

            if (showHint) {
              setShowScrollHint(true);
              hasShownHintInSession.current = true;
              setTimeout(() => setShowScrollHint(false), scrollHintDuration);
            }
          }, 100);

          // Show Anomaly Popup if any found
          if (uniqueAnomalies.length > 0) {
            setTimeout(() => {
              setShowAnomalyPopup(true);
              setTimeout(() => setShowAnomalyPopup(false), 4000);
            }, 100 + anomalyPopupDelay);
          }

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
  }, []);

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
    <div className="flex flex-col gap-12 text-left w-full py-6">
      {/* Executive Summary Section */}
      <section className="bg-brand-teal/5 p-8 rounded-[2rem] border border-brand-teal/10 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-teal mb-3">NSE Option Chain Analysis Guide</h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-4xl font-medium">
            The NSE Option Chain provides real-time data for Nifty, Bank Nifty, and stocks. The analyzer simplifies Open Interest (OI) into visual Support/Resistance maps using <strong className="text-brand-teal">6.0x institutional multipliers</strong> to identify key market barriers.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-teal/5 blur-[100px] rounded-full" />
      </section>

      {/* Two-Column Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-2">
        <section>
          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-teal mb-6 border-b border-brand-teal/10 pb-4 inline-block">Methodology & How-to-Use</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-teal text-white text-xs font-black flex items-center justify-center shrink-0 shadow-lg">1</div>
              <div>
                <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-1">Download Source</h4>
                <p className="text-sm leading-relaxed text-slate-500 font-medium italic">Important: Download official CSV files for <strong>Nifty, Bank Nifty</strong>, other indices like <strong>FINNIFTY, MIDCPNIFTY</strong> or individual <strong>Stocks</strong> directly from <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-semibold">www.nseindia.com/option-chain</a>.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-teal text-white text-xs font-black flex items-center justify-center shrink-0 shadow-lg">2</div>
              <div>
                <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-1">Upload Process</h4>
                <p className="text-sm leading-relaxed text-slate-500 font-medium">Navigate to the Option Chain page on NSE for your instrument of choice, click 'Download CSV', and upload that file here using the selector or drag-drop.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-brand-teal text-white text-xs font-black flex items-center justify-center shrink-0 shadow-lg">3</div>
              <div>
                <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest mb-1">Analyze Matrix</h4>
                <p className="text-sm leading-relaxed text-slate-500 font-medium">Review the Strike Map. The tool automatically flags strikes where Open Interest exceeds the 6.0x institutional barrier.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-teal mb-6 border-b border-brand-teal/10 pb-4 inline-block">Proper FAQs</h3>
          <div className="space-y-6">
            <div className="group">
              <h4 className="text-[12px] font-black uppercase text-brand-teal mb-1 tracking-widest">What is the 6.0x Threshold?</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">It identifies levels where one side (Calls or Puts) is 600% stronger than the other, indicating a significant institutional 'wall'.</p>
            </div>
            <div className="group">
              <h4 className="text-[12px] font-black uppercase text-brand-teal mb-1 tracking-widest">How to read PCR OI?</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Put-Call Ratio (PCR) above 1.0 at a strike suggests bullish bias (support), while below 1.0 suggests bearish bias (resistance).</p>
            </div>
            <div className="group">
              <h4 className="text-[12px] font-black uppercase text-brand-teal mb-1 tracking-widest">Is my data secure?</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Yes. The analyzer runs 100% locally in your browser. Your CSV data is never uploaded to any server or database.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Deep Theory Section */}
      <div className="border-t border-slate-100 pt-8 gap-6 flex flex-col">
        <section className="bg-amber-50 p-6 rounded-[1.5rem] border border-amber-100 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-600 mb-3">Understanding IV Anomalies</h3>
            <p className="text-[13px] text-amber-900/80 leading-relaxed max-w-4xl font-medium">
              <strong>Implied Volatility (IV)</strong> represents the market's expectation of price movement. Think of it as the <strong>"Fear Index"</strong> for specific strikes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-white/60 p-4 rounded-xl">
                <h4 className="text-[10px] font-black uppercase text-amber-700 mb-2">Volatility Anomaly (Spike)</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">When a specific strike's IV is <strong>25%+ higher</strong> than the current market average, it signals an <strong>"Institutional Magnet"</strong>. This suggests pros are paying huge premiums expecting a massive move to (or rejection from) that level.</p>
              </div>
              <div className="bg-white/60 p-4 rounded-xl">
                <h4 className="text-[10px] font-black uppercase text-amber-700 mb-2">IV Skew Interpretation</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">If Put IVs are much higher than Call IVs, the market is <strong>Bearish/Hedging</strong>. If Call IVs are spiking, the market anticipates an <strong>Explosive Breakout</strong>.</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200/20 blur-[60px] rounded-full -mr-16 -mt-16" />
        </section>

        <section className="max-w-4xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Market Structure</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-brand-teal text-[11px] uppercase tracking-wider">OI Clusters</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">Psychological Pivot Points identified visually without manual spreadsheet filtering.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-brand-teal text-[11px] uppercase tracking-wider">Volume Defense</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">High volume at mapped resistance confirms active defense by writers.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-brand-teal text-[11px] uppercase tracking-wider">Strategic Map</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">Track OI Spikes and Change in OI to anticipate the next trending move.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-teal mb-3">Institutional Bias</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed max-w-4xl mb-4 font-medium">
            Institutions are typically option writers. Understanding these 6x strength zones allows you to avoid false breakouts and look for mean reversion setups.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
             {['NIFTY', 'BANKNIFTY', 'STOCKS', 'EXPIRY'].map(item => (
               <div key={item} className="p-2.5 bg-white rounded-xl border border-slate-100 text-center shadow-sm">
                 <span className="block text-[10px] font-black uppercase text-slate-400">{item}</span>
               </div>
             ))}
          </div>
        </section>

        <section className="bg-brand-teal text-white p-8 rounded-[2rem] relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
          <div className="relative z-10">
            <h4 className="text-[11px] font-black uppercase mb-3 tracking-widest text-emerald-400">Risk Disclosure</h4>
            <p className="text-[12px] text-slate-300 leading-relaxed max-w-2xl font-medium tracking-wide">
              Trading derivatives involves high risk. This educational utility visualizes raw NSE data. The tool does not provide trading signals. Professional caution is advised.
            </p>
          </div>
        </section>
      </div>
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
              <p className="text-[12px] text-slate-600 font-medium leading-relaxed max-w-[200px]">Institutional-grade NSE data mapping and OI visualization tool.</p>
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
              <button onClick={handleReset} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-all text-left uppercase tracking-wider active:scale-95">Reset Platform</button>
              <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">NSE Official Source</a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Security & Legal</h4>
            <div className="flex flex-col gap-3">
              <button onClick={() => setActiveModal('privacy')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Privacy Protocol</button>
              <button onClick={() => setActiveModal('terms')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Usage Terms</button>
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

  const Modal = ({ type, onClose }: { type: 'privacy' | 'terms', onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-teal/80 backdrop-blur-xl">
      <div className="bg-white rounded-[3rem] w-full max-w-3xl max-h-[85vh] overflow-auto p-16 premium-shadow relative animate-in fade-in zoom-in duration-300 scrollbar-none">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-brand-teal transition-all hover:rotate-90">
          <AlertCircle size={32} className="rotate-45" />
        </button>
        <div className="flex items-center gap-8 mb-16">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center p-3 border border-slate-100 shadow-2xl shadow-brand-teal/10">
            <Logo />
          </div>
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-brand-teal">{type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}</h2>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1 block">Protocol Document</span>
          </div>
        </div>        <div className="prose prose-slate prose-lg max-w-none">
        {type === 'privacy' ? (
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
        ) : (
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
        )}
        </div>
      </div>
    </div>
  );

  return (
    <div 
      className="h-screen bg-slate-100 font-sans text-slate-900 flex flex-col relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {activeModal && <Modal type={activeModal} onClose={() => setActiveModal(null)} />}
      {/* ... Rest of the UI */}
      {/* Drop Overlay */}
      {isHovering && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-12 pointer-events-none">
          <div className="border-4 border-dashed border-white/40 rounded-3xl w-full h-full flex flex-col items-center justify-center text-white">
            <Upload size={80} className="mb-6 animate-bounce" />
            <p className="text-4xl font-bold tracking-tight">Drop NSE CSV to Analyze</p>
          </div>
        </div>
      )}

      {/* Scroll Hint Popup */}
      <AnimatePresence mode="wait">
        {showScrollHint && (
          <motion.div 
            key="scroll-hint"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-6 border border-slate-700/50 backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1.5">
              <ArrowUpCircle size={24} className="text-amber-400 animate-bounce" />
              <ArrowDownCircle size={24} className="text-amber-400 animate-bounce delay-150" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-[15px] font-black uppercase text-amber-400 tracking-[0.2em] leading-tight">Scroll Up/Down</p>
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Find high probable S/R zones</p>
            </div>
          </motion.div>
        )}

        {showAnomalyPopup && (
          <motion.div 
            key="iv-anomaly"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] bg-amber-500 text-white px-10 py-8 rounded-[3rem] shadow-[0_30px_70px_rgba(245,158,11,0.4)] flex flex-col items-center gap-4 border border-amber-400/50 backdrop-blur-xl text-center min-w-[320px]"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-2">
              <AlertCircle size={40} className="animate-pulse" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-xl font-black uppercase tracking-widest leading-none">IV Anomaly Detected</p>
              <p className="text-[10px] font-black uppercase text-amber-900/40 tracking-[0.4em]">Institutional Fear Magnets</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl w-full border border-white/10 mt-2">
              <p className="text-[9px] font-black uppercase text-amber-100 tracking-widest mb-2 opacity-60">Impacted Strike Levels</p>
              <div className="flex flex-wrap justify-center gap-2">
                {anomalyStrikes.map(strike => (
                  <span key={strike} className="px-3 py-1 bg-white text-amber-600 rounded-lg text-xs font-black shadow-sm tracking-tight border border-amber-400/20">
                    {strike.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-[10px] font-bold text-amber-100 leading-relaxed max-w-[240px] mt-2 italic opacity-80">
              High volatility spikes detected at these levels. Professional hedging or breakout expected.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="h-20 border-b border-slate-200 bg-slate-100 px-8 flex items-center justify-between shrink-0 z-50 relative shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-brand-teal/5 flex items-center justify-center overflow-hidden border border-slate-200 p-1.5 transition-all hover:scale-105 active:scale-95 group">
            <Logo className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter uppercase text-brand-teal leading-none">Option Chain Analyzer</h1>
            {asOfTime && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Data: {asOfTime}</span>}
          </div>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            {spotPrice && (
              <div className="hidden md:flex flex-col items-end px-4 border-r border-slate-200">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Spot Price</span>
                <span className="text-sm font-black text-brand-teal tabular-nums leading-none tracking-tighter">₹{spotPrice.toLocaleString()}</span>
              </div>
            )}
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
        {data.length === 0 ? (
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
                
                <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-6 max-w-2xl text-center font-medium">
                  Upload your desired option chain CSV for <strong className="text-brand-teal">Indices (NIFTY, BANKNIFTY, FINNIFTY)</strong> or <strong className="text-slate-700">individual Stocks</strong> directly from the NSE website (<a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 underline font-semibold">www.nseindia.com/option-chain</a>) to identify institutional Support & Resistance levels based on real-time OI and Volume clusters.
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
            <div 
              ref={tableContainerRef}
              className="flex-1 overflow-auto flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300 scroll-smooth"
            >
              <div className="max-w-screen-xl w-full px-4 md:px-12 pb-20">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 my-12 relative text-slate-900">
                  <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-teal/5 blur-[100px] -mr-48 -mt-48 pointer-events-none" />
                  <table className="border-separate border-spacing-0 table-fixed min-w-max w-full">
                    <caption className="sr-only">NSE Option Chain Analysis Data Table</caption>
                  <thead className="relative z-40">
                  {/* Level 1: Category Header */}
                  <tr className="h-8 text-[10px] font-black uppercase text-white tracking-[0.2em] text-center">
                    <th colSpan={7} className="bg-brand-teal border-r border-white/5 px-4 sticky top-0 z-30 first:rounded-tl-3xl">Call Analysis</th>
                    <th rowSpan={2} className="bg-brand-teal border-x border-white/10 text-emerald-400 w-24 border-b border-white/5 text-[11px] font-black sticky top-0 z-40">Strike</th>
                    <th rowSpan={2} className="bg-slate-50 border-r border-slate-200 w-20 text-slate-500 border-b border-slate-200 text-[9px] tracking-widest px-1 sticky top-0 z-40">Resistance</th>
                    <th rowSpan={2} className="bg-slate-50 border-r-2 border-slate-200 w-20 text-slate-500 border-b border-slate-200 text-[9px] tracking-widest px-1 sticky top-0 z-40">Support</th>
                    <th colSpan={7} className="bg-brand-teal text-white px-4 sticky top-0 z-30 last:rounded-tr-3xl">Put Analysis</th>
                  </tr>
                  {/* Level 2: Metric Header */}
                  <tr className="h-10 text-[9px] font-black uppercase text-center bg-white border-b border-slate-200 shadow-sm">
                    <th className="w-12 text-slate-400 sticky top-8 z-30 bg-white border-r border-slate-100 italic">CPR OI</th>
                    <th className="w-12 text-slate-400 sticky top-8 z-30 bg-white border-r border-slate-100 italic">CPR VOL</th>
                    <th className="w-16 text-amber-600 sticky top-8 z-30 bg-amber-50 border-r border-slate-100 font-black">IV %</th>
                    <th className="w-16 text-slate-500 sticky top-8 z-30 bg-white border-r border-slate-100 italic">CHG</th>
                    <th className="w-20 text-slate-600 sticky top-8 z-30 bg-white border-r border-slate-100">OI</th>
                    <th className="w-20 text-slate-600 sticky top-8 z-30 bg-white border-r border-slate-100">CHG OI</th>
                    <th className="w-20 text-slate-400 sticky top-8 z-30 bg-white border-r-2 border-slate-200">Volume</th>
                    <th className="w-20 text-slate-600 sticky top-8 z-30 bg-white border-r border-slate-100">OI</th>
                    <th className="w-20 text-slate-600 sticky top-8 z-30 bg-white border-r border-slate-100">CHG OI</th>
                    <th className="w-20 text-slate-400 sticky top-8 z-30 bg-white border-r border-slate-100">Volume</th>
                    <th className="w-16 text-slate-500 sticky top-8 z-30 bg-white border-r border-slate-100 italic">CHG</th>
                    <th className="w-16 text-amber-600 sticky top-8 z-30 bg-amber-50 border-r border-slate-100 font-black">IV %</th>
                    <th className="w-12 text-slate-400 sticky top-8 z-30 bg-white border-r border-slate-100 italic">PCR OI</th>
                    <th className="w-12 text-slate-400 sticky top-8 z-30 bg-white">PCR VOL</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                    {data.map((row) => {
                      const strikeDiff = data.length > 1 ? Math.abs(data[1].strikePrice - data[0].strikePrice) : 50;
                      const isATM = spotPrice && Math.abs(row.strikePrice - spotPrice) <= (strikeDiff / 2);
                      
                      return (
                        <tr key={row.strikePrice} className={`hover:bg-slate-50/80 group transition-colors ${isATM ? 'bg-brand-teal/[0.04]' : ''}`}>
                          <td className="text-center font-bold border-r border-slate-100 text-slate-400">{row.cprOI}</td>
                          <td className="text-center font-bold border-r border-slate-100 text-slate-400">{row.cprVol}</td>
                          <td className={`text-center border-r border-slate-100 font-black relative ${row.isCallIVAnomaly ? 'bg-amber-100/50' : 'text-amber-600/80 font-bold'}`}>
                            {row.isCallIVAnomaly && <div className="absolute inset-y-0 right-0 w-0.5 bg-amber-400" />}
                            <span className={row.isCallIVAnomaly ? 'text-amber-700 animate-slow-blink inline-block' : ''}>{row.callIV.toFixed(2)}</span>
                          </td>
                          <td className={`text-center border-r border-slate-100 italic font-bold ${row.callChng >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{row.callChng}</td>
                          <td className="text-right px-2 border-r border-slate-100 text-slate-700">{row.callOI.toLocaleString()}</td>
                          <td className={`text-right px-2 border-r border-slate-100 ${row.callChngOI >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}`}>{row.callChngOI.toLocaleString()}</td>
                          <td className="text-right px-2 border-r-2 border-slate-200 text-slate-400 italic">{(row.callVolume / 1000).toFixed(1)}k</td>
                          
                          <td className="text-center font-black bg-brand-teal text-white border-x border-white/10 text-[11px] py-2 shadow-inner tracking-tight relative">
                            {isATM && <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                            {row.strikePrice.toLocaleString()}
                          </td>
                          
                          <td className={`text-center font-black border-r border-slate-100 text-[10px] tracking-tighter py-1.5 ${row.isResistance ? 'bg-resistance text-white' : 'text-slate-200 italic'}`}>
                            {row.isResistance ? 'RESISTANCE' : '—'}
                          </td>
                          <td className={`text-center font-black border-r-2 border-slate-200 text-[10px] tracking-tighter py-1.5 ${row.isSupport ? 'bg-support text-white' : 'text-slate-200 italic'}`}>
                            {row.isSupport ? 'SUPPORT' : '—'}
                          </td>
                          
                          <td className="text-right px-2 border-r border-slate-100 text-slate-700">{row.putOI.toLocaleString()}</td>
                          <td className={`text-right px-2 border-r border-slate-100 ${row.putChngOI >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}`}>{row.putChngOI.toLocaleString()}</td>
                          <td className="text-right px-2 border-r border-slate-100 text-slate-400 italic">{(row.putVolume / 1000).toFixed(1)}k</td>
                          <td className={`text-center border-r border-slate-100 italic font-bold ${row.putChng >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{row.putChng}</td>
                          <td className={`text-center border-r border-slate-100 font-black relative ${row.isPutIVAnomaly ? 'bg-amber-100/50' : 'text-amber-600/80 font-bold'}`}>
                            {row.isPutIVAnomaly && <div className="absolute inset-y-0 left-0 w-0.5 bg-amber-400" />}
                            <span className={row.isPutIVAnomaly ? 'text-amber-700 animate-slow-blink inline-block' : ''}>{row.putIV.toFixed(2)}</span>
                          </td>
                          <td className="text-center font-bold border-r border-slate-100 text-slate-400">{row.pcrOI}</td>
                          <td className="text-center font-bold text-slate-400">{row.pcrVol}</td>
                        </tr>
                      );
                    })}
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
      )}
    </main>
    </div>
  );
}
