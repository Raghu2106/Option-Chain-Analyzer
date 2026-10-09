import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  CheckCircle2, 
  AlertTriangle, 
  Send, 
  MapPin, 
  Clock, 
  FileText, 
  ExternalLink,
  Info,
  Layers,
  ArrowRight,
  Target,
  Cpu,
  BookOpen,
  Lock,
  UserCheck
} from 'lucide-react';

interface StaticPageProps {
  onBackToApp: () => void;
  onNavigateBlog: () => void;
  onNavigatePage?: (page: 'about' | 'contact' | 'disclaimer' | 'privacy' | 'terms') => void;
}

export function ContactPage({ onBackToApp, onNavigateBlog }: StaticPageProps) {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-xs font-black uppercase tracking-widest text-brand-teal block mb-1">
          Support & Editorial Desk
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
          Contact Us
        </h1>
        <p className="text-sm md:text-base text-slate-600 font-medium mt-2 max-w-2xl">
          Have feedback on the Option Chain Analyzer tool, want to report an NSE CSV parsing edge case, or have questions regarding our educational research guides? We are here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
              Direct Contact Channels
            </h2>
            
            <div className="space-y-4 text-xs font-medium text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-teal shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Primary Inquiries</span>
                  <a href="mailto:reachraghuhere14@gmail.com" className="text-blue-600 hover:underline break-all">
                    reachraghuhere14@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-teal shrink-0">
                  <Mail size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Technical & Support Desk</span>
                  <a href="mailto:support@optionchainanalyzer.in" className="text-blue-600 hover:underline break-all">
                    support@optionchainanalyzer.in
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Turnaround Time</span>
                  <p className="text-slate-500">Responses typically provided within 24 to 48 business hours (Mon – Fri, 9:00 AM – 6:00 PM IST).</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <MapPin size={16} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">Operations & Research</span>
                  <p className="text-slate-500">Bengaluru, Karnataka, India • Serving retail derivative market students worldwide.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-2 text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-amber-900 text-[11px]">
              <Info size={14} /> Regulatory Reminder
            </div>
            <p className="leading-relaxed">
              We do not provide personalized stock advisory, stock tips, or portfolio management services. Inquiries asking for specific trade recommendations cannot be answered.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-sm">
          {submitted ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                Message Received Successfully
              </h2>
              <p className="text-sm text-slate-600 max-w-md font-medium leading-relaxed">
                Thank you for contacting OptionChainAnalyzer.in. Our team will review your query and respond to <strong>{formState.email}</strong> as soon as possible.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormState({ name: '', email: '', subject: 'General Inquiry', message: '' });
                }}
                className="mt-4 px-6 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-teal/90 transition-all cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">
                Send Us a Message
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Your Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@example.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Inquiry Topic
                </label>
                <select
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal bg-white"
                >
                  <option value="General Inquiry">General Feedback or Questions</option>
                  <option value="CSV Parsing Issue">NSE Option Chain CSV Parsing Feedback</option>
                  <option value="Educational Content">Educational Guide or Article Query</option>
                  <option value="AdSense / Partnerships">Partnership & Compliance Inquiries</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Detailed Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Please describe your question, feedback, or observation with as much detail as possible..."
                  value={formState.message}
                  onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-teal/30 focus:border-brand-teal resize-y"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[11px] text-slate-500 font-medium">
                  We respect your privacy. No personal data submitted here is ever shared or sold.
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 bg-brand-teal text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-teal/90 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Transmitting...' : (
                    <>
                      <span>Send Message</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Quick Navigation Footer */}
      <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <button 
          onClick={onBackToApp} 
          className="text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Option Chain Analyzer
        </button>
        <button 
          onClick={onNavigateBlog} 
          className="text-slate-600 hover:text-brand-teal transition-colors flex items-center gap-1 cursor-pointer"
        >
          Explore Market Research Blog &rarr;
        </button>
      </div>
    </div>
  );
}

