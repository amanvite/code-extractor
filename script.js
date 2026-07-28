const landingUrlInput = document.getElementById('landingUrlInput');
const landingFetchBtn = document.getElementById('landingFetchBtn');

const outputArea = document.getElementById('outputArea');
const fileTree = document.getElementById('fileTree');

const viewCode = document.getElementById('viewCode');
const viewImage = document.getElementById('viewImage');
const imagePreview = document.getElementById('imagePreview');
const viewPreview = document.getElementById('viewPreview'); 

let extractedFiles = {};

function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return 'https://' + url;
    return url;
}

async function fetchViaProxy(targetUrl) {
    const encodedUrl = encodeURIComponent(targetUrl);
    
    // Create a kill switch that triggers after 8 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); 

    const requests = [
        fetch(`https://api.allorigins.win/raw?url=${encodedUrl}`, { signal: controller.signal })
            .then(res => { if (!res.ok) throw new Error(); return res.text(); }),
        fetch(`https://api.codetabs.com/v1/proxy?quest=${encodedUrl}`, { signal: controller.signal })
            .then(res => { if (!res.ok) throw new Error(); return res.text(); }),
        fetch(`https://corsproxy.io/?${encodedUrl}`, { signal: controller.signal })
            .then(res => { if (!res.ok) throw new Error(); return res.text(); })
    ];

    try {
        // Run them all. Fastest one wins!
        const result = await Promise.any(requests);
        clearTimeout(timeoutId); // Cancel the kill switch if we succeed
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        throw new Error("Proxies were blocked or timed out.");
    }
}

function resolveUrl(baseUrl, relativeUrl) {
    try { return new URL(relativeUrl, baseUrl).href; } catch (e) { return null; }
}

async function startExtraction(rawUrl) {
    let baseUrl = rawUrl.trim();
    if (!baseUrl) return alert("Please enter a valid URL.");
    baseUrl = formatUrl(baseUrl);

    landingFetchBtn.disabled = true;
    landingFetchBtn.innerText = "Extracting...";

    extractedFiles = {};
    fileTree.innerHTML = `<div class="empty-state">Extracting Code & Media...</div>`;
    
    try {
        const htmlContent = await fetchViaProxy(baseUrl);
        extractedFiles['index.html'] = { category: 'HTML', content: htmlContent, type: 'code' };

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        const cssLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(l => l.getAttribute('href')).filter(h => h);
        for (let href of cssLinks) {
            const fullUrl = resolveUrl(baseUrl, href);
            if (fullUrl) {
                try {
                    const cssContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'style.css';
                    if (!fileName.endsWith('.css')) fileName += '.css';
                    extractedFiles[fileName] = { category: 'CSS', content: cssContent, type: 'code' };
                } catch (e) {}
            }
        }

        const jsLinks = Array.from(doc.querySelectorAll('script[src]')).map(s => s.getAttribute('src')).filter(s => s);
        for (let src of jsLinks) {
            const fullUrl = resolveUrl(baseUrl, src);
            if (fullUrl) {
                try {
                    const jsContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'script.js';
                    if (!fileName.endsWith('.js')) fileName += '.js';
                    extractedFiles[fileName] = { category: 'JavaScript', content: jsContent, type: 'code' };
                } catch (e) {}
            }
        }

        // Extract Web Manifests / JSON files
        const linkTags = Array.from(doc.querySelectorAll('link[rel="manifest"], link[rel="alternate"][type="application/json"]')).map(l => l.getAttribute('href')).filter(h => h);
        for (let href of linkTags) {
            const fullUrl = resolveUrl(baseUrl, href);
            if (fullUrl) {
                try {
                    const jsonContent = await fetchViaProxy(fullUrl);
                    let fileName = fullUrl.split('/').pop().split('?')[0] || 'manifest.json';
                    extractedFiles[fileName] = { category: 'JSON/Config', content: jsonContent, type: 'code' };
                } catch (e) {}
            }
        }

        const imgTags = Array.from(doc.querySelectorAll('img')).map(img => img.getAttribute('src')).filter(src => src);
        for (let src of imgTags) {
            const fullUrl = resolveUrl(baseUrl, src);
            if (fullUrl) {
                let fileName = fullUrl.split('/').pop().split('?')[0];
                if(fileName) {
                    extractedFiles[fileName] = { category: 'Images', content: fullUrl, type: 'image' };
                }
            }
        }

        renderFileTree();
        selectFile('index.html');

} catch (error) {
        // Show the error in red
        fileTree.innerHTML = '<div class="empty-state" style="color: #ef4444;">Extraction failed. Site security blocked the proxies.</div>';
        
        // Clear the old ghost code from the editor
        outputArea.textContent = ''; 
        viewCode.classList.add('hidden');
    } finally {
        landingFetchBtn.disabled = false;
        landingFetchBtn.innerText = "Extract Site";
    }
}

