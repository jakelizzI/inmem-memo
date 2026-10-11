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
 * Validates and safely replaces content in a target file using a regular expression.
 * Writes the result atomically. Throws an error if the expected pattern is not found.
 *
 * @param {string} filePath - Absolute path to the file to modify.
 * @param {RegExp} regex - Regular expression pattern to search for.
 * @param {string} replacement - Replacement string or template.
 * @param {string} label - Human-readable label for logging and error reporting.
 * @throws {Error} If the target pattern is not found in the file content.
 */
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
  writeAtomic(filePath, updated);
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

// 1. package.json
pkg.version = newVersion;
writeAtomic(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 2. src-tauri/tauri.conf.json
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  writeAtomic(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
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
