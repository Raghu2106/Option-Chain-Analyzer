import fs from 'fs';
import path from 'path';

// Define specialized SEO metadata for each route to ensure unique canonical headers, titles, and descriptions on Google.
const routeMeta = {
  'index': {
    title: 'Option Chain Analyzer - NSE Nifty & Bank Nifty Support/Resistance Tool',
    desc: 'Free NSE Option Chain Analyzer for Nifty and Bank Nifty. Instantly identify resistance and support levels using Open Interest (OI), Volume clusters, PCR, and CPR OI mapping for intraday trading.',
    canonical: 'https://optionchainanalyzer.in/'
  },
  'blog': {
    title: 'Market Research & Derivatives Education Blog - Option Chain Analyzer',
    desc: 'Learn option chain analysis, Put Call Ratio (PCR), Open Interest (OI) clustering, and other essential derivatives trading metrics with our expert-crafted guides.',
    canonical: 'https://optionchainanalyzer.in/blog'
  },
  'blog/understanding-max-pain-theory-on-the-option-chain': {
    title: 'Understanding Max Pain Theory on the Option Chain: How Option Sellers Position for Expiry',
    desc: 'Explore the Max Pain Theory: a derivatives analysis model showing how index/stock prices gravitate towards the strike price where option buyers face the greatest maximum financial loss on expiry day.',
    canonical: 'https://optionchainanalyzer.in/blog/understanding-max-pain-theory-on-the-option-chain'
  },
  'blog/understanding-implied-volatility-iv-on-the-option-chain': {
    title: 'Understanding Implied Volatility (IV) on the Option Chain: A Practical Guide',
    desc: 'Learn what Implied Volatility (IV) is, why it is crucial for pricing options, how to identify high/low IV on an option chain, and how to use it to optimize your options trading strategies.',
    canonical: 'https://optionchainanalyzer.in/blog/understanding-implied-volatility-iv-on-the-option-chain'
  },
  'blog/how-traders-identify-support-and-resistance-using-option-chain-data': {
    title: 'How Traders Identify Support and Resistance Using Option Chain Data',
    desc: 'Learn how traders identify support and resistance levels using option chain data and Open Interest concentrations.',
    canonical: 'https://optionchainanalyzer.in/blog/how-traders-identify-support-and-resistance-using-option-chain-data'
  },
  'blog/what-is-an-option-chain-and-why-do-traders-use-it': {
    title: "What Is an Option Chain and Why Do Traders Use It? A complete beginner's guide",
    desc: 'If you are learning about options trading, one of the first terms you will encounter is the option chain. Learn how option chains are structured, how to read them, and how experienced traders analyze market sentiment, support levels, and open interest.',
    canonical: 'https://optionchainanalyzer.in/blog/what-is-an-option-chain-and-why-do-traders-use-it'
  },
  'blog/what-is-put-call-ratio-pcr': {
    title: 'What Is Put Call Ratio (PCR)? Complete Beginner Guide for Option Traders',
    desc: 'Learn what Put Call Ratio (PCR) is, how it is calculated, how traders interpret PCR values, common misconceptions, limitations, and how PCR is used in option chain analysis.',
    canonical: 'https://optionchainanalyzer.in/blog/what-is-put-call-ratio-pcr'
  },
  'blog/what-is-open-interest-oi': {
    title: "What Is Open Interest (OI)? A Complete Beginner's Guide",
    desc: 'Learn what Open Interest (OI) is, how it works, how traders interpret OI changes, the difference between OI and volume, and why Open Interest is important in option chain analysis.',
    canonical: 'https://optionchainanalyzer.in/blog/what-is-open-interest-oi'
  },
  'blog/open-interest-vs-volume': {
    title: 'Open Interest vs Volume: Understanding the Key Differences',
    desc: 'Learn the difference between Open Interest and Volume, how traders use each metric, and why understanding both is important for option chain analysis.',
    canonical: 'https://optionchainanalyzer.in/blog/open-interest-vs-volume'
  },
  'about': {
    title: 'About Us - Option Chain Analyzer',
    desc: 'Discover the mission and background of Option Chain Analyzer, our visual support and resistance methodology, and how we help retail traders interpret live NSE option chain data.',
    canonical: 'https://optionchainanalyzer.in/about'
  },
  'privacy': {
    title: 'Privacy Protocol - Option Chain Analyzer',
    desc: 'Read our comprehensive privacy policy governing data protection, cookies, and local browser storage security guidelines.',
    canonical: 'https://optionchainanalyzer.in/privacy'
  },
  'terms': {
    title: 'Usage Terms & Legal Agreement - Option Chain Analyzer',
    desc: 'Review the usage terms and regulatory disclaimers governing your access to the Option Chain Analyzer software, spreadsheets, and educational blogs.',
    canonical: 'https://optionchainanalyzer.in/terms'
  }
};

const navigationHTML = `
<header class="h-20 border-b border-slate-200 bg-slate-100 px-8 flex items-center justify-between shrink-0 z-50 relative shadow-sm">
  <div class="flex items-center gap-6">
    <a href="/" class="w-12 h-12 bg-white rounded-2xl shadow-xl shadow-brand-teal/5 flex items-center justify-center overflow-hidden border border-slate-200 p-1.5 transition-all hover:scale-105 active:scale-95 group">
      <img src="/logo.svg" alt="Option Chain Analyzer Logo" class="w-full h-full object-contain" width="48" height="48" />
    </a>
    <div class="flex flex-col items-start">
      <h1 class="text-xl font-black tracking-tighter uppercase text-slate-800 leading-none">Option Chain Analyzer</h1>
      <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Live Derivative Dashboard</span>
    </div>
  </div>
  <nav class="hidden md:flex items-center gap-6">
    <a href="/" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-brand-teal transition-all">Analyzer Dashboard</a>
    <a href="/blog" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-brand-teal transition-all">Blog Articles</a>
    <a href="/about" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-brand-teal transition-all">About Us</a>
    <a href="/privacy" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-brand-teal transition-all">Privacy Protocol</a>
    <a href="/terms" class="text-xs font-black uppercase tracking-wider text-slate-600 hover:text-brand-teal transition-all">Terms of Use</a>
  </nav>
</header>
`;

