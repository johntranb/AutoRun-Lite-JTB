const vscode = require('vscode');
const http = require('http');
const WebSocket = require('ws');

// Cổng mạng duy nhất chúng ta quét
const PORT = 9222;

let isEnabled = false;
let statusBarItem;
let wsConnection = null;

// Đoạn script an toàn injection vào Webview của VS Code
const INJECTION_SCRIPT = `
(function() {
    // Chỉ hoạt động trên Webview của Agent (tránh quét Editor/Terminal)
    const isAgentUI = document.querySelector('.antigravity-agent-side-panel, [class*="agent"], .react-app-container');
    if (!isAgentUI) return 'ignore';

    const safeKeywords = ['run', 'accept', 'continue', 'proceed', 'esegui', 'accetta'];

    function isSafeButton(node) {
        const tag = (node.tagName || '').toLowerCase();
        return tag === 'button' || node.getAttribute('role') === 'button';
    }

    function checkAndClick(root) {
        // Loại bỏ các khu vực lõi của VS Code
        if (root.closest && (root.closest('.monaco-editor') || root.closest('.terminal-container'))) {
            return false;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        let node;
        let clicked = false;

        while ((node = walker.nextNode())) {
            // Đệ quy chui vào Shadow DOM
            if (node.shadowRoot) {
                if(checkAndClick(node.shadowRoot)) return true;
            }

            if (isSafeButton(node)) {
                // Chỉ lấy text trực tiếp, không lấy text rác
                const text = (node.textContent || '').trim().toLowerCase();
                
                if (safeKeywords.includes(text)) {
                    // Kiểm tra xem nút có hiểm thị thật không (height & width > 0)
                    const rect = node.getBoundingClientRect();
                    if (rect.width > 0 && rect.height > 0) {
                        try {
                            const cx = rect.left + rect.width / 2;
                            const cy = rect.top + rect.height / 2;
                            const opts = { bubbles: true, cancelable: true, composed: true, clientX: cx, clientY: cy, button: 0 };
                            
                            // Phát tín hiệu chuột đầy đủ để bypass React Synthetic Events
                            node.dispatchEvent(new PointerEvent('pointerdown', opts));
                            node.dispatchEvent(new MouseEvent('mousedown', opts));
                            node.click(); // Standard click

                            return true;
                        } catch(e) {}
                    }
                }
            }
        }
        return false;
    }

    return checkAndClick(document.body) ? 'clicked' : 'waiting';
})();
`;

async function fetchCDPWebviews() {
    return new Promise((resolve) => {
        http.get({ hostname: '127.0.0.1', port: PORT, path: '/json/list', timeout: 500 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const pages = JSON.parse(data).filter(p => p.webSocketDebuggerUrl);
                    resolve(pages);
                } catch(e) { resolve([]); }
            });
        }).on('error', () => resolve([])).on('timeout', () => resolve([]));
    });
}

async function evalInWebview(wsUrl, script) {
    return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        let resolved = false;

        const timeout = setTimeout(() => {
            if(!resolved) { resolved = true; ws.close(); resolve(null); }
        }, 1000);

        ws.on('open', () => {
            ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: script } }));
        });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if(msg.id === 1) {
                    resolved = true;
                    clearTimeout(timeout);
                    ws.close();
                    resolve(msg.result?.result?.value);
                }
            } catch(e) {}
        });

        ws.on('error', () => { if(!resolved) { resolved = true; clearTimeout(timeout); ws.close(); resolve(null); } });
    });
}

async function runAutoAcceptLoop() {
    if (!isEnabled) return;
    
    try {
        const pages = await fetchCDPWebviews();
        let tookAction = false;
        
        for (const page of pages) {
            const result = await evalInWebview(page.webSocketDebuggerUrl, INJECTION_SCRIPT);
            if (result === 'clicked') {
                tookAction = true;
            }
        }

        // Tối ưu vòng lặp: Nếu vừa bấm xong thì nghỉ 2 giây chờ UI render.
        // Ngược lại nếu chưa làm gì, quẹt mỗi 0.5s để bắt sự kiện.
        setTimeout(runAutoAcceptLoop, tookAction ? 2000 : 500);

    } catch (error) {
        // Đứt mạng thì chờ 3s mới thử lại
        setTimeout(runAutoAcceptLoop, 3000);
    }
}

function updateStatusBar() {
    if (isEnabled) {
        statusBarItem.text = '$(zap) AutoRun: ON';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
        statusBarItem.text = '$(circle-slash) AutoRun: OFF';
        statusBarItem.backgroundColor = undefined;
    }
}

function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'agautorunlite.toggle';
    context.subscriptions.push(statusBarItem);
    
    isEnabled = true; // Default to ON
    updateStatusBar();
    statusBarItem.show();
    vscode.window.showInformationMessage('JTB AutoRun Lite has been activated successfully!');
    runAutoAcceptLoop();

    let disposable = vscode.commands.registerCommand('agautorunlite.toggle', () => {
        isEnabled = !isEnabled;
        updateStatusBar();
        if (isEnabled) {
            runAutoAcceptLoop();
        }
    });

    context.subscriptions.push(disposable);
}

function deactivate() {
    isEnabled = false;
}

module.exports = {
    activate,
    deactivate
};