export function DisclaimerPage({ onBackToApp, onNavigateBlog }: StaticPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8 text-slate-700 leading-relaxed font-medium">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-xs font-black uppercase tracking-widest text-rose-600 block mb-1">
          Regulatory Compliance &amp; Risk Disclosure
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
          SEBI Compliance &amp; Financial Disclaimer
        </h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">
          Effective Date: October 9, 2026 • Statutory Disclosure Notice
        </p>
      </div>

      {/* SEBI Highlight Box */}
      <div className="p-6 md:p-8 bg-rose-50/80 border-2 border-rose-200 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black uppercase tracking-tight text-rose-900">
              Securities and Exchange Board of India (SEBI) Risk Study
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">
              Notice to Retail Traders in the Equity Derivatives (F&amp;O) Segment
            </span>
          </div>
        </div>
        <p className="text-xs md:text-sm text-slate-800 leading-relaxed font-semibold">
          Per extensive research studies conducted by SEBI on individual retail investors participating in the equity derivatives (Futures &amp; Options) market:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-xs md:text-sm text-slate-750 font-medium leading-relaxed">
          <li><strong>9 out of 10 individual traders</strong> in the equity Options segment incurred net financial losses.</li>
          <li>On average, loss-makers registered net trading losses close to <strong>₹50,000 per year</strong>.</li>
          <li>Over and above the net trading losses, loss-makers spent an additional <strong>28% of net trading losses</strong> on transaction costs, exchange turnover charges, and brokerage fees.</li>
          <li>Even among the small minority of profitable traders, less than 1% generated returns substantially exceeding the risk-free rate after accounting for execution fees and taxes.</li>
        </ul>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          1. Educational and Analytical Nature of the Software
        </h2>
        <p className="text-sm leading-relaxed">
          <strong>OptionChainAnalyzer.in</strong> is an independent, non-commercial analytical software utility designed strictly for <strong>educational, informational, and personal quantitative research purposes</strong>. The software parses user-provided option chain CSV files downloaded directly from the official National Stock Exchange of India (NSE) website (<a href="https://www.nseindia.com/option-chain" target="_blank" rel="noreferrer" className="text-blue-600 underline">nseindia.com/option-chain</a>).
        </p>
        <p className="text-sm leading-relaxed">
          All computations—including Open Interest (OI) aggregation, Put-Call Ratio (PCR), Call-Put Ratio (CPR), Max Pain strike calculations, and Implied Volatility (IV) skew indicators—are computed client-side using deterministic mathematical formulas. These calculations are strictly designed to organize tabular data and do not incorporate forecasting algorithms or proprietary prediction models.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          2. No Investment Advice or Buy/Sell Recommendations
        </h2>
        <p className="text-sm leading-relaxed">
          <strong>OptionChainAnalyzer.in does not provide investment, trading, financial, tax, or legal advice.</strong> We are <em>not</em> a SEBI-registered Investment Adviser (RIA), Research Analyst (RA), Portfolio Manager, or Stock Broker.
        </p>
        <p className="text-sm leading-relaxed">
          None of the metrics displayed—including Support tags (PCR &ge; 6.0x), Resistance tags (CPR &ge; 6.0x), Max Pain markers, or IV anomaly highlights—should be considered as:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-xs md:text-sm">
          <li>An offer or solicitation to buy or sell any stock, index, future, or option contract;</li>
          <li>A recommendation that any specific security, portfolio, or transaction strategy is suitable for any individual;</li>
          <li>A promise or guarantee of market direction, support preservation, or resistance adherence.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          3. Independent Verification Required
        </h2>
        <p className="text-sm leading-relaxed">
          Derivatives markets operate with extreme liquidity and rapid price fluctuations. Data parsed from static CSV files reflects a historical snapshot at the moment of download. Traders must always independently cross-verify all prices, bid-ask quotes, and implied volatility numbers with their licensed SEBI broker terminal and official exchange trading systems before taking any market action.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          4. Limitation of Financial Liability
        </h2>
        <p className="text-sm leading-relaxed">
          To the maximum extent permitted by applicable Indian and international law, OptionChainAnalyzer.in, its authors, contributors, and web hosts explicitly disclaim all liability for any direct, indirect, consequential, punitive, or incidental damages, including but not limited to loss of trading capital, margin liquidations, software downtime, or calculation anomalies. Your use of this tool constitutes full acknowledgment and acceptance of this limitation.
        </p>
      </section>

      {/* Quick Navigation Footer */}
      <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <button 
          onClick={onBackToApp} 
          className="text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Option Chain Analyzer
        </button>
        <button 
          onClick={onNavigateBlog} 
          className="text-slate-600 hover:text-brand-teal transition-colors flex items-center gap-1 cursor-pointer"
        >
          Explore Market Research Blog &rarr;
        </button>
      </div>
    </div>
  );
}

