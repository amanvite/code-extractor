const formatBtn = document.getElementById('formatBtn');

formatBtn.addEventListener('click', () => {
    const activeFileEl = document.querySelector('.file-item.active');
    if (!activeFileEl) return;
    const activeFileName = activeFileEl.dataset.filename;

    let code = outputArea.textContent;
    if (!code || code.includes('// Extracting code')) return;

    let formattedCode = code;
    const options = { indent_size: 4, space_in_empty_paren: true };

    try {
        if (activeFileName.endsWith('.html') || activeFileName.endsWith('.xml') || activeFileName.endsWith('.svg')) {
            formattedCode = html_beautify(code, options);
        } else if (activeFileName.endsWith('.css')) {
            formattedCode = css_beautify(code, options);
        } else if (activeFileName.endsWith('.js') || activeFileName.endsWith('.ts')) {
            formattedCode = js_beautify(code, options);
        } else if (activeFileName.endsWith('.json')) {
            const jsonObj = JSON.parse(code);
            formattedCode = JSON.stringify(jsonObj, null, 4);
        } else {
            alert("No auto-formatter available for this file type yet.");
            return;
        }

        extractedFiles[activeFileName].content = formattedCode;
        outputArea.textContent = formattedCode;
        
        Prism.highlightElement(outputArea);
        
        const originalText = formatBtn.innerHTML;
        formatBtn.innerHTML = `<span style="color:#4ade80">Formatted!</span>`;
        setTimeout(() => formatBtn.innerHTML = originalText, 1500);

    } catch (e) {
        console.error("Formatting failed:", e);
        alert("Could not format this file. Ensure the syntax is correct.");
    }
});