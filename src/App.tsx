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
    <div className="flex flex-col gap-12 text-left w-full">
      {/* Executive Summary Section */}
      <section className="bg-emerald-50/40 p-8 rounded-3xl border border-emerald-100/50">
        <h2 className="text-xs font-black uppercase tracking-widest text-[#0f4e5a] mb-3">NSE Option Chain Analysis Guide</h2>
        <p className="text-[13px] text-slate-600 leading-relaxed max-w-3xl">
          The NSE Option Chain provides real-time data for Nifty, Bank Nifty, and stocks. Our analyzer simplifies Open Interest (OI) into visual Support/Resistance maps using <strong>6.0x institutional multipliers</strong> to identify key market barriers.
        </p>
      </section>

      {/* Two-Column Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0f4e5a] mb-5 decoration-emerald-400/50 underline underline-offset-4">Methodology</h3>
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Official Data</h4>
                <p className="text-xs leading-relaxed text-slate-500">Download CSV from nseindia.com for Indices or Equities.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Compatibility</h4>
                <p className="text-xs leading-relaxed text-slate-500">Supports NIFTY, BANKNIFTY, FINNIFTY and stocks.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0f4e5a] mb-5 decoration-emerald-400/50 underline underline-offset-4">FAQ</h3>
          <div className="space-y-5">
            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-900 mb-1">PCR Indicator</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">High PCR (especially above 1.5) at strikes suggests strong Put writing (floor).</p>
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-900 mb-1">6.0x Threshold</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">Flags levels where one side has 6x the strength of the other (institutional barrier).</p>
            </div>
          </div>
        </section>
      </div>

      {/* Deep Theory Section */}
      <div className="border-t border-slate-100 pt-10 space-y-10">
        <section className="max-w-4xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8">Market Structure</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="font-bold text-[#0f4e5a] text-[10px] uppercase tracking-wider">OI Clusters</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">Psychological Pivot Points identified visually without manual spreadsheet filtering.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-[#0f4e5a] text-[10px] uppercase tracking-wider">Volume Defense</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">High volume at mapped resistance confirms active defense by writers.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-[#0f4e5a] text-[10px] uppercase tracking-wider">Strategic Map</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">Track OI Spikes and Change in OI to anticipate the next trending move.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#0f4e5a] mb-4">Institutional Bias</h3>
          <p className="text-[12px] text-slate-600 leading-relaxed max-w-4xl mb-6 font-medium">
            Institutions are typically option writers. Understanding these 6x strength zones allows you to avoid false breakouts and look for mean reversion setups.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
               <span className="block text-[10px] font-black uppercase text-slate-400">NIFTY</span>
             </div>
             <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
               <span className="block text-[10px] font-black uppercase text-slate-400">BANKNIFTY</span>
             </div>
             <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
               <span className="block text-[10px] font-black uppercase text-slate-400">STOCKS</span>
             </div>
             <div className="p-3 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
               <span className="block text-[10px] font-black uppercase text-slate-400">EXPIRY</span>
             </div>
          </div>
        </section>

        <section className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
          <div className="relative z-10">
            <h4 className="text-[11px] font-black uppercase mb-3 tracking-widest text-emerald-400">Risk Disclosure</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl font-medium tracking-wide">
              Trading derivatives involves high risk. This educational utility visualizes raw NSE data. We do not provide trading signals. Professional caution is advised.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full" />
        </section>
      </div>

      {/* Extended Glossary */}
      <section className="max-w-4xl pb-12">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-8">Glossary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="border-l-2 border-emerald-400 pl-4">
            <dt className="text-[11px] font-black uppercase text-slate-900 mb-1">Change in OI</dt>
            <dd className="text-xs text-slate-500 leading-relaxed font-medium">Net difference in contracts from previous day.</dd>
          </div>
          <div className="border-l-2 border-emerald-400 pl-4">
            <dt className="text-[11px] font-black uppercase text-slate-900 mb-1">Time Decay</dt>
            <dd className="text-xs text-slate-500 leading-relaxed font-medium">Decrease in option value as expiry approaches.</dd>
          </div>
        </div>
      </section>
    </div>
  );

  const FooterContent = () => (
    <div className="w-full bg-slate-900 text-white pt-16 pb-8 px-8 mt-24 rounded-t-[3rem] shadow-2xl">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 text-center md:text-left">
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">Option Chain Analyzer</h3>
          <p className="text-[11px] text-slate-400 leading-relaxed uppercase font-black tracking-widest">
            Institutional-grade NSE data mapping and visualization. Trusted by advanced retail traders.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">Direct Links</h3>
          <div className="flex flex-row flex-wrap justify-center md:justify-start gap-x-6 gap-y-2">
            <button 
              onClick={() => setData([])}
              className="text-[11px] text-slate-400 hover:text-white transition-colors uppercase font-black tracking-widest"
            >
              Reset Tool
            </button>
            <button 
              onClick={() => setActiveModal('privacy')}
              className="text-[11px] text-slate-400 hover:text-white transition-colors uppercase font-black tracking-widest"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setActiveModal('terms')}
              className="text-[11px] text-slate-400 hover:text-white transition-colors uppercase font-black tracking-widest"
            >
              Terms of Use
            </button>
            <a 
              href="mailto:support@optionchainanalyzer.in"
              className="text-[11px] text-slate-500 hover:text-white transition-colors uppercase font-black tracking-widest"
            >
              Contact Support
            </a>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-400">Verification</h3>
          <div className="text-[11px] text-slate-500 leading-relaxed uppercase font-black tracking-widest space-y-2">
            <p>Processing raw metrics from NSE India.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row items-center justify-center gap-6">
        <p className="text-[10px] text-slate-600 font-black tracking-[0.25em] uppercase">
          © 2026 OptionChainAnalyzer.in
        </p>
      </div>
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
            <h3 className="font-bold text-slate-900 mt-8 mb-4 underline underline-offset-8 decoration-emerald-400 text-base uppercase tracking-wider">1. Local Processing Only</h3>
            <p className="text-sm leading-relaxed text-slate-600">Our application analyzes data strictly locally in your browser. We do not upload your CSV files to any server. Your proprietary financial data never leaves your machine.</p>
            <h3 className="font-bold text-slate-900 mt-8 mb-4 underline underline-offset-8 decoration-emerald-400 text-base uppercase tracking-wider">2. Cookies & Ads</h3>
            <p className="text-sm leading-relaxed text-slate-600">We use third-party advertising services (Google AdSense) to keep this tool free. These services may use cookies to serve personalized ads based on your web browsing history.</p>
            <h3 className="font-bold text-slate-900 mt-8 mb-4 underline underline-offset-8 decoration-emerald-400 text-base uppercase tracking-wider">3. Anonymous Usage</h3>
            <p className="text-sm leading-relaxed text-slate-600">We do not collect PII (Personally Identifiable Information). No sign-up or email is required to use the mapper.</p>
          </div>
        ) : (
          <div className="prose prose-slate prose-sm max-w-none">
            <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">Terms of Use</h2>
            <p className="font-bold border-b-2 pb-2 text-slate-900">Legal Agreement</p>
            <p className="mt-6 text-slate-600 text-sm leading-relaxed">By using optionchainanalyzer.in, you agree to comply with the following terms:</p>
            <h3 className="font-bold text-slate-900 mt-10 mb-4 uppercase text-[11px] tracking-[0.2em] border-l-4 border-emerald-400 pl-4">1. License for Personal Use</h3>
            <p className="text-sm leading-relaxed text-slate-600">We grant you a temporary license to use this analyzer for personal, non-commercial education. This tool is intended to simplify manual OI analysis.</p>
            <h3 className="font-bold text-slate-900 mt-10 mb-4 uppercase text-[11px] tracking-[0.2em] border-l-4 border-emerald-400 pl-4">2. Risk Disclosure</h3>
            <p className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-bold text-sm leading-relaxed shadow-sm">Financial markets involve high risk. Option trading is speculative. The levels generated by this tool are mathematical projections and not investment advice.</p>
            <h3 className="font-bold text-slate-900 mt-10 mb-4 uppercase text-[11px] tracking-[0.2em] border-l-4 border-emerald-400 pl-4">3. No Liability</h3>
            <p className="text-sm leading-relaxed text-slate-600">We are not responsible for any financial decisions or trading losses based on the output of this application. Always verify data with official exchange sources.</p>
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
          <h1 className="text-base font-black tracking-widest uppercase text-[#0f4e5a]">Option Chain Analyzer</h1>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setData([])}
              className="px-5 py-2.5 bg-rose-600 text-white text-xs font-black uppercase tracking-widest transition-all hover:bg-rose-700 active:scale-95 rounded-xl shadow-lg shadow-rose-200 flex items-center gap-2 border border-rose-500"
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
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-black uppercase tracking-widest flex items-center gap-3 mb-8 shadow-sm">
                    <AlertCircle size={18} /> {error}
                  </div>
                )}
                
                <label className="px-10 py-5 bg-slate-900 text-white rounded-full text-sm font-black uppercase tracking-[0.25em] transition-all cursor-pointer hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-300/50 group mb-6 active:scale-[0.98]">
                  Select CSV File
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0], 'file_upload')} />
                </label>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">
                  or drop it anywhere on this page
                </p>

                <div className="w-full border-t border-slate-200 mt-8 pt-8 px-4">
                  <GuideContent />
                  <FooterContent />
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300">
              <div className="max-w-screen-xl w-full p-4 md:p-8">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 mb-16">
                  <table className="border-collapse table-fixed min-w-max w-full">
                <thead className="relative z-20">
                  {/* Level 1: Category Header */}
                  <tr className="h-10 text-[11px] font-black uppercase text-slate-800 tracking-[0.2em] text-center sticky top-0 z-30">
                    <th colSpan={5} className="bg-[#92D050] border-r border-slate-300 rounded-tl-3xl">Call Details</th>
                    <th rowSpan={2} className="bg-[#00B0F0] border-r-2 border-slate-400 text-white w-28 border-b border-slate-300 text-xs">Strike</th>
                    <th rowSpan={2} className="bg-[#F8CBAD] border-r-2 border-slate-400 w-28 text-slate-900 border-b border-slate-300 text-xs">Resistance</th>
                    <th rowSpan={2} className="bg-[#E2EFDA] border-r-2 border-slate-400 w-28 text-slate-900 border-b border-slate-300 text-xs">Support</th>
                    <th colSpan={5} className="bg-[#FF0000] text-white rounded-tr-3xl">Put Details</th>
                  </tr>
                  {/* Level 2: Metric Header */}
                  <tr className="h-12 text-[11px] font-black uppercase text-center bg-[#FFFF00] divide-x divide-slate-300 border-y border-slate-300 sticky top-10 z-20 shadow-md">
                    <th className="w-20">CPR OI</th>
                    <th className="w-20">CPR VOL</th>
                    <th className="w-28">OI</th>
                    <th className="w-28">CHG OI</th>
                    <th className="w-28 border-r-2 border-slate-400">VOL</th>
                    <th className="w-28">OI</th>
                    <th className="w-28">CHG OI</th>
                    <th className="w-28">VOL</th>
                    <th className="w-20">PCR OI</th>
                    <th className="w-20">PCR VOL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                  {data.map((row) => (
                    <tr key={row.strikePrice} className="h-10 hover:bg-slate-50 group">
                      <td className={`text-center font-black border-r border-slate-200 ${row.isResistance ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}>{row.cprOI}</td>
                      <td className={`text-center font-black border-r border-slate-200 ${row.isResistance ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}>{row.cprVol}</td>
                      <td className="text-right px-4 border-r border-slate-200">{row.callOI.toLocaleString()}</td>
                      <td className={`text-right px-4 border-r border-slate-200 ${row.callChngOI >= 0 ? 'text-blue-600 font-black' : 'text-rose-500 font-black'}`}>{row.callChngOI.toLocaleString()}</td>
                      <td className="text-right px-4 border-r-2 border-slate-400 text-slate-500 font-bold">{row.callVolume.toLocaleString()}</td>
                      
                      <td className="text-center font-black bg-[#00B0F0]/90 text-white border-r-2 border-slate-400 text-sm py-2 select-all shadow-inner tracking-tight">{row.strikePrice.toLocaleString()}</td>
                      
                      <td className={`text-center font-black border-r-2 border-slate-400 text-[10px] tracking-widest ${row.isResistance ? 'bg-rose-500 text-white' : 'text-slate-200 italic font-normal'}`}>
                        {row.isResistance ? 'RESISTANCE' : '-'}
                      </td>
                      <td className={`text-center font-black border-r-2 border-slate-400 text-[10px] tracking-widest ${row.isSupport ? 'bg-emerald-500 text-white' : 'text-slate-200 italic font-normal'}`}>
                        {row.isSupport ? 'SUPPORT' : '-'}
                      </td>
                      <td className="text-right px-4 border-r border-slate-200">{row.putOI.toLocaleString()}</td>
                      <td className={`text-right px-4 border-r border-slate-200 ${row.putChngOI >= 0 ? 'text-blue-600 font-black' : 'text-rose-500 font-black'}`}>{row.putChngOI.toLocaleString()}</td>
                      <td className="text-right px-4 border-r border-slate-200 text-slate-500 font-bold">{row.putVolume.toLocaleString()}</td>
                      <td className={`text-center font-black border-r border-slate-200 ${row.isSupport ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}>{row.pcrOI}</td>
                      <td className={`text-center font-black ${row.isSupport ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400'}`}>{row.pcrVol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
