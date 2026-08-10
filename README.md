# ⚡ InMem Scratchpad

<div align="center">

<img src="src/assets/icon.png" width="128" height="128" alt="InMem Scratchpad Icon" />

### Ultra-Fast, Pure In-Memory Scratchpad Memo Application
**Instantly launchable and installable via npm / npx across Windows, macOS, and Linux**

[![npm version](https://img.shields.io/npm/v/inmem-memo.svg?style=flat-square&color=cb3837)](https://www.npmjs.com/package/inmem-memo)
[![Framework: Tauri v2](https://img.shields.io/badge/Framework-Tauri%20v2.0-6366f1.svg?style=flat-square&logo=tauri&logoColor=white)](https://v2.tauri.app/)
[![Frontend: React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite%205-61dafb.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Storage: In-Memory Only](https://img.shields.io/badge/Storage-In--Memory%20Only-f59e0b.svg?style=flat-square)](https://github.com/)
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

InMem Scratchpad eliminates traditional note management overhead—such as title editing, file naming, folder hierarchies, and disk indexing—in favor of **instant startup speed, pure in-memory security, and ultra-low resource usage** powered by **Tauri v2 + Rust**.

---

## 🌟 Key Features

### 1. 🛡️ Pure In-Memory Security Policy
- **Zero Disk Persistence for Memo Text**: Note text is kept purely in RAM. It is never written to disk, databases, or `localStorage`.
- **Complete Erasure on Process Exit**: Terminating the application (via "Quit App" in settings or tray menu) immediately releases all allocated memory back to the OS.
- **Unload Guard**: Built-in confirmation prompt to prevent accidental data loss while typing.

### 2. ⚡ Right Quick-Action Toolbar (JSON Format & Regex Replacements)
- **Built-in JSON Formatter**:
  - Permanently pinned at the top. Instantly prettifies unformatted JSON payloads with clean 2-space indentation.
- **Custom Regular Expression Actions**:
  - Add, edit, test, and save frequently used regex replacement rules via the Settings modal.
  - **Live Preview Testing**: Interactive sandbox inside the Settings modal to verify pattern replacements in real time.
  - **One-Click Presets**:
    - "Clean Empty Lines" (`^\s*$\n` ➔ `""`)
    - "Trim Trailing Spaces" (`[ \t]+$` ➔ `""`)
    - "Comma to Newlines" (`,\s*` ➔ `\n`)
    - "Strip HTML Tags" (`<[^>]+>` ➔ `""`)
    - "Collapse Multiple Spaces" (`[ \t]+` ➔ `" "`)

### 3. ↩️ Full `Ctrl + Z` (Undo) & `Ctrl + Y` (Redo) History Stack
- Even after executing batch transformations (JSON formatting or regex replacements), pressing **`Ctrl + Z` (Mac: `Cmd + Z`)** instantly restores the exact previous text state.
- Redo anytime using **`Ctrl + Y`** or **`Ctrl + Shift + Z` (Mac: `Cmd + Shift + Z`)**.
- Visual Undo/Redo icon buttons located directly in the header bar.

### 4. ⌨️ Global Shortcut & System Tray Residency
- **Background Tray Standby**: Clicking the window close button (`×`) minimizes the app directly to the system tray (Windows) or menu bar (macOS).
- **Instant Hotkey Summon**:
  - Press the global hotkey from any active window (IDE, browser, terminal) to instantly toggle the scratchpad on top of your screen.
  - Default: `Ctrl + Shift + M` (Mac: `Cmd + Shift + M`).
  - Customizable in Settings with an interactive key recorder.

### 5. ⚙️ Local Settings Persistence & Complete App Exit
- While memo text remains strictly in-memory, your **user preferences are safely persisted to `localStorage`**:
  - Global shortcut key
  - Custom regex action library
  - Theme choice (Midnight Dark / OLED Pure Black)
  - Editor preferences (Font size, Tab width, Word wrap)
- **Complete Application Exit**:
  - Easily terminate the background tray process and completely free memory with the "Quit App" button in Settings.

### 6. 🎨 Modern Dark Glassmorphism UI & Markdown Preview
- **Aesthetic Dark Mode**: Curated color palette with fluid micro-animations.
- **Live Markdown Preview**: Toggle between raw text editing and formatted Markdown rendering with one click.
- **Live Statistics**: Status bar displaying real-time character, word, and line counts.
- **Quick Operations**: Copy all (`Copy`), export file (`Export .md`), and clear (`Clear`).

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Shift + M` (Mac: `Cmd + Shift + M`) | **Global Summon** (Toggle window visibility from anywhere) |
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
- **Frontend**: [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/) + [Lucide Icons](https://lucide.dev/)
- **Styling**: Vanilla CSS (Modern CSS Variables, Glassmorphism, Responsive Grid/Flexbox)
- **Distribution**:
  - npm: Automated platform-resolving CLI runner (`inmem-memo`)
  - GitHub Actions: Multi-platform automated builds for Windows (`.exe`), macOS (`.dmg`), and Linux (`.AppImage`)

---

## 💻 Local Development & Building from Source

```powershell
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

[MIT License](LICENSE) © 2026 InMem Scratchpad Project
