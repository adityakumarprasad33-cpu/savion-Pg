/**
 * fix-darkmode.js
 * Scans all .tsx files in src/ and patches hardcoded light-mode classes
 * to use proper dark: variants, ensuring full dark mode compatibility.
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Replacements: [pattern, replacement]
// Only target className strings — these are safe global substitutions
const replacements = [
  // Backgrounds
  [/\bbg-white\b(?!\s*dark:)/g, 'bg-white dark:bg-slate-900'],
  [/\bbg-slate-50\b(?!\s*dark:)/g, 'bg-slate-50 dark:bg-slate-900/50'],
  [/\bbg-slate-100\b(?!\s*dark:)/g, 'bg-slate-100 dark:bg-slate-800'],
  [/\bbg-gray-50\b(?!\s*dark:)/g, 'bg-gray-50 dark:bg-slate-900/50'],
  [/\bbg-gray-100\b(?!\s*dark:)/g, 'bg-gray-100 dark:bg-slate-800'],
  
  // Text colors that vanish on dark bg
  [/\btext-slate-900\b(?!\s*dark:)/g, 'text-slate-900 dark:text-slate-100'],
  [/\btext-slate-800\b(?!\s*dark:)/g, 'text-slate-800 dark:text-slate-100'],
  [/\btext-slate-700\b(?!\s*dark:)/g, 'text-slate-700 dark:text-slate-300'],
  [/\btext-gray-900\b(?!\s*dark:)/g, 'text-gray-900 dark:text-slate-100'],
  [/\btext-gray-800\b(?!\s*dark:)/g, 'text-gray-800 dark:text-slate-100'],
  [/\btext-gray-700\b(?!\s*dark:)/g, 'text-gray-700 dark:text-slate-300'],
  [/\btext-gray-600\b(?!\s*dark:)/g, 'text-gray-600 dark:text-slate-400'],
  [/\btext-gray-500\b(?!\s*dark:)/g, 'text-gray-500 dark:text-slate-400'],
  [/\btext-slate-600\b(?!\s*dark:)/g, 'text-slate-600 dark:text-slate-400'],
  [/\btext-slate-500\b(?!\s*dark:)/g, 'text-slate-500 dark:text-slate-400'],
  [/\btext-black\b(?!\s*dark:)/g, 'text-black dark:text-white'],
  
  // Borders
  [/\bborder-slate-200\b(?!\s*dark:)/g, 'border-slate-200 dark:border-slate-700'],
  [/\bborder-slate-300\b(?!\s*dark:)/g, 'border-slate-300 dark:border-slate-600'],
  [/\bborder-gray-200\b(?!\s*dark:)/g, 'border-gray-200 dark:border-slate-700'],
  [/\bborder-gray-300\b(?!\s*dark:)/g, 'border-gray-300 dark:border-slate-600'],
  
  // Hover states
  [/\bhover:bg-slate-50\b(?!\s*dark:)/g, 'hover:bg-slate-50 dark:hover:bg-slate-800'],
  [/\bhover:bg-slate-100\b(?!\s*dark:)/g, 'hover:bg-slate-100 dark:hover:bg-slate-800'],
  [/\bhover:bg-gray-50\b(?!\s*dark:)/g, 'hover:bg-gray-50 dark:hover:bg-slate-800'],
  [/\bhover:bg-gray-100\b(?!\s*dark:)/g, 'hover:bg-gray-100 dark:hover:bg-slate-800'],
  [/\bhover:bg-white\b(?!\s*dark:)/g, 'hover:bg-white dark:hover:bg-slate-800'],

  // Dividers / separators
  [/\bdivide-slate-200\b(?!\s*dark:)/g, 'divide-slate-200 dark:divide-slate-700'],
  [/\bdivide-gray-200\b(?!\s*dark:)/g, 'divide-gray-200 dark:divide-slate-700'],
  
  // Ring colors
  [/\bring-slate-200\b(?!\s*dark:)/g, 'ring-slate-200 dark:ring-slate-700'],
  [/\bring-gray-200\b(?!\s*dark:)/g, 'ring-gray-200 dark:ring-slate-700'],
  
  // Shadow colors that look wrong
  [/\bshadow-sm\b(?!\s*dark:)/g, 'shadow-sm dark:shadow-slate-900/50'],

  // Notification unread backgrounds
  [/\bbg-orange-50\/50\b(?!\s*dark:)/g, 'bg-orange-50/50 dark:bg-orange-950/30'],
  [/\bbg-red-50\b(?!\s*dark:)/g, 'bg-red-50 dark:bg-red-950/30'],
  [/\bbg-violet-50\b(?!\s*dark:)/g, 'bg-violet-50 dark:bg-violet-950/30'],

  // Focus backgrounds
  [/\bfocus:bg-slate-50\b(?!\s*dark:)/g, 'focus:bg-slate-50 dark:focus:bg-slate-800'],
];

let totalChanges = 0;
let filesChanged = 0;

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walkDir(full);
    } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      processFile(full);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  let changeCount = 0;
  
  for (const [pattern, replacement] of replacements) {
    const matches = content.match(pattern);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(pattern, replacement);
    }
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    const rel = path.relative(__dirname, filePath);
    console.log(`  ✓ ${rel} (${changeCount} fixes)`);
    totalChanges += changeCount;
    filesChanged++;
  }
}

console.log('\n🌙 Dark Mode Patcher — Scanning all .tsx/.ts files...\n');
walkDir(srcDir);
console.log(`\n✅ Done! Patched ${totalChanges} dark-mode issues across ${filesChanged} files.\n`);
