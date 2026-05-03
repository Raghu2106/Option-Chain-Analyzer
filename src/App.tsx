import { useState, useCallback, DragEvent } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
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
    <div className="flex flex-col gap-12 text-left w-full py-6">
      {/* Executive Summary Section */}
      <section className="bg-brand-teal/5 p-8 rounded-[2rem] border border-brand-teal/10 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-teal mb-3">NSE Option Chain Analysis Guide</h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-4xl font-medium">
            The NSE Option Chain provides real-time data for Nifty, Bank Nifty, and stocks. The analyzer simplifies Open Interest (OI) into visual Support/Resistance maps using <strong className="text-brand-teal">6.0x institutional multipliers</strong> to identify key market barriers.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-teal/5 blur-[100px] rounded-full" />
      </section>

      {/* Two-Column Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-2">
        <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-teal mb-6 border-b border-brand-teal/10 pb-4 inline-block">Methodology & How-to-Use</h3>
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
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-teal mb-6 border-b border-brand-teal/10 pb-4 inline-block">Proper FAQs</h3>
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
        <section className="max-w-4xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Market Structure</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-brand-teal text-[10px] uppercase tracking-wider">OI Clusters</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">Psychological Pivot Points identified visually without manual spreadsheet filtering.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-brand-teal text-[10px] uppercase tracking-wider">Volume Defense</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">High volume at mapped resistance confirms active defense by writers.</p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-brand-teal text-[10px] uppercase tracking-wider">Strategic Map</h4>
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

  const FooterContent = () => (
    <footer className="w-full bg-slate-50 border-t border-slate-200 py-16 px-8 mt-16 rounded-t-[3rem] relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1 flex flex-col items-start gap-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl shadow-brand-teal/5 border border-slate-200">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-full h-full object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-black uppercase tracking-tighter text-brand-teal">Option Chain Analyzer</h3>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[200px]">Institutional-grade NSE data mapping and OI visualization tool.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Resources</h4>
            <div className="flex flex-col gap-3">
              <button onClick={() => setData([])} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Reset Platform</button>
              <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">NSE Official Source</a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Security & Legal</h4>
            <div className="flex flex-col gap-3">
              <button onClick={() => setActiveModal('privacy')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Privacy Protocol</button>
              <button onClick={() => setActiveModal('terms')} className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Usage Terms</button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Support</h4>
            <div className="flex flex-col gap-3">
              <a href="mailto:support@optionchainanalyzer.in" className="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">Contact Us</a>
              <span className="text-[11px] text-brand-teal/50 font-black uppercase tracking-widest">v1.2.0 Stable Build</span>
            </div>
          </div>
        </div>
        
        <div className="pt-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase">
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
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
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

      {/* Header */}
      <header className="h-20 border-b border-slate-200 bg-slate-100 px-8 flex items-center justify-between shrink-0 z-50 relative shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-brand-teal/5 flex items-center justify-center overflow-hidden border border-slate-200 p-1.5 transition-all hover:scale-105 active:scale-95 group">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter uppercase text-brand-teal leading-none">Option Chain Analyzer</h1>
          </div>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setData([])}
              className="px-6 py-2.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-100 active:scale-95 rounded-xl shadow-sm shadow-rose-100/50 flex items-center gap-2 border border-rose-200"
            >
              <AlertCircle size={14} className="text-rose-500" />
              Reset
            </button>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white shadow-inner">        {data.length === 0 ? (
            <div className="flex-1 flex flex-col items-center overflow-auto scrollbar-none bg-[#fafafa] p-4 md:p-6">
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
                  <label className="px-8 py-4 bg-brand-teal text-white rounded-xl text-sm font-black uppercase tracking-[0.3em] transition-all cursor-pointer hover:shadow-lg hover:shadow-brand-teal/20 group active:scale-[0.98] border border-white/10 text-center">
                    Select CSV File
                    <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0], 'file_upload')} />
                  </label>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 opacity-60 text-center">
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
            <div className="flex-1 overflow-auto flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300">
              <div className="max-w-screen-xl w-full p-4 md:p-8">
                <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 mb-16">
                  <table className="border-collapse table-fixed min-w-max w-full">
                <thead className="relative z-20">
                  {/* Level 1: Category Header */}
                  <tr className="h-10 text-[10px] font-black uppercase text-white tracking-[0.2em] text-center sticky top-0 z-30">
                    <th colSpan={5} className="bg-brand-teal border-r border-white/10 px-4">Call Analysis</th>
                    <th rowSpan={2} className="bg-brand-teal border-x-2 border-white/20 text-emerald-400 w-36 border-b border-white/10 text-sm font-black">Strike</th>
                    <th rowSpan={2} className="bg-white border-r-2 border-slate-200 w-32 text-slate-900 border-b border-slate-200 text-[9px] tracking-widest px-4">Resistance Zones</th>
                    <th rowSpan={2} className="bg-white border-r-2 border-slate-200 w-32 text-slate-900 border-b border-slate-200 text-[9px] tracking-widest px-4">Support Zones</th>
                    <th colSpan={5} className="bg-brand-teal text-white px-4">Put Analysis</th>
                  </tr>
                  {/* Level 2: Metric Header */}
                  <tr className="h-16 text-[11px] font-black uppercase text-center bg-slate-50 divide-x divide-slate-200 border-b border-slate-200 sticky top-10 z-20 shadow-xl">
                    <th className="w-24 text-brand-teal/60">CPR OI</th>
                    <th className="w-24 text-brand-teal/60">CPR VOL</th>
                    <th className="w-32">OI</th>
                    <th className="w-32">CHG OI</th>
                    <th className="w-32 border-r border-slate-300">Volume</th>
                    <th className="w-32">OI</th>
                    <th className="w-32">CHG OI</th>
                    <th className="w-32">Volume</th>
                    <th className="w-24 text-brand-teal/60">PCR OI</th>
                    <th className="w-24 text-brand-teal/60">PCR VOL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {data.map((row) => (
                    <tr key={row.strikePrice} className="h-14 hover:bg-slate-50/80 group transition-colors">
                      <td className={`text-center font-bold border-r border-slate-100 ${row.isResistance ? 'text-resistance bg-resistance/5' : 'text-slate-400'}`}>{row.cprOI}</td>
                      <td className={`text-center font-bold border-r border-slate-100 ${row.isResistance ? 'text-resistance bg-resistance/5' : 'text-slate-400'}`}>{row.cprVol}</td>
                      <td className="text-right px-6 border-r border-slate-100 text-slate-700">{row.callOI.toLocaleString()}</td>
                      <td className={`text-right px-6 border-r border-slate-100 ${row.callChngOI >= 0 ? 'text-brand-teal font-black text-xs' : 'text-resistance font-black text-xs'}`}>{row.callChngOI.toLocaleString()}</td>
                      <td className="text-right px-6 border-r-2 border-slate-200 text-slate-400 font-medium italic">{row.callVolume.toLocaleString()}</td>
                      
                      <td className="text-center font-black bg-brand-teal text-white border-x-2 border-white/20 text-base py-3 select-all shadow-inner tracking-tight">{row.strikePrice.toLocaleString()}</td>
                      
                      <td className={`text-center font-black border-r-2 border-slate-200 text-[10px] tracking-[0.2em] transition-all duration-300 ${row.isResistance ? 'bg-resistance text-white shadow-inner scale-x-[1.02]' : 'text-slate-200 font-normal italic'}`}>
                        {row.isResistance ? 'RESISTANCE ZONE' : '—'}
                      </td>
                      <td className={`text-center font-black border-r-2 border-slate-200 text-[10px] tracking-[0.2em] transition-all duration-300 ${row.isSupport ? 'bg-support text-white shadow-inner scale-x-[1.02]' : 'text-slate-200 font-normal italic'}`}>
                        {row.isSupport ? 'SUPPORT ZONE' : '—'}
                      </td>
                      <td className="text-right px-6 border-r border-slate-100 text-slate-700">{row.putOI.toLocaleString()}</td>
                      <td className={`text-right px-6 border-r border-slate-100 ${row.putChngOI >= 0 ? 'text-brand-teal font-black text-xs' : 'text-resistance font-black text-xs'}`}>{row.putChngOI.toLocaleString()}</td>
                      <td className="text-right px-6 border-r border-slate-100 text-slate-400 font-medium italic">{row.putVolume.toLocaleString()}</td>
                      <td className={`text-center font-bold border-r border-slate-100 ${row.isSupport ? 'text-support bg-support/5' : 'text-slate-400'}`}>{row.pcrOI}</td>
                      <td className={`text-center font-bold ${row.isSupport ? 'text-support bg-support/5' : 'text-slate-400'}`}>{row.pcrVol}</td>
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
