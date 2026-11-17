import fs from 'fs';
import path from 'path';

// Define clean SEO metadata strictly matching the 14 active routes in App.tsx and BlogSection.tsx.
// Generates tailored <head> tags (title, canonical, description, OG, Twitter) per route while
// leaving <div id="root"></div> untouched—eliminating pre-rendered HTML mismatches on hydration.
const routeMeta = {
  'index': {
    title: 'Option Chain Analyzer - NSE Nifty & Bank Nifty Educational Tool',
    desc: 'Free NSE Option Chain Analyzer for Nifty and Bank Nifty. Visualize Put-Call Ratio (PCR), Call-Put Ratio (CPR), Open Interest clusters, and Implied Volatility locally in your browser.',
    canonical: 'https://optionchainanalyzer.in/'
  },
  'blog': {
    title: 'Educational Derivatives & Global Macro Blog - Option Chain Analyzer',
    desc: 'Concise, non-advisory guides explaining NSE option chain structure, global macro transmission, Put-Call Ratios, and derivatives risk literacy.',
    canonical: 'https://optionchainanalyzer.in/blog'
  },
  'blog/global-central-bank-liquidity-shifts-nse-derivatives': {
    title: 'Global Central Bank Liquidity Cycles: How Macro Shocks Transmit to NSE Option Chain',
    desc: 'An educational overview of how policy rate decisions by major central banks alter cross-border capital flows and Implied Volatility on Indian benchmark indices.',
    canonical: 'https://optionchainanalyzer.in/blog/global-central-bank-liquidity-shifts-nse-derivatives'
  },
  'blog/geopolitical-trade-corridor-disruptions-market-volatility': {
    title: 'Geopolitical Developments & Global Trade Disruptions: Reading Derivatives Sentiment on the NSE',
    desc: 'An educational guide on how geopolitical events, global supply chain bottlenecks, and trade policy updates impact energy inputs, India VIX, and option chain structures.',
    canonical: 'https://optionchainanalyzer.in/blog/geopolitical-trade-corridor-disruptions-market-volatility'
  },
  'blog/nasdaq-tech-earnings-wall-street-cues-nifty-opening-gaps': {
    title: 'Overnight Wall Street & Global Cues: Understanding Opening Price Adjustments on the NSE',
    desc: 'How overnight US index moves, global technology earnings, and Gift Nifty pricing shape domestic opening gaps and early-session open interest updates on the NSE.',
    canonical: 'https://optionchainanalyzer.in/blog/nasdaq-tech-earnings-wall-street-cues-nifty-opening-gaps'
  },
  'blog/what-is-an-option-chain-and-why-do-traders-use-it': {
    title: 'What Is an Option Chain? Understanding Calls, Puts, and Strike Structure',
    desc: 'A clear beginner guide explaining how NSE option chains organize strike prices, Calls, Puts, Last Traded Price (LTP), and Open Interest in a single tabular matrix.',
    canonical: 'https://optionchainanalyzer.in/blog/what-is-an-option-chain-and-why-do-traders-use-it'
  },
  'blog/open-interest-vs-volume': {
    title: 'Open Interest vs. Trading Volume: How Exchange Participation Is Measured',
    desc: 'Understand the difference between Open Interest (active unsettled contracts) and Volume (daily transaction count), and how both metrics work together in derivatives data.',
    canonical: 'https://optionchainanalyzer.in/blog/open-interest-vs-volume'
  },
  'blog/what-is-put-call-ratio-pcr': {
    title: 'Put-Call Ratio (PCR) & Max Pain: Analytical Concepts Explained',
    desc: 'Learn how Put-Call Ratio (PCR), Call-Put Ratio (CPR), and Max Pain formulas are calculated from exchange open interest data, along with their mathematical limitations.',
    canonical: 'https://optionchainanalyzer.in/blog/what-is-put-call-ratio-pcr'
  },
  'blog/understanding-implied-volatility-iv-on-the-option-chain': {
    title: 'Implied Volatility (IV) & Option Greeks: Educational Risk Awareness',
    desc: 'An introduction to Implied Volatility (IV) and the four core Option Greeks—Delta, Gamma, Theta, and Vega—explaining how time decay and volatility impact option pricing risk.',
    canonical: 'https://optionchainanalyzer.in/blog/understanding-implied-volatility-iv-on-the-option-chain'
  },
  'about': {
    title: 'About Us - Option Chain Analyzer',
    desc: 'Learn about Option Chain Analyzer, our helpdesk, transparent mathematical methodology, and browser-local privacy architecture.',
    canonical: 'https://optionchainanalyzer.in/about'
  },
  'contact': {
    title: 'Contact Us - Option Chain Analyzer Help & Support',
    desc: 'Get in touch with Option Chain Analyzer Helpdesk in Bengaluru for CSV parser questions, educational blog feedback, or technical support.',
    canonical: 'https://optionchainanalyzer.in/contact'
  },
  'disclaimer': {
    title: 'SEBI Compliance & Financial Risk Disclaimer - Option Chain Analyzer',
    desc: 'Review statutory SEBI regulatory disclosures, retail loss statistics, and the strictly non-advisory educational scope of Option Chain Analyzer.',
    canonical: 'https://optionchainanalyzer.in/disclaimer'
  },
  'privacy': {
    title: 'Privacy Policy - Option Chain Analyzer',
    desc: 'Read our privacy policy covering client-side CSV processing, localStorage preferences, Google Analytics, and Google AdSense cookie disclosures.',
    canonical: 'https://optionchainanalyzer.in/privacy'
  },
  'terms': {
    title: 'Terms of Use & Legal Agreement - Option Chain Analyzer',
    desc: 'Review the terms of use and regulatory disclaimers governing access to Option Chain Analyzer and its educational guides.',
    canonical: 'https://optionchainanalyzer.in/terms'
  }
};

