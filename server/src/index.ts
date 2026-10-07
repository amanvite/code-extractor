import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

chromium.use(StealthPlugin());

const app = express();
app.use(cors());
app.use(express.json());

interface ExtractedAsset {
    category: 'HTML' | 'CSS' | 'JavaScript' | 'Images';
    path: string;
    content: string;
    isBinary: boolean;
}

app.post('/api/extract', async (req: Request, res: Response): Promise<void> => {
    const { url } = req.body;
    if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
    }

    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const assets: Record<string, ExtractedAsset> = {};
    let browser;

    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            bypassCSP: true
        });
        
        const page = await context.newPage();

        page.on('response', async (response: any) => {
            try {
                const resUrl = response.url();
                if (resUrl.startsWith('data:') || response.status() >= 400) return;

                const contentType = response.headers()['content-type'] || '';
                const parsedUrl = new URL(resUrl);
                const filename = parsedUrl.pathname.split('/').pop()?.split('?')[0] || 'resource';

                if (contentType.includes('text/css') || resUrl.endsWith('.css')) {
                    assets[filename] = { category: 'CSS', path: `css/${filename}`, content: await response.text(), isBinary: false };
                } else if (contentType.includes('javascript') || resUrl.endsWith('.js')) {
                    assets[filename] = { category: 'JavaScript', path: `js/${filename}`, content: await response.text(), isBinary: false };
                } else if (contentType.includes('image/') || /\.(png|jpe?g|svg|webp|gif|ico)$/i.test(filename)) {
                    const buffer = await response.body();
                    assets[filename] = { 
                        category: 'Images', 
                        path: `images/${filename}`, 
                        content: `data:${contentType};base64,${buffer.toString('base64')}`, 
                        isBinary: true 
                    };
                }
            } catch (err) {
            }
        });

        await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 75000 });

        const renderedHtml = await page.content();
        const $ = cheerio.load(renderedHtml);

        $('link[rel="stylesheet"]').each((_, el) => {
            const href = $(el).attr('href');
            if (href) $(el).attr('href', `css/${href.split('/').pop()?.split('?')[0] || 'style.css'}`);
        });

        $('script[src]').each((_, el) => {
            const src = $(el).attr('src');
            if (src) $(el).attr('src', `js/${src.split('/').pop()?.split('?')[0] || 'script.js'}`);
        });

        $('img[src]').each((_, el) => {
            const src = $(el).attr('src');
            if (src && !src.startsWith('data:')) $(el).attr('src', `images/${src.split('/').pop()?.split('?')[0] || 'image'}`);
        });

        assets['index.html'] = { category: 'HTML', path: 'index.html', content: $.html(), isBinary: false };
        res.json({ success: true, url: targetUrl, assets });

    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Extraction failed.' });
    } finally {
        if (browser) await browser.close();
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Stealth Extractor active on http://localhost:${PORT}`));