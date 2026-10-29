# Code Extractor

A full-stack web extraction tool for retrieving and formatting dynamic DOM assets.

**[Launch Live Application](https://code-extractor-plus.vercel.app)**  

## Core Capabilities
* **Dynamic DOM Extraction:** Utilizes a headless Playwright engine to bypass modern network trackers and extract fully rendered, DOM-ready code.
* **In-Browser Formatting:** Natively structures and indents heavily minified HTML, CSS, and JS payloads using the `js-beautify` engine.
* **Asset Bundling:** Compresses extracted text and binary media on the fly into a downloadable `.zip` archive.
* **Integrated Development Environment:** Provides a VS Code-like viewing experience directly in the browser via Monaco Editor.

## Technical Architecture
* **Frontend (Deployed on Vercel):** React, Vite, Zustand, Monaco Editor
* **Backend (Deployed on Render):** Node.js, Express, Playwright, Docker, TSX

## License & Usage Restrictions
**Proprietary – All Rights Reserved.**  
This repository is provided strictly for portfolio demonstration. While you are welcome to interact with the live deployed application, downloading, copying, modifying, or utilizing this source code for any personal, educational, or commercial purpose is strictly prohibited. See the [LICENSE](LICENSE) file for complete legal terms.

---
*Engineered by Aman Verma* | [info.amanvite@gmail.com](mailto:info.amanvite@gmail.com)
