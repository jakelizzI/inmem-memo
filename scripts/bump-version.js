import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceFileContent(filePath, regex, replacement, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found, skipping: ${filePath}`);
    return;
  }
  const original = fs.readFileSync(filePath, 'utf8');
  if (!regex.test(original)) {
    throw new Error(`Target pattern for ${label} not found in ${filePath}`);
  }
  const updated = original.replace(regex, replacement);
  fs.writeFileSync(filePath, updated, 'utf8');
}

// 1. Read current version from package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version;

let newVersion = process.argv[2];
if (!newVersion) {
  const parts = oldVersion.split('.').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.error(`Invalid version format: ${oldVersion}`);
    process.exit(1);
  }
  parts[2] += 1;
  newVersion = parts.join('.');
}

console.log(`Bumping version: ${oldVersion} -> ${newVersion}`);
const escapedOld = escapeRegExp(oldVersion);

// 1. package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// 2. src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
}

// 3. src-tauri/Cargo.toml (Match version specifically within [package] section)
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
const cargoPackageRegex = /(\[package\][\s\S]*?^version\s*=\s*")[^"]+(")/m;
replaceFileContent(
  cargoTomlPath,
  cargoPackageRegex,
  `$1${newVersion}$2`,
  'Cargo.toml [package] version'
);

// 4. src/constants/version.js
const versionJsPath = path.join(rootDir, 'src', 'constants', 'version.js');
replaceFileContent(
  versionJsPath,
  new RegExp(`'${escapedOld}'`, 'g'),
  `'${newVersion}'`,
  'version.js APP_VERSION'
);

// 5. packaging/winget/inmem-memo.yaml
const wingetPath = path.join(rootDir, 'packaging', 'winget', 'inmem-memo.yaml');
replaceFileContent(
  wingetPath,
  new RegExp(`PackageVersion: ${escapedOld}`, 'g'),
  `PackageVersion: ${newVersion}`,
  'winget PackageVersion'
);
replaceFileContent(
  wingetPath,
  new RegExp(`/v${escapedOld}/`, 'g'),
  `/v${newVersion}/`,
  'winget InstallerUrl tag'
);
replaceFileContent(
  wingetPath,
  new RegExp(`_${escapedOld}_`, 'g'),
  `_${newVersion}_`,
  'winget InstallerUrl filename'
);

// 6. README.md
const readmePath = path.join(rootDir, 'README.md');
replaceFileContent(
  readmePath,
  new RegExp(`\`v${escapedOld}\``, 'g'),
  `\`v${newVersion}\``,
  'README.md badge'
);

// 7. docs/ja/README.md
const jaReadmePath = path.join(rootDir, 'docs', 'ja', 'README.md');
replaceFileContent(
  jaReadmePath,
  new RegExp(`\`v${escapedOld}\``, 'g'),
  `\`v${newVersion}\``,
  'docs/ja/README.md badge'
);

console.log(`Successfully bumped all files to ${newVersion}`);
