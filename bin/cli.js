#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json for version and metadata
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

const VERSION = packageJson.version;
const REPO = 'jakelizzI/InMem_Scratchpad';
const CACHE_DIR = path.join(os.homedir(), '.inmem-memo', `v${VERSION}`);

function getPlatformInfo() {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === 'win32') {
    return {
      osName: 'windows',
      fileName: 'inmem-memo.exe',
      assetName: 'inmem-memo.exe',
      executable: 'inmem-memo.exe'
    };
  } else if (platform === 'darwin') {
    return {
      osName: 'macos',
      fileName: 'inmem-memo',
      assetName: arch === 'arm64' ? 'inmem-memo_aarch64' : 'inmem-memo_x64',
      executable: 'inmem-memo'
    };
  } else if (platform === 'linux') {
    return {
      osName: 'linux',
      fileName: 'inmem-memo.AppImage',
      assetName: 'inmem-memo.AppImage',
      executable: 'inmem-memo.AppImage'
    };
  } else {
    throw new Error(`Unsupported platform: ${platform} (${arch})`);
  }
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      // Handle redirects (GitHub releases 302 redirect to S3/CDN)
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

async function main() {
  try {
    const platformInfo = getPlatformInfo();

    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const localBinaryPath = path.join(CACHE_DIR, platformInfo.executable);

    // If not cached locally, download from GitHub Releases
    if (!fs.existsSync(localBinaryPath)) {
      console.log(`⚡ InMem Scratchpad (v${VERSION}) をセットアップしています...`);
      console.log(`📥 ネイティブバイナリ (${platformInfo.osName}) を取得中...`);

      const downloadUrl = `https://github.com/${REPO}/releases/download/v${VERSION}/${platformInfo.assetName}`;
      
      try {
        await downloadFile(downloadUrl, localBinaryPath);
        if (process.platform !== 'win32') {
          fs.chmodSync(localBinaryPath, 0o755);
        }
        console.log('✅ セットアップが完了しました！');
      } catch (dlErr) {
        console.error(`\n⚠️ バイナリの自動ダウンロードに失敗しました (${dlErr.message})`);
        console.error(`GitHub Releases (https://github.com/${REPO}/releases) から手動で取得することも可能です。\n`);
        process.exit(1);
      }
    }

    // Launch application in detached mode
    console.log('🚀 InMem Scratchpad を起動しています...');
    const child = spawn(localBinaryPath, [], {
      detached: true,
      stdio: 'ignore'
    });

    child.unref();
    process.exit(0);

  } catch (err) {
    console.error(`❌ エラー: ${err.message}`);
    process.exit(1);
  }
}

main();
