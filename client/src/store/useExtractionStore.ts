import { create } from 'zustand';

export interface ExtractedAsset {
  category: 'HTML' | 'CSS' | 'Javascript' | 'Images';
  path: string;
  content: string;
  isBinary: boolean;
}

interface ExtractionState {
  assets: Record<string, ExtractedAsset>;
  activeFile: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveFile: (filename: string) => void;
  extractSite: (url: string) => Promise<void>;
}

export const useExtractionStore = create<ExtractionState>((set) => ({
  assets: {},
  activeFile: null,
  isLoading: false,
  error: null,

  setActiveFile: (filename) => set({ activeFile: filename }),

  extractSite: async (url) => {
    set({ isLoading: true, error: null, assets: {}, activeFile: null });
    
    try {
      // MUST UPDATE: Replace YOUR-RENDER-APP-NAME with your live Render backend URL
      const response = await fetch('https://code-extractor-99iu.onrender.com/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Extraction failed');
      }
      
      set({ assets: data.assets, isLoading: false, activeFile: 'index.html' });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  }
}));