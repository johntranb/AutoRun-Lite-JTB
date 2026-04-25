# ⚡ JTB AutoRun Lite (v1.0.1)

**A Premium AI Assistant Accelerator by JTB**

JTB AutoRun Lite is a high-performance, lightweight VS Code extension designed to eliminate the manual friction of interacting with AI agents like Antigravity. It automatically detects and approves standard "Run", "Accept", and "Proceed" prompts, allowing for a truly autonomous coding experience.

---

## 🚀 Key Features

- **Zero-Latency Execution**: Near-instant button detection using CDP (Chrome DevTools Protocol).
- **Intelligent Filtering**: Prevents false-positive clicks in editors, terminals, or chat logs.
- **Ultra-Lightweight**: Only monitors port 9222, minimizing CPU and memory impact.
- **Universal Mode**: Works across all workspaces automatically.
- **Safety First**: Only targets safe action buttons; avoids critical file-permission bypasses unless supervised.

## 🛠️ Installation Guide

### 1. Enable Debugging Port (Required)
For the extension to communicate with the IDE, you must start VS Code with the debugging port enabled:
- Right-click your **VS Code Shortcut**.
- Go to **Properties**.
- In the **Target** field, add the following flag at the very end:
  ` --remote-debugging-port=9222`
- **Restart VS Code** using this shortcut.

### 2. Install VSIX
- Open VS Code.
- Go to the **Extensions** view (`Ctrl+Shift+X`).
- Click the **`...`** (View More) at the top right.
- Select **Install from VSIX...**.
- Choose `jtb-autorun-lite-1.0.1.vsix`.

## ⚙️ Capabilities & Limitations

### ✅ What it can do:
- **Auto-Approve AI Prompts:** Instantly clicks "Run", "Accept", "Continue", and "Proceed" buttons.
- **High Speed & Low Lag:** Uses CDP for sub-0.5s response times without taxing your CPU.
- **Intelligent Filtering:** Specifically ignores text in code editors, chat logs, and terminals to prevent misclicks.
- **Universal Compatibility:** Once installed, it works across all your VS Code projects.

### ❌ What it cannot do (by design):
- **Requires Debug Port:** It will not function if VS Code is launched without the `--remote-debugging-port=9222` flag.
- **VS Code Bound:** The extension stops when VS Code is closed. Keep it open (minimized is fine).
- **Native OS Access:** It cannot click OS-level system menus or native VS Code "File/Save" menus.
- **Security Check:** It does **NOT** auto-click "Allow" for risky external file system access to protect your data from accidental loss.

## ⚙️ How it works

Once installed, check the status bar (bottom right). You will see **⚡ AutoRun: ON**.
- The extension listens on `localhost:9222`.
- When an AI agent presents a button with keywords like `Run` or `Accept`, the extension triggers a native pointer event to click it on your behalf.
- To pause the extension, simply click the status bar item.

## 🛡️ Security Note

This tool is designed for trusted local environments. It strictly interacts via local loopback. Do not use on public machines with debugging ports open to external networks.

---
**Created with ❤️ by JTB**
