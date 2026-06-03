import fs from 'fs';
import path from 'path';

// Define all routes that need to be statically generated as 200 OK folders on GitHub Pages
const routes = [
  'blog',
  'blog/what-is-an-option-chain-and-why-do-traders-use-it',
  'blog/what-is-put-call-ratio-pcr',
  'blog/what-is-open-interest-oi',
  'blog/open-interest-vs-volume',
  'about',
  'privacy',
  'terms'
];

const distPath = path.resolve('dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('Error: dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

const indexContent = fs.readFileSync(indexPath, 'utf-8');

console.log('--- Generating Static Route Folders to prevent 404s for SEO ---');

routes.forEach(route => {
  const dirPath = path.join(distPath, route);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, 'index.html'), indexContent);
  console.log(`✓ Generated route folder + index: dist/${route}/index.html`);
});

// Create 404.html as a general fallback for any other dynamic paths
fs.copyFileSync(indexPath, path.join(distPath, '404.html'));
console.log('✓ Generated fallback: dist/404.html');
console.log('--- All static route folders generated successfully! ---');
