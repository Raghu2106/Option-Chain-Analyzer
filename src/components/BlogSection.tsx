import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Share2,
  Bookmark,
  UserCheck,
  AlertCircle,
  Check
} from 'lucide-react';

export type BlogCategory =
  | 'Global Macro'
  | 'Option Chain Basics'
  | 'Analytical Metrics'
  | 'Volatility & Risk';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: React.ReactNode;
  category: BlogCategory;
  date: string;
  readTime: string;
  author: string;
}

interface BlogSectionProps {
  onBackToApp: () => void;
  openArticleId?: string | null;
  onSelectArticle: (id: string | null) => void;
}

const BOOKMARKS_STORAGE_KEY = 'oca_bookmarked_articles';

export default function BlogSection({ onBackToApp, openArticleId, onSelectArticle }: BlogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = window.localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarkedIds));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [bookmarkedIds]);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const posts = useMemo<BlogPost[]>(() => [
    {
      id: 'global-central-bank-liquidity-shifts-nse-derivatives',
      title: 'Global Central Bank Liquidity Cycles: How Macro Shocks Transmit to the NSE Option Chain',
      excerpt: 'An educational overview of how policy rate decisions by the US Federal Reserve, European Central Bank, and Bank of Japan alter cross-border capital flows and Implied Volatility on Indian benchmark indices.',
      category: 'Global Macro',
      date: 'October 31, 2026',
      readTime: '5 min read',
      author: 'OptionChainAnalyzer Helpdesk',
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px] md:text-base max-w-[68ch]">
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed">
            In interconnected financial markets, domestic index derivatives respond continuously to global capital flows. Shifts in monetary policy stances by major central banks—including the US Federal Reserve (Fed), the European Central Bank (ECB), and the Bank of Japan (BoJ)—alter sovereign bond yields and cross-border liquidity, which in turn shape open interest distribution on the National Stock Exchange of India (NSE).
          </p>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">Key Educational Concepts</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
              <li><strong>Yield Spread Dynamics:</strong> Widening spreads between US 10-Year Treasuries and Indian Government Bonds affect Foreign Portfolio Investor (FPI) hedging requirements across index options.</li>
              <li><strong>Currency Carry Adjustments:</strong> Sudden policy shifts abroad can trigger cross-asset deleveraging and measurable Implied Volatility (IV) expansion in domestic contracts.</li>
              <li><strong>Observational Mapping:</strong> Option chain Open Interest (OI) reflects existing contractual commitments—it is a descriptive ledger, not a predictive price signal.</li>
            </ul>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              01. The Global Monetary Transmission Channels
            </h2>
            <p>
              When major central banks adjust benchmark interest rates or balance sheet liquidity, institutional allocators reassess emerging market exposures through three main channels:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Foreign Portfolio Flows</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Higher sovereign yields abroad raise the global risk-free hurdle rate, influencing net institutional cash and index derivatives positioning.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Currency &amp; FX Hedging</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Moves in the US Dollar Index (DXY) affect the INR/USD exchange rate, prompting institutional portfolios to adjust index hedges during currency swings.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Cross-Asset Volatility</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Global equity repricing elevates international risk aversion, often appearing on NSE option chains as broader Implied Volatility expansion.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              02. Observable Option Chain Signatures
            </h2>
            <p>
              During scheduled policy meetings such as FOMC rate decisions or macro payroll releases, analysts examine how strike tables reprice risk:
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                    <th className="p-3">Macro Event Regime</th>
                    <th className="p-3">Primary Metric Observed</th>
                    <th className="p-3">Typical Option Chain Behavior</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Tighter Global Rate Expectations</td>
                    <td className="p-3">Call Open Interest &amp; CPR</td>
                    <td className="p-3">Increased Out-of-the-Money Call OI concentration at upper strikes as institutions hedge upside exposure.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Accommodative Policy Stance</td>
                    <td className="p-3">Put Open Interest &amp; PCR</td>
                    <td className="p-3">Gradual Put OI addition closer to at-the-money strikes as downside hedging urgency eases.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-900">Unanticipated Policy Surprise</td>
                    <td className="p-3">Implied Volatility (IV) Skew</td>
                    <td className="p-3">Put-side IV rises faster than Call-side IV, reflecting higher demand for downside portfolio protection.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              03. Event-Driven IV Expansion &amp; Post-Event Crush
            </h2>
            <p>
              Before major central bank announcements, option premiums across both Calls and Puts frequently expand—a statistical effect known as <em>IV inflation</em>. Once the announcement passes and event uncertainty clears, excess implied volatility rapidly deflates (<em>IV crush</em>), demonstrating why option pricing reflects uncertainty rather than direction alone.
            </p>
          </section>
        </div>
      ),
    },
    {
      id: 'geopolitical-trade-corridor-disruptions-market-volatility',
      title: 'Geopolitical Developments & Global Trade Disruptions: Reading Derivatives Sentiment on the NSE',
      excerpt: 'An educational guide on how geopolitical events, global supply chain bottlenecks, and trade policy updates impact energy inputs, India VIX, and option chain open interest structures.',
      category: 'Global Macro',
      date: 'October 31, 2026',
      readTime: '5 min read',
      author: 'OptionChainAnalyzer Helpdesk',
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px] md:text-base max-w-[68ch]">
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed">
            Geopolitical developments and international trade policy shifts—such as maritime shipping disruptions, commodity export restrictions, or tariff revisions—introduce external economic variables for net-importing economies. Understanding how these headlines translate into India VIX and NSE option chain structures helps market participants read derivatives data objectively.
          </p>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">Key Awareness Points</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-700">
              <li><strong>Import Sensitivity:</strong> India imports over 85% of its crude oil, making benchmark energy shocks an important macro factor for domestic inflation and corporate margin expectations.</li>
              <li><strong>Volatility Thermometer:</strong> Geopolitical uncertainty often raises India VIX as market makers and funds price wider expected index ranges.</li>
              <li><strong>Defensive Strike Adjustments:</strong> Shifting open interest distributions highlight how institutions adjust portfolio protection—not guaranteed market direction.</li>
            </ul>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              01. How Geopolitical Headlines Affect Pricing Surfaces
            </h2>
            <p>
              Unlike scheduled quarterly earnings or central bank calendars, geopolitical news frequently arrives without advance notice. When supply corridors face disruption, two immediate adjustments occur across financial markets:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Commodity &amp; Freight Cost Risk</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Higher Brent crude prices and freight rates can widen trade balances and pressure input costs for aviation, logistics, and manufacturing industries.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Safe-Haven Capital Reallocation</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Periods of international tension historically prompt global funds to rotate temporarily toward reserve currencies and sovereign debt instruments.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              02. Observing Open Interest Shifts &amp; Volatility Skew
            </h2>
            <p>
              During headline-heavy weeks, reading the NSE option chain reveals three structural patterns in how risk is priced:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
              <li><strong>Lower Put Strike Migration:</strong> Option writers often shift activity further out-of-the-money (OTM) to give themselves wider statistical cushions against sudden intraday swings.</li>
              <li><strong>Asymmetric Put IV Skew:</strong> Protective Put contracts frequently trade at higher Implied Volatility than equidistant Call contracts because portfolio managers pay extra premium for downside insurance.</li>
              <li><strong>Volume vs. Net New Positions:</strong> Comparing intraday trading Volume against Change in Open Interest clarifies whether headlines caused temporary turnover or durable hedging commitments.</li>
            </ul>
          </section>
        </div>
      ),
    },
    {
      id: 'nasdaq-tech-earnings-wall-street-cues-nifty-opening-gaps',
      title: 'Overnight Wall Street & Global Cues: Understanding Opening Price Adjustments on the NSE',
      excerpt: 'How overnight US index moves, global technology earnings, and Gift Nifty pricing shape domestic opening gaps and early-session open interest updates on the NSE.',
      category: 'Global Macro',
      date: 'October 21, 2026',
      readTime: '5 min read',
      author: 'OptionChainAnalyzer Helpdesk',
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px] md:text-base max-w-[68ch]">
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed">
            Because Indian equity markets operate in a different time zone from Wall Street and major European exchanges, overnight global earnings releases and US index movements are often priced into domestic benchmarks immediately at the 9:15 AM IST opening bell. Examining how overnight cues translate into opening gaps and option chain adjustments provides essential context for market literacy.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              01. Why Overnight Cues Create Opening Gaps
            </h2>
            <p>
              Major US indices (the S&amp;P 500 and Nasdaq Composite), global semiconductor and software earnings, and Asian morning benchmarks reflect new economic information while the NSE is closed. International derivatives contracts such as Gift Nifty trade across extended hours, allowing domestic indices to reflect global valuations right at market open.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              02. How Option Chains Re-Center After an Opening Gap
            </h2>
            <p>
              When the underlying spot index opens significantly higher or lower than the previous day&apos;s close, the existing At-The-Money (ATM) strike shifts immediately:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
              <li><strong>Strike Re-Anchoring:</strong> Yesterday&apos;s Out-of-the-Money strikes can instantaneously become In-the-Money or At-the-Money contracts, altering Delta and Gamma sensitivity.</li>
              <li><strong>Early-Session Liquidity Noise:</strong> During the first 15 minutes of trading, bid-ask spreads and implied volatility readings fluctuate rapidly as market makers recalibrate quotes to the new spot reference.</li>
              <li><strong>Position Unwinding vs. Fresh Addition:</strong> Monitoring Change in OI after initial market settlement shows whether existing contract holders closed positions or established new reference levels.</li>
            </ul>
          </section>
        </div>
      ),
    },
    {
      id: 'what-is-an-option-chain-and-why-do-traders-use-it',
      title: 'What Is an Option Chain? Understanding Calls, Puts, and Strike Structure',
      excerpt: 'A clear, beginner-friendly explanation of how NSE option chains organize strike prices, Calls, Puts, Last Traded Price (LTP), and Open Interest in a single tabular matrix.',
      category: 'Option Chain Basics',
      date: 'October 15, 2026',
      readTime: '5 min read',
      author: 'OptionChainAnalyzer Helpdesk',
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px] md:text-base max-w-[68ch]">
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed">
            An <strong>option chain</strong> (or option matrix) is an exchange-published table listing all active Call and Put option contracts available for a given underlying index or stock—such as NIFTY 50 or BANK NIFTY—for a specific expiration date. Learning to read its columns is the first step toward derivatives literacy.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              01. Anatomy of the Option Chain Table
            </h2>
            <p>
              Every option chain is organized symmetrically around a central <strong>Strike Price</strong> column:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Calls (Left Side)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A Call contract gives the buyer the right, without obligation, to buy the underlying asset at the specified strike price on or before expiration.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Puts (Right Side)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A Put contract gives the buyer the right, without obligation, to sell the underlying asset at the specified strike price on or before expiration.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              02. ITM, ATM, and OTM Explained
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
              <li><strong>At-The-Money (ATM):</strong> The strike price closest to the current market spot price. Time decay and volatility shifts are typically most visible here.</li>
              <li><strong>In-The-Money (ITM):</strong> Contracts that hold positive intrinsic value right now (Calls with strike below spot; Puts with strike above spot).</li>
              <li><strong>Out-of-The-Money (OTM):</strong> Contracts composed solely of extrinsic time value (Calls with strike above spot; Puts with strike below spot).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              03. Key Columns Included in NSE CSV Exports
            </h2>
            <p>
              Official NSE CSV snapshots record Open Interest (OI), Change in OI, traded Volume, Implied Volatility (IV), Last Traded Price (LTP), Net Price Change, and Bid/Ask quotes for every active strike—allowing analytical tools to compute ratios and structural distributions locally.
            </p>
          </section>
        </div>
      ),
    },
    {
      id: 'open-interest-vs-volume',
      title: 'Open Interest vs. Trading Volume: How Exchange Participation Is Measured',
      excerpt: 'Understand the fundamental difference between Open Interest (active unsettled contracts) and Volume (daily transaction count), and how both metrics work together in derivatives data.',
      category: 'Option Chain Basics',
      date: 'October 12, 2026',
      readTime: '4 min read',
      author: 'OptionChainAnalyzer Helpdesk',
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px] md:text-base max-w-[68ch]">
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed">
            Newcomers to derivatives markets often confuse <strong>Volume</strong> and <strong>Open Interest (OI)</strong>. Although both quantify contract activity on the exchange, they measure two distinct aspects of market participation.
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
                  <th className="p-3">Characteristic</th>
                  <th className="p-3">Trading Volume</th>
                  <th className="p-3">Open Interest (OI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-900">What It Measures</td>
                  <td className="p-3">Total number of contracts traded during a single session.</td>
                  <td className="p-3">Total number of active, unsettled contracts currently open.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Daily Reset Behavior</td>
                  <td className="p-3">Resets to zero at the start of every trading day.</td>
                  <td className="p-3">Carries forward day-to-day until contracts are closed or expire.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-900">Intraday Effect</td>
                  <td className="p-3">Only increases throughout the session.</td>
                  <td className="p-3">Can increase (new contracts created) or decrease (existing contracts closed).</td>
                </tr>
              </tbody>
            </table>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              How Change in OI Provides Context
            </h2>
            <p>
              Suppose 500 contracts change hands at a strike today (Volume = 500). If both buyer and seller are opening brand-new positions, Open Interest increases by +500. If an existing contract holder simply transfers an open contract to a new participant, Volume rises by 500 while Open Interest remains unchanged. Reviewing both metrics together distinguishes short-term turnover from lasting contractual commitments.
            </p>
          </section>
        </div>
      ),
    },
    {
      id: 'what-is-put-call-ratio-pcr',
      title: 'Put-Call Ratio (PCR) & Max Pain: Analytical Concepts Explained',
      excerpt: 'Learn how Put-Call Ratio (PCR), Call-Put Ratio (CPR), and Max Pain formulas are calculated from exchange open interest data, along with their mathematical limitations.',
      category: 'Analytical Metrics',
      date: 'October 10, 2026',
      readTime: '5 min read',
      author: 'OptionChainAnalyzer Helpdesk',
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px] md:text-base max-w-[68ch]">
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed">
            Analytical ratios help summarize thousands of open interest numbers across an option chain into readable comparisons. Two widely studied metrics are the <strong>Put-Call Ratio (PCR)</strong> and <strong>Max Pain Theory</strong>. Understanding both their math and their limitations prevents over-reliance on any single indicator.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              01. Put-Call Ratio (PCR) &amp; Call-Put Ratio (CPR) Math
            </h2>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 space-y-1.5">
              <div>PCR = Put Open Interest ÷ Call Open Interest</div>
              <div>CPR = Call Open Interest ÷ Put Open Interest</div>
            </div>
            <p>
              When calculated strike-by-strike on an option chain, extreme ratios (such as Put OI exceeding Call OI by 6x or more at a lower strike, or Call OI exceeding Put OI by 6x at an upper strike) show where option writers have concentrated substantial contract volume. Because institutional sellers require significant margin deposits, heavy concentrations often represent notable reference zones—though sudden macro news can always cause writers to unwind positions rapidly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              02. Understanding Max Pain Theory
            </h2>
            <p>
              Max Pain calculates, across every listed strike price, the hypothetical expiry settlement point at which the combined intrinsic payout of all outstanding Call and Put contracts would be lowest. While it is a useful mathematical summary of aggregate open interest distribution, expiry settlement is never guaranteed to gravitate toward Max Pain—actual market prices are driven by macroeconomic data, institutional cash flows, and spot market demand.
            </p>
          </section>
        </div>
      ),
    },
    {
      id: 'understanding-implied-volatility-iv-on-the-option-chain',
      title: 'Implied Volatility (IV) & Option Greeks: Educational Risk Awareness',
      excerpt: 'An introduction to Implied Volatility (IV) and the four core Option Greeks—Delta, Gamma, Theta, and Vega—explaining how time decay and volatility impact option pricing risk.',
      category: 'Volatility & Risk',
      date: 'October 8, 2026',
      readTime: '5 min read',
      author: 'OptionChainAnalyzer Helpdesk',
      content: (
        <div className="space-y-6 text-slate-700 leading-relaxed text-[15px] md:text-base max-w-[68ch]">
          <p className="text-base md:text-lg text-slate-800 font-medium leading-relaxed">
            Option prices do not depend solely on whether the underlying index moves up or down. They are governed continuously by expected volatility and remaining time until expiry—quantified through <strong>Implied Volatility (IV)</strong> and the mathematical sensitivities known as <strong>Option Greeks</strong>.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              01. What Implied Volatility (IV) Represents
            </h2>
            <p>
              Implied Volatility represents the market&apos;s annualized expectation of price fluctuation derived backward from current option market prices. Elevated IV indicates higher option premiums (more uncertainty priced in), whereas low IV reflects calmer expected movement. High-IV spikes at isolated strikes can signal sudden hedging demand or thin order-book liquidity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              02. The Four Primary Option Greeks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Delta (Spot Sensitivity)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Estimates how much an option&apos;s price changes for a 1-point move in the underlying spot price.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Gamma (Acceleration)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Measures how rapidly Delta changes as the spot price moves, peaking near At-The-Money strikes close to expiry.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Theta (Time Decay)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Represents the daily erosion of an option&apos;s extrinsic value as expiration approaches, accelerating sharply in expiry week.
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-teal">Vega (Volatility Sensitivity)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Estimates how much an option&apos;s premium changes for each 1% shift in Implied Volatility.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              03. Why Greeks Matter for Retail Risk Awareness
            </h2>
            <p>
              Understanding Theta and Vega clarifies why retail option buyers can incur losses even when the underlying index moves modestly in their anticipated direction—if time decay (Theta) or a post-event IV drop (Vega) outweighs small spot gains. According to SEBI research, 9 out of 10 individual retail traders in equity derivatives experience net financial losses.
            </p>
          </section>
        </div>
      ),
    }
  ], []);

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/blog/${id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => {});
    }
  };

  const categories = [
    'All',
    'Global Macro',
    'Option Chain Basics',
    'Analytical Metrics',
    'Volatility & Risk',
    ...(bookmarkedIds.length > 0 ? ['Saved'] : [])
  ];

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'All'
          ? true
          : activeCategory === 'Saved'
          ? bookmarkedIds.includes(post.id)
          : post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, activeCategory, bookmarkedIds]);

  const currentPost = useMemo(() => {
    if (!openArticleId) return null;
    return posts.find(p => p.id === openArticleId) || null;
  }, [posts, openArticleId]);

  const isBookmarked = currentPost ? bookmarkedIds.includes(currentPost.id) : false;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-10">

        {/* Top Bar inside Blog */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-5 gap-4">
          <a
            href={currentPost ? '/blog' : '/'}
            onClick={(e) => {
              if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                if (currentPost) {
                  onSelectArticle(null);
                } else {
                  onBackToApp();
                }
              }
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-brand-teal transition-colors cursor-pointer min-h-[40px]"
          >
            <ArrowLeft size={16} />
            <span>{currentPost ? 'All Articles' : 'Back to Analyzer'}</span>
          </a>

          <a
            href="/"
            onClick={(e) => {
              if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                onBackToApp();
              }
            }}
            className="px-4 py-2 text-xs font-bold bg-brand-teal text-white hover:bg-brand-teal/90 transition-colors rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            Open Analyzer
          </a>
        </div>

        <AnimatePresence mode="wait">
          {currentPost ? (
            <motion.article
              key={currentPost.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="font-semibold text-brand-teal">{currentPost.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentPost.date}</span>
                  <span aria-hidden="true">·</span>
                  <span>{currentPost.readTime}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight text-balance">
                  {currentPost.title}
                </h1>

                <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-slate-200">
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <UserCheck size={16} className="text-brand-teal shrink-0" />
                    <span>
                      Published by <strong className="text-slate-900">{currentPost.author}</strong> · Educational Review
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShare(currentPost.id)}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg hover:border-brand-teal hover:text-brand-teal transition-colors flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer min-h-[36px]"
                      aria-label="Copy article link"
                    >
                      {copiedId === currentPost.id ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
                      <span>{copiedId === currentPost.id ? 'Link Copied' : 'Share'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(currentPost.id)}
                      aria-pressed={isBookmarked}
                      className={`px-3 py-1.5 border rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer min-h-[36px] ${
                        isBookmarked
                          ? 'border-brand-teal bg-teal-50 text-brand-teal'
                          : 'border-slate-200 text-slate-600 hover:border-brand-teal hover:text-brand-teal'
                      }`}
                      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
                    >
                      <Bookmark size={14} className={isBookmarked ? 'fill-current' : ''} />
                      <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>{currentPost.content}</div>

              {/* Educational SEBI Compliance Notice */}
              <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 max-w-[68ch]">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle size={15} />
                  <span>SEBI Educational Disclosure</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed">
                  OptionChainAnalyzer.in publishes strictly educational material for financial literacy. We are not a SEBI-registered investment advisor and do not provide trading tips, stock calls, or investment advice. According to SEBI studies, 9 out of 10 individual retail traders in equity F&amp;O incur net losses.
                </p>
              </div>

              {/* Educational Tool Link */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Explore Option Chain Data Yourself
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-lg">
                    Inspect sample Nifty 50 strike tables or upload an official NSE CSV file directly in your browser with zero server storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onBackToApp}
                  className="px-5 py-2.5 bg-brand-teal text-white rounded-lg text-xs font-bold hover:bg-brand-teal/90 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                >
                  Open Analyzer
                </button>
              </div>
            </motion.article>
          ) : (
            <motion.div
              key="blog-feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Heading */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-teal block">
                  Educational Knowledge Base
                </span>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight text-balance">
                  Derivatives &amp; Global Macro Guides
                </h1>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                  Concise, non-advisory guides explaining NSE option chain structure, global macro transmission, and derivatives risk literacy.
                </p>
              </div>

              {/* Search & Category Filter Controls */}
              <div className="space-y-4">
                <div className="relative max-w-md">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search educational guides..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search educational guides"
                    className="w-full pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter guides by topic">
                  {categories.map(category => (
                    <button
                      key={category}
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        activeCategory === category
                          ? 'bg-brand-teal text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Curated Articles List */}
              {filteredPosts.length > 0 ? (
                <div className="divide-y divide-slate-200 border-t border-slate-200">
                  {filteredPosts.map((post) => (
                    <a
                      key={post.id}
                      href={`/blog/${post.id}`}
                      onClick={(e) => {
                        if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                          e.preventDefault();
                          onSelectArticle(post.id);
                        }
                      }}
                      className="group py-6 flex flex-col gap-2.5 transition-colors hover:bg-slate-50/70 px-3 -mx-3 rounded-xl no-underline"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="font-semibold text-brand-teal">{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTime}</span>
                        <span aria-hidden="true">·</span>
                        <span>By {post.author}</span>
                      </div>

                      <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-brand-teal transition-colors leading-snug">
                        {post.title}
                      </h3>

                      <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                        {post.excerpt}
                      </p>

                      <span className="text-xs font-bold text-brand-teal inline-flex items-center gap-1 pt-1">
                        Read Guide
                        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm border-t border-slate-200">
                  No educational guides match your current filter.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
