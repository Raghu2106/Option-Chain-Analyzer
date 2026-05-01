import { useState, useCallback, DragEvent } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface OptionChainRow {
  strikePrice: number;
  callOI: number;
  callChngOI: number;
  callVolume: number;
  putOI: number;
  putChngOI: number;
  putVolume: number;
  pcrOI: number;
  pcrVol: number;
  cprOI: number;
  cprVol: number;
  isSupport: boolean;
  isResistance: boolean;
}

export default function App() {
  const [data, setData] = useState<OptionChainRow[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [logoError, setLogoError] = useState(false);

  const processCSV = useCallback((file: File, method: 'file_upload' | 'drag_drop' = 'file_upload') => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rawData = results.data as string[][];
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
          const putVolIdx = 19;
          const putChngOIIdx = 20;
          const putOIIdx = 21;

          const parsedRows: OptionChainRow[] = rawData.slice(dataStartIndex + 1)
            .map(row => {
              const parseNum = (val: string) => {
                if (!val || val.trim() === '-' || val.trim() === '') return 0;
                return parseFloat(val.replace(/,/g, '')) || 0;
              };
              
              const strike = parseNum(row[strikeIdx]);
              if (!strike || isNaN(strike)) return null;

              const coi = parseNum(row[callOIIdx]);
              const cchng = parseNum(row[callChngOIIdx]);
              const cvol = parseNum(row[callVolIdx]);
              const poi = parseNum(row[putOIIdx]);
              const pchng = parseNum(row[putChngOIIdx]);
              const pvol = parseNum(row[putVolIdx]);

              // Logic: PCR for Support (P/C), CPR for Resistance (C/P)
              const pcrOI = coi > 0 ? Number((poi / coi).toFixed(2)) : (poi > 0 ? 999 : 0);
              const pcrVol = cvol > 0 ? Number((pvol / cvol).toFixed(2)) : (pvol > 0 ? 999 : 0);
              
              const cprOI = poi > 0 ? Number((coi / poi).toFixed(2)) : (coi > 0 ? 999 : 0);
              const cprVol = pvol > 0 ? Number((cvol / pvol).toFixed(2)) : (cvol > 0 ? 999 : 0);

              return {
                strikePrice: strike,
                callOI: coi,
                callChngOI: cchng,
                callVolume: cvol,
                putOI: poi,
                putChngOI: pchng,
                putVolume: pvol,
                pcrOI,
                pcrVol,
                cprOI,
                cprVol,
                isSupport: pcrOI >= 6 && pcrVol >= 6,
                isResistance: cprOI >= 6 && cprVol >= 6
              };
            })
            .filter((r): r is OptionChainRow => r !== null);

          setData(parsedRows.sort((a, b) => a.strikePrice - b.strikePrice));
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
    <div className="flex flex-col gap-16 text-left w-full border-t border-slate-200 pt-16">
      {/* Executive Summary Section */}
      <section className="bg-emerald-50/50 p-8 rounded-3xl border border-emerald-100">
        <h2 className="text-sm font-black uppercase tracking-widest text-[#0f4e5a] mb-4">Mastering NSE Option Chain Analysis</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          The National Stock Exchange (NSE) of India provides real-time data for Nifty, Bank Nifty, and equity stocks via its Option Chain. For retail traders, this spreadsheet-style data is often overwhelming. Our <strong>Option Chain Analyzer</strong> simplifies complex Open Interest (OI) numbers into a visual Support and Resistance map. By focusing on <strong>institutional-grade multipliers (6.0x)</strong>, we help you identify "Stone-Wall" levels where major market participants are positioned.
        </p>
      </section>

      {/* Two-Column Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0f4e5a] mb-6 decoration-emerald-400 underline underline-offset-8">Step-by-Step Methodology</h3>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 uppercase mb-1">Source Proper Data</h4>
                <p className="text-[11px] leading-relaxed text-slate-600">Navigate to the official NSE India website. Use the "Download CSV" feature on the Option Chain page for your preferred symbol (Indices or Equities).</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 uppercase mb-1">Universal Compatibility</h4>
                <p className="text-[11px] leading-relaxed text-slate-600">Our tool supports analysis for all expiry dates and standard retail instruments including <strong>MIDCPNIFTY</strong> and <strong>FINNIFTY</strong>.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <h4 className="text-[10px] font-bold text-slate-800 uppercase mb-1">Privacy First</h4>
                <p className="text-[11px] leading-relaxed text-slate-600">We utilize <strong>Client-Side Web Processing</strong>. Your trading data never leaves your browser, ensuring complete confidentiality for your intraday strategies.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0f4e5a] mb-6 decoration-emerald-400 underline underline-offset-8">Educational FAQ</h3>
          <div className="space-y-6">
            <div>
              <h4 className="text-[10px] font-black uppercase mb-1 text-slate-900">What is the PCR (Put-Call Ratio)?</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">PCR is a vital sentiment indicator. A high PCR (especially above 1.5) at specific strikes suggests strong Put writing, which acts as a floor. Conversely, low PCR suggests Call writing dominance at the ceiling.</p>
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase mb-1 text-slate-900">Why the 6.0x Threshold?</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">Minor OI differences are often retail noise. We flag a level as Support or Resistance only when one side has **6 times the strength** of the other, signaling a structural market barrier.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Deep Theory Section */}
      <div className="border-t border-slate-100 pt-12 space-y-12">
        <section className="max-w-4xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8">Understanding Market Micro-Structure</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="font-bold text-[#0f4e5a] text-[10px] uppercase tracking-wider">Open Interest Clusters</h4>
              <p className="text-[11px] text-slate-600">OI represents outstanding contracts. Large clusters are "Psychological Pivot Points." Our heatmap identifies these visually without requiring manual spreadsheet filtering.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-[#0f4e5a] text-[10px] uppercase tracking-wider">Volume Weightage</h4>
              <p className="text-[11px] text-slate-600">Volume indicators provide immediate confirmation of a support test. High volume at a mapped resistance confirms active defense by Call writers.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-[#0f4e5a] text-[10px] uppercase tracking-wider">Strategic Mapping</h4>
              <p className="text-[11px] text-slate-600">Successful Nifty traders look for "OI Spikes" accompanied by "Change in OI" build-ups to anticipate the next trending move.</p>
            </div>
          </div>
        </section>

        {/* Detailed Article Section */}
        <section className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#0f4e5a] mb-6">Trading Strategy: Navigating Institutional Rips</h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-4xl mb-6">
            In the Indian derivative markets, "Smart Money" or Institutional players are typically the sellers (writers) of options. When our tool identifies a <strong>Resistance Level</strong>, it is actually showing you where Call Sellers have parked significant capital to prevent the price from rising. Understanding this structural bias allows you to avoid buying breakouts that are likely to fail. Instead, professional traders look for "Mean Reversion" from these 6x strength zones back toward the middle of the range.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-4 bg-white rounded-2xl border border-slate-100 text-center">
               <span className="block text-[9px] font-black uppercase text-slate-400 mb-1">NIFTY</span>
               <span className="text-[10px] font-bold text-slate-700">Scalping Guard</span>
             </div>
             <div className="p-4 bg-white rounded-2xl border border-slate-100 text-center">
               <span className="block text-[9px] font-black uppercase text-slate-400 mb-1">BANKNIFTY</span>
               <span className="text-[10px] font-bold text-slate-700">Volatility Map</span>
             </div>
             <div className="p-4 bg-white rounded-2xl border border-slate-100 text-center">
               <span className="block text-[9px] font-black uppercase text-slate-400 mb-1">STOCKS</span>
               <span className="text-[10px] font-bold text-slate-700">OI Tracking</span>
             </div>
             <div className="p-4 bg-white rounded-2xl border border-slate-100 text-center">
               <span className="block text-[9px] font-black uppercase text-slate-400 mb-1">EXPIRY</span>
               <span className="text-[10px] font-bold text-slate-700">Max Pain Logic</span>
             </div>
          </div>
        </section>

        <section className="bg-slate-900 text-white p-10 rounded-[2.5rem] relative overflow-hidden ring-4 ring-emerald-500/10">
          <div className="relative z-10">
            <h4 className="text-sm font-black uppercase mb-4 tracking-widest text-emerald-400">Strict Disclaimer</h4>
            <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
              Trading in derivatives involves high risk and is not suitable for everyone. This analyzer is an educational utility provided to visualize NSE data. We do not provide trading signals or financial advice. All data is processed on the user's side and the accuracy of the output depends on the quality of the CSV file provided.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        </section>
      </div>

      {/* Extended Glossary */}
      <section className="max-w-4xl pb-20">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8">Option Trading Glossary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          <div>
            <dt className="text-[10px] font-black uppercase text-slate-900 mb-2">Change in Open Interest (Chg OI)</dt>
            <dd className="text-[11px] text-slate-500 leading-relaxed">The net difference in outstanding contracts from the previous day. A positive Change in OI at lower strikes indicates fresh Put writing and strong support build-up.</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase text-slate-900 mb-2">Premium Erosion (Time Decay)</dt>
            <dd className="text-[11px] text-slate-500 leading-relaxed">The decrease in option value as expiry approaches. Sellers use our OI map to identify levels where they can safely collect premium through time decay.</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase text-slate-900 mb-2">In-The-Money (ITM)</dt>
            <dd className="text-[11px] text-slate-500 leading-relaxed">Options with intrinsic value. Institutional players often focus on OTM (Out-of-the-Money) strikes for writing, which is what our mapper highlights.</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black uppercase text-slate-900 mb-2">Short Covering</dt>
            <dd className="text-[11px] text-slate-500 leading-relaxed">When sellers buy back their contracts, often causing a rapid price move. Our tool helps identifying potential short-covering triggers at key resistance levels.</dd>
          </div>
        </div>
      </section>
    </div>
  );

  const Modal = ({ type, onClose }: { type: 'privacy' | 'terms', onClose: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-auto p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors">
          <AlertCircle size={24} className="rotate-45" />
        </button>
        {type === 'privacy' ? (
          <div className="prose prose-slate prose-sm max-w-none">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Privacy Policy</h2>
            <p className="font-bold border-b pb-1">Last Updated: April 23, 2026</p>
            <p className="mt-4">Your privacy is important to us. It is NSE Option Chain Analyzer's policy to respect your privacy regarding any information we may collect from you across our website.</p>
            <h3 className="font-bold text-slate-900 mt-6 mb-2 underline underline-offset-4 decoration-emerald-400">1. Local Processing Only</h3>
            <p>Our application analyzes data strictly locally in your browser. We do not upload your CSV files to any server. Your proprietary financial data never leaves your machine.</p>
            <h3 className="font-bold text-slate-900 mt-6 mb-2 underline underline-offset-4 decoration-emerald-400">2. Cookies & Ads</h3>
            <p>We use third-party advertising services (Google AdSense) to keep this tool free. These services may use cookies to serve personalized ads based on your web browsing history.</p>
            <h3 className="font-bold text-slate-900 mt-6 mb-2 underline underline-offset-4 decoration-emerald-400">3. Anonymous Usage</h3>
            <p>We do not collect PII (Personally Identifiable Information). No sign-up or email is required to use the mapper.</p>
          </div>
        ) : (
          <div className="prose prose-slate prose-sm max-w-none">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tighter">Terms of Use</h2>
            <p className="font-bold border-b pb-1">Legal Agreement</p>
            <p className="mt-4 text-slate-600">By using optionchainanalyzer.in, you agree to comply with the following terms:</p>
            <h3 className="font-bold text-slate-900 mt-6 mb-2 uppercase text-[10px] tracking-widest">1. License for Personal Use</h3>
            <p>We grant you a temporary license to use this analyzer for personal, non-commercial education. This tool is intended to simplify manual OI analysis.</p>
            <h3 className="font-bold text-slate-900 mt-6 mb-2 uppercase text-[10px] tracking-widest">2. Risk Disclosure</h3>
            <p className="p-3 bg-rose-50 border border-rose-100 rounded text-rose-700 font-medium">Financial markets involve high risk. Option trading is speculative. The levels generated by this tool are mathematical projections and not investment advice.</p>
            <h3 className="font-bold text-slate-900 mt-6 mb-2 uppercase text-[10px] tracking-widest">3. No Liability</h3>
            <p>We are not responsible for any financial decisions or trading losses based on the output of this application. Always verify data with official exchange sources.</p>
          </div>
        )}
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

      {/* Header */}
      <header className="h-12 border-b bg-white px-6 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-3">
          {logoError ? (
            <div className="w-9 h-9 bg-slate-100 rounded flex items-center justify-center shadow-sm">
              <TrendingUp className="text-[#0f4e5a] w-5 h-5" />
            </div>
          ) : (
            <img 
              src="/logo.png" 
              alt="Option Chain Analyzer Logo" 
              className="w-9 h-auto rounded shadow-sm" 
              referrerPolicy="no-referrer"
              onError={() => setLogoError(true)}
            />
          )}
          <h1 className="text-sm font-black tracking-widest uppercase text-[#0f4e5a]/90">Option Chain Analyzer</h1>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setData([])}
              className="px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-700 active:scale-95 rounded-lg shadow-lg shadow-rose-200 flex items-center gap-2 border border-rose-500"
            >
              <AlertCircle size={14} />
              Reset Map
            </button>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white shadow-inner">
        {data.length === 0 ? (
            <div className="flex-1 flex flex-col items-center overflow-auto scrollbar-thin scrollbar-thumb-slate-300 bg-slate-50/50 p-6 md:p-12">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center max-w-2xl w-full"
              >
                <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase text-slate-900 pt-8">Option Chain Analyzer</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-lg text-center">
                  Analyze NSE Option Chain data effortlessly. Upload your desired option chain CSV for <strong>Indices (NIFTY, BANKNIFTY, FINNIFTY)</strong> or <strong>individual Stocks</strong> directly from the NSE website to identify institutional Support & Resistance levels based on real-time OI and Volume clusters.
                </p>
                
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold uppercase flex items-center gap-2 mb-6">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                
                <label className="px-8 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 group mb-4">
                  Select CSV File
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0], 'file_upload')} />
                </label>
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-16">
                  or drop it anywhere on this page
                </p>

                <GuideContent />
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300 p-4 md:p-8">
              <div className="max-w-screen-xl w-full">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden mb-16">
                  <table className="border-collapse table-fixed min-w-max w-full">
                <thead className="sticky top-0 z-10 shadow-sm transition-shadow">
                  {/* Level 1: Category Header */}
                  <tr className="h-8 text-[9px] font-black uppercase text-slate-800 tracking-widest text-center">
                    <th colSpan={5} className="bg-[#92D050] border-r border-slate-300">Call Details</th>
                    <th rowSpan={2} className="bg-[#00B0F0] border-r-2 border-slate-400 text-white w-24 border-b border-slate-300">Strike</th>
                    <th rowSpan={2} className="bg-[#F8CBAD] border-r-2 border-slate-400 w-24 text-slate-900 border-b border-slate-300">Resistance</th>
                    <th rowSpan={2} className="bg-[#E2EFDA] border-r-2 border-slate-400 w-24 text-slate-900 border-b border-slate-300">Support</th>
                    <th colSpan={5} className="bg-[#FF0000] text-white">Put Details</th>
                  </tr>
                  {/* Level 2: Metric Header */}
                  <tr className="h-10 text-[10px] font-bold uppercase text-center bg-[#FFFF00] divide-x divide-slate-300 border-y border-slate-300">
                    <th className="w-16">CPR OI</th>
                    <th className="w-16">CPR VOL</th>
                    <th className="w-24">OI</th>
                    <th className="w-24">CHG OI</th>
                    <th className="w-24 border-r-2 border-slate-400">VOL</th>
                    <th className="w-24">OI</th>
                    <th className="w-24">CHG OI</th>
                    <th className="w-24">VOL</th>
                    <th className="w-16">PCR OI</th>
                    <th className="w-16">PCR VOL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
                  {data.map((row) => (
                    <tr key={row.strikePrice} className="h-8 hover:bg-slate-50 group">
                      <td className={`text-center font-bold border-r border-slate-200 ${row.isResistance ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}>{row.cprOI}</td>
                      <td className={`text-center font-bold border-r border-slate-200 ${row.isResistance ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}>{row.cprVol}</td>
                      <td className="text-right px-3 border-r border-slate-200">{row.callOI.toLocaleString()}</td>
                      <td className={`text-right px-3 border-r border-slate-200 ${row.callChngOI >= 0 ? 'text-blue-600 font-medium' : 'text-rose-500'}`}>{row.callChngOI.toLocaleString()}</td>
                      <td className="text-right px-3 border-r-2 border-slate-400 text-slate-500 font-medium">{row.callVolume.toLocaleString()}</td>
                      
                      <td className="text-center font-black bg-[#00B0F0]/90 text-white border-r-2 border-slate-400 text-xs py-1 select-all">{row.strikePrice.toLocaleString()}</td>
                      
                      <td className={`text-center font-black border-r-2 border-slate-400 text-[9px] ${row.isResistance ? 'bg-rose-500 text-white' : 'text-slate-200 italic font-normal'}`}>
                        {row.isResistance ? 'RESISTANCE' : '-'}
                      </td>
                      <td className={`text-center font-black border-r-2 border-slate-400 text-[9px] ${row.isSupport ? 'bg-emerald-500 text-white' : 'text-slate-200 italic font-normal'}`}>
                        {row.isSupport ? 'SUPPORT' : '-'}
                      </td>

                      <td className="text-right px-3 border-r border-slate-200">{row.putOI.toLocaleString()}</td>
                      <td className={`text-right px-3 border-r border-slate-200 ${row.putChngOI >= 0 ? 'text-blue-600 font-medium' : 'text-rose-500'}`}>{row.putChngOI.toLocaleString()}</td>
                      <td className="text-right px-3 border-r border-slate-200 text-slate-500 font-medium">{row.putVolume.toLocaleString()}</td>
                      <td className={`text-center font-bold border-r border-slate-200 ${row.isSupport ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}>{row.pcrOI}</td>
                      <td className={`text-center font-bold ${row.isSupport ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}>{row.pcrVol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="max-w-4xl mx-auto pb-32">
              <GuideContent />
            </div>
          </div>
        </div>
      )}
    </main>

      <footer className="bg-slate-900 border-t border-slate-800 text-white shrink-0 pt-12 pb-6 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Option Chain Analyzer</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold tracking-widest">
              India's premier tool for institutional-grade NSE data mapping. Built for speed, privacy, and precision.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Navigation</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setData([])}
                className="text-[10px] text-slate-400 hover:text-white transition-colors uppercase font-bold text-left"
              >
                Reset Tool
              </button>
              <button 
                onClick={() => setActiveModal('privacy')}
                className="text-[10px] text-slate-400 hover:text-white transition-colors uppercase font-bold text-left"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => setActiveModal('terms')}
                className="text-[10px] text-slate-400 hover:text-white transition-colors uppercase font-bold text-left"
              >
                Terms of Use
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400">Data Source</h3>
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold tracking-widest">
              Processing raw CSV metrics from NSE India. No data is stored or repurposed.
              <br/><br/>
              <span className="text-emerald-500/50">Verified AdSense Property</span>
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 text-[8px] font-black uppercase tracking-[0.2em]">
            <span className="flex items-center gap-2">
              <span className="text-slate-500">Method:</span> 
              <span className="text-[#0f4e5a] underline underline-offset-2">DUAL_PCR_CPR_V2</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-slate-500">Mult:</span> 
              <span className="text-[#0f4e5a]">6.0x_MIN</span>
            </span>
          </div>
          <p className="text-[8px] text-slate-600 font-bold tracking-widest uppercase">
            © 2026 OptionChainAnalyzer.in | All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