const footerHTML = `
<footer class="w-full bg-slate-50 border-t border-slate-200 py-16 px-8 mt-16 rounded-t-[3rem] relative overflow-hidden">
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
      <div class="col-span-1 md:col-span-1 flex flex-col items-start gap-6">
        <div class="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl shadow-brand-teal/5 border border-slate-200">
          <img src="/logo.svg" alt="Option Chain Analyzer Logo" class="w-full h-full object-contain" width="48" height="48" />
        </div>
        <div class="space-y-2">
          <h3 class="text-sm font-black uppercase tracking-tighter text-brand-teal">Option Chain Analyzer</h3>
          <p class="text-[12px] text-slate-600 font-medium leading-relaxed max-w-[200px]">High-probability NSE data mapping and OI visualization tool.</p>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h4 class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Resources</h4>
        <div class="flex flex-col gap-3">
          <a href="/" class="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Analyzer Tool</a>
          <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" class="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">NSE Official Source</a>
          <a href="/blog" class="text-xs font-bold text-slate-600 hover:text-brand-teal transition-all text-left uppercase tracking-wider active:scale-95">Blog Articles</a>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h4 class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Security & Legal</h4>
        <div class="flex flex-col gap-3">
          <a href="/about" class="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">About Us</a>
          <a href="/privacy" class="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Privacy Protocol</a>
          <a href="/terms" class="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors text-left uppercase tracking-wider">Usage Terms</a>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <h4 class="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Support</h4>
        <div class="flex flex-col gap-3">
          <a href="mailto:support@optionchainanalyzer.in" class="text-xs font-bold text-slate-600 hover:text-brand-teal transition-colors uppercase tracking-wider">Contact Us</a>
          <span class="text-[11px] text-brand-teal/50 font-black uppercase tracking-widest text-left">v1.2.0 Stable Build</span>
        </div>
      </div>
    </div>
    
    <div class="pt-10 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-6">
      <p class="text-[11px] text-slate-500 font-black tracking-[0.4em] uppercase text-center md:text-left">
        © 2026 OptionChainAnalyzer.in • All Rights Reserved
      </p>
      <div class="flex gap-8 items-center">
        <p class="text-[10px] text-slate-400 font-semibold max-w-sm leading-relaxed text-center md:text-right">
          Disclaimer: Education only. Option trading involves substantial market risk. Please evaluate using primary regulatory charts.
        </p>
      </div>
    </div>
  </div>
</footer>
`;

