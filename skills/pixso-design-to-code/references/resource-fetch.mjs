#!/usr/bin/env node
// Generic Pixso resource fetcher: fetch code files, download assets in parallel, and replace temporary URLs.
// Cross-platform: pure Node with no shell dependency. Node 18+ uses built-in fetch; older versions fall back to node:http(s).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';

function parseArgs(argv) {
  const a = {};
  for (let i = 2; i < argv.length; i++) {
    const eq = argv[i].match(/^--([^=]+)=(.*)$/);
    if (eq) a[eq[1]] = eq[2];
    else if (argv[i].startsWith('--')) a[argv[i].slice(2)] = argv[++i];
  }
  return a;
}

const args = parseArgs(process.argv);
const HOST = (args.host || 'http://localhost:3667').replace(/\/$/, '');
const BATCH = args.batch;
const NODES = (args.nodes || '').split(',').map((s) => s.trim()).filter(Boolean);
const OUT_DIR = path.resolve(args['out-dir'] || '.');
const IMG_DIR = path.resolve(args['img-dir'] || path.join(OUT_DIR, 'assets/images'));
const FONT_DIR = path.resolve(args['font-dir'] || path.join(OUT_DIR, 'assets/fonts'));
const IMG_PREFIX = args['img-prefix'] || 'assets/images/';
const FONT_PREFIX = args['font-prefix'] || 'assets/fonts/';
const RETRIES = Number(args.retries || 3);
const CONCURRENCY = Number(args.concurrency || 8);

if (!BATCH || NODES.length === 0) {
  console.error('Usage: node resource-fetch.mjs --host <url> --batch <batchTs> --nodes <id1,id2> [--out-dir <dir>]');
  process.exit(2);
}

// Fallback 1: use node:http(s) when fetch is unavailable.
async function download(url) {
  if (typeof globalThis.fetch === 'function') {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

// Fallback 2: retry each request with exponential backoff.
async function downloadWithRetry(url) {
  let lastErr;
  for (let i = 0; i < RETRIES; i++) {
    try {
      return await download(url);
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i));
    }
  }
  throw lastErr;
}

// Concurrency pool.
async function pool(items, limit, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx]);
    }
  });
  await Promise.all(runners);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(FONT_DIR, { recursive: true });

const failed = [];
const batchEsc = BATCH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const assetRe = new RegExp(`https?://[^"'()\\s]*?/assets/${batchEsc}/([^"'()\\s?#]+)`, 'g');
const isFont = (f) => /\.(ttf|otf|woff2?)$/i.test(f);

for (const node of NODES) {
  const codeUrl = `${HOST}/code/${BATCH}/${encodeURIComponent(node)}`;
  let code;
  try {
    code = (await downloadWithRetry(codeUrl)).toString('utf8');
  } catch (e) {
    // Fallback 3: record code fetch failures and skip the node.
    failed.push({ type: 'code', url: codeUrl, error: String(e) });
    console.error(`[FAIL] code ${node}: ${e}`);
    continue;
  }

  const files = [...new Set([...code.matchAll(assetRe)].map((m) => m[1]))];

  await pool(files, CONCURRENCY, async (file) => {
    const url = `${HOST}/assets/${BATCH}/${file}`;
    const dest = path.join(isFont(file) ? FONT_DIR : IMG_DIR, path.basename(file));
    try {
      if (!fs.existsSync(dest)) fs.writeFileSync(dest, await downloadWithRetry(url));
    } catch (e) {
      // Fallback 3: isolate single asset failures.
      failed.push({ type: 'asset', url, dest, error: String(e) });
      console.error(`[FAIL] asset ${file}: ${e}`);
    }
  });

  const localized = code.replace(assetRe, (_m, file) =>
    (isFont(file) ? FONT_PREFIX : IMG_PREFIX) + path.basename(file)
  );
  const outFile = path.join(OUT_DIR, `${node.replace(/:/g, '_')}.html`);
  fs.writeFileSync(outFile, localized, 'utf8');
  console.log(`[OK] ${node} -> ${outFile} (${files.length} assets)`);
}

// Fallback 4: whole-run fallback with a failure manifest and cross-platform manual commands.
if (failed.length) {
  const manifestPath = path.join(OUT_DIR, 'resource-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(failed, null, 2), 'utf8');
  console.error(`\n${failed.length} items failed; wrote ${manifestPath}`);
  console.error('Manual fallback downloads, choose the command for your OS:');
  for (const f of failed.filter((x) => x.dest)) {
    console.error(`  # Windows PowerShell: Invoke-WebRequest "${f.url}" -OutFile "${f.dest}"`);
    console.error(`  # macOS / Linux:     curl -fsSL "${f.url}" -o "${f.dest}"`);
  }
  process.exit(1);
}
console.log('\nDone.');
