import fs from 'fs';
import path from 'path';

// Define specialized SEO metadata for each route to ensure unique canonical headers, titles, and descriptions on Google.
const routeMeta = {
  'blog': {
    title: 'Market Research & Derivatives Education Blog - Option Chain Analyzer',
    desc: 'Learn option chain analysis, Put Call Ratio (PCR), Open Interest (OI) clustering, and other essential derivatives trading metrics with our expert-crafted guides.',
    canonical: 'https://optionchainanalyzer.in/blog'
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

const distPath = path.resolve('dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

const defaultIndex = fs.readFileSync(indexPath, 'utf-8');

console.log('--- Generating Optimised Static Route Folders for Google Indexing & SEO ---');

Object.keys(routeMeta).forEach(route => {
  const meta = routeMeta[route];
  const dirPath = path.join(distPath, route);
  fs.mkdirSync(dirPath, { recursive: true });

  // Dynamically tailor metadata in the index.html template for current route
  let customizedHTML = defaultIndex;

  // 1. Title Meta
  customizedHTML = customizedHTML.replace(
    /<title>[^<]+<\/title>/g,
    `<title>${meta.title}</title>`
  );

  // 2. Canonical URL Meta
  customizedHTML = customizedHTML.replace(
    /<link rel="canonical" href="[^"]+" \/>/g,
    `<link rel="canonical" href="${meta.canonical}" />`
  );

  // 3. Description Meta
  customizedHTML = customizedHTML.replace(
    /<meta name="description" content="[^"]+" \/>/g,
    `<meta name="description" content="${meta.desc}" />`
  );

  // 4. Open Graph Meta Tags
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

  // 5. Twitter Meta Tags
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

  fs.writeFileSync(path.join(dirPath, 'index.html'), customizedHTML);
  console.log(`✓ Generated tailored SEO route: dist/${route}/index.html`);
});

// Update the root-level fallback standard copies safely
fs.copyFileSync(indexPath, path.join(distPath, '404.html'));
console.log('✓ Generated fallback: dist/404.html');
console.log('--- All static route folders generated and customized successfully! ---');
