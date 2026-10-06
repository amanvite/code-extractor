import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Search, Code2, Image as ImageIcon, Download, Box, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useExtractionStore } from './store/useExtractionStore';
import JSZip from 'jszip';
import './index.css';

export default function App() {
    const [urlInput, setUrlInput] = useState('');
    const { assets, activeFile, isLoading, error, extractSite, setActiveFile } = useExtractionStore();

    const handleExtract = (e: React.FormEvent) => {
        e.preventDefault();
        if (urlInput) extractSite(urlInput);
    };

    const handleDownload = async () => {
        const zip = new JSZip();
        Object.values(assets).forEach(file => {
            if (file.isBinary) {
                const base64Data = file.content.split(',')[1];
                zip.file(file.path, base64Data, { base64: true });
            } else {
                zip.file(file.path, file.content);
            }
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `extraction-${Date.now()}.zip`;
        link.click();
    };

    const currentAsset = activeFile ? assets[activeFile] : null;
    const fileCount = Object.keys(assets).length;

    const getLanguage = (filename: string) => {
        if (filename.endsWith('.js')) return 'javascript';
        if (filename.endsWith('.css')) return 'css';
        if (filename.endsWith('.html')) return 'html';
        if (filename.endsWith('.json')) return 'json';
        return 'plaintext';
    };

    return (
        <div className="app-layout">
            <header className="header">
                <div className="brand">
                    <Box size={20} strokeWidth={2.5} />
                    Code Extractor
                </div>
                
                <form onSubmit={handleExtract} className="search-container">
                    <Search size={16} color="#737373" style={{marginRight: '8px'}} />
                    <input 
                        type="text" 
                        className="search-input"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Paste target URL (e.g., https://stripe.com)" 
                        autoComplete="off"
                    />
                    <button type="submit" className="action-btn" disabled={isLoading}>
                        {isLoading ? 'Extracting...' : 'Extract Payload'}
                    </button>
                </form>

                <button onClick={handleDownload} disabled={fileCount === 0} className="action-btn" style={{background: 'transparent', color: '#171717', border: '1px solid #e5e5e5'}}>
                    <Download size={14} style={{display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom'}} />
                    Export ZIP
                </button>
            </header>

            <div className="main-stage">
                <aside className="sidebar">
                    <div className="sidebar-heading">Workspace</div>
                    
                    <div className="file-tree">
                        {error && (
                            <div style={{padding: '12px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', display: 'flex', gap: '8px'}}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        
                        {!error && fileCount === 0 && !isLoading && (
                            <div style={{padding: '24px 12px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px'}}>
                                No assets loaded.
                            </div>
                        )}
                        
                        {Object.entries(assets).map(([filename, file]) => (
                            <button 
                                key={filename}
                                onClick={() => setActiveFile(filename)}
                                className={`file-item ${activeFile === filename ? 'active' : ''}`}
                            >
                                {file.isBinary ? <ImageIcon size={14} /> : <Code2 size={14} />}
                                <span style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                    {file.path}
                                </span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="editor-column">
                    <div className="tab-bar">
                        {currentAsset ? (
                            <div className="tab active">
                                {currentAsset.isBinary ? <ImageIcon size={14} /> : <Code2 size={14} />}
                                {currentAsset.path}
                            </div>
                        ) : (
                            <div className="tab" style={{color: '#a1a1aa'}}>Welcome</div>
                        )}
                    </div>

                    <div className="editor-canvas">
                        {currentAsset ? (
                            currentAsset.isBinary ? (
                                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px'}}>
                                    <img src={currentAsset.content} alt={currentAsset.path} style={{maxWidth: '100%', maxHeight: '100%', border: '1px solid #e5e5e5', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                                </div>
                            ) : (
                                <Editor
                                    height="100%"
                                    language={getLanguage(currentAsset.path)}
                                    theme="light"
                                    value={currentAsset.content}
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: true, scale: 0.75 },
                                        wordWrap: 'on',
                                        fontSize: 14,
                                        fontFamily: "'JetBrains Mono', monospace",
                                        padding: { top: 16 },
                                        scrollBeyondLastLine: false,
                                        hideCursorInOverviewRuler: true
                                    }}
                                />
                            )
                        ) : (
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a1a1aa'}}>
                                <Box size={48} strokeWidth={1} style={{marginBottom: '16px'}} />
                                <p style={{fontSize: '14px'}}>Enter a URL above to map the DOM.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <footer className="status-bar">
                <div className="status-group">
                    {isLoading ? (
                        <><Loader2 size={12} className="animate-spin" /> Intercepting Network Traffic...</>
                    ) : fileCount > 0 ? (
                        <><CheckCircle2 size={12} color="#10b981" /> Extraction Complete</>
                    ) : (
                        <><AlertCircle size={12} /> System Idle</>
                    )}
                </div>
                
                <div className="status-group">
                    <span>{fileCount} Assets Extracted</span>
                    {currentAsset && (
                        <span>Type: {currentAsset.isBinary ? 'Media' : 'UTF-8'}</span>
                    )}
                </div>
            </footer>
        </div>
    );
}