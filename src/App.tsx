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
    <div className="flex flex-col gap-24 text-left w-full py-12">
      {/* Executive Summary Section */}
      <section className="bg-brand-teal/5 p-12 rounded-[3rem] border border-brand-teal/10 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-brand-gold mb-6">NSE Option Chain Analysis Guide</h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-4xl font-medium">
            The NSE Option Chain provides real-time data for Nifty, Bank Nifty, and stocks. Our analyzer simplifies Open Interest (OI) into visual Support/Resistance maps using <strong className="text-brand-teal">6.0x institutional multipliers</strong> to identify key market barriers.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-brand-gold/5 blur-[100px] rounded-full" />
      </section>

      {/* Two-Column Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 px-4">
        <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-teal mb-10 border-b border-brand-teal/10 pb-4 inline-block">Methodology</h3>
          <div className="space-y-10">
            <div className="flex gap-8">
              <div className="w-10 h-10 rounded-xl bg-brand-teal text-brand-gold text-sm font-black flex items-center justify-center shrink-0 shadow-lg shadow-brand-teal/20">1</div>
              <div>
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-2">Official Data</h4>
                <p className="text-sm leading-relaxed text-slate-500 font-medium">Download CSV from nseindia.com for Indices or Equities.</p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="w-10 h-10 rounded-xl bg-brand-teal text-brand-gold text-sm font-black flex items-center justify-center shrink-0 shadow-lg shadow-brand-teal/20">2</div>
              <div>
                <h4 className="text-[13px] font-black text-slate-900 uppercase tracking-widest mb-2">Compatibility</h4>
                <p className="text-sm leading-relaxed text-slate-500 font-medium">Supports NIFTY, BANKNIFTY, FINNIFTY and stocks.</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-teal mb-10 border-b border-brand-teal/10 pb-4 inline-block">FAQ</h3>
          <div className="space-y-10">
            <div className="group">
              <h4 className="text-[12px] font-black uppercase text-brand-gold mb-3 tracking-widest">PCR Indicator</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">High PCR (especially above 1.5) at strikes suggests strong Put writing (floor).</p>
            </div>
            <div className="group">
              <h4 className="text-[12px] font-black uppercase text-brand-gold mb-3 tracking-widest">6.0x Threshold</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">Flags levels where one side has 6x the strength of the other (institutional barrier).</p>
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
              <h4 className="font-bold text-brand-teal text-[10px] uppercase tracking-wider">OI Clusters</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">Psychological Pivot Points identified visually without manual spreadsheet filtering.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-brand-teal text-[10px] uppercase tracking-wider">Volume Defense</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">High volume at mapped resistance confirms active defense by writers.</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold text-brand-teal text-[10px] uppercase tracking-wider">Strategic Map</h4>
              <p className="text-[12px] text-slate-600 leading-relaxed">Track OI Spikes and Change in OI to anticipate the next trending move.</p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-teal mb-4">Institutional Bias</h3>
          <p className="text-[13px] text-slate-600 leading-relaxed max-w-4xl mb-6 font-medium">
            Institutions are typically option writers. Understanding these 6x strength zones allows you to avoid false breakouts and look for mean reversion setups.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {['NIFTY', 'BANKNIFTY', 'STOCKS', 'EXPIRY'].map(item => (
               <div key={item} className="p-3 bg-white rounded-2xl border border-slate-100 text-center shadow-sm">
                 <span className="block text-[10px] font-black uppercase text-slate-400">{item}</span>
               </div>
             ))}
          </div>
        </section>

        <section className="bg-brand-teal text-white p-8 rounded-[2rem] relative overflow-hidden ring-1 ring-white/10 shadow-2xl">
          <div className="relative z-10">
            <h4 className="text-[11px] font-black uppercase mb-3 tracking-widest text-brand-gold">Risk Disclosure</h4>
            <p className="text-[12px] text-slate-300 leading-relaxed max-w-2xl font-medium tracking-wide">
              Trading derivatives involves high risk. This educational utility visualizes raw NSE data. We do not provide trading signals. Professional caution is advised.
            </p>
          </div>
        </section>
      </div>
    </div>
  );

  const FooterContent = () => (
    <div className="w-full bg-brand-teal text-white pt-24 pb-12 px-12 mt-48 rounded-t-[5rem] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold shadow-[0_0_20px_rgba(197,160,74,0.5)]" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 mb-20 text-center md:text-left">
        <div className="space-y-8">
          <div className="flex items-center justify-center md:justify-start gap-6">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden border border-white/20 p-2 transform -rotate-3">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain brightness-110" referrerPolicy="no-referrer" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl font-black uppercase tracking-[0.3em] text-white">Option Chain Analyzer</h3>
            </div>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed font-medium opacity-80 uppercase tracking-widest">
            Institutional-grade NSE data mapping and visualization. Trusted by advanced retail traders.
          </p>
        </div>
        <div className="space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-gold">Direct Links</h3>
          <div className="flex flex-col gap-5 items-center md:items-start text-sm font-medium text-slate-400">
            <button onClick={() => setData([])} className="hover:text-white transition-colors uppercase tracking-widest text-[11px] font-black">Reset Tool</button>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-white transition-colors uppercase tracking-widest text-[11px] font-black">Privacy Policy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-white transition-colors uppercase tracking-widest text-[11px] font-black">Terms of Use</button>
            <a href="mailto:support@optionchainanalyzer.in" className="hover:text-white transition-colors uppercase tracking-widest text-[11px] font-black">Contact Support</a>
          </div>
        </div>
        <div className="space-y-8 text-center md:text-right">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-brand-gold">Verification</h3>
          <div className="text-[10px] text-slate-500 font-black tracking-widest uppercase space-y-3">
            <p>Processing raw metrics from NSE India.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40">
        <p className="text-[10px] text-slate-400 font-black tracking-[0.5em] uppercase">
          © 2026 OptionChainAnalyzer.in
        </p>
        <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.3em]">
          <span>Security Verified</span>
          <span>End-to-End Local</span>
        </div>
      </div>
    </div>
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-gold mt-1 block">Protocol Document</span>
          </div>
        </div>        <div className="prose prose-slate prose-lg max-w-none">
        {type === 'privacy' ? (
          <div className="space-y-12 text-base">
            <p className="font-bold border-b pb-1">Last Updated: April 23, 2026</p>
            <p className="mt-4">Your privacy is important to us. It is NSE Option Chain Analyzer's policy to respect your privacy regarding any information we may collect from you across our website.</p>
            <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">1. Local Processing Only</h3>
            <p className="leading-relaxed text-slate-600">Our application analyzes data strictly locally in your browser. We do not upload your CSV files to any server. Your proprietary financial data never leaves your machine.</p>
            <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">2. Cookies & Ads</h3>
            <p className="leading-relaxed text-slate-600">We use third-party advertising services (Google AdSense) to keep this tool free. These services may use cookies to serve personalized ads based on your web browsing history.</p>
            <h3 className="font-black text-brand-teal mt-8 mb-4 uppercase tracking-wider">3. Anonymous Usage</h3>
            <p className="leading-relaxed text-slate-600">We do not collect PII (Personally Identifiable Information). No sign-up or email is required to use the mapper.</p>
          </div>
        ) : (
          <div className="space-y-12 text-base">
            <p className="font-bold border-b-2 pb-2 text-slate-900 border-brand-gold inline-block">Legal Agreement</p>
            <p className="mt-6 text-slate-600 leading-relaxed font-medium">By using optionchainanalyzer.in, you agree to comply with the following terms:</p>
            <h3 className="font-black text-brand-teal mt-10 mb-4 uppercase tracking-[0.2em] border-l-4 border-brand-gold pl-4">1. License for Personal Use</h3>
            <p className="leading-relaxed text-slate-600">We grant you a temporary license to use this analyzer for personal, non-commercial education. This tool is intended to simplify manual OI analysis.</p>
            <h3 className="font-black text-brand-teal mt-10 mb-4 uppercase tracking-[0.2em] border-l-4 border-brand-gold pl-4">2. Risk Disclosure</h3>
            <p className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-bold leading-relaxed shadow-sm">Financial markets involve high risk. Option trading is speculative. The levels generated by this tool are mathematical projections and not investment advice.</p>
            <h3 className="font-black text-brand-teal mt-10 mb-4 uppercase tracking-[0.2em] border-l-4 border-brand-gold pl-4">3. No Liability</h3>
            <p className="leading-relaxed text-slate-600">We are not responsible for any financial decisions or trading losses based on the output of this application. Always verify data with official exchange sources.</p>
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
      <header className="h-20 border-b bg-white/80 backdrop-blur-md px-8 flex items-center justify-between shrink-0 glass z-30 sticky top-0">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-brand-teal/5 flex items-center justify-center overflow-hidden border border-slate-100 p-1.5">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter uppercase text-brand-teal leading-none">Option Chain Analyzer</h1>
            <span className="text-[11px] font-bold tracking-[0.4em] uppercase text-brand-gold mt-1">Institutional Metrics</span>
          </div>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setData([])}
              className="px-6 py-3 bg-brand-teal text-white text-[11px] font-black uppercase tracking-widest transition-all hover:bg-brand-teal/90 active:scale-95 rounded-xl shadow-lg shadow-brand-teal/20 flex items-center gap-2 border border-white/10"
            >
              <AlertCircle size={14} className="text-brand-gold" />
              New Analysis
            </button>
          </div>
        )}
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white shadow-inner">        {data.length === 0 ? (
            <div className="flex-1 flex flex-col items-center overflow-auto scrollbar-none bg-[#fafafa] p-6 md:p-24">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center max-w-4xl w-full"
              >
                <h2 className="text-6xl md:text-8xl font-black mb-10 tracking-tighter text-brand-teal text-center leading-[0.85] uppercase">
                  Option Chain <br/>
                  <span className="text-brand-gold font-black">Analyzer</span>
                </h2>
                
                <p className="text-slate-500 text-xl leading-relaxed mb-16 max-w-2xl text-center font-medium">
                  Analyze NSE Option Chain data effortlessly. Upload your desired option chain CSV for <strong className="text-brand-teal">Indices (NIFTY, BANKNIFTY, FINNIFTY)</strong> or <strong>individual Stocks</strong> directly from the NSE website to identify institutional Support & Resistance levels based on real-time OI and Volume clusters.
                </p>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-black uppercase tracking-widest flex items-center gap-3 mb-12 shadow-sm"
                  >
                    <AlertCircle size={20} /> {error}
                  </motion.div>
                )}
                
                <div className="flex flex-col gap-8 mb-32">
                  <label className="px-14 py-7 bg-brand-teal text-white rounded-2xl text-lg font-black uppercase tracking-[0.3em] transition-all cursor-pointer hover:shadow-2xl hover:shadow-brand-teal/30 group active:scale-[0.98] border border-white/10 text-center">
                    Select CSV File
                    <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0], 'file_upload')} />
                  </label>
                  <p className="text-xs font-black uppercase tracking-[0.4em] text-brand-gold opacity-60">
                    or drop it anywhere on this page
                  </p>
                </div>

                <div className="w-full border-t border-slate-200/60 mt-8 pt-20 px-4">
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
                  <tr className="h-16 text-sm font-black uppercase text-white tracking-[0.2em] text-center sticky top-0 z-30">
                    <th colSpan={5} className="bg-brand-teal/95 backdrop-blur-sm border-r border-white/10 px-4">Call Analysis</th>
                    <th rowSpan={2} className="bg-brand-teal border-x-2 border-white/20 text-brand-gold w-36 border-b border-white/10 text-lg font-black">Strike</th>
                    <th rowSpan={2} className="bg-white border-r-2 border-slate-200 w-36 text-slate-900 border-b border-slate-200 text-xs tracking-widest px-4">Boundary</th>
                    <th rowSpan={2} className="bg-white border-r-2 border-slate-200 w-36 text-slate-900 border-b border-slate-200 text-xs tracking-widest px-4">Zone</th>
                    <th colSpan={5} className="bg-brand-teal/95 backdrop-blur-sm text-white px-4">Put Analysis</th>
                  </tr>
                  {/* Level 2: Metric Header */}
                  <tr className="h-16 text-[11px] font-black uppercase text-center bg-slate-50 divide-x divide-slate-200 border-b border-slate-200 sticky top-16 z-20 shadow-xl">
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
                        {row.isResistance ? 'RESISTANCE' : '—'}
                      </td>
                      <td className={`text-center font-black border-r-2 border-slate-200 text-[10px] tracking-[0.2em] transition-all duration-300 ${row.isSupport ? 'bg-support text-white shadow-inner scale-x-[1.02]' : 'text-slate-200 font-normal italic'}`}>
                        {row.isSupport ? 'SUPPORT' : '—'}
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
