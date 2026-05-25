import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  BookOpen, 
  Calendar, 
  Clock, 
  ChevronRight, 
  TrendingUp, 
  Share2, 
  Bookmark,
  Sparkles,
  Award,
  AlertCircle
} from 'lucide-react';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: React.ReactNode;
  category: 'Education' | 'Strategy' | 'Analysis' | 'Compliance';
  date: string;
  readTime: string;
  author: string;
  imageGenPrompt?: string;
}

interface BlogSectionProps {
  onBackToApp: () => void;
  openArticleId?: string | null;
  onSelectArticle: (id: string | null) => void;
}

export default function BlogSection({ onBackToApp, openArticleId, onSelectArticle }: BlogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const posts = useMemo<BlogPost[]>(() => [
    {
      id: 'what-is-an-option-chain-and-why-do-traders-use-it',
      title: "What Is an Option Chain and Why Do Traders Use It? A Complete Beginner's Guide",
      excerpt: "If you are learning about options trading, one of the first terms you will encounter is the option chain. Learn how option chains are structured, how to read them, and how experienced traders analyze market sentiment, support levels, and open interest.",
      category: 'Education',
      date: 'May 22, 2026',
      readTime: '7 min read',
      author: 'Options Education Desk',
      content: (
        <div className="space-y-8 text-slate-700 leading-relaxed text-base pt-4">
          <p className="font-semibold text-lg text-slate-900 border-l-4 border-brand-teal pl-4 leading-relaxed">
            If you are learning about options trading, one of the first terms you will encounter is the <strong>option chain</strong>. At first glance, an option chain can appear intimidating. It is usually presented as a large table containing strike prices, premiums, open interest figures, trading volumes, and several other data points.
          </p>
          
          <p>
            For beginners, these numbers may seem confusing. However, experienced traders rely on option chain data every day because it provides valuable insight into market activity and trader positioning.
          </p>

          <p>
            An option chain helps traders understand where market participants are concentrating their positions, which strike prices are attracting attention, and how sentiment may be evolving. While no tool can predict the future with certainty, option chain analysis remains one of the most widely used methods for studying options market behaviour.
          </p>

          <p>
            In this guide, we will explore what an option chain is, how it is structured, the meaning of its key components, and why traders use it as part of their market analysis process.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            What Is an Option Chain?
          </h2>
          <p>
            An option chain is a complete listing of all available option contracts for a specific underlying asset.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
            <div className="border-l-2 border-slate-200 pl-6 py-1">
              <span className="block text-xs font-black uppercase text-brand-teal tracking-widest mb-3">The underlying asset could be:</span>
              <ul className="space-y-2 text-sm font-semibold text-slate-600">
                <li className="flex items-center gap-2">A stock</li>
                <li className="flex items-center gap-2">An index</li>
                <li className="flex items-center gap-2">An ETF</li>
                <li className="flex items-center gap-2">A commodity</li>
                <li className="flex items-center gap-2">A currency</li>
              </ul>
            </div>
            
            <div className="border-l-2 border-slate-200 pl-6 py-1">
              <span className="block text-xs font-black uppercase text-brand-teal tracking-widest mb-3">For Indian traders, common examples:</span>
              <ul className="space-y-2 text-sm font-semibold text-slate-600">
                <li className="flex items-center gap-2">NIFTY</li>
                <li className="flex items-center gap-2">BANK NIFTY</li>
                <li className="flex items-center gap-2">FINNIFTY</li>
                <li className="flex items-center gap-2">Reliance Industries</li>
                <li className="flex items-center gap-2">TCS</li>
                <li className="flex items-center gap-2">Infosys</li>
              </ul>
            </div>
          </div>

          <p>
            Each option chain displays all available strike prices and corresponding option contracts for a selected expiry date.
          </p>

          <div className="py-4 border-y border-slate-100 italic text-slate-600 text-sm">
            <p className="font-semibold text-slate-800 not-italic mb-2">
              The information is usually divided into two core sections:
            </p>
            <ul className="flex flex-wrap gap-6 text-xs font-black uppercase tracking-widest my-2 not-italic">
              <li className="flex items-center gap-2 text-brand-teal">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" /> Call Options
              </li>
              <li className="flex items-center gap-2 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" /> Put Options
              </li>
            </ul>
            <p className="text-xs text-slate-400 font-medium">
              Together, these contracts provide a precise snapshot of activity occurring in the options market.
            </p>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Understanding Call Options and Put Options
          </h2>
          <p>
            Before analyzing an option chain, it is important to understand the two primary types of options.
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-black text-brand-teal uppercase tracking-wider mb-2">Call Options</h3>
              <p className="text-slate-600">
                A call option gives the buyer the right, but not the obligation, to purchase the underlying asset at a predetermined strike price before expiry.
              </p>
              <p className="text-xs text-slate-500 italic mt-2 font-medium">
                Traders often use call options when they expect the market to move higher.
              </p>
              
              <div className="border-l-4 border-brand-teal/30 pl-4 py-1.5 mt-4 space-y-1 text-xs text-slate-500">
                <span className="font-black uppercase text-[10px] text-brand-teal block tracking-widest">Example Scenario</span>
                <p>Suppose <strong>NIFTY</strong> is trading at <strong>25,000</strong>. A trader who expects prices to rise may purchase a <strong>25,100 call option</strong>. If NIFTY rises above that level, the option may gain value.</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-black text-amber-600 uppercase tracking-wider mb-2">Put Options</h3>
              <p className="text-slate-600">
                A put option gives the buyer the right, but not the obligation, to sell the underlying asset at a predetermined strike price before expiry.
              </p>
              <p className="text-xs text-slate-500 italic mt-2 font-medium">
                Put options are often used when traders expect prices to fall or when they want to hedge existing positions.
              </p>
              
              <div className="border-l-4 border-amber-600/30 pl-4 py-1.5 mt-4 space-y-1 text-xs text-slate-500">
                <span className="font-black uppercase text-[10px] text-amber-600 block tracking-widest">Example Scenario</span>
                <p>Suppose <strong>NIFTY</strong> is trading at <strong>25,000</strong>. If a trader expects weakness, they may buy a <strong>put option</strong> at a relevant strike price. If prices decline, the value of the put option may increase.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            How an Option Chain Is Structured
          </h2>
          <p>
            An option chain generally displays multiple columns of information. The exact layout may vary between brokers and analytical platforms, but most option chains contain the following central elements:
          </p>

          <div className="space-y-12">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>1. Strike Price</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Reference Core</span>
              </h3>
              <p className="text-slate-600">
                The strike price is the price level associated with an option contract.
              </p>
              <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-4 max-w-xs text-xs font-mono space-y-1.5">
                <div className="text-[9px] uppercase font-black text-slate-400 tracking-widest pb-1.5 border-b border-slate-200">Strike Price Chain</div>
                <div>24,800</div>
                <div>24,900</div>
                <div className="text-brand-teal font-extrabold flex items-center gap-2">25,000 <span className="text-[9px] rounded bg-brand-teal/10 px-1 font-semibold">Spot</span></div>
                <div>25,100</div>
                <div>25,200</div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Each strike price has corresponding call and put options. The strike price acts as the central reference point around which the option chain layout is strictly organized.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                <span>2. Open Interest (OI)</span>
                <span className="text-[10px] font-black uppercase text-brand-teal tracking-wider">Crucial Metric</span>
              </h3>
              <p className="text-slate-600">
                Open Interest refers to the total number of active contracts that remain open. Unlike trading volume, open interest does not measure how many contracts traded during the day. Instead, it measures how many contracts currently exist in the market.
              </p>
              <div className="py-2 pl-4 border-l-2 border-brand-teal/20 space-y-1.5 text-xs font-semibold text-slate-600">
                <span className="block text-[10px] font-black uppercase text-brand-teal tracking-wider mb-1">High open interest generally indicates:</span>
                <p>&bull; Greater institutional participation</p>
                <p>&bull; Higher market liquidity</p>
                <p>&bull; Increased overall market interest</p>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Many traders consider open interest one of the most important components of option chain analysis.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                3. Change in Open Interest
              </h3>
              <p className="text-slate-600">
                This metric measures how open interest changes throughout the trading session. An increase in open interest often suggests that new positions are actively being created, while a decrease in open interest may indicate that traders are finishing or closing positions.
              </p>
              <p className="text-xs text-slate-500 italic">
                When combined with underlying price movement, changes in open interest can provide additional insight into market behaviour.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                4. Trading Volume
              </h3>
              <p className="text-slate-600">
                Volume measures the absolute number of contracts traded during a given period. High volume often indicates strong active participation and immediate trading interest.
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Many traders closely monitor volume spikes because they highlight specific strike prices that are attracting significant attention at various times of the trading day.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
                5. Implied Volatility (IV)
              </h3>
              <p className="text-slate-600">
                Implied Volatility represents the market's expectation of future price movement. Higher IV generally suggests that traders expect larger price fluctuations, while lower IV indicates relatively lower expectations for overall volatility.
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Implied volatility plays an important role in determining option premiums as it directly impacts extrinsic value.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Why Traders Analyze Option Chains
          </h2>
          <p>
            Option chains provide information that goes beyond price alone. They allow traders to observe market participation from a different perspective. Several reasons explain why option chain analysis remains highly popular among retail and professional participants.
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">
              &bull; Understanding Market Sentiment
            </h3>
            <p className="text-sm">
              By comparing activity in calls and puts, traders attempt to estimate overall market sentiment. For example:
            </p>
            <ul className="text-xs font-semibold text-slate-700 pl-6 space-y-2 list-disc">
              <li><strong>Heavy call activity</strong> may suggest bullish expectations or immediate ceiling resistances.</li>
              <li><strong>Heavy put activity</strong> may indicate bearish expectations or solid floor support levels acting as capital boundaries.</li>
              <li><strong>Balanced activity</strong> may suggest neutrality and expected sideways movement.</li>
            </ul>
            <p className="text-xs text-slate-500">
              Although sentiment analysis is not perfect, it can help traders understand broader options market positioning.
            </p>

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider pt-4">
              &bull; Identifying Potential Support Levels
            </h3>
            <p className="text-sm">
              Many traders examine put-side open interest to identify areas that may act as support. When significant open interest accumulates at a particular strike price, traders often monitor that level closely because it represents zones where substantial market participation exists.
            </p>

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider pt-4">
              &bull; Identifying Potential Resistance Levels
            </h3>
            <p className="text-sm">
              Similarly, call-side open interest is often studied to identify potential resistance zones. Large concentrations of call positions may indicate price levels that traders are actively monitoring. Resistance identification remains one of the most common applications of option chain analysis.
            </p>

            <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider pt-4">
              &bull; Monitoring Positioning Changes
            </h3>
            <p className="text-sm">
              Markets evolve continuously throughout the trading session. Option chain data changes dynamically as traders open positions, close positions, adjust hedges, or shift expectations. Tracking these changes allows traders to monitor evolving market behavior.
            </p>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Common Mistakes Beginners Make
          </h2>
          <p>
            Many new traders misunderstand option chain data. Some common mistakes include:
          </p>
          
          <div className="space-y-8 mt-6">
            <div className="flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-1">Looking Only at Open Interest</h4>
                <p className="text-xs text-slate-650 leading-relaxed">Open interest is highly important, but it should never be analyzed in complete isolation. Spot price action, traded volume, and implied volatility must also be considered before reaching decisions.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-1">Ignoring Market Context</h4>
                <p className="text-xs text-slate-650 leading-relaxed">Option chain data should always be interpreted within the broader market environment. Economic announcements, earnings reports, global events, and interest rates significantly influence market behaviour.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-1">Assuming Support and Resistance Are Guaranteed</h4>
                <p className="text-xs text-slate-650 leading-relaxed">No support or resistance level is guaranteed to hold. Option chain analysis identifies areas of interest and potential congestion, not complete certainty.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-1">Treating One Indicator as a Complete Strategy</h4>
                <p className="text-xs text-slate-650 leading-relaxed">Successful market analysis typically combines multiple forms of information. Option chain data is just one component of a larger analytical process.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            How Technology Helps Simplify Option Chain Analysis
          </h2>
          <p>
            Modern analytical platforms help traders interpret complex option chain datasets more efficiently. Instead of manually reviewing hundreds of rows and multiple metrics, analytical tools can organize data into structured visual insights.
          </p>
          <p>
            Educational resources and analytical platforms such as <a href="https://optionchainanalyzer.in/" target="_blank" rel="noreferrer" className="text-brand-teal font-extrabold hover:underline">optionchainanalyzer.in</a> help traders understand concepts as:
          </p>
          
          <ul className="text-xs font-bold text-slate-800 uppercase tracking-wider pl-6 space-y-2 list-none">
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-teal rounded-full" /> Open interest concentration</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-teal rounded-full" /> Support and resistance levels</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-teal rounded-full" /> Implied volatility behaviour</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-teal rounded-full" /> Market sentiment indicators</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-teal rounded-full" /> Option chain structure</li>
          </ul>

          <p className="text-xs text-slate-500 font-medium">
            Using educational tools can make it easier for beginners to understand large amounts of market data without replacing the need for independent analysis.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Is option chain analysis useful for beginners?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Yes. Understanding option chain fundamentals helps beginners learn how market participants position themselves around different strike prices.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Can option chain data predict future prices?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                No. Option chain data reflects current market positioning and activity. It does not guarantee future price movement.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">What is the most important metric in an option chain?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                There is no single most important metric. Open interest, volume, implied volatility, and price action all provide useful information when analyzed together.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Why do traders monitor open interest?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Open interest helps traders understand where participation is concentrated and how positions are evolving over time.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Does high open interest always indicate support or resistance?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Not necessarily. It indicates significant market activity at a particular strike price, but market conditions can change rapidly.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Conclusion
          </h2>
          <p>
            An option chain is one of the most valuable educational tools available to traders seeking to understand options markets. By displaying strike prices, open interest, trading volume, implied volatility, and market participation data, option chains provide a detailed view of how traders are positioning themselves.
          </p>
          <p>
            While option chain analysis should never be viewed as a standalone prediction tool, understanding its structure and purpose can help traders interpret market activity more effectively. Learning how to read option chain data is often one of the first steps toward developing a deeper understanding of options markets and market behaviour.
          </p>
        </div>
      )
    },
    {
      id: 'what-is-put-call-ratio-pcr',
      title: "What Is Put Call Ratio (PCR)? Complete Beginner Guide for Option Traders",
      excerpt: "Learn what Put Call Ratio (PCR) is, how it is calculated, how traders interpret PCR values, common misconceptions, limitations, and how PCR is used in option chain analysis.",
      category: 'Education',
      date: 'May 25, 2026',
      readTime: '6 min read',
      author: 'Options Education Desk',
      content: (
        <div className="space-y-8 text-slate-700 leading-relaxed text-base pt-4">
          <p className="font-semibold text-lg text-slate-900 border-l-4 border-brand-teal pl-4 leading-relaxed">
            Put Call Ratio (PCR) is one of the most widely used sentiment indicators in options trading. By comparing put activity with call activity, traders attempt to understand how market participants are positioned. PCR is not a forecasting tool, but it can provide useful context when analysed alongside price action, open interest, volatility, and broader market conditions.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            What Is Put Call Ratio (PCR)?
          </h2>
          <p>
            PCR is a ratio that compares the total number of put options to call options. It can be calculated using open interest or trading volume. The purpose of PCR is to provide a simplified view of sentiment in the options market.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            How Is Put Call Ratio Calculated?
          </h2>
          <p>
            PCR based on Open Interest is calculated by dividing the total Put Open Interest by the total Call Open Interest. PCR can also be calculated using trading volume.
          </p>
          <div className="bg-slate-50 border-l-4 border-brand-teal rounded-r-2xl p-6 my-6">
            <span className="block text-xs font-black uppercase text-brand-teal tracking-widest mb-1">PCR formula</span>
            <div className="font-mono text-sm font-bold text-slate-800 bg-white/50 border border-slate-100 rounded-lg p-3 my-2 text-center">
              PCR (OI) = Total Put Open Interest / Total Call Open Interest
            </div>
            <p className="text-xs text-slate-500 mt-2">
              For example, if put open interest is 15 lakh contracts and call open interest is 10 lakh contracts, the PCR would be 1.5.
            </p>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Understanding PCR Values
          </h2>
          <p>
            Lower PCR values generally indicate stronger call activity, while higher PCR values indicate stronger put activity. Traders often interpret these zones as guidelines of relative market positioning.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
            <div className="border bg-slate-50 border-slate-100 rounded-2xl p-5 border-l-4 border-l-emerald-500">
              <span className="block text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-1">Below 0.7</span>
              <h4 className="font-black text-slate-900 text-sm uppercase">Relatively Bullish</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Indicates strong call interest relative to puts. Traders are aggressively buying or writing calls, reflecting positive sentiment.</p>
            </div>
            <div className="border bg-slate-50 border-slate-100 rounded-2xl p-5 border-l-4 border-l-slate-400">
              <span className="block text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">Around 1.0</span>
              <h4 className="font-black text-slate-900 text-sm uppercase">Neutral Sentiment</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Indicates a balanced distribution of puts and calls, showing no strong directional bias or dominance in the underlying asset.</p>
            </div>
            <div className="border bg-slate-50 border-slate-100 rounded-2xl p-5 border-l-4 border-l-rose-500">
              <span className="block text-[10px] font-black uppercase text-rose-600 tracking-wider mb-1">Above 1.3</span>
              <h4 className="font-black text-slate-900 text-sm uppercase">Relatively Bearish</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">Indicates stronger put activity or panic hedging. Put buyers/writers are active, reflecting cautious or negative sentiment.</p>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            Note: These values are guidelines rather than fixed, absolute rules. Each market, index, or equity may have its own natural baseline PCR range.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Why Do Traders Monitor PCR?
          </h2>
          <p>
            Traders monitor PCR to gain multi-layered insights into general option chain configurations:
          </p>
          <ul className="space-y-3 pl-4">
            <li className="flex gap-2.5 items-start text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-2 shrink-0" />
              <span><strong>Sentiment Assessment:</strong> To evaluate active momentum and notice where bullish or bearish biases dominate.</span>
            </li>
            <li className="flex gap-2.5 items-start text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-2 shrink-0" />
              <span><strong>Observe Institutional Positioning:</strong> Smart money is often on the writing side of the market; changes in open interest distributions reveal their actions.</span>
            </li>
            <li className="flex gap-2.5 items-start text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-2 shrink-0" />
              <span><strong>Option Chain Support:</strong> Reinforces key support and resistance zones identified through individual strike price concentrations.</span>
            </li>
            <li className="flex gap-2.5 items-start text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-2 shrink-0" />
              <span><strong>Potential Sentiment Extremes:</strong> Spotting overextended levels where momentum might be exhausting.</span>
            </li>
          </ul>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Can PCR Be Used as a Contrarian Indicator?
          </h2>
          <p>
            Some traders view extreme PCR readings through a contrarian lens. Very high PCR values can signify that market fear has peaked—representing a potential capitulation bottom. Conversely, extremely low PCR values might suggest euphoria, indicating a market top.
          </p>
          <p>
            However, context is absolutely essential. A high PCR can stay high for a sustained period in a severe downtrend, and PCR should never be used as a standalone entry or exit signal in isolation.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Limitations of Put Call Ratio
          </h2>
          <p>
            Like all technical measurements, the Put Call Ratio has specific bounds:
          </p>
          <ul className="space-y-2 list-disc list-inside text-sm pl-2">
            <li><strong>No predictive guarantee:</strong> PCR is a descriptor of existing contracts and does not forecast future price action.</li>
            <li><strong>Ignores market context:</strong> It cannot account for critical macroeconomic events, company earnings, or black-swan catalysts.</li>
            <li><strong>Occasionally misleading:</strong> Spikes in PCR can sometimes be driven by large, institutional hedging transactions rather than direct speculative sentiment.</li>
          </ul>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            PCR vs Open Interest
          </h2>
          <p>
            It is critical to distinguish these two: PCR is a comparative sentiment indicator assessing the relationship between puts and calls, while Open Interest (OI) is a participation indicator measuring total active contracts. Total OI shows how much interest belongs in a sector, whereas PCR shows its distribution.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Common Mistakes Beginners Make
          </h2>
          <p>
            Avoid these critical pitfalls when integrating PCR into your routines:
          </p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex gap-2 items-center text-slate-650">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span>Treating PCR as an automated Buy/Sell buzzer.</span>
            </li>
            <li className="flex gap-2 items-center text-slate-650">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span>Ignoring the underlying price support/resistance zones.</span>
            </li>
            <li className="flex gap-2 items-center text-slate-650">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span>Focusing only on the PCR of volume instead of the more robust Open Interest PCR.</span>
            </li>
            <li className="flex gap-2 items-center text-slate-650">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span>Misinterpreting extreme historical values as permanent rules.</span>
            </li>
          </ul>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            How to Learn PCR Through Real Option Chain Data
          </h2>
          <p>
            Readers interested in understanding option chain concepts, support and resistance levels, open interest concentrations, and educational market analysis can explore <a href="https://optionchainanalyzer.in/" className="text-brand-teal hover:underline font-bold">OptionChainAnalyzer.in</a> as part of their learning process.
          </p>
          <p>
            Using real-time option analytical systems allows you to trace PCR moves, resistance barriers, and custom IV anomalies dynamically next to actual index levels, transforming static theory into practical trading literacy.
          </p>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="space-y-1.5">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">What is a good PCR value?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                There is no single universally good value. Values vary based on indices and overall macro-hedging patterns.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Is high PCR bullish or bearish?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Usually bearish (indicates more puts), though extremes can act as contrarian bullish indicators suggesting a market bottom.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Can PCR predict direction?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                No. It describes positioning only. It is a sentiment gauges, not a direct predictor.
              </p>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-100">
              <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">Should beginners use PCR?</h4>
              <p className="text-xs text-slate-650 leading-relaxed">
                Yes, as a straightforward educational sentiment indicator alongside key support and resistance evaluations.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight pt-6 border-b border-slate-100 pb-2">
            Conclusion
          </h2>
          <p>
            Put Call Ratio is an exceptional asset for understanding sentiment in options markets. While it should not be treated as a predictive indicator in of itself, it provides valuable insight into how market participants are positioned. The most effective approach is to use PCR together with broader market analysis rather than in isolation.
          </p>
        </div>
      )
    }
  ], []);

  const handleShare = (id: string) => {
    const url = `${window.location.origin}/blog/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, searchQuery, activeCategory]);

  const currentPost = useMemo(() => {
    if (!openArticleId) return null;
    return posts.find(p => p.id === openArticleId) || null;
  }, [posts, openArticleId]);

  const categories = ['All', 'Education', 'Strategy', 'Compliance'];

  return (
    <div className="flex-1 flex flex-col bg-white overflow-y-auto scrollbar-thin">
      <div className="max-w-4xl w-full mx-auto px-6 py-12 md:py-16 space-y-10">
        
        {/* Navigation / Header Area */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <button 
            onClick={() => {
              if (currentPost) {
                onSelectArticle(null);
              } else {
                onBackToApp();
              }
            }}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-teal transition-all active:scale-95 group"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            {currentPost ? 'Back to Articles' : 'Exit Blog'}
          </button>

          <button 
            onClick={onBackToApp} 
            className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] bg-brand-teal/5 text-brand-teal hover:bg-brand-teal hover:text-white transition-all rounded-full border border-brand-teal/10 cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>

        <AnimatePresence mode="wait">
          {currentPost ? (
            /* =======================================
               ARTICLE DETAIL PAGES IN-WEBSITE
               ======================================= */
            <motion.article 
              key={currentPost.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest bg-brand-teal/10 text-brand-teal px-3 py-1 rounded">
                    {currentPost.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-bold ml-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {currentPost.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {currentPost.readTime}
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-[1.1] uppercase">
                  {currentPost.title}
                </h1>

                <div className="flex items-center justify-between pt-4 border-y border-slate-100 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-brand-teal/10 flex items-center justify-center text-brand-teal">
                      <Award size={14} className="stroke-[2.5]" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">{currentPost.author}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleShare(currentPost.id)}
                      className="p-2 border border-slate-100 rounded-lg hover:border-brand-teal hover:text-brand-teal transition-all flex items-center gap-1.5 text-xs font-bold text-slate-500 cursor-pointer active:scale-95"
                      title="Copy sharing link"
                    >
                      <Share2 size={13} />
                      <span>{copiedId === currentPost.id ? 'Copied' : 'Share'}</span>
                    </button>
                    <button 
                      className="p-2 border border-slate-100 rounded-lg hover:border-brand-teal hover:text-brand-teal transition-all text-slate-500"
                      title="Bookmark Article"
                    >
                      <Bookmark size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic full styled content */}
              <div>
                {currentPost.content}
              </div>

              {/* Internal Related Resource Callout / Ad space */}
              <div className="bg-[#fafafa] border border-slate-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 mt-16 shadow-inner">
                <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase tracking-wider text-brand-teal flex items-center gap-2">
                    <Sparkles size={16} /> Ready to test your strategy?
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-lg">
                    Export option chain CSV data from the NSE website, upload it to our dashboard, and analyze the option chain in real-time.
                  </p>
                </div>
                <button 
                  onClick={onBackToApp}
                  className="px-6 py-3 bg-brand-teal text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:shadow-lg hover:shadow-brand-teal/20 active:scale-95 text-center shrink-0 cursor-pointer"
                >
                  Start Analyzing
                </button>
              </div>

            </motion.article>
          ) : (
            /* =======================================
               BLOG DIRECTORY PAGES (GRID FEED VIEW)
               ======================================= */
            <motion.div 
              key="blog-feed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10 animate-in fade-in duration-300"
            >
              {/* Heading */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-teal block">The Knowledge Base</span>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Blog Articles
                </h1>
                <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-2xl font-medium">
                  Educational documentation on NSE option chains, advanced Volume-OI metrics, high probability boundaries, and structural risk control mechanisms.
                </p>
              </div>

              {/* Search bar */}
              <div className="bg-slate-50 p-4 border border-slate-100 rounded-3xl">
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search articles..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 text-xs font-bold text-slate-700 placeholder-slate-400 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-brand-teal transition-all md:max-w-md"
                  />
                </div>
              </div>

              {/* Articles Grid list */}
              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {filteredPosts.map((post) => (
                    <div 
                      key={post.id}
                      onClick={() => onSelectArticle(post.id)}
                      className="group border border-slate-100 bg-white hover:bg-slate-50/40 p-6 md:p-8 rounded-[2rem] transition-all hover:border-brand-teal/40 hover:shadow-xl hover:shadow-brand-teal/[0.02] cursor-pointer flex flex-col md:flex-row items-stretch gap-6 relative"
                    >
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-brand-teal/10 text-brand-teal px-2.5 py-1 rounded">
                            {post.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1 ml-1">
                            <Calendar size={10} />
                            {post.date}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-xl md:text-2xl font-black text-slate-800 group-hover:text-brand-teal transition-colors tracking-tight uppercase leading-tight">
                            {post.title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100 flex-wrap">
                          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            {post.readTime}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            By {post.author}
                          </span>
                          
                          <span className="text-xs font-black uppercase tracking-wider text-brand-teal hover:underline ml-auto flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                            Read Article 
                            <ChevronRight size={13} className="stroke-[2.5]" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 font-medium text-xs">
                  Articles will be published here soon.
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
