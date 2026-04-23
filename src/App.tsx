import { useState, useCallback, DragEvent } from 'react';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertCircle, TrendingUp } from 'lucide-react';
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

  return (
    <div 
      className="h-screen bg-slate-100 font-sans text-slate-900 flex flex-col relative overflow-hidden"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
          <div className="w-5 h-5 bg-slate-900 rounded flex items-center justify-center">
            <TrendingUp size={12} className="text-white" />
          </div>
          <h1 className="text-xs font-black tracking-widest uppercase opacity-70">NSE Option Map</h1>
        </div>
        {data.length > 0 && (
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setData([])}
              className="px-3 py-1 bg-slate-100 border border-slate-200 text-[9px] font-black uppercase transition-all hover:bg-rose-500 hover:text-white hover:border-rose-600 rounded shadow-sm flex items-center gap-2"
            >
              <AlertCircle size={10} />
              Reset Map
            </button>
          </div>
        )}
      </header>

      {/* TOP AD SLOT */}
      <div className="w-full bg-slate-200/50 flex shrink-0 items-center justify-center py-2 border-b border-slate-200">
        <div className="w-[728px] h-[90px] bg-slate-300/30 border border-dashed border-slate-400 rounded flex items-center justify-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Top Leaderboard Ad (728x90)
        </div>
      </div>

      {/* Main Layout with Ad Sidebars */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT AD SLOT */}
        <aside className="w-[160px] bg-slate-50 border-r border-slate-200 flex flex-col items-center py-4 shrink-0 overflow-hidden">
          <div className="flex-1 w-[120px] bg-slate-200/40 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase [writing-mode:vertical-lr] tracking-widest leading-none rotate-180">
            Skyscraper Ad Slot
          </div>
        </aside>

        {/* Center Analysis Content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white shadow-inner">
          {data.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/50 p-6 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center max-w-sm"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center border border-slate-200 mb-6 transition-transform hover:rotate-3">
                  <FileSpreadsheet size={28} className="text-slate-400" />
                </div>
                <h2 className="text-xl font-black mb-2 tracking-tighter uppercase">Drop CSV Anywhere</h2>
                <p className="text-slate-500 text-xs leading-relaxed mb-8 max-w-xs">
                  Drop your NSE CSV here to generate the Support/Resistance map. This website uses PCR and CPR values to analyze key price levels.
                </p>
                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-[10px] font-bold uppercase flex items-center gap-2 mb-4">
                    <AlertCircle size={12} /> {error}
                  </div>
                )}
                <label className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer hover:bg-slate-800">
                  Browse File
                  <input type="file" className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && processCSV(e.target.files[0])} />
                </label>
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

        {/* RIGHT AD SLOT */}
        <aside className="w-[160px] bg-slate-50 border-l border-slate-200 flex flex-col items-center py-4 shrink-0 overflow-hidden">
          <div className="flex-1 w-[120px] bg-slate-200/40 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase [writing-mode:vertical-lr] tracking-widest leading-none">
            Skyscraper Ad Slot
          </div>
        </aside>

      </div>

      {/* Footer / Status Bar */}
      <footer className="h-8 bg-slate-900 border-t border-slate-800 text-white flex items-center px-6 justify-between shrink-0">
        <div className="flex gap-6 text-[8px] font-black uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2">
            <span className="text-slate-500">Method:</span> 
            <span className="text-emerald-400 underline underline-offset-2">DUAL_PCR_CPR_V2</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-slate-500">Mult:</span> 
            <span className="text-amber-400">6.0x_MIN</span>
          </span>
        </div>
        <div className="text-[8px] text-slate-500 flex items-center gap-4 uppercase tracking-widest font-bold">
          <span className="flex items-center gap-2">
            Free Access <span className="w-1 h-1 rounded-full bg-slate-700" /> Open Source Analysis
          </span>
          <div className="flex gap-4">
            <button 
              onClick={() => alert("Privacy Policy: This website does not collect, store, or share any personal user data. All CSV analysis is performed locally in your browser.")}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => alert("Terms of Use: This tool is for educational and analysis purposes only. Mapping data is calculated based on CSV uploads and does not constitute financial advice. Trading involves risk.")}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Use
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
