import { create } from 'zustand';
import { html, css, js } from 'js-beautify';

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
  formatActiveFile: () => void;
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
  },

  formatActiveFile: () => {
    set((state) => {
      if (!state.activeFile || !state.assets[state.activeFile]) return state;

      const asset = state.assets[state.activeFile];
      let formatted = asset.content;

      try {
        if (asset.category === 'HTML') {
          formatted = html(asset.content, { indent_size: 2, max_preserve_newlines: 1 });
        } else if (asset.category === 'CSS') {
          formatted = css(asset.content, { indent_size: 2 });
        } else if (asset.category === 'Javascript') {
          formatted = js(asset.content, { indent_size: 2 });
        }
      } catch (error) {
        console.error('Formatting failed:', error);
      }

      return {
        assets: {
          ...state.assets,
          [state.activeFile]: { ...asset, content: formatted }
        }
      };
    });
  }
}));