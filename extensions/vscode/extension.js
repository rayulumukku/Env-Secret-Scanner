/**
 * @file extension.js
 * @description SecretShield VS Code Extension Foundation
 * Zero-cloud, privacy-first real-time secret scanner for VS Code.
 * 
 * JSDoc typing used throughout. Pure JavaScript, 100% offline.
 */

import { scanSync, scanText, createFingerprint } from '../../packages/scanner/index.js';
import { meetsThreshold, DEFAULT_CONFIG } from '../../packages/config/index.js';

/**
 * @typedef {Object} Finding
 * @property {string} ruleId
 * @property {string} ruleName
 * @property {string} [category]
 * @property {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'} severity
 * @property {number} confidence
 * @property {number} [line]
 * @property {number} [column]
 * @property {number} [endLine]
 * @property {number} [endColumn]
 * @property {string} maskedValue
 * @property {number} [entropy]
 * @property {string} [description]
 * @property {string} [remediationGuidance]
 * @property {string} [fingerprint]
 */

/**
 * Maps SecretShield severity string to VS Code DiagnosticSeverity integer.
 * @param {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|string} severity 
 * @param {any} vscodeApi 
 * @returns {number}
 */
export function mapSeverityToVsCode(severity, vscodeApi) {
  const s = String(severity || '').toUpperCase();
  if (!vscodeApi || !vscodeApi.DiagnosticSeverity) {
    if (s === 'CRITICAL' || s === 'HIGH') return 0; // Error
    if (s === 'MEDIUM') return 1; // Warning
    return 2; // Information
  }
  
  switch (s) {
    case 'CRITICAL':
    case 'HIGH':
      return vscodeApi.DiagnosticSeverity.Error;
    case 'MEDIUM':
      return vscodeApi.DiagnosticSeverity.Warning;
    case 'LOW':
    default:
      return vscodeApi.DiagnosticSeverity.Information;
  }
}

/**
 * Creates a VS Code Diagnostic object from a SecretShield finding.
 * @param {Finding} finding 
 * @param {any} document 
 * @param {any} vscodeApi 
 * @returns {any} VS Code Diagnostic
 */
export function createDiagnosticFromFinding(finding, document, vscodeApi) {
  const line = Math.max(0, (finding.line || 1) - 1);
  const col = Math.max(0, (finding.column || 1) - 1);
  const endLine = Math.max(line, (finding.endLine || finding.line || 1) - 1);
  const endCol = Math.max(col + 1, (finding.endColumn || col + (finding.maskedValue?.length || 10)));

  const range = vscodeApi?.Range 
    ? new vscodeApi.Range(line, col, endLine, endCol)
    : { start: { line, character: col }, end: { line: endLine, character: endCol } };

  const message = `[${finding.severity}] ${finding.ruleName || finding.ruleId}: Exposed secret detected (${finding.maskedValue})`;
  const diagSeverity = mapSeverityToVsCode(finding.severity, vscodeApi);

  const diagnostic = vscodeApi?.Diagnostic
    ? new vscodeApi.Diagnostic(range, message, diagSeverity)
    : { range, message, severity: diagSeverity };

  diagnostic.source = 'SecretShield';
  diagnostic.code = {
    value: finding.ruleId,
    target: vscodeApi?.Uri?.parse?.(`https://secretshield.dev/rules#${finding.ruleId}`) || `https://secretshield.dev/rules#${finding.ruleId}`
  };

  return diagnostic;
}

/**
 * Creates Markdown content for VS Code Hover Provider.
 * @param {Finding} finding 
 * @returns {string} Markdown text
 */