const distPath = path.resolve('dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

const defaultIndex = fs.readFileSync(indexPath, 'utf-8');

function escapeHtmlAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function applyRouteMeta(html, meta) {
  const safeTitle = escapeHtmlAttr(meta.title);
  const safeDesc = escapeHtmlAttr(meta.desc);
  const safeCanonical = escapeHtmlAttr(meta.canonical);

  let customizedHTML = html;
  customizedHTML = customizedHTML.replace(/<title>[^<]+<\/title>/g, `<title>${meta.title}</title>`);
  customizedHTML = customizedHTML.replace(/<link rel="canonical" href="[^"]+" \/>/g, `<link rel="canonical" href="${safeCanonical}" />`);
  customizedHTML = customizedHTML.replace(/<meta name="description" content="[^"]+" \/>/g, `<meta name="description" content="${safeDesc}" />`);
  customizedHTML = customizedHTML.replace(/<meta property="og:url" content="[^"]+" \/>/g, `<meta property="og:url" content="${safeCanonical}" />`);
  customizedHTML = customizedHTML.replace(/<meta property="og:title" content="[^"]+" \/>/g, `<meta property="og:title" content="${safeTitle}" />`);
  customizedHTML = customizedHTML.replace(/<meta property="og:description" content="[^"]+" \/>/g, `<meta property="og:description" content="${safeDesc}" />`);
  customizedHTML = customizedHTML.replace(/<meta property="twitter:url" content="[^"]+" \/>/g, `<meta property="twitter:url" content="${safeCanonical}" />`);
  customizedHTML = customizedHTML.replace(/<meta property="twitter:title" content="[^"]+" \/>/g, `<meta property="twitter:title" content="${safeTitle}" />`);
  customizedHTML = customizedHTML.replace(/<meta property="twitter:description" content="[^"]+" \/>/g, `<meta property="twitter:description" content="${safeDesc}" />`);
  return customizedHTML;
}

console.log('--- Generating Clean Canonical Route Metadata (14 Active Routes) ---');

Object.keys(routeMeta).forEach((route) => {
  if (route === 'index') return;

  const meta = routeMeta[route];
  const dirPath = path.join(distPath, route);
  fs.mkdirSync(dirPath, { recursive: true });

  const customizedHTML = applyRouteMeta(defaultIndex, meta);
  fs.writeFileSync(path.join(dirPath, 'index.html'), customizedHTML);
  console.log(`✓ Generated route head metadata: dist/${route}/index.html`);
});

try {
  const homeHTML = applyRouteMeta(defaultIndex, routeMeta['index']);
  fs.writeFileSync(indexPath, homeHTML);
  console.log('✓ Updated root homepage metadata: dist/index.html');
} catch (e) {
  console.error('Failed to customize root index.html:', e);
}

fs.copyFileSync(indexPath, path.join(distPath, '404.html'));
console.log('✓ Generated fallback: dist/404.html');
console.log('--- Static route metadata generation complete (no DOM pre-rendering injected) ---');
