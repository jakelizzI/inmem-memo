import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Validates that a version string strictly matches three-part numeric semantic versioning (X.Y.Z).
 *
 * @param {string} version - The version string to validate.
 * @returns {boolean} True if the version is valid, false otherwise.
 */
function isValidSemver(version) {
  return typeof version === 'string' && /^\d+\.\d+\.\d+$/.test(version.trim());
}

/**
 * Escapes special characters in a string for safe use in a regular expression.
 *
 * @param {string} string - The raw string to escape.
 * @returns {string} The escaped string safe for RegExp construction.
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Writes data atomically to a file using a temporary file in the same directory.
 *
 * @param {string} filePath - Absolute path to the destination file.
 * @param {string} data - Content string to write.
 */
function writeAtomic(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, data, 'utf8');
  fs.renameSync(tempPath, filePath);
}

/**
 * Validates that a pattern exists in a file content and returns the updated string.
 *
 * @param {string} content - Original file content.
 * @param {RegExp} regex - Regular expression pattern to search for.
 * @param {string} replacement - Replacement string or template.
 * @param {string} label - Human-readable label for error reporting.
 * @param {string} filePath - Path of the file being processed.
 * @returns {string} Updated content.
 * @throws {Error} If regex does not match the content.
 */
function prepareReplacement(content, regex, replacement, label, filePath) {
  if (!regex.test(content)) {
    throw new Error(`Target pattern for ${label} not found in ${filePath}`);
  }
  return content.replace(regex, replacement);
}

// 1. Read and validate current version from package.json
const pkgPath = path.join(rootDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const oldVersion = pkg.version;

if (!isValidSemver(oldVersion)) {
  console.error(`Invalid old version format in package.json: ${oldVersion}`);
  process.exit(1);
}

let newVersion = process.argv[2];
if (newVersion) {
  if (!isValidSemver(newVersion)) {
    console.error(`Invalid new version argument format: ${newVersion}. Expected X.Y.Z`);
    process.exit(1);
  }
} else {
  const parts = oldVersion.split('.').map(Number);
  parts[2] += 1;
  newVersion = parts.join('.');
}

console.log(`Bumping version: ${oldVersion} -> ${newVersion}`);
const escapedOld = escapeRegExp(oldVersion);

// Plan file writes in memory first (all-or-nothing validation)
const pendingWrites = new Map();

// 1. package.json
const updatedPkg = { ...pkg, version: newVersion };
pendingWrites.set(pkgPath, JSON.stringify(updatedPkg, null, 2) + '\n');

// 2. package-lock.json
const lockPath = path.join(rootDir, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.version = newVersion;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = newVersion;
  }
  pendingWrites.set(lockPath, JSON.stringify(lock, null, 2) + '\n');
}

// 3. src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  pendingWrites.set(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
}

// 4. src-tauri/Cargo.toml (Match version specifically within [package] section)
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoTomlPath)) {
  const original = fs.readFileSync(cargoTomlPath, 'utf8');
  const cargoPackageRegex = /(\[package\][\s\S]*?^version\s*=\s*")[^"]+(")/m;
  const updated = prepareReplacement(
    original,
    cargoPackageRegex,
    `$1${newVersion}$2`,
    'Cargo.toml [package] version',
    cargoTomlPath
  );
  pendingWrites.set(cargoTomlPath, updated);
}

// 5. src/constants/version.js
const versionJsPath = path.join(rootDir, 'src', 'constants', 'version.js');
if (fs.existsSync(versionJsPath)) {
  const original = fs.readFileSync(versionJsPath, 'utf8');
  const updated = prepareReplacement(
    original,
    new RegExp(`'${escapedOld}'`, 'g'),
    `'${newVersion}'`,
    'version.js APP_VERSION',
    versionJsPath
  );
  pendingWrites.set(versionJsPath, updated);
}

// 6. packaging/winget/inmem-memo.yaml
const wingetPath = path.join(rootDir, 'packaging', 'winget', 'inmem-memo.yaml');
if (fs.existsSync(wingetPath)) {
  let content = fs.readFileSync(wingetPath, 'utf8');
  content = prepareReplacement(
    content,
    new RegExp(`PackageVersion: ${escapedOld}`, 'g'),
    `PackageVersion: ${newVersion}`,
    'winget PackageVersion',
    wingetPath
  );
  content = prepareReplacement(
    content,
    new RegExp(`/v${escapedOld}/`, 'g'),
    `/v${newVersion}/`,
    'winget InstallerUrl tag',
    wingetPath
  );
  content = prepareReplacement(
    content,
    new RegExp(`_${escapedOld}_`, 'g'),
    `_${newVersion}_`,
    'winget InstallerUrl filename',
    wingetPath
  );
  pendingWrites.set(wingetPath, content);
}

// 7. README.md
const readmePath = path.join(rootDir, 'README.md');
if (fs.existsSync(readmePath)) {
  const original = fs.readFileSync(readmePath, 'utf8');
  const updated = prepareReplacement(
    original,
    new RegExp(`\`v${escapedOld}\``, 'g'),
    `\`v${newVersion}\``,
    'README.md badge',
    readmePath
  );
  pendingWrites.set(readmePath, updated);
}

// 8. docs/ja/README.md
const jaReadmePath = path.join(rootDir, 'docs', 'ja', 'README.md');
if (fs.existsSync(jaReadmePath)) {
  const original = fs.readFileSync(jaReadmePath, 'utf8');
  const updated = prepareReplacement(
    original,
    new RegExp(`\`v${escapedOld}\``, 'g'),
    `\`v${newVersion}\``,
    'docs/ja/README.md badge',
    jaReadmePath
  );
  pendingWrites.set(jaReadmePath, updated);
}

// Commit all validated file writes atomically
for (const [targetFile, content] of pendingWrites.entries()) {
  writeAtomic(targetFile, content);
}

console.log(`Successfully bumped all files to ${newVersion}`);