export function createHoverMarkdown(finding) {
  const sevEmoji = finding.severity === 'CRITICAL' ? '🔴' : finding.severity === 'HIGH' ? '🟠' : finding.severity === 'MEDIUM' ? '🟡' : '🔵';
  
  return [
    `### 🛡️ SecretShield: ${finding.ruleName || finding.ruleId}`,
    `**Severity:** ${sevEmoji} \`${finding.severity}\` &nbsp;|&nbsp; **Confidence:** \`${Math.round((finding.confidence || 1) * 100)}%\``,
    ``,
    `> **Masked Credential:** \`${finding.maskedValue}\``,
    finding.entropy ? `> **Shannon Entropy:** \`${finding.entropy.toFixed(2)}\`` : '',
    ``,
    finding.description ? `**Description:** ${finding.description}` : '',
    ``,
    finding.remediationGuidance ? `**Remediation Steps:**\n${finding.remediationGuidance}` : '',
    ``,
    `---`,
    `🔒 *Scanned 100% locally by SecretShield. No code is transmitted.*`
  ].filter(Boolean).join('\n');
}

/**
 * Tree item representing a file or finding in the sidebar.
 */
export class SecretShieldTreeItem {
  /**
   * @param {string} label 
   * @param {number} collapsibleState 0: None, 1: Collapsed, 2: Expanded
   * @param {Object} [options]
   */
  constructor(label, collapsibleState, options = {}) {
    this.label = label;
    this.collapsibleState = collapsibleState;
    this.contextValue = options.contextValue || 'finding';
    this.iconPath = options.iconPath;
    this.description = options.description;
    this.tooltip = options.tooltip;
    this.command = options.command;
    this.finding = options.finding;
    this.filePath = options.filePath;
  }
}

/**
 * TreeDataProvider for SecretShield Findings Sidebar View.
 */
export class SecretShieldTreeDataProvider {
  /**
   * @param {any} [vscodeApi]
   */
  constructor(vscodeApi = null) {
    this.vscode = vscodeApi;
    /** @type {Map<string, Finding[]>} */
    this.findingsByFile = new Map();
    /** @type {Array<Function>} */
    this._listeners = [];
  }

  /**
   * Event emitter for tree data changes.
   * @param {Function} listener 
   */
  onDidChangeTreeData(listener) {
    this._listeners.push(listener);
    return {
      dispose: () => {
        const idx = this._listeners.indexOf(listener);
        if (idx !== -1) this._listeners.splice(idx, 1);
      }
    };
  }

  refresh() {
    for (const listener of this._listeners) {
      listener();
    }
  }

  /**
   * Sets findings for a specific file.
   * @param {string} filePath 
   * @param {Finding[]} findings 
   */
  setFileFindings(filePath, findings) {
    if (!findings || findings.length === 0) {
      this.findingsByFile.delete(filePath);
    } else {
      this.findingsByFile.set(filePath, findings);
    }
    this.refresh();
  }

  /**
   * Clears all findings.
   */
  clear() {
    this.findingsByFile.clear();
    this.refresh();
  }

  /**
   * Total number of findings.
   * @returns {number}
   */
  get totalFindings() {
    let count = 0;
    for (const findings of this.findingsByFile.values()) {
      count += findings.length;
    }
    return count;
  }

  /**
   * @param {SecretShieldTreeItem} element 
   * @returns {SecretShieldTreeItem}
   */
  getTreeItem(element) {
    return element;
  }

