#!/usr/bin/env node
/**
 * local-scan.mjs
 * Lokale Version der Security Pipeline (ohne GitHub Actions).
 * Ausführen: node scripts/local-scan.mjs [--fix]
 *
 * Benötigt: npm, npx (kein Python/Gitleaks-Binary nötig für Basis-Scan)
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

const FIX = process.argv.includes('--fix');
const RESULTS_DIR = '.security-results';

if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR);

const run = (label, cmd, outFile) => {
  process.stdout.write(`  ⏳ ${label}... `);
  try {
    const result = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (outFile) writeFileSync(`${RESULTS_DIR}/${outFile}`, result || '[]');
    console.log('✅');
    return true;
  } catch (err) {
    const output = err.stdout || err.stderr || '';
    if (outFile) writeFileSync(`${RESULTS_DIR}/${outFile}`, output || '{}');
    console.log('⚠️  (Ergebnisse gespeichert)');
    return false;
  }
};

console.log('\n🔐 ptr-digital Security Pipeline — Lokaler Scan');
console.log('─'.repeat(50));
console.log(`Modus: ${FIX ? 'Scan + Auto-Fix' : 'Nur Scan'}\n`);

run('npm audit', `npm audit --json`, 'npm-audit.json');

if (FIX) {
  run('npm audit fix', 'npm audit fix', null);
}

run(
  'ESLint Security',
  `npx eslint . --format json`,
  'eslint-results.json'
);

if (FIX) {
  run('ESLint fix', 'npx eslint . --fix', null);
}

run('Knip (toter Code)', 'npx knip --reporter json 2>/dev/null', 'knip-results.json');

console.log('\n📊 Ergebnisse gespeichert in: .security-results/');

if (FIX) {
  console.log('\n✅ Auto-Fixes angewendet. Bitte Änderungen in git review vor dem Commit.');
}

console.log('\nTipp: Für vollständigen Scan (inkl. Gitleaks + Semgrep) → GitHub Actions "Run workflow" nutzen.\n');
