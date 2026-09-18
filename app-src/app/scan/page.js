'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useCustomRules } from '@/lib/hooks/useCustomRules';
import { useAllowlist } from '@/lib/hooks/useCustomRules';
import { useScanHistory } from '@/lib/hooks/useScanHistory';
import { DEMO_FILES } from '@/lib/scanner/demo-data';
import {
  Zap, Upload, Code2, FileCode, X, Play, RotateCcw,
  FlaskConical, ChevronRight, Folder, Plus, Loader2,
  Shield, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 500 * 1024; // 500KB
const ALLOWED_EXTENSIONS = /\.(js|jsx|ts|tsx|mjs|cjs|py|rb|php|java|go|rs|cs|cpp|c|h|env|json|yaml|yml|toml|ini|cfg|conf|config|sh|bash|zsh|ps1|bat|tf|tfvars|xml|properties|sql|txt|md|Dockerfile)$/i;

export default function ScanPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { rules: customRules } = useCustomRules();
  const { allowlist } = useAllowlist();
  const { addToHistory } = useScanHistory();

  const [files, setFiles] = useState([]); // [{name, content, size}]
  const [pasteContent, setPasteContent] = useState('');
  const [pasteFilename, setPasteFilename] = useState('pasted-code.js');
  const [isScanning, setIsScanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState('paste');

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // --- File handling ---
  const addFile = useCallback((name, content) => {
    if (content.length > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: `${name} exceeds 500KB limit.`, variant: 'destructive' });
      return;
    }
    setFiles(prev => {
      if (prev.find(f => f.name === name)) return prev;
      return [...prev, { name, content, size: content.length }];
    });
  }, [toast]);

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const handleFileInput = (e) => {
    const picked = Array.from(e.target.files || []);
    picked.forEach(file => {
      if (!ALLOWED_EXTENSIONS.test(file.name) && !['Dockerfile', 'Makefile', 'Procfile'].includes(file.name)) {
        toast({ title: 'Unsupported file type', description: `${file.name} is not a supported file type.` });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => addFile(file.name, ev.target.result);
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const items = Array.from(e.dataTransfer.files);
    items.forEach(file => {
      if (!ALLOWED_EXTENSIONS.test(file.name) && !['Dockerfile', 'Makefile'].includes(file.name)) return;
      const reader = new FileReader();
      reader.onload = (ev) => addFile(file.name, ev.target.result);
      reader.readAsText(file);
    });
  }, [addFile]);

  // --- Demo mode ---
  const loadDemo = () => {
    setIsDemo(true);
    setFiles(DEMO_FILES.map(f => ({ ...f, size: f.content.length })));
    setActiveTab('files');
    toast({ title: '⚠ Demo mode loaded', description: '5 files with fake credentials ready to scan.' });
  };

  const clearAll = () => {
    setFiles([]);
    setPasteContent('');
    setIsDemo(false);
    setActiveTab('paste');
  };

  // --- Scan ---
  const startScan = async () => {
    const filesToScan = [];

    // Add pasted content
    if (activeTab === 'paste' && pasteContent.trim()) {
      filesToScan.push({ name: pasteFilename || 'pasted-code.js', content: pasteContent });
    }

    // Add uploaded files
    filesToScan.push(...files);

    if (filesToScan.length === 0) {
      toast({ title: 'Nothing to scan', description: 'Paste code or upload files first.', variant: 'destructive' });
      return;
    }

    setIsScanning(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesToScan,
          customRules: customRules.filter(r => r.enabled),
          allowlistFingerprints: allowlist.fingerprints || [],
          allowlistFiles: allowlist.files || [],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Scan failed' }));
        throw new Error(err.error || 'Scan failed');
      }

      const result = await response.json();

      // Save to history (masked values only)
      addToHistory(result, filesToScan.map(f => f.name));

      // Store result for results page (masked values only — no raw content)
      const safeResult = {
        ...result,
        isDemo,
        scannedFileNames: filesToScan.map(f => f.name),
      };
      sessionStorage.setItem('secretshield_last_scan', JSON.stringify(safeResult));

      router.push('/results');
    } catch (err) {
      toast({
        title: 'Scan failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const totalFiles = files.length + (activeTab === 'paste' && pasteContent.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">Secret Scanner</h1>
            {isDemo && (
              <Badge variant="outline" className="border-amber-800/50 text-amber-400 bg-amber-950/30 text-xs">
                ⚠ Demo Mode
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Paste code or upload files to detect exposed API keys, tokens, and credentials.
          </p>
        </div>

        {/* Input area */}
        <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden mb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between px-4 pt-4 border-b border-border/50 pb-0">
              <TabsList className="bg-transparent gap-1 h-auto p-0">
                <TabsTrigger
                  value="paste"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary border-transparent text-sm px-3 py-2"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1.5" />
                  Paste Code
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-md rounded-b-none border-b-2 data-[state=active]:border-primary border-transparent text-sm px-3 py-2"
                >
                  <FileCode className="w-3.5 h-3.5 mr-1.5" />
                  Upload Files
                  {files.length > 0 && (
                    <span className="ml-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {files.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Paste tab */}
            <TabsContent value="paste" className="m-0">
              <div className="p-1">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-secondary/30">
                  <FileCode className="w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={pasteFilename}
                    onChange={e => setPasteFilename(e.target.value)}
                    className="bg-transparent text-xs font-mono text-muted-foreground outline-none flex-1 min-w-0"
                    placeholder="filename.js"
                    aria-label="Filename for pasted code"
                  />
                </div>
                <textarea
                  id="code-input"
                  value={pasteContent}
                  onChange={e => setPasteContent(e.target.value)}
                  placeholder={`Paste your source code here…\n\nExample:\nconst API_KEY = "sk-proj-...";\nconst AWS_KEY = "AKIA...";`}
                  className="code-editor w-full h-72 p-4 resize-none outline-none bg-transparent"
                  spellCheck={false}
                  aria-label="Source code input"
                />
              </div>
            </TabsContent>

            {/* Files tab */}
            <TabsContent value="files" className="m-0">
              {/* Drop zone */}
              <div
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  'border-2 border-dashed rounded-lg m-4 p-8 text-center transition-colors cursor-pointer',
                  isDragOver
                    ? 'border-primary/60 bg-primary/5'
                    : 'border-border/40 hover:border-border/70'
                )}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Drop files or click to upload"
              >
                <Upload className={cn('w-8 h-8 mx-auto mb-3', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
                <p className="text-sm font-medium text-foreground mb-1">
                  Drop files here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  JS, TS, Python, Ruby, PHP, Go, YAML, JSON, .env and more · 500KB max per file
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                  aria-label="File upload input"
                />
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="px-4 pb-4 space-y-1.5">
                  {files.map(file => (
                    <div
                      key={file.name}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/30 group"
                    >
                      <FileCode className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-mono text-foreground/80 flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)}KB
                      </span>
                      <button
                        onClick={() => removeFile(file.name)}
                        className="text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {files.length === 0 && (
                <div className="px-4 pb-4 text-center text-xs text-muted-foreground">
                  No files added yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Action bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Scan button */}
          <Button
            id="start-scan-btn"
            onClick={startScan}
            disabled={isScanning || totalFiles === 0}
            className="gap-2 font-bold sm:flex-1 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 h-11"
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning{totalFiles > 0 ? ` ${totalFiles} file${totalFiles > 1 ? 's' : ''}` : ''}…
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {totalFiles > 0
                  ? `Scan ${totalFiles} File${totalFiles > 1 ? 's' : ''}`
                  : 'Scan Code'}
              </>
            )}
          </Button>

          {/* Demo */}
          <Button
            id="load-demo-btn"
            variant="outline"
            onClick={loadDemo}
            disabled={isScanning}
            className="gap-2 border-border/60 text-muted-foreground hover:text-foreground h-11"
          >
            <FlaskConical className="w-4 h-4" />
            Load Demo
          </Button>

          {/* Clear */}
          {(totalFiles > 0 || pasteContent) && (
            <Button
              id="clear-btn"
              variant="ghost"
              onClick={clearAll}
              disabled={isScanning}
              className="gap-2 text-muted-foreground hover:text-foreground h-11"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Scanning state */}
        {isScanning && (
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="font-medium text-sm">Running detection rules…</span>
            </div>
            <div className="space-y-2">
              {['AWS credentials', 'GitHub tokens', 'OpenAI keys', 'Stripe keys', 'Private keys', 'Database URLs'].map((rule, i) => (
                <Skeleton key={i} className="h-2 rounded" style={{ width: `${60 + i * 6}%`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {!isScanning && totalFiles === 0 && (
          <div className="mt-8 grid sm:grid-cols-3 gap-3">
            {[
              { icon: FlaskConical, text: 'Load the demo to see findings with fake credentials instantly' },
              { icon: Upload, text: 'Upload .env, config files, and source code for a real scan' },
              { icon: Shield, text: 'Results show masked secrets — raw values are never exposed' },
            ].map((tip, i) => {
              const Icon = tip.icon;
              return (
                <div key={i} className="flex gap-2.5 rounded-lg border border-border/30 bg-card/30 p-3">
                  <Icon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.text}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
