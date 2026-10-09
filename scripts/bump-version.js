import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

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

// 3. src-tauri/Cargo.toml
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
  let cargoContent = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoContent = cargoContent.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`);
  fs.writeFileSync(cargoTomlPath, cargoContent, 'utf8');
}

// 4. src/constants/version.js
const versionJsPath = path.join(rootDir, 'src', 'constants', 'version.js');
if (fs.existsSync(versionJsPath)) {
  let versionJs = fs.readFileSync(versionJsPath, 'utf8');
  versionJs = versionJs.replace(new RegExp(`'${oldVersion}'`, 'g'), `'${newVersion}'`);
  fs.writeFileSync(versionJsPath, versionJs, 'utf8');
}

// 5. packaging/winget/inmem-memo.yaml
const wingetPath = path.join(rootDir, 'packaging', 'winget', 'inmem-memo.yaml');
if (fs.existsSync(wingetPath)) {
  let winget = fs.readFileSync(wingetPath, 'utf8');
  winget = winget.replace(new RegExp(`PackageVersion: ${oldVersion}`, 'g'), `PackageVersion: ${newVersion}`);
  winget = winget.replace(new RegExp(`/v${oldVersion}/`, 'g'), `/v${newVersion}/`);
  winget = winget.replace(new RegExp(`_${oldVersion}_`, 'g'), `_${newVersion}_`);
  fs.writeFileSync(wingetPath, winget, 'utf8');
}

// 6. README.md
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  readme = readme.replace(new RegExp(`\`v${oldVersion}\``, 'g'), `\`v${newVersion}\``);
  fs.writeFileSync(readmePath, readme, 'utf8');
}

// 7. docs/ja/README.md
const jaReadmePath = path.join(rootDir, 'docs', 'ja', 'README.md');
if (fs.existsSync(jaReadmePath)) {
  let jaReadme = fs.readFileSync(jaReadmePath, 'utf8');
  jaReadme = jaReadme.replace(new RegExp(`\`v${oldVersion}\``, 'g'), `\`v${newVersion}\``);
  fs.writeFileSync(jaReadmePath, jaReadme, 'utf8');
}

console.log(`Successfully bumped all files to ${newVersion}`);
