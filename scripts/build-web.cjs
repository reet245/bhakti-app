const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
process.env.NODE_ENV = 'production';
const expoRequire = createRequire(require.resolve('expo/package.json'));
expoRequire('@expo/env').load(process.cwd());
const { validateApiUrl } = require('../src/utils/apiPolicy.cjs');
try { validateApiUrl(process.env.EXPO_PUBLIC_API_BASE_URL, { production: true }); }
catch (error) { console.error(error.message); process.exit(1); }
const args = process.argv.slice(2);
const outputIndex = args.indexOf('--output-dir');
const outputDirectory = path.resolve(outputIndex >= 0 ? args[outputIndex + 1] : 'dist');
const result = spawnSync(process.execPath, [require.resolve('expo/bin/cli'), 'export', '-p', 'web', ...args], { stdio: 'inherit', env: process.env });
if (result.status !== 0) process.exit(result.status || 1);
const workerPath = path.join(outputDirectory, 'sw.js');
const html = fs.readFileSync(path.join(outputDirectory, 'index.html'));
const buildId = crypto.createHash('sha256').update(html).update(fs.readFileSync(workerPath)).digest('hex').slice(0, 16);
fs.writeFileSync(workerPath, fs.readFileSync(workerPath, 'utf8').replace('__BHAKTI_BUILD_ID__', buildId));
console.log(`Bhakti PWA cache version: ${buildId}`);
