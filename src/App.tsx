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

  const processCSV = useCallback((file: File) => {
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
    if (file) processCSV(file);
  };

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
          <h1 className="text-sm font-black tracking-widest uppercase text-[#0f4e5a]/90">Option Analyzer</h1>
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
                <div className="relative mb-8 group">
                  <div className="w-56 h-auto min-h-[14rem] bg-white rounded-3xl shadow-2xl flex items-center justify-center p-6 border border-slate-100 overflow-hidden transition-all group-hover:scale-105">
                    {logoError ? (
                      <div className="flex flex-col items-center gap-4">
                        <TrendingUp size={64} className="text-[#0f4e5a]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Option Chain Analyzer</span>
                      </div>
                    ) : (
                      <img 
                        src="/logo.png" 
                        alt="NSE India Option Chain Analyzer Support and Resistance Chart Logo" 
                        className="w-full h-full object-contain" 
                        referrerPolicy="no-referrer"
                        onError={() => setLogoError(true)}
                      />
                    )}
                  </div>
                  <div className="absolute -inset-8 bg-[#0f4e5a]/10 blur-3xl rounded-full -z-10" />
                </div>
                <h2 className="text-3xl font-black mb-4 tracking-tighter uppercase text-slate-900">Option Chain Analyzer</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-md text-center">
                  Drop your NSE Option Chain CSV anywhere to identify Support & Resistance levels using real-time Open Interest and Volume analysis.
                </p>
                
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[10px] font-bold uppercase flex items-center gap-2 mb-6">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                
                <label className="px-8 py-4 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 group mb-16">
                  Select CSV File
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0])} />
                </label>

                {/* Educational Content for AdSense & SEO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full border-t border-slate-200 pt-16">
                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 opacity-50">How it Works</h3>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</div>
                        <p className="text-[11px] leading-relaxed text-slate-600">Download the Option Chain CSV from the official NSE India website for any stock or index.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</div>
                        <p className="text-[11px] leading-relaxed text-slate-600">Drop the file here. Our algorithm scans all strike prices for PCR (Put Call Ratio) and CPR (Call Put Ratio).</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</div>
                        <p className="text-[11px] leading-relaxed text-slate-600">Key support and resistance levels are identified where OI and Volume clusters exceed our 6.0x threshold.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-4 opacity-50">Frequently Asked</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-black uppercase mb-1 text-slate-900">Is my data safe?</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Yes. Processing happens entirely in your local browser. No data is ever uploaded to our servers.</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase mb-1 text-slate-900">What is the 6.0x Multiplier?</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">We flag a level as Support or Resistance only when the Put/Call strength ratio is at least 6 times higher than the opposite side.</p>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto flex flex-col items-center scrollbar-thin scrollbar-thumb-slate-300">
              <table className="border-collapse table-fixed min-w-max h-fit bg-white shadow-xl border border-slate-300 m-4 mb-8">
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
          )}
        </main>

      <footer className="h-8 bg-slate-900 border-t border-slate-800 text-white flex items-center px-6 justify-between shrink-0">
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
        <div className="text-[8px] text-slate-500 flex items-center gap-4 uppercase tracking-widest font-bold">
          <span className="flex items-center gap-2">
            Free Access <span className="w-1 h-1 rounded-full bg-slate-700" /> Open Source Analysis
          </span>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveModal('privacy')}
              className="text-slate-400 hover:text-white transition-colors uppercase"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setActiveModal('terms')}
              className="text-slate-400 hover:text-white transition-colors uppercase"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