landingFetchBtn.addEventListener('click', () => startExtraction(landingUrlInput.value));
landingUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') startExtraction(landingUrlInput.value);
});

const icons = {
    html: `<svg class="file-icon icon-html" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    css: `<svg class="file-icon icon-css" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    js: `<svg class="file-icon icon-js" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4l1.5 13.5L12 21l6.5-3.5L20 4H4zm11 5H8.5l-.3-3H17l-1 8h-3v-3h3l.4-2z"></path></svg>`,
    img: `<svg class="file-icon icon-img" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    generic: `<svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="#969696" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
};

function renderFileTree() {
    fileTree.innerHTML = '';
    const files = Object.keys(extractedFiles);

    if (files.length === 0) {
        fileTree.innerHTML = '<div class="empty-state">No files extracted yet.</div>';
        return;
    }

    files.forEach(fileName => {
        const fileData = extractedFiles[fileName];
        const fileEl = document.createElement('div');
        fileEl.className = 'file-item';
        fileEl.dataset.filename = fileName;

        let icon = icons.generic; 
        if (fileName.endsWith('.html')) icon = icons.html;
        else if (fileData.category === 'CSS') icon = icons.css;
        else if (fileData.category === 'JavaScript') icon = icons.js;
        else if (fileData.category === 'Images') icon = icons.img;

        fileEl.innerHTML = `${icon} <span>${fileName}</span>`;
        fileEl.addEventListener('click', () => selectFile(fileName));
        fileTree.appendChild(fileEl);
    });
}

function selectFile(fileName) {
    if (!extractedFiles[fileName]) return;

    if (window.isPreviewMode) {
        const toggleBtn = document.getElementById('togglePreviewBtn');
        toggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Preview Site`;
        toggleBtn.style.backgroundColor = 'var(--accent)';
        window.isPreviewMode = false;
    }
    viewPreview.classList.add('hidden');
    
    document.querySelectorAll('.file-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.filename === fileName) el.classList.add('active');
    });

    const fileData = extractedFiles[fileName];
    
    if (fileData.type === 'image') {
        viewCode.classList.add('hidden');
        viewImage.classList.remove('hidden');
        imagePreview.src = fileData.content;
        
        if(window.formatBtn) formatBtn.disabled = true;
    } else {
        viewImage.classList.add('hidden');
        viewCode.classList.remove('hidden');
        
        outputArea.textContent = fileData.content;
        
        let lang = 'none'; 
        const ext = fileName.split('.').pop().toLowerCase();
        
        const languageMap = {
            'html': 'markup', 'xml': 'markup', 'svg': 'markup',
            'css': 'css',
            'js': 'javascript', 'jsx': 'jsx',
            'ts': 'typescript', 'tsx': 'tsx',
            'json': 'json',
            'py': 'python',
            'php': 'php'
        };

        if (languageMap[ext]) {
            lang = languageMap[ext];
        }
        
        outputArea.className = `language-${lang}`;
        Prism.highlightElement(outputArea); 
        
        if(window.formatBtn) formatBtn.disabled = false;
    }
}