const distPath = path.resolve('dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

const defaultIndex = fs.readFileSync(indexPath, 'utf-8');

console.log('--- Generating Optimised Static Route Folders for Google Indexing & SEO ---');

// Define rich page content generator
const getPageBodyContent = (route) => {
  let content = '';

  switch (route) {
    case 'index':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-12">
            <!-- Hero matches exactly with the visual output -->
            <div class="text-center space-y-6">
              <h2 class="text-3xl md:text-5xl font-black tracking-tighter text-[#0f4e5a] uppercase leading-[1.1]">
                Analyze NSE Option Chain <br class="hidden md:block" /> data effortlessly
              </h2>
              <p class="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium">
                Upload Option Chain CSVs specifically for <strong class="text-brand-teal">NSE Indices</strong> and <strong class="text-slate-705">F&O-listed Stocks</strong> directly from the official NSE website <a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" class="text-blue-600 hover:text-blue-700 underline font-semibold whitespace-nowrap">https://www.nseindia.com/option-chain</a> to identify high probable Support & Resistance zones based on real-time OI and volume clusters.
              </p>
            </div>

            <!-- Pre-render instructions for crawler indexing -->
            <div class="border border-slate-200/80 bg-slate-50 rounded-3xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-sm">
              <div class="w-12 h-12 bg-[#0f4e5a]/10 text-[#0f4e5a] rounded-2xl flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-upload"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </div>
              <h3 class="text-lg font-black text-slate-800 uppercase tracking-tight">Interactive Option Chain Mapper Tool</h3>
              <p class="text-xs text-slate-600 leading-relaxed font-semibold">
                To start, download the option chain .CSV file or search table from the National Stock Exchange of India (nseindia.com) for Nifty, Bank Nifty, or stock assets. Drag your file here or click "Upload CSV File" to instantly generate color-mapped support, resistance, Spot Price markers, and Volatility outlier alerts.
              </p>
              <div class="inline-block px-4 py-2 border border-slate-200 rounded-xl bg-white text-xs font-black uppercase tracking-wider text-slate-400">
                Awaiting Local File Upload (Client-Side)
              </div>
            </div>

            <!-- Complete index link list of Educational Blog for powerful crawler index connectivity -->
            <div class="border-t border-slate-200 pt-12 space-y-8">
              <div class="flex justify-between items-end border-b border-slate-100 pb-4">
                <div>
                  <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight">Derivatives Education & Option Chain Blog</h3>
                  <p class="text-xs text-[#0f4e5a] font-bold uppercase tracking-wider mt-1">Comprehensive tutorials on Open Interest, PCR, and Volume clusters</p>
                </div>
                <a href="/blog" class="text-xs font-black uppercase text-[#0f4e5a] hover:underline whitespace-nowrap">View All Articles &rarr;</a>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="border border-slate-100 bg-[#fafafa]/50 rounded-2xl p-6 hover:shadow-md transition-all space-y-3">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Education</span>
                  <h4 class="text-md font-black text-slate-800 uppercase tracking-tight">
                    <a href="/blog/how-traders-identify-support-and-resistance-using-option-chain-data" class="hover:text-[#0f4e5a] transition-colors">How Traders Identify Support and Resistance Using Option Chain Data</a>
                  </h4>
                  <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">Learn how traders identify support and resistance levels using option chain data and Open Interest concentrations.</p>
                  <a href="/blog/how-traders-identify-support-and-resistance-using-option-chain-data" class="text-xs font-bold text-[#0f4e5a] inline-block pt-1 hover:underline">Read Article &rarr;</a>
                </div>

                <div class="border border-slate-100 bg-[#fafafa]/50 rounded-2xl p-6 hover:shadow-md transition-all space-y-3">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Education</span>
                  <h4 class="text-md font-black text-slate-800 uppercase tracking-tight">
                    <a href="/blog/what-is-an-option-chain-and-why-do-traders-use-it" class="hover:text-[#0f4e5a] transition-colors">What Is an Option Chain and Why Do Traders Use It? A Complete Beginner's Guide</a>
                  </h4>
                  <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">If you are learning about options trading, one of the first terms you will encounter is the option chain. Learn how option chains are structured, how to read them, and how experienced traders analyze market sentiment, support levels, and open interest.</p>
                  <a href="/blog/what-is-an-option-chain-and-why-do-traders-use-it" class="text-xs font-bold text-[#0f4e5a] inline-block pt-1 hover:underline">Read Article &rarr;</a>
                </div>

                <div class="border border-slate-100 bg-[#fafafa]/50 rounded-2xl p-6 hover:shadow-md transition-all space-y-3">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Education</span>
                  <h4 class="text-md font-black text-slate-800 uppercase tracking-tight">
                    <a href="/blog/what-is-put-call-ratio-pcr" class="hover:text-[#0f4e5a] transition-colors">What Is Put Call Ratio (PCR)? Complete Beginner Guide for Option Traders</a>
                  </h4>
                  <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">Learn what Put Call Ratio (PCR) is, how it is calculated, how traders interpret PCR values, common misconceptions, limitations, and how PCR is used in option chain analysis.</p>
                  <a href="/blog/what-is-put-call-ratio-pcr" class="text-xs font-bold text-[#0f4e5a] inline-block pt-1 hover:underline">Read Article &rarr;</a>
                </div>

                <div class="border border-slate-100 bg-[#fafafa]/50 rounded-2xl p-6 hover:shadow-md transition-all space-y-3">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Education</span>
                  <h4 class="text-md font-black text-slate-800 uppercase tracking-tight">
                    <a href="/blog/what-is-open-interest-oi" class="hover:text-[#0f4e5a] transition-colors">What Is Open Interest (OI)? A Complete Beginner's Guide</a>
                  </h4>
                  <p class="text-xs text-slate-500 leading-relaxed line-clamp-2">Learn what Open Interest (OI) is, how it works, how traders interpret OI changes, the difference between OI and volume, and why Open Interest is important in option chain analysis.</p>
                  <a href="/blog/what-is-open-interest-oi" class="text-xs font-bold text-[#0f4e5a] inline-block pt-1 hover:underline">Read Article &rarr;</a>
                </div>
              </div>
            </div>

            <!-- Complete Option Chain operational guide rendered in clean HTML to ensure thousands of words of high-quality copy is crawled on / -->
            <div class="border-t border-slate-200/80 pt-16 flex flex-col gap-12 text-left">
              <div class="border-b-2 border-[#0f4e5a] pb-4">
                <h3 class="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">
                  Option Chain Analyzer Operational Guide
                </h3>
                <p class="text-xs md:text-sm font-black text-[#0f4e5a] uppercase tracking-[0.25em] mt-1">
                  User manual & systematic workflow for interpreting derivative open interest positioning
                </p>
              </div>

              <section class="space-y-6">
                <h4 class="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
                  1. Comprehensive Research Guide: Supplementary Analysis alongside Technical Charting
                </h4>
                <p class="text-sm md:text-base text-slate-600 leading-relaxed font-semibold">
                  The National Stock Exchange of India (NSE) hosts highly active derivatives segments, with liquid options contracts on major benchmark indices like Nifty 50, Bank Nifty, Financial Services Nifty (FINNIFTY), and Midcap Nifty (MIDCPNIFTY), alongside individual equity stock options. For research analysts, tracking these contracts in dense tabular layouts can be challenging. Our Option Chain Analyzer serves as a supplementary analytical dashboard, converting raw, static CSV files into intuitive, live, color-mapped visualizations. This utility should be used as a corroborative data source alongside your primary price charting platform.
                </p>
                <p class="text-sm md:text-base text-slate-600 leading-relaxed">
                  To analyze and locate potential support and resistance benchmarks as a confluence filter in conjunction with your chart analysis, follow this systematic workflow:
                </p>
                <ul class="list-disc pl-6 space-y-3 text-sm md:text-base text-slate-600 font-medium">
                  <li>
                    <strong>Acquiring Clean Data:</strong> Begin by navigating directly to the official National Stock Exchange of India option chain dashboard (nseindia.com/option-chain). Select your preferred contract—whether Nifty 50 or Bank Nifty—and click the "Download CSV" link to extract the latest snapshot.
                  </li>
                  <li>
                    <strong>Importing the File:</strong> Simply drag and drop the .csv file onto our drop zone on the main page, or click "Upload CSV File" to choose it manually. Our processing engine runs 100% locally in your browser memory, keeping your analytical data private and highly secure.
                  </li>
                  <li>
                    <strong>Locating the Spot Price & ATM Strike:</strong> The tool automatically extracts the current spot value and benchmarks the closest At-The-Money (ATM) strike. The ATM row acts as the key gravity center of the options chain and maps out a prominent highlighted container upon rendering so you never lose track of active market movements.
                  </li>
                  <li>
                    <strong>Reading the Color-Coded Multipliers:</strong> Look at the Call and Put ratio metrics. In corporate risk management and options analysis, heavy concentration of short open interest can signal significant resistance and support layers. If a strike exhibits a Call-to-Put or Put-to-Call ratio of 6.0x or more, our tool recognizes this as a high probable zone and color-highlights the strike in shades of green (strong Support) or red (strong Resistance).
                  </li>
                  <li>
                    <strong>Tracking Implied Volatility (IV) Anomalies:</strong> Implied Volatility (IV) measures market expectation of future movement. Our analyzer calculates the ATM-centered average IV. When a single strike experiences an IV spike exceeding 25% of this average, it highlights it as an anomaly. These premium spikes are statistical "hot-spots" where market participants are anticipating or hedging against price fluctuations.
                  </li>
                </ul>
              </section>

              <section class="space-y-6">
                <h4 class="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
                  2. Deep Dive Into Put-Call Ratio (PCR): Quantitative Sentiment Mapping
                </h4>
                <p class="text-sm md:text-base text-slate-600 leading-relaxed">
                  The Put-Call Ratio (PCR) is one of the most effective, mathematically derived market sentiment indicators used in derivatives analysis. While basic charts track price history, PCR maps out real-time position accumulation by market participants. In our analytical toolkit, PCR can be calculated across the entire index, or localized strike-by-strike, to show concentrated zones of dominance.
                </p>
                <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 my-4 text-center font-mono text-sm text-slate-800">
                  PCR (Open Interest) = Total Outstanding Put Open Interest / Total Outstanding Call Open Interest
                </div>
                <p class="text-sm md:text-base text-slate-600 leading-relaxed font-semibold">
                  Because option writing (selling) requires substantial margin capital under SEBI guidelines—typically averaging over ₹1,00,000 per lot compared to the minimal premium required to buy options—the option chain is traditionally analyzed from the perspective of option writers. Option buyers are generally retail participants who are vulnerable to rapid time decay (theta), whereas option writers are well-capitalized institutions, mutual funds, and large prop desks.
                </p>
              </section>

              <section class="space-y-6">
                <h4 class="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
                  3. Call-Put Ratio (CPR) Dynamics: Sector Resistance & High Probable Overhead Barriers
                </h4>
                <p class="text-sm md:text-base text-slate-600 leading-relaxed">
                  While retail platforms typically focus strictly on Put-Call relationships, experienced market analysts heavily monitor the reciprocal relationship: the Call-Put Ratio (CPR). In our option chain interface, CPR is mapped as a high-conviction resistance indicator.
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span class="block text-xs font-black uppercase text-brand-teal mb-1">Open Interest Call-Put Ratio (CPR OI)</span>
                    <span class="block font-mono text-[13px] text-slate-800 font-bold">CPR OI = Call Outstanding Open Interest / Put Outstanding Open Interest</span>
                    <p class="text-[11px] text-slate-500 mt-2">Tracks the build-up of massive overhead blocks. High CPR OI database indicates that major funds are heavily underwriting call contracts.</p>
                  </div>
                  <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span class="block text-xs font-black uppercase text-brand-teal mb-1">Volume Call-Put Ratio (CPR Vol)</span>
                    <span class="block font-mono text-[13px] text-slate-800 font-bold">CPR Vol = Call Traded Volume / Put Traded Volume</span>
                    <p class="text-[11px] text-slate-500 mt-2">Detects real-time volume build-up. Sudden spikes in CPR Vol show rapid resistance formation, often coinciding with capped price breakouts.</p>
                  </div>
                </div>
              </section>

              <section class="space-y-6">
                <h4 class="text-lg md:text-xl font-black text-slate-900 uppercase tracking-wide border-l-4 border-brand-teal pl-4">
                  4. Professional Risk Management: Mastering Derivatives Volatility
                </h4>
                <p class="text-sm md:text-base text-slate-600 leading-relaxed">
                  Futures and Options (F&O) analysis in the Indian stock exchange is inherently high-risk. While structured data analysis like PCR, volume concentration zone analysis, and IV tracking can dramatically improve your understanding of market structure, they are ultimately mathematical probabilities. No data model is infallible, and market conditions can change instantly.
                </p>
                <p class="text-sm md:text-base text-slate-600 leading-relaxed font-semibold">
                  Securities regulatory reports (SEBI) reveal a stark statistic for retail derivative traders: 9 out of 10 retail traders lose money in active option trading, with average losses often wiping out entire accounts. Capital preservation is the core hallmark separating veteran analysts from beginners.
                </p>
              </section>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'blog':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-12">
            <div class="space-y-4">
              <h1 class="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                Market Research & Derivatives Education Blog
              </h1>
              <p class="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                Welcome to our educational library. Dive deep into expert-crafted resources regarding Put Call Ratio configurations, options chain mapping, and open interest diagnostics on Nifty 50 and Bank Nifty contracts.
              </p>
            </div>

            <!-- Pre-render article items -->
            <div class="grid grid-cols-1 gap-12 pt-8 border-t border-slate-100">
              <article class="p-8 border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-brand-teal/5 transition-all bg-white">
                <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                  <span>June 10, 2026</span>
                  <span>4 min read</span>
                </div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  <a href="/blog/how-traders-identify-support-and-resistance-using-option-chain-data" class="hover:text-brand-teal">How Traders Identify Support and Resistance Using Option Chain Data</a>
                </h2>
                <p class="text-slate-600 text-sm md:text-base leading-relaxed">
                  Learn how traders identify support and resistance levels using option chain data and Open Interest concentrations.
                </p>
                <a href="/blog/how-traders-identify-support-and-resistance-using-option-chain-data" class="text-xs font-black uppercase tracking-wider text-[#0f4e5a] hover:underline inline-block pt-2">View Full Guide &rarr;</a>
              </article>

              <article class="p-8 border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-brand-teal/5 transition-all bg-white">
                <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                  <span>June 3, 2026</span>
                  <span>5 min read</span>
                </div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  <a href="/blog/open-interest-vs-volume" class="hover:text-brand-teal">Open Interest vs Volume: Understanding the Key Differences</a>
                </h2>
                <p class="text-slate-600 text-sm md:text-base leading-relaxed">
                  Learn the difference between Open Interest and Volume, how traders use each metric, and why understanding both is important for option chain analysis.
                </p>
                <a href="/blog/open-interest-vs-volume" class="text-xs font-black uppercase tracking-wider text-[#0f4e5a] hover:underline inline-block pt-2">View Full Guide &rarr;</a>
              </article>

              <article class="p-8 border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-brand-teal/5 transition-all bg-white">
                <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                  <span>May 31, 2026</span>
                  <span>6 min read</span>
                </div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  <a href="/blog/what-is-open-interest-oi" class="hover:text-brand-teal">What Is Open Interest (OI)? A Complete Beginner's Guide</a>
                </h2>
                <p class="text-slate-600 text-sm md:text-base leading-relaxed">
                  Learn what Open Interest (OI) is, how it works, how traders interpret OI changes, the difference between OI and volume, and why Open Interest is important in option chain analysis.
                </p>
                <a href="/blog/what-is-open-interest-oi" class="text-xs font-black uppercase tracking-wider text-[#0f4e5a] hover:underline inline-block pt-2">View Full Guide &rarr;</a>
              </article>

              <article class="p-8 border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-brand-teal/5 transition-all bg-white">
                <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                  <span>May 25, 2026</span>
                  <span>6 min read</span>
                </div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  <a href="/blog/what-is-put-call-ratio-pcr" class="hover:text-brand-teal">What Is Put Call Ratio (PCR)? Complete Beginner Guide for Option Traders</a>
                </h2>
                <p class="text-slate-600 text-sm md:text-base leading-relaxed">
                  Learn what Put Call Ratio (PCR) is, how it is calculated, how traders interpret PCR values, common misconceptions, limitations, and how PCR is used in option chain analysis.
                </p>
                <a href="/blog/what-is-put-call-ratio-pcr" class="text-xs font-black uppercase tracking-wider text-[#0f4e5a] hover:underline inline-block pt-2">View Full Guide &rarr;</a>
              </article>

              <article class="p-8 border border-slate-100 rounded-3xl space-y-4 hover:shadow-xl hover:shadow-brand-teal/5 transition-all bg-white">
                <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                  <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                  <span>May 22, 2026</span>
                  <span>7 min read</span>
                </div>
                <h2 class="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  <a href="/blog/what-is-an-option-chain-and-why-do-traders-use-it" class="hover:text-brand-teal">What Is an Option Chain and Why Do Traders Use It? A Complete Beginner's Guide</a>
                </h2>
                <p class="text-slate-600 text-sm md:text-base leading-relaxed">
                  If you are learning about options trading, one of the first terms you will encounter is the option chain. Learn how option chains are structured, how to read them, and how experienced traders analyze market sentiment, support levels, and open interest.
                </p>
                <a href="/blog/what-is-an-option-chain-and-why-do-traders-use-it" class="text-xs font-black uppercase tracking-wider text-[#0f4e5a] hover:underline inline-block pt-2">View Full Guide &rarr;</a>
              </article>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'blog/how-traders-identify-support-and-resistance-using-option-chain-data':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <div class="space-y-4">
              <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                <span>June 10, 2026</span>
                <span>4 min read</span>
              </div>
              <h1 class="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                How Traders Identify Support and Resistance Using Option Chain Data
              </h1>
              <p class="text-md text-slate-600 leading-relaxed font-semibold border-l-4 border-brand-teal pl-4">
                Learn how traders identify support and resistance levels using option chain data and Open Interest concentrations.
              </p>
            </div>

            <div class="border-t border-slate-100 pt-8 space-y-6 text-slate-700 leading-relaxed text-base">
              <p>
                In technical analysis, <strong>Support</strong> is an area where buying interest may emerge to stop a falling price. Conversely, <strong>Resistance</strong> is an area where selling pressure may appear to stall rising prices. Option chain data provides additional insight into where market participants are positioning themselves, allowing traders to observe these key levels in real-time.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div class="border border-slate-100 bg-slate-50/50 rounded-2xl p-6">
                  <span class="text-xs font-black uppercase text-brand-teal tracking-widest block mb-2">Demand Floor</span>
                  <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Support</h3>
                  <p class="text-sm text-slate-600 leading-relaxed">
                    An area where buying interest may emerge. It acts as a potential floor for price declines.
                  </p>
                </div>
                <div class="border border-slate-100 bg-slate-50/50 rounded-2xl p-6">
                  <span class="text-xs font-black uppercase text-amber-600 tracking-widest block mb-2">Supply Ceiling</span>
                  <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Resistance</h3>
                  <p class="text-sm text-slate-600 leading-relaxed">
                    An area where selling pressure may appear. It acts as a potential ceiling for price advances.
                  </p>
                </div>
              </div>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Open Interest Analysis</h2>
              <p>
                Open Interest (OI) represents the total number of outstanding active option contracts in the market. Large Open Interest concentrations often attract attention because they may indicate important strike prices being observed or written by major institutional participants.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Put Open Interest and Support Zones</h2>
              <p>
                Many options traders monitor large <strong>Put OI concentrations</strong> of option strike prices as potential support zones. Since put writers (sellers) take a bullish stance and back their views with significant margin capital, the highest concentrations often show where institutional money has laid down a solid price floor. When the underlying asset declines toward these heavy concentrations, buying may emerge.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Call Open Interest and Resistance Zones</h2>
              <p>
                Conversely, large <strong>Call OI concentrations</strong> are frequently monitored by options traders as potential resistance zones. Since call writers have a neutral-to-bearish perspective and seek to capture call option premiums, these key concentrations represent levels where significant supply clusters are placed, functioning as overhead ceilings.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Educational Confluence</h2>
              <p>
                Learn more about option chain analysis, Put Call Ratio (PCR), and Open Interest (OI) indicators at <a href="https://optionchainanalyzer.in/" class="text-brand-teal hover:underline font-bold">optionchainanalyzer.in</a>. Study live configurations of option chains to bridge the gap between abstract financial theory and real market structures. Always combine option chain analysis with Price Action, Chart Patterns, Volume, and sound risk controls.
              </p>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'blog/what-is-an-option-chain-and-why-do-traders-use-it':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <div class="space-y-4">
              <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                <span>May 22, 2026</span>
                <span>7 min read</span>
              </div>
              <h1 class="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                What Is an Option Chain and Why Do Traders Use It? A Complete Beginner's Guide
              </h1>
              <p class="text-md text-slate-600 leading-relaxed font-semibold border-l-4 border-brand-teal pl-4">
                If you are learning about options trading, one of the first terms you will encounter is the option chain. Learn how option chains are structured, how to read them, and how experienced traders analyze market sentiment, support levels, and open interest.
              </p>
            </div>

            <div class="border-t border-slate-100 pt-8 space-y-6 text-slate-700 leading-relaxed text-base">
              <p>
                At first glance, an option chain can appear intimidating. It is usually presented as a large table containing strike prices, premiums, open interest figures, trading volumes, and several other data points. However, experienced traders rely on option chain data every day because it provides valuable insight into market activity and trader positioning.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">What Is an Option Chain?</h2>
              <p>
                An option chain is a complete listing of all available option contracts for a specific underlying asset. The underlying asset could be a stock, an index (such as NIFTY or BANK NIFTY), an ETF, or a commodity. Each option chain displays all available strike prices and corresponding option contracts for a selected expiry date. The information is usually divided into two core sections: Call Options on the left (or as one primary focus) and Put Options on the right.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">How an Option Chain Is Structured</h2>
              <p>
                An option chain generally displays multiple columns of info. The exact layout may vary between brokers and platforms, but most option chains contain the following central elements:
              </p>
              <ul class="list-disc pl-6 space-y-3">
                <li><strong>Strike Price:</strong> The predetermined price level associated with an option contract. Acting as the gravity center of the options chain layout, it of course dictates the contract execution bounds.</li>
                <li><strong>Open Interest (OI):</strong> The total number of outstanding active option contracts in the market. Many traders consider open interest one of the most vital metrics of options chain analysis.</li>
                <li><strong>Volume:</strong> The absolute number of contracts traded during a specific session. High volume shows immediate trading speed and execution.</li>
                <li><strong>Implied Volatility (IV):</strong> The market's expectation of future price movement. Higher IV generally suggests larger price fluctuations.</li>
              </ul>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Why Traders Analyze Option Chains</h2>
              <p>
                Option chains provide information that goes beyond price alone. By comparing activity in calls and puts, traders attempt to estimate overall options market positioning. Heavy put activity may indicate strong floor support levels, whereas heavy call activity may suggest bullish interest or immediate resistance ceilings. Learning to read option chain data is often one of the first steps toward developing a deeper understanding of derivatives markets.
              </p>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'blog/what-is-put-call-ratio-pcr':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <div class="space-y-4">
              <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                <span>May 25, 2026</span>
                <span>6 min read</span>
              </div>
              <h1 class="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                What Is Put Call Ratio (PCR)? Complete Beginner Guide for Option Traders
              </h1>
              <p class="text-md text-slate-600 leading-relaxed font-semibold border-l-4 border-brand-teal pl-4">
                Learn what Put Call Ratio (PCR) is, how it is calculated, how traders interpret PCR values, common misconceptions, limitations, and how PCR is used in option chain analysis.
              </p>
            </div>

            <div class="border-t border-slate-100 pt-8 space-y-6 text-slate-700 leading-relaxed text-base">
              <p>
                Put Call Ratio (PCR) is one of the most widely used sentiment indicators in options trading. By comparing put activity with call activity, traders attempt to understand how options market participants are positioned. PCR is not a forecasting tool, but it can provide useful context when analysed alongside price action, open interest, and broader market conditions.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">How Is Put Call Ratio Calculated?</h2>
              <p>
                PCR based on Open Interest is calculated by dividing the total Put Open Interest by the total Call Open Interest. It can also be calculated using traded volume.
              </p>
              <div class="bg-slate-50 border-l-4 border-brand-teal rounded-r-2xl p-6 my-6">
                <span class="block text-xs font-black uppercase text-brand-teal tracking-widest mb-1">PCR formula</span>
                <div class="font-mono text-sm font-bold text-slate-800 bg-white/50 border border-slate-100 rounded-lg p-3 my-2 text-center">
                  PCR (OI) = Total Put Open Interest / Total Call Open Interest
                </div>
              </div>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Understanding PCR Values</h2>
              <p>
                Lower PCR values (e.g., below 0.7) generally indicate strong call activity relative to puts, reflecting a bullish sentiment bias. Higher PCR values (e.g., above 1.3) indicate stronger put activity or panic hedging, reflecting a cautious or relatively bearish sentiment. A PCR around 1.0 represents a balanced distribution. Note that these are helpful guidelines and not absolute rules; each market asset may have its own natural baseline range.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Why Do Traders Monitor PCR?</h2>
              <p>
                Traders monitor Put Call Ratios to gain multi-layered insights. Since options writers are typically well-capitalized institutions, tracing where puts or calls are being aggressively shorted provides indicators of where the "smart money" is establishing pricing boundaries. This helps options chain analysts evaluate trend stability and identify support levels.
              </p>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'blog/what-is-open-interest-oi':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <div class="space-y-4">
              <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                <span>May 31, 2026</span>
                <span>6 min read</span>
              </div>
              <h1 class="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                What Is Open Interest (OI)? A Complete Beginner's Guide
              </h1>
              <p class="text-md text-slate-600 leading-relaxed font-semibold border-l-4 border-brand-teal pl-4">
                Learn what Open Interest (OI) is, how it works, how traders interpret OI changes, the difference between OI and volume, and why Open Interest is important in option chain analysis.
              </p>
            </div>

            <div class="border-t border-slate-100 pt-8 space-y-6 text-slate-700 leading-relaxed text-base">
              <p>
                Open Interest (OI) is one of the most important concepts in derivatives trading, yet it is often misunderstood by beginners. Many traders focus only on price movement and overlook the information hidden within market participation data. Open Interest helps traders understand how many active contracts currently exist in the market.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">What Is Open Interest?</h2>
              <p>
                Open Interest refers to the total number of active derivative contracts (in futures or options) that have not been closed, settled, or exercised. Unlike trading volume, which measures how many contracts changed hands during a specific session, Open Interest measures ongoing market participation and capital commitment.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">How Open Interest Is Created</h2>
              <p>
                Open Interest increases when a new buyer and a new seller create a fresh contract. It decreases when both parties execute orders to close their existing positions. If one trader transfers an open position to another trader, Open Interest remains identical of course, because no new contract came into existence. Studying these mechanics is essential before interpreting complex option chain tables.
              </p>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">Open Interest in Option Chain Analysis</h2>
              <p>
                Option chain analysts frequently study Open Interest concentrations to understand where market participants are positioning themselves. Large accumulations of outstanding put-side contracts are frequently monitored as potential support zones, while heavy call-side concentrations are observed as potential resistance ceilings. Always combine OI evaluations with price action, trade volume, and proper charts before forming trading plans.
              </p>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'blog/open-interest-vs-volume':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <div class="space-y-4">
              <div class="flex items-center gap-3 text-xs text-slate-400 font-bold">
                <span class="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-[#0f4e5a] px-3 py-1 rounded">Education</span>
                <span>June 3, 2026</span>
                <span>5 min read</span>
              </div>
              <h1 class="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                Open Interest vs Volume: Understanding the Key Differences
              </h1>
              <p class="text-md text-slate-600 leading-relaxed font-semibold border-l-4 border-brand-teal pl-4">
                Learn the difference between Open Interest and Volume, how traders use each metric, and why understanding both is important for option chain analysis.
              </p>
            </div>

            <div class="border-t border-slate-100 pt-8 space-y-6 text-slate-700 leading-relaxed text-base">
              <p>
                Open Interest and Volume are two of the most commonly used metrics in options and futures trading. Although both appear in option chains, they measure different aspects of market behaviour.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                <div class="border border-slate-100 bg-slate-50/50 rounded-2xl p-6">
                  <span class="text-xs font-black uppercase text-brand-teal tracking-widest block mb-2">PARTICIPATION</span>
                  <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">What Is Open Interest?</h3>
                  <p class="text-sm text-slate-650 leading-relaxed">
                    Open Interest represents the total number of active derivative contracts that remain open. It is commonly used as a participation indicator.
                  </p>
                </div>
                <div class="border border-slate-100 bg-slate-50/50 rounded-2xl p-6">
                  <span class="text-xs font-black uppercase text-amber-600 tracking-widest block mb-2">ACTIVITY</span>
                  <h3 class="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">What Is Trading Volume?</h3>
                  <p class="text-sm text-slate-650 leading-relaxed">
                    Volume measures the number of contracts traded during a specific period. It reflects trading activity rather than active positions.
                  </p>
                </div>
              </div>

              <h2 class="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">The Core Difference</h2>
              <p>
                Open Interest measures active contracts, while Volume measures traded contracts. Open Interest tracks participation (how much capital is committed); Volume tracks activity (how fast trades are executing).
              </p>
              <p>
                Volume resets to zero at the start of each individual trading session. Open Interest is cumulative; it only changes as new contracts are created or existing positions are closed out. Option chain analysts combine both to study trends and determine support or resistance walls.
              </p>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'about':
      content = `
        <div class="flex flex-col min-h-screen bg-white">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <h1 class="text-3xl md:text-5xl font-black text-[#0f4e5a] tracking-tight leading-[1.1] uppercase">About Us - Option Chain Analyzer</h1>
            
            <div class="border-t border-slate-100 pt-8 space-y-8 text-slate-700 leading-relaxed text-base">
              <div>
                <h2 class="text-xl font-black text-slate-950 uppercase tracking-wider mb-2">Our Mission</h2>
                <p>
                  The <strong>Option Chain Analyzer</strong> is built with a simple objective: to transform highly dense, static spreadsheet datasets from the National Stock Exchange of India (NSE) into human-friendly, high-probability visualizations. We believe options data should be transparent and accessible to retail analysts.
                </p>
              </div>

              <div>
                <h2 class="text-xl font-black text-slate-950 uppercase tracking-wider mb-2">Visual Support and Resistance Methodology</h2>
                <p>
                  Derivatives analysis is often challenging when viewing standard, colorless option tables. Our analyzer parses real-time Open Interest (OI) and Traded Volume values, calculating Put-to-Call (PCR) and Call-to-Put (CPR) ratios strike-by-strike. When an outstanding contract multiply parameter of <strong>6.0x or higher</strong> is detected, the platform automatically color-codes that level to highlight prominent defense zones (Green for support, Red for resistance).
                </p>
              </div>

              <div>
                <h2 class="text-xl font-black text-slate-950 uppercase tracking-wider mb-2">Confluence Over Execution</h2>
                <p>
                  We recommend using this analyzer as a supportive, corroborative filter in conjunction with your primary price charting tools. Check your candlesticks, verify your trendlines, and use our color-mapped highlights to see if they align with high-probability support or resistance levels.
                </p>
              </div>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'privacy':
      content = `
        <div class="flex flex-col min-h-screen bg-[#fafafa]">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <h1 class="text-3xl md:text-5xl font-black text-[#0f4e5a] tracking-tight leading-[1.1] uppercase">Privacy Protocol</h1>
            <p class="font-bold text-slate-500 uppercase tracking-widest text-xs">Last Updated: April 23, 2026</p>
            
            <div class="border-t border-slate-150 pt-8 space-y-6 text-slate-700 leading-relaxed text-base bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200/60">
              <p>Your privacy is important to us. It is Option Chain Analyzer's policy to respect your privacy regarding any data we may handle from you across our website, <a href="https://optionchainanalyzer.in" class="text-brand-teal underline font-semibold">https://optionchainanalyzer.in</a>.</p>
              
              <h2 class="text-xl font-black text-[#0f4e5a] uppercase tracking-wide pt-4">1. Local-Only Processing Memory</h2>
              <p>The application analyzes data strictly locally inside your web browser. CSV files you upload are not sent to any database, synchronization portal, or outer server. All parsing runs client-side, keeping your proprietary sheets and files safe and confidential.</p>

              <h2 class="text-xl font-black text-[#0f4e5a] uppercase tracking-wide pt-4">2. Cookies and Advertising Partners</h2>
              <p>Third-party advertising services (specifically Google AdSense) may be used to serve personalized and/or non-personalized ads to keep this educational tool free. These advertising partners may use digital cookies, web beacons, and unique identifiers to collect anonymous browsing behavior data to optimize advertisements based on your search history.</p>

              <h2 class="text-xl font-black text-[#0f4e5a] uppercase tracking-wide pt-4">3. Absence of Personally Identifiable Information</h2>
              <p>We do not collect names, phone numbers, or email addresses. No registration, user accounts, password, or financial credentials are required to use this analyzer. This tool is completely open-access for anonymous learning and study purposes.</p>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;

    case 'terms':
      content = `
        <div class="flex flex-col min-h-screen bg-[#fafafa]">
          ${navigationHTML}
          
          <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
            <h1 class="text-3xl md:text-5xl font-black text-[#0f4e5a] tracking-tight leading-[1.1] uppercase">Usage Terms & Legal Disclaimers</h1>
            
            <div class="border-t border-slate-150 pt-8 space-y-6 text-slate-700 leading-relaxed text-base bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200/60">
              <h2 class="text-xl font-black text-rose-700 uppercase tracking-wide">1. Important Regulatory Financial Risk Disclosure</h2>
              <p class="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 font-bold leading-relaxed shadow-sm">
                Financial markets are subject to high volatility and risk. Options and derivatives trading involve substantial leverage and can result in significant capital losses of your entire trading account. Under SEBI guidelines, 9 out of 10 retail traders actively lose capital in the futures & options market. The levels, color mappings, PCR, and CPR ratios generated by this local mapper tool are purely mathematical calculations for educational and research purposes. They do not constitute financial advice, buying alerts, or recommendations to trade.
              </p>

              <h2 class="text-xl font-black text-slate-900 uppercase tracking-wide pt-4">2. Non-Commercial Educational License</h2>
              <p>This application is provided under a temporary personal license for study, research, and technical literacy. You must not compile, sell, or copy this code for commercial trading products or commercial proprietary tools.</p>

              <h2 class="text-xl font-black text-slate-900 uppercase tracking-wide pt-4">3. Accuracy of Data and Limitation of Liability</h2>
              <p>While the tool parses official National Stock Exchange of India (NSE) formatted spreadsheets and CSV files, we make no guarantees about mathematical completeness, historical correctness, or uninterrupted live data availability. We assume no liability for personal trading decisions, losses, or errors arising from using this software. Always verify and execute decisions on primary, official broker charting engines.</p>
            </div>
          </main>
          
          ${footerHTML}
        </div>
      `;
      break;
    
    default:
      content = `<div class="p-12 text-center text-slate-500 font-bold uppercase tracking-widest bg-white">Pre-rendered payload not available</div>`;
  }

  return content;
};

// 1. Process standard route subfolders
Object.keys(routeMeta).forEach(route => {
  if (route === 'index') return; // Handled separately directly at root-level index.html

  const meta = routeMeta[route];
  const dirPath = path.join(distPath, route);
  fs.mkdirSync(dirPath, { recursive: true });

  // Dynamically tailor metadata in the index.html template for current route
  let customizedHTML = defaultIndex;

  // Title Meta
  customizedHTML = customizedHTML.replace(
    /<title>[^<]+<\/title>/g,
    `<title>${meta.title}</title>`
  );

  // Canonical URL Meta
  customizedHTML = customizedHTML.replace(
    /<link rel="canonical" href="[^"]+" \/>/g,
    `<link rel="canonical" href="${meta.canonical}" />`
  );

  // Description Meta
  customizedHTML = customizedHTML.replace(
    /<meta name="description" content="[^"]+" \/>/g,
    `<meta name="description" content="${meta.desc}" />`
  );

  // Open Graph Meta Tags
  customizedHTML = customizedHTML.replace(
    /<meta property="og:url" content="[^"]+" \/>/g,
    `<meta property="og:url" content="${meta.canonical}" />`
  );
  customizedHTML = customizedHTML.replace(
    /<meta property="og:title" content="[^"]+" \/>/g,
    `<meta property="og:title" content="${meta.title}" />`
  );
  customizedHTML = customizedHTML.replace(
    /<meta property="og:description" content="[^"]+" \/>/g,
    `<meta property="og:description" content="${meta.desc}" />`
  );

  // Twitter Meta Tags
  customizedHTML = customizedHTML.replace(
    /<meta property="twitter:url" content="[^"]+" \/>/g,
    `<meta property="twitter:url" content="${meta.canonical}" />`
  );
  customizedHTML = customizedHTML.replace(
    /<meta property="twitter:title" content="[^"]+" \/>/g,
    `<meta property="twitter:title" content="${meta.title}" />`
  );
  customizedHTML = customizedHTML.replace(
    /<meta property="twitter:description" content="[^"]+" \/>/g,
    `<meta property="twitter:description" content="${meta.desc}" />`
  );

  // Inject rich pre-rendered HTML into <div id="root"></div> for crawlers
  const pageBody = getPageBodyContent(route);
  customizedHTML = customizedHTML.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${pageBody}</div>`
  );

  fs.writeFileSync(path.join(dirPath, 'index.html'), customizedHTML);
  console.log(`✓ Generated tailored SEO route: dist/${route}/index.html`);
});

// 2. Process root-level index.html (Homepage) and bake in rich content
try {
  let homeHTML = defaultIndex;
  const homeMeta = routeMeta['index'];

  homeHTML = homeHTML.replace(
    /<title>[^<]+<\/title>/g,
    `<title>${homeMeta.title}</title>`
  );
  homeHTML = homeHTML.replace(
    /<link rel="canonical" href="[^"]+" \/>/g,
    `<link rel="canonical" href="${homeMeta.canonical}" />`
  );
  homeHTML = homeHTML.replace(
    /<meta name="description" content="[^"]+" \/>/g,
    `<meta name="description" content="${homeMeta.desc}" />`
  );
  homeHTML = homeHTML.replace(
    /<meta property="og:url" content="[^"]+" \/>/g,
    `<meta property="og:url" content="${homeMeta.canonical}" />`
  );
  homeHTML = homeHTML.replace(
    /<meta property="og:title" content="[^"]+" \/>/g,
    `<meta property="og:title" content="${homeMeta.title}" />`
  );
  homeHTML = homeHTML.replace(
    /<meta property="og:description" content="[^"]+" \/>/g,
    `<meta property="og:description" content="${homeMeta.desc}" />`
  );

  // Inject beautiful text and guides inside the homepage <div id="root"></div> as well!
  const homeBody = getPageBodyContent('index');
  homeHTML = homeHTML.replace(
    /<div id="root"><\/div>/,
    `<div id="root">${homeBody}</div>`
  );

  fs.writeFileSync(indexPath, homeHTML);
  console.log(`✓ Generated tailored rich Homepage: dist/index.html`);
} catch (e) {
  console.error("Failed to customize root index.html:", e);
}

// 3. Update the root-level fallback standard copies safely
fs.copyFileSync(indexPath, path.join(distPath, '404.html'));
console.log('✓ Generated fallback: dist/404.html');
console.log('--- All static route folders generated and customized successfully! ---');
