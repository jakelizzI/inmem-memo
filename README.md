# ⚡ inmem-memo

<div align="center">

<img src="src/assets/icon.png" width="128" height="128" alt="inmem-memo Icon" />

### Ultra-Fast, Pure In-Memory Scratchpad Memo Application
**Instantly launchable and installable via npm / npx across Windows, macOS, and Linux**

[![npm version](https://img.shields.io/npm/v/inmem-memo.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/inmem-memo)
[![Framework: Tauri v2](https://img.shields.io/badge/Framework-Tauri%20v2.0-6366f1.svg?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%205-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Storage: In-Memory Only](https://img.shields.io/badge/Storage-In--Memory%20Only-f59e0b.svg?style=flat-square)](https://github.com/jakelizzI/inmem-memo)
[![License: MIT](https://img.shields.io/badge/License-MIT-10b981.svg?style=flat-square)](LICENSE)

<br />

[📖 日本語のドキュメントはこちら (Japanese README)](./docs/ja/README.md)

</div>

---

> 🤖 **Built with Vibe Coding**:  
> This entire project—from architecture and Rust/Tauri native internals to UI design, undo history stacks, and automated CI/CD release pipelines—was designed, implemented, and refined through AI-assisted **Vibe Coding** (collaborative pair programming with AI).

---

## 🚀 Quick Start (npm / npx)

No complex installation required. If you have Node.js installed, you can launch the native app instantly:

```bash
# Launch immediately without permanent installation
npx inmem-memo
```

To install as a permanent global CLI command:

```bash
# Global installation
npm install -g inmem-memo

# Launch from anywhere in your terminal
inmem-memo
```

> [!TIP]
> **🍎 macOS First-Time Launch Note**  
> If macOS Gatekeeper displays a security notice on first launch, open **System Settings ➔ Privacy & Security**, scroll down, and click **"Open Anyway"** next to `inmem-memo`. Subsequent launches will open immediately without prompts.

---

## 📖 Concept

**"Write fast, discard immediately."**

During development and daily work, we constantly need a temporary place to paste and inspect JSON payloads, perform quick regex string replacements, or jot down transient notes. 

inmem-memo eliminates traditional note management overhead—such as title editing, file naming, folder hierarchies, and disk indexing—in favor of **instant startup speed, pure in-memory security, and ultra-low resource usage** powered by **Tauri v2 + Rust**.

---

## 🌟 Key Features

### 1. 🛡️ Pure In-Memory Security Policy
- **Zero Disk Persistence for Memo Text**: Note text is kept strictly in RAM. It is never written to disk, databases, or `localStorage`.
- **Complete Erasure on Process Exit**: Terminating the application (via "Quit App" in settings or tray menu) immediately releases all allocated memory back to the OS.
- **Robust macOS & Multi-Platform Process Termination**: Guaranteed process exit via `std::process::exit(0)` ensuring full memory cleanup across Windows, macOS, and Linux.
- **Unload Guard**: Built-in confirmation prompt to prevent accidental data loss while typing.

### 2. ⚡ Right Quick-Action Toolbar (JSON Format & Regex Replacements)
- **Built-in JSON Formatter**:
  - Permanently pinned at the top. Instantly prettifies unformatted JSON payloads with clean 2-space indentation.
- **Custom Regular Expression Actions**:
  - Add, edit, test, and save frequently used regex replacement rules via the Settings modal.
  - **Interactive Regex Flags Cheat Sheet & Help Guide**: Clear explanations for `g` (global), `m` (multiline), `i` (case-insensitive), and `s` (dot-all) with one-click quick chips (`gm`, `g`, `gi`).
  - **Multiline Real-Time Testing Sandbox**: 2-pane interactive preview (input text ➔ live replacement output) with sample preset buttons to verify pattern replacements across multiple lines.
  - **One-Click Presets**:
    - "Clean Empty Lines" (`^\s*$\n` ➔ `""`)
    - "Trim Trailing Spaces" (`[ \t]+$` ➔ `""`)
    - "Comma to Newlines" (`,\s*` ➔ `\n`)
    - "Strip HTML Tags" (`<[^>]+>` ➔ `""`)
    - "Collapse Multiple Spaces" (`[ \t]+` ➔ `" "`)

### 3. 📝 Advanced Lightweight Editor (Line Numbers, Syntax Highlighting & Code Folding)
- **Line Numbers (ON / OFF Toggle)**:
  - Clean line number gutter along the left edge with active line highlighting. Toggleable anytime in Settings.
- **Custom Syntax Highlighting (Zero Bloat)**:
  - Native, ultra-light regex-based tokenization for **JSON, YAML, JavaScript, and Markdown** tailored to all 3 themes.
  - Automatic language detection with a real-time status badge (`JSON`, `YAML`, `JS`, `Markdown`, `Plain`) in the status bar.
- **Inline Code & Block Folding**:
  - Fold and expand JSON objects `{...}`, arrays `[...]`, and YAML indentation blocks directly in the editor with smooth fold indicators (▼ / ▶).
- **Tab Width & Indent Unit Configuration**:
  - Choose between 2-space and 4-space indentation with full `Tab` key insertion support.

### 4. 🎨 Modern UI & 3 Themes (Midnight / OLED / Clean Light)
- **3 Curated Color Themes**:
  - **Midnight Dark**: Deep gradient dark mode for night work.
  - **OLED Pure Black**: High-contrast, power-saving true black mode.
  - **Clean Light**: Crisp, bright light mode with soft shadows and refined readability.
- **Interactive Font Resizing**:
  - Adjust editor font size via numerical input or interactively via **`Ctrl + MouseWheel`** (Mac: `Cmd + Wheel`) with smooth silent zooming.
- **Live Markdown Preview**: Toggle between raw text editing and sanitized Markdown rendering with one click (sanitized with DOMPurify).
- **Status Bar & UI Version Display**: Real-time character, word, line count metrics, detected language badge, and bottom-left version badge (`v1.3.2`).

### 5. 📑 2-Column Sidebar Settings Modal
- Redesigned from horizontal tabs into a **macOS / VS Code style 2-column sidebar navigation** layout.
- Easily customize shortcuts, regex actions, appearance themes, font sizes, editor preferences (Line Numbers, Folding, Highlighting), and process termination in dedicated sections.

### 6. ↩️ Full `Ctrl + Z` (Undo) & `Ctrl + Y` (Redo) History Stack
- Even after executing batch transformations (JSON formatting or regex replacements), pressing **`Ctrl + Z` (Mac: `Cmd + Z`)** instantly restores the exact previous text state.
- Redo anytime using **`Ctrl + Y`** or **`Ctrl + Shift + Z` (Mac: `Cmd + Shift + Z`)**.
- Visual Undo/Redo icon buttons located directly in the header bar.

### 7. ⌨️ Global Shortcut & System Tray Residency
- **Background Tray Standby**: Clicking the window close button (`×`) minimizes the app directly to the system tray (Windows) or menu bar (macOS).
- **Instant Hotkey Summon**:
  - Press the global hotkey from any active window (IDE, browser, terminal) to instantly toggle the scratchpad on top of your screen.
  - Default: `Ctrl + Shift + M` (Mac: `Cmd + Shift + M`).
  - Customizable in Settings with an interactive key recorder.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Shift + M` (Mac: `Cmd + Shift + M`) | **Global Summon** (Toggle window visibility from anywhere) |
| `Ctrl + MouseWheel` (Mac: `Cmd + Wheel`) | **Interactive Font Resize** (Zoom editor text seamlessly) |
| `Ctrl + Z` (Mac: `Cmd + Z`) | **Undo** (Revert text changes, JSON formatting, or regex replacements) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | **Redo** (Re-apply reverted changes) |
| `Tab` | Insert indentation (2 or 4 spaces) |
| Close (`×`) / Tray Click | Minimize to system tray (Memo text preserved in RAM) |

---

## 🏗️ Architecture & Tech Stack

- **Core Backend**: [Tauri v2 (2.0)](https://v2.tauri.app/) (Rust)
  - `tauri-plugin-global-shortcut`: System-wide hotkey listener
  - `tray-icon`: System tray / menu bar residency
  - `include_image!`: Native embedded icon binaries
- **Frontend**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [Lucide Icons](https://lucide.dev/) + [DOMPurify](https://github.com/cure53/DOMPurify)
- **Styling**: Vanilla CSS (Modern CSS Variables, Glassmorphism, Responsive Grid/Flexbox)
- **Distribution**:
  - npm: Automated platform-resolving CLI runner (`inmem-memo`) with Sigstore Provenance
  - GitHub Actions: Multi-platform automated builds for Windows (`.exe`, `.msi`), macOS (`.dmg`), and Linux (`.AppImage`, `.deb`, `.rpm`)

---

## 💻 Local Development & Building from Source

```powershell
# Clone repository
git clone https://github.com/jakelizzI/inmem-memo.git
cd inmem-memo

# Install frontend dependencies
npm install

# Start Vite dev server for browser preview
npm run dev

# Launch native desktop app in local development mode
npm run tauri dev

# Build production bundle and standalone binaries
npm run tauri build
```

---

## 📄 License

[MIT License](LICENSE) © 2026 [jakelizzI](https://github.com/jakelizzI/inmem-memo)