  /**
   * @param {SecretShieldTreeItem} [element] 
   * @returns {SecretShieldTreeItem[]}
   */
  getChildren(element) {
    if (!element) {
      // Root level: list of files with findings
      const items = [];
      for (const [filePath, findings] of this.findingsByFile.entries()) {
        const filename = filePath.split(/[\/\\]/).pop() || filePath;
        const highestSeverity = findings.some(f => f.severity === 'CRITICAL') ? 'CRITICAL'
          : findings.some(f => f.severity === 'HIGH') ? 'HIGH'
          : findings.some(f => f.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW';

        const item = new SecretShieldTreeItem(
          filename,
          this.vscode?.TreeItemCollapsibleState?.Expanded ?? 2,
          {
            contextValue: 'file',
            description: `${findings.length} secret${findings.length === 1 ? '' : 's'} (${highestSeverity})`,
            tooltip: `${filePath} (${findings.length} findings)`,
            filePath
          }
        );
        items.push(item);
      }
      return items;
    }

    if (element.contextValue === 'file' && element.filePath) {
      // Child level: list of findings in file
      const findings = this.findingsByFile.get(element.filePath) || [];
      return findings.map((f, idx) => {
        const line = f.line || 1;
        const col = f.column || 1;
        const label = `Line ${line}: ${f.ruleName || f.ruleId}`;
        
        return new SecretShieldTreeItem(
          label,
          this.vscode?.TreeItemCollapsibleState?.None ?? 0,
          {
            contextValue: 'finding',
            description: `[${f.severity}] ${f.maskedValue}`,
            tooltip: `${f.ruleName || f.ruleId}\nMasked: ${f.maskedValue}\nRemediation: ${f.remediationGuidance || 'Review credential'}`,
            finding: f,
            filePath: element.filePath,
            command: {
              command: 'vscode.open',
              title: 'Open Secret Location',
              arguments: [
                this.vscode?.Uri?.file?.(element.filePath) || element.filePath,
                {
                  selection: this.vscode?.Range 
                    ? new this.vscode.Range(line - 1, col - 1, line - 1, col + 10)
                    : { start: { line: line - 1, character: col - 1 }, end: { line: line - 1, character: col + 10 } }
                }
              ]
            }
          }
        );
      });
    }

    return [];
  }
}

/**
 * Scans a single document's text and updates diagnostics and tree provider.
 * @param {any} document 
 * @param {any} diagnosticCollection 
 * @param {SecretShieldTreeDataProvider} treeDataProvider 
 * @param {Object} [config] 
 * @param {any} [vscodeApi]
 * @returns {Finding[]}
 */
export function scanDocument(document, diagnosticCollection, treeDataProvider, config = DEFAULT_CONFIG, vscodeApi = null) {
  if (!document) return [];
  const text = typeof document.getText === 'function' ? document.getText() : String(document.content || '');
  const filePath = document.fileName || document.uri?.fsPath || 'untitled';

  // Check file size threshold
  const maxBytes = config.maxFileSize || 5242880;
  if (Buffer.byteLength(text, 'utf8') > maxBytes) {
    return [];
  }

  // Synchronous scan
  const scanResult = scanSync({
    files: [{ name: filePath, content: text }],
    customRules: config.customRules || []
  });

  const rawFindings = scanResult.findings || [];

  // Filter according to severity threshold
  const threshold = config.severityThreshold || 'LOW';
  const findings = rawFindings.filter(f => meetsThreshold(f.severity, threshold));

  // Map to VS Code diagnostics
  if (diagnosticCollection && document.uri) {
    const diagnostics = findings.map(f => createDiagnosticFromFinding(f, document, vscodeApi));
    diagnosticCollection.set(document.uri, diagnostics);
  }

  // Update tree provider
  if (treeDataProvider) {
    treeDataProvider.setFileFindings(filePath, findings);
  }

  return findings;
}

/**
 * Extension activation entry point called by VS Code runtime.
 * @param {any} context 
 */
export async function activate(context) {
  let vscode;
  try {
    vscode = await import('vscode');
  } catch {
    // Standalone or test environment
    return { isVsCode: false };
  }

  const diagnosticCollection = vscode.languages.createDiagnosticCollection('secretshield');
  const treeDataProvider = new SecretShieldTreeDataProvider(vscode);
  
  context.subscriptions.push(diagnosticCollection);

  // Register Tree View in Activity Bar
  const treeView = vscode.window.registerTreeDataProvider('secretshield-findings-view', treeDataProvider);
  context.subscriptions.push(treeView);

  // Helper to get active configuration
  const getConfig = () => {
    const wsConfig = vscode.workspace.getConfiguration('secretshield');
    return {
      enabled: wsConfig.get('enabled', true),
      scanOnSave: wsConfig.get('scanOnSave', true),
      scanOnChange: wsConfig.get('scanOnChange', false),
      severityThreshold: wsConfig.get('severityThreshold', 'LOW'),
      maxFileSize: wsConfig.get('maxFileSize', 5242880)
    };
  };

  // Register Commands
  const scanCurrentFileCmd = vscode.commands.registerCommand('secretshield.scanFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage('SecretShield: No active document to scan.');
      return;
    }
    const findings = scanDocument(editor.document, diagnosticCollection, treeDataProvider, getConfig(), vscode);
    if (findings.length === 0) {
      vscode.window.showInformationMessage('🛡️ SecretShield: No secrets found in file. Safe!');
    } else {
      vscode.window.showWarningMessage(`🛡️ SecretShield detected ${findings.length} secret(s) in current file!`);
    }
  });

  const scanWorkspaceCmd = vscode.commands.registerCommand('secretshield.scanWorkspace', async () => {
    const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
    let totalCount = 0;
    
    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: 'SecretShield: Scanning workspace for secrets...',
      cancellable: false
    }, async (progress) => {
      const step = 100 / Math.max(1, files.length);
      for (const fileUri of files) {
        try {
          const doc = await vscode.workspace.openTextDocument(fileUri);
          const findings = scanDocument(doc, diagnosticCollection, treeDataProvider, getConfig(), vscode);
          totalCount += findings.length;
        } catch {}
        progress.report({ increment: step });
      }
    });

    if (totalCount === 0) {
      vscode.window.showInformationMessage('🛡️ SecretShield: Workspace scan complete. No secrets found!');
    } else {
      vscode.window.showWarningMessage(`🛡️ SecretShield: Found ${totalCount} secret(s) across workspace.`);
    }
  });

  const showFindingsCmd = vscode.commands.registerCommand('secretshield.showFindings', () => {
    vscode.commands.executeCommand('secretshield-findings-view.focus');
  });

  const clearDiagnosticsCmd = vscode.commands.registerCommand('secretshield.clearDiagnostics', () => {
    diagnosticCollection.clear();
    treeDataProvider.clear();
    vscode.window.showInformationMessage('SecretShield: Cleared all findings.');
  });

  context.subscriptions.push(scanCurrentFileCmd, scanWorkspaceCmd, showFindingsCmd, clearDiagnosticsCmd);

  // Register Hover Provider
  const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file' }, {
    provideHover(document, position) {
      const filePath = document.fileName || document.uri.fsPath;
      const fileFindings = treeDataProvider.findingsByFile.get(filePath) || [];
      const lineNum = position.line + 1;

      const matchingFinding = fileFindings.find(f => f.line === lineNum);
      if (matchingFinding) {
        const md = new vscode.MarkdownString(createHoverMarkdown(matchingFinding));
        md.isTrusted = true;
        return new vscode.Hover(md);
      }
      return null;
    }
  });
  context.subscriptions.push(hoverProvider);

  // Event Listeners
  if (vscode.workspace.onDidSaveTextDocument) {
    context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        const cfg = getConfig();
        if (cfg.enabled && cfg.scanOnSave) {
          scanDocument(doc, diagnosticCollection, treeDataProvider, cfg, vscode);
        }
      })
    );
  }

  // Scan currently open editor upon activation
  if (vscode.window.activeTextEditor) {
    const cfg = getConfig();
    if (cfg.enabled) {
      scanDocument(vscode.window.activeTextEditor.document, diagnosticCollection, treeDataProvider, cfg, vscode);
    }
  }

  return {
    diagnosticCollection,
    treeDataProvider,
    scanDocument: (doc) => scanDocument(doc, diagnosticCollection, treeDataProvider, getConfig(), vscode)
  };
}

/**
 * Extension deactivation.
 */
export function deactivate() {}