export function AboutPage({ onBackToApp, onNavigateBlog }: StaticPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8 text-slate-700 leading-relaxed font-medium">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-xs font-black uppercase tracking-widest text-brand-teal block mb-1">
          About Option Chain Analyzer
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
          Empowering Data-Driven Retail Derivatives Research
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-semibold mt-2">
          An offline-first, client-side analytical utility designed to bring clarity, discipline, and quantitative transparency to Indian F&amp;O markets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-teal mb-3">
            <Target size={18} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Our Mission</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Democratizing sophisticated open interest clustering and volatility metrics for independent retail traders and students of the market.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-teal mb-3">
            <Lock size={18} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">Zero-Upload Privacy</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            100% in-browser execution. No CSV datasets, portfolio strikes, or personal trading data are ever sent to or stored on any remote server.
          </p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-brand-teal mb-3">
            <BookOpen size={18} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">SEBI Compliance</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Purely mathematical and educational. No advisory services, stock tips, or speculative claims—focusing instead on real risk literacy.
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Why We Built Option Chain Analyzer
        </h2>
        <p className="text-sm leading-relaxed">
          Derivatives markets in India, particularly on the National Stock Exchange (NSE), are among the highest-volume index options venues in the world. However, navigating raw option chains on exchange websites or broker platforms presents significant hurdles for individual retail participants:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-xs md:text-sm">
          <li><strong>Information Overload:</strong> Monochrome tables with dozens of columns make it tedious to quickly identify institutional support and resistance clusters during active trading sessions.</li>
          <li><strong>Delayed Visualizations:</strong> Many commercial platforms gate basic OI histograms behind costly recurring paywalls or sell speculative indicator packages.</li>
          <li><strong>Lack of Structural Literacy:</strong> Many retail market participants fail to realize that option writing is dominated by well-capitalized institutions whose positions establish physical hedging barriers.</li>
        </ul>
        <p className="text-sm leading-relaxed">
          Option Chain Analyzer bridges this gap by offering a clean, lightweight, completely free, and transparent analytical workspace that instantly extracts spot prices, calculates strike-by-strike Put-Call Ratios, flags IV skews, and highlights major open interest walls.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Our Analytical Framework: The 6.0x Institutional Rule
        </h2>
        <p className="text-sm leading-relaxed">
          In our research framework, individual strike support and resistance levels are determined by mathematical ratio thresholds:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold uppercase text-emerald-900 tracking-wider">Statistical Support (PCR &ge; 6.0x)</h4>
            <p className="text-xs text-emerald-950 leading-relaxed">
              When Put Open Interest exceeds Call Open Interest by at least 6 to 1 at a specific strike, it signifies massive institutional put underwriting. Writers have deployed significant margin capital to defend that strike against downward moves.
            </p>
          </div>
          <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1.5">
            <h4 className="text-xs font-bold uppercase text-rose-900 tracking-wider">Statistical Resistance (CPR &ge; 6.0x)</h4>
            <p className="text-xs text-rose-950 leading-relaxed">
              When Call Open Interest exceeds Put Open Interest by at least 6 to 1, it reflects heavy overhead call underwriting, signaling that option sellers expect the market to remain below that ceiling.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          Editorial &amp; Research Standards
        </h2>
        <p className="text-sm leading-relaxed">
          Our Market Research &amp; Derivatives Education blog is crafted by experienced market analysts committed to genuine education rather than get-rich-quick marketing. Every guide includes mathematical definitions, real-world scenario breakdowns, structural market mechanics, and SEBI regulatory disclosures.
        </p>
      </section>

      {/* Quick Navigation Footer */}
      <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <button 
          onClick={onBackToApp} 
          className="text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Option Chain Analyzer
        </button>
        <button 
          onClick={onNavigateBlog} 
          className="text-slate-600 hover:text-brand-teal transition-colors flex items-center gap-1 cursor-pointer"
        >
          Explore Market Research Blog &rarr;
        </button>
      </div>
    </div>
  );
}

