#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version and repository
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

const VERSION = packageJson.version;
const REPO = 'jakelizzI/inmem-memo';
const CACHE_DIR = path.join(os.homedir(), '.inmem-memo', `v${VERSION}`);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'inmem-memo-cli' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'inmem-memo-cli' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download binary: HTTP ${response.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

async function getDownloadUrlAndExecutable() {
  const platform = process.platform;
  const arch = process.arch;

  // Pattern matchers for release assets
  let pattern = null;
  let execName = 'inmem-memo';

  if (platform === 'win32') {
    pattern = /\.exe$/i;
    execName = 'inmem-memo-setup.exe';
  } else if (platform === 'linux') {
    pattern = /\.AppImage$/i;
    execName = 'inmem-memo.AppImage';
  } else if (platform === 'darwin') {
    pattern = arch === 'arm64' ? /aarch64\.dmg$/i : /x64\.dmg$/i;
    execName = 'inmem-memo.dmg';
  } else {
    throw new Error(`Unsupported platform: ${platform} (${arch})`);
  }

  // Query GitHub release assets dynamically
  const releaseApiUrl = `https://api.github.com/repos/${REPO}/releases/tags/v${VERSION}`;
  let assetUrl = null;

  try {
    const releaseData = await fetchJson(releaseApiUrl);
    if (releaseData && Array.isArray(releaseData.assets)) {
      const matched = releaseData.assets.find(a => pattern.test(a.name));
      if (matched && matched.browser_download_url) {
        assetUrl = matched.browser_download_url;
      }
    }
  } catch (apiErr) {
    // Fallback to static expected URL
    if (platform === 'win32') {
      assetUrl = `https://github.com/${REPO}/releases/download/v${VERSION}/inmem-memo_${VERSION}_x64-setup.exe`;
    } else if (platform === 'linux') {
      assetUrl = `https://github.com/${REPO}/releases/download/v${VERSION}/inmem-memo_${VERSION}_amd64.AppImage`;
    } else if (platform === 'darwin') {
      assetUrl = `https://github.com/${REPO}/releases/download/v${VERSION}/inmem-memo_${VERSION}_aarch64.dmg`;
    }
  }

  if (!assetUrl) {
    throw new Error(`Could not find a compatible binary release for ${platform} (${arch}).`);
  }

  return { downloadUrl: assetUrl, executable: execName };
}

async function main() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const { downloadUrl, executable } = await getDownloadUrlAndExecutable();
    const localBinaryPath = path.join(CACHE_DIR, executable);

    if (!fs.existsSync(localBinaryPath)) {
      console.log(`⚡ Setting up inmem-memo (v${VERSION})...`);
      console.log(`📥 Downloading native package from GitHub Releases...`);

      await downloadFile(downloadUrl, localBinaryPath);

      if (process.platform !== 'win32') {
        fs.chmodSync(localBinaryPath, 0o755);
      }
      console.log('✅ Setup complete!');
    }

    console.log('🚀 Launching inmem-memo...');

    if (process.platform === 'win32') {
      const child = spawn(localBinaryPath, [], { detached: true, stdio: 'ignore' });
      child.unref();
    } else if (process.platform === 'darwin') {
      const child = spawn('open', [localBinaryPath], { detached: true, stdio: 'ignore' });
      child.unref();
    } else {
      const child = spawn(localBinaryPath, [], { detached: true, stdio: 'ignore' });
      child.unref();
    }

    process.exit(0);

  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    console.error(`Please download directly from https://github.com/${REPO}/releases\n`);
    process.exit(1);
  }
}

main();