export function PrivacyPage({ onBackToApp, onNavigateBlog }: StaticPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8 text-slate-700 leading-relaxed font-medium">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-xs font-black uppercase tracking-widest text-brand-teal block mb-1">
          Privacy Protocol &amp; Cookie Policy
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">
          Last Updated: October 9, 2026 • Full Transparency Notice
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          1. Overview and Scope
        </h2>
        <p className="text-sm leading-relaxed">
          This Privacy Policy explains how <strong>OptionChainAnalyzer.in</strong> ("we", "our", or "us") manages information when you use our website, local data processing tool, and educational resources. We respect user privacy as a fundamental engineering principle.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          2. Client-Side Offline Processing (Zero Remote Storage)
        </h2>
        <p className="text-sm leading-relaxed">
          The core differentiator of OptionChainAnalyzer.in is our <strong>browser-local computation model</strong>. When you upload, select, or drag-and-drop an NSE Option Chain CSV file:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-xs md:text-sm">
          <li>The file is parsed in your device's browser memory (via Web Workers / JavaScript engine).</li>
          <li><strong>No CSV file, ticker symbol, spot price, or trade parameter is ever transmitted to our servers or stored in any remote database.</strong></li>
          <li>Closing or refreshing the browser tab immediately clears the dataset from memory.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          3. Google AdSense &amp; Advertising Cookies Disclosure
        </h2>
        <p className="text-sm leading-relaxed">
          To maintain free access to our analysis software and educational blog, we utilize third-party advertising services, including Google AdSense. In compliance with Google publisher requirements and global data privacy standards:
        </p>
        <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs leading-relaxed">
          <p>
            <strong>Third-Party Vendors:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites across the Internet.
          </p>
          <p>
            <strong>DoubleClick DART Cookie:</strong> Google's use of advertising cookies enables it and its partners to serve ads to users based on their visits to our site and other destinations online.
          </p>
          <p>
            <strong>User Opt-Out:</strong> Users may opt out of personalized advertising by visiting Google Ad Settings at <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">https://policies.google.com/technologies/ads</a> or through <a href="http://www.aboutads.info/choices/" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">www.aboutads.info/choices</a>.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          4. GDPR &amp; CCPA Compliance
        </h2>
        <p className="text-sm leading-relaxed">
          We comply with General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA) standards:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-xs md:text-sm">
          <li>We do not sell, rent, or trade user personal information to any third party.</li>
          <li>Users have the right to request access, correction, or deletion of any personal data submitted via our contact channels.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          5. Contact Details for Privacy Queries
        </h2>
        <p className="text-sm leading-relaxed">
          For any questions concerning our privacy practices or cookie policies, reach out to our team at:
        </p>
        <p className="font-mono text-sm text-brand-teal font-extrabold">
          reachraghuhere14@gmail.com / support@optionchainanalyzer.in
        </p>
      </section>

      {/* Quick Navigation Footer */}
      <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <button 
          onClick={onBackToApp} 
          className="text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Option Chain Analyzer
        </button>
        <button 
          onClick={onNavigateBlog} 
          className="text-slate-600 hover:text-brand-teal transition-colors flex items-center gap-1 cursor-pointer"
        >
          Explore Market Research Blog &rarr;
        </button>
      </div>
    </div>
  );
}

export function TermsPage({ onBackToApp, onNavigateBlog }: StaticPageProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-8 text-slate-700 leading-relaxed font-medium">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <span className="text-xs font-black uppercase tracking-widest text-brand-teal block mb-1">
          Legal Agreement
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
          Terms of Use &amp; Service Agreement
        </h1>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">
          Last Updated: October 9, 2026 • Mandatory User Terms
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          1. Acceptance of Terms
        </h2>
        <p className="text-sm leading-relaxed">
          By visiting, accessing, or using OptionChainAnalyzer.in, you agree to be bound by these Terms of Use and our Privacy Policy. If you disagree with any portion of these terms, you must discontinue your use of this website immediately.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          2. Educational License &amp; Permitted Use
        </h2>
        <p className="text-sm leading-relaxed">
          You are granted a personal, non-exclusive, non-transferable revocable license to access the Option Chain Analyzer tool and read our research articles strictly for personal, educational, and research purposes. You may not:
        </p>
        <ul className="list-disc pl-6 space-y-1.5 text-xs md:text-sm">
          <li>Decompile, reverse engineer, or scrape the application layout and mathematical indicators for commercial redistribution;</li>
          <li>Re-package the software into paid advisory products or signal services;</li>
          <li>Circumvent or tamper with local browser security controls or display settings.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          3. Absolute Disclaimer of Warranties
        </h2>
        <p className="text-sm leading-relaxed">
          The software and articles are provided on an "as is" and "as available" basis without warranties of any kind. We make no warranty that parsed calculations, support/resistance ratios, or volatility metrics will be uninterrupted, error-free, or match live real-time exchange transactions with zero latency.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
          4. Governing Law and Jurisdiction
        </h2>
        <p className="text-sm leading-relaxed">
          These Terms of Use are governed by and construed in accordance with the laws of India. Any legal dispute or proceeding arising out of or related to this platform shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, India.
        </p>
      </section>

      {/* Quick Navigation Footer */}
      <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <button 
          onClick={onBackToApp} 
          className="text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
        >
          &larr; Back to Option Chain Analyzer
        </button>
        <button 
          onClick={onNavigateBlog} 
          className="text-slate-600 hover:text-brand-teal transition-colors flex items-center gap-1 cursor-pointer"
        >
          Explore Market Research Blog &rarr;
        </button>
      </div>
    </div>
  );
}
