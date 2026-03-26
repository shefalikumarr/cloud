// Archive Magazine Editor
(function () {
    // --- State ---
    let password = '';
    let magazineData = null;
    let currentSpread = 0; // index of left page
    let selectedElement = null; // { pageIndex, elementId }
    let editingTextId = null; // elementId currently being text-edited
    let undoStack = [];
    let contentLibrary = null;

    // Cloudinary base URL for full-quality images
    const CLOUD_BASE = 'https://res.cloudinary.com/djfrhmsgw/image/upload';

    function cloudinaryFullUrl(publicId, width) {
        if (width) return `${CLOUD_BASE}/q_auto,f_auto,w_${width}/${publicId}`;
        return `${CLOUD_BASE}/q_auto,f_auto/${publicId}`;
    }

    // Page dimensions in editor (5:7 ratio)
    const PAGE_W = 400;
    const PAGE_H = 560;
    // Data model dimensions
    const DATA_W = 500;
    const DATA_H = 700;

    const scaleX = PAGE_W / DATA_W;
    const scaleY = PAGE_H / DATA_H;

    // --- DOM refs ---
    const overlay = document.getElementById('password-overlay');
    const passInput = document.getElementById('password-input');
    const passSubmit = document.getElementById('password-submit');
    const passError = document.getElementById('password-error');
    const editorLayout = document.getElementById('editor-layout');
    const pageLeftEl = document.getElementById('editor-page-left');
    const pageRightEl = document.getElementById('editor-page-right');
    const pageStrip = document.getElementById('page-strip');
    const saveStatus = document.getElementById('save-status');

    // ==========================================
    // PASSWORD AUTH
    // ==========================================
    const stored = sessionStorage.getItem('archive-pw');
    if (stored) {
        password = stored;
        enterEditor();
    }

    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') passSubmit.click(); });
    passSubmit.addEventListener('click', async () => {
        passError.textContent = '';
        const pw = passInput.value;
        try {
            const res = await fetch('/api/archive/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pw })
            });
            if (res.ok) {
                password = pw;
                sessionStorage.setItem('archive-pw', pw);
                enterEditor();
            } else {
                passError.textContent = 'wrong password';
            }
        } catch {
            passError.textContent = 'connection error';
        }
    });

    async function enterEditor() {
        overlay.style.display = 'none';
        editorLayout.style.display = 'flex';
        await loadMagazine();
        loadContentLibrary();
        populateSiteContent();
    }

    // ==========================================
    // DATA LOADING / SAVING
    // ==========================================
    async function loadMagazine() {
        try {
            const res = await fetch('/api/archive');
            magazineData = await res.json();
            magazineData.pages.sort((a, b) => a.order - b.order);
            pushUndo();
            renderAll();
        } catch {
            magazineData = { version: 1, title: 'Archive', pages: [makePage(0), makePage(1)] };
            pushUndo();
            renderAll();
        }
    }

    async function saveMagazine() {
        saveStatus.textContent = 'saving...';
        try {
            const res = await fetch('/api/archive', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + password
                },
                body: JSON.stringify(magazineData)
            });
            if (res.ok) {
                saveStatus.textContent = 'saved';
                setTimeout(() => { saveStatus.textContent = ''; }, 2000);
            } else {
                saveStatus.textContent = 'save failed';
            }
        } catch {
            saveStatus.textContent = 'save error';
        }
    }

    async function loadContentLibrary() {
        try {
            const res = await fetch('/api/archive/content-library');
            contentLibrary = await res.json();
            renderImageGrid();
            populateSiteContent(); // re-populate after essays are loaded
        } catch {
            document.getElementById('image-grid').innerHTML = '<p class="lib-loading">failed to load</p>';
        }
    }

    // ==========================================
    // UNDO
    // ==========================================
    function pushUndo() {
        undoStack.push(JSON.stringify(magazineData));
        if (undoStack.length > 50) undoStack.shift();
    }

    function undo() {
        if (undoStack.length < 2) return;
        undoStack.pop(); // discard current
        const prev = undoStack[undoStack.length - 1];
        magazineData = JSON.parse(prev);
        selectedElement = null;
        renderAll();
    }

    // ==========================================
    // HELPERS
    // ==========================================
    function uid() {
        return 'el-' + Math.random().toString(36).slice(2, 10);
    }

    function makePage(order) {
        return { id: 'page-' + Math.random().toString(36).slice(2, 8), order, backgroundColor: '#111111', elements: [] };
    }

    function getPage(index) {
        return magazineData.pages[index] || null;
    }

    function getSelectedEl() {
        if (!selectedElement) return null;
        const page = getPage(selectedElement.pageIndex);
        if (!page) return null;
        return page.elements.find(e => e.id === selectedElement.elementId) || null;
    }

    function mutate(fn) {
        pushUndo();
        fn();
        renderAll();
    }

    // ==========================================
    // RENDERING
    // ==========================================
    function renderAll() {
        if (editingTextId) return; // don't re-render while editing text
        renderSpread();
        renderPageStrip();
        renderProperties();
        updateBgColorInput();
    }

    function renderSpread() {
        if (editingTextId) return; // don't re-render while editing text
        const leftPage = getPage(currentSpread);
        const rightPage = getPage(currentSpread + 1);
        renderEditorPage(pageLeftEl, leftPage, currentSpread);
        renderEditorPage(pageRightEl, rightPage, currentSpread + 1);
    }

    function renderEditorPage(container, pageData, pageIndex) {
        container.innerHTML = '';
        container.style.backgroundColor = pageData ? (pageData.backgroundColor || '#111') : '#0a0a0a';

        if (!pageData) {
            container.style.opacity = '0.3';
            return;
        }
        container.style.opacity = '1';

        (pageData.elements || []).forEach(el => {
            const div = document.createElement('div');
            div.className = 'ed-element';
            div.dataset.elId = el.id;
            div.dataset.pageIndex = pageIndex;
            div.style.left = (el.x * scaleX) + 'px';
            div.style.top = (el.y * scaleY) + 'px';
            div.style.width = (el.width * scaleX) + 'px';
            div.style.height = (el.height * scaleY) + 'px';
            if (el.rotation) div.style.transform = `rotate(${el.rotation}deg)`;

            if (selectedElement && selectedElement.pageIndex === pageIndex && selectedElement.elementId === el.id) {
                div.classList.add('selected');
                addResizeHandles(div);
            }

            if (el.type === 'text') {
                const textDiv = document.createElement('div');
                textDiv.className = 'el-text-content';
                textDiv.textContent = el.content || '';
                if (el.style) {
                    if (el.style.fontSize) textDiv.style.fontSize = (el.style.fontSize * scaleX) + 'px';
                    if (el.style.fontFamily) textDiv.style.fontFamily = el.style.fontFamily;
                    if (el.style.color) textDiv.style.color = el.style.color;
                    if (el.style.fontWeight) textDiv.style.fontWeight = el.style.fontWeight;
                    if (el.style.textAlign) textDiv.style.textAlign = el.style.textAlign;
                }
                div.appendChild(textDiv);

                // Double-click to edit text
                div.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    editingTextId = el.id;
                    textDiv.contentEditable = 'true';
                    textDiv.style.cursor = 'text';
                    textDiv.style.overflow = 'auto';
                    textDiv.focus();

                    function finishEdit() {
                        document.removeEventListener('mousedown', onClickOutside, true);
                        textDiv.contentEditable = 'false';
                        textDiv.style.cursor = '';
                        textDiv.style.overflow = 'hidden';
                        const newContent = textDiv.innerText;
                        editingTextId = null;
                        if (newContent !== el.content) {
                            pushUndo();
                            el.content = newContent;
                        }
                        renderAll();
                    }

                    function onClickOutside(e2) {
                        if (!textDiv.contains(e2.target) && e2.target !== textDiv) {
                            e2.stopPropagation();
                            finishEdit();
                        }
                    }

                    // Listen for clicks outside to finish editing (capture phase)
                    setTimeout(() => {
                        document.addEventListener('mousedown', onClickOutside, true);
                    }, 10);
                });
            } else if (el.type === 'image') {
                const img = document.createElement('img');
                // Use Cloudinary publicId for high-res, fall back to stored src
                if (el.cloudinaryId) {
                    // Request image at 2x display size for sharpness
                    const displayW = Math.round(el.width * scaleX * 2);
                    img.src = cloudinaryFullUrl(el.cloudinaryId, displayW);
                } else {
                    img.src = el.src || '';
                }
                img.draggable = false;
                if (el.style?.opacity !== undefined) img.style.opacity = el.style.opacity;
                div.appendChild(img);
            } else if (el.type === 'shape') {
                div.innerHTML = renderShapeSVG(el);
            }

            // Click to select, drag to move
            div.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('resize-handle')) return;
                if (editingTextId) return; // don't interfere with text editing
                if (div.querySelector('[contenteditable="true"]')) return;
                e.stopPropagation();
                // Only call selectElement (which rebuilds DOM) if not already selected.
                // This preserves the DOM node so dblclick can fire for text editing.
                const alreadySelected = selectedElement && selectedElement.pageIndex === pageIndex && selectedElement.elementId === el.id;
                if (!alreadySelected) {
                    selectElement(pageIndex, el.id);
                }
                // Delay drag start to allow double-click to fire without interference
                const startX = e.clientX, startY = e.clientY;
                let moved = false;
                function onMove(e2) {
                    if (!moved && (Math.abs(e2.clientX - startX) > 3 || Math.abs(e2.clientY - startY) > 3)) {
                        moved = true;
                    }
                    if (moved) {
                        const dx = (e2.clientX - startX) / scaleX;
                        const dy = (e2.clientY - startY) / scaleY;
                        el.x = Math.round(origX + dx);
                        el.y = Math.round(origY + dy);
                        renderSpread();
                    }
                }
                const origX = el.x, origY = el.y;
                function onUp() {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    if (moved) {
                        pushUndo();
                        renderAll();
                    }
                }
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onUp);
            });

            container.appendChild(div);
        });

        // Click on empty area to deselect
        container.addEventListener('mousedown', (e) => {
            if (e.target === container) {
                editingTextId = null;
                selectedElement = null;
                renderAll();
            }
        });
    }

    function renderShapeSVG(el) {
        const fill = el.style?.fill || '#ffffff';
        const stroke = el.style?.stroke || 'none';
        const sw = el.style?.strokeWidth || 0;
        const opacity = el.style?.opacity !== undefined ? el.style.opacity : 1;
        const br = el.style?.borderRadius || 0;
        const w = el.width, h = el.height;

        switch (el.shapeType) {
            case 'rectangle':
                return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect x="${sw/2}" y="${sw/2}" width="${w-sw}" height="${h-sw}" rx="${br}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/></svg>`;
            case 'circle':
                return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><ellipse cx="${w/2}" cy="${h/2}" rx="${(w-sw)/2}" ry="${(h-sw)/2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/></svg>`;
            case 'triangle':
                return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><polygon points="${w/2},${sw/2} ${sw/2},${h-sw/2} ${w-sw/2},${h-sw/2}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/></svg>`;
            case 'line':
                return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><line x1="0" y1="${h/2}" x2="${w}" y2="${h/2}" stroke="${stroke||fill}" stroke-width="${sw||2}" opacity="${opacity}"/></svg>`;
            default: return '';
        }
    }

    function addResizeHandles(div) {
        ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach(dir => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle ' + dir;
            handle.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                startResize(e, dir);
            });
            div.appendChild(handle);
        });
    }

    function renderPageStrip() {
        pageStrip.innerHTML = '';
        magazineData.pages.forEach((page, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'page-thumb';
            thumb.style.backgroundColor = page.backgroundColor || '#111';
            if (i === currentSpread || i === currentSpread + 1) thumb.classList.add('active');
            thumb.innerHTML = `<span class="page-thumb-num">${i + 1}</span>`;
            thumb.addEventListener('click', () => {
                currentSpread = i % 2 === 0 ? i : i - 1;
                if (currentSpread < 0) currentSpread = 0;
                selectedElement = null;
                renderAll();
            });
            pageStrip.appendChild(thumb);
        });
    }

    function updateBgColorInput() {
        const page = getPage(currentSpread);
        if (page) {
            document.getElementById('page-bg-color').value = page.backgroundColor || '#111111';
        }
    }

    // ==========================================
    // SELECTION & PROPERTIES
    // ==========================================
    function selectElement(pageIndex, elementId) {
        selectedElement = { pageIndex, elementId };
        renderAll();
    }

    function renderProperties() {
        const propsContent = document.getElementById('props-content');
        const propsEmpty = document.querySelector('.props-empty');
        const el = getSelectedEl();

        if (!el) {
            propsContent.style.display = 'none';
            propsEmpty.style.display = 'block';
            return;
        }

        propsContent.style.display = 'block';
        propsEmpty.style.display = 'none';

        document.getElementById('prop-x').value = Math.round(el.x);
        document.getElementById('prop-y').value = Math.round(el.y);
        document.getElementById('prop-w').value = Math.round(el.width);
        document.getElementById('prop-h').value = Math.round(el.height);

        // Show/hide type-specific props
        document.getElementById('props-text').style.display = el.type === 'text' ? 'block' : 'none';
        document.getElementById('props-shape').style.display = el.type === 'shape' ? 'block' : 'none';
        document.getElementById('props-image').style.display = el.type === 'image' ? 'block' : 'none';

        if (el.type === 'text' && el.style) {
            document.getElementById('prop-font-size').value = el.style.fontSize || 18;
            document.getElementById('prop-text-color').value = el.style.color || '#ffffff';
            document.getElementById('prop-font-weight').value = el.style.fontWeight || 'normal';
            document.getElementById('prop-text-align').value = el.style.textAlign || 'left';
        }
        if (el.type === 'shape' && el.style) {
            document.getElementById('prop-fill').value = el.style.fill || '#ffffff';
            document.getElementById('prop-stroke').value = el.style.stroke || '#ffffff';
            document.getElementById('prop-stroke-width').value = el.style.strokeWidth || 0;
            document.getElementById('prop-opacity').value = el.style.opacity !== undefined ? el.style.opacity : 1;
        }
        if (el.type === 'image') {
            document.getElementById('prop-img-opacity').value = el.style?.opacity !== undefined ? el.style.opacity : 1;
            document.getElementById('prop-lock-aspect').checked = el.lockAspect !== false;
        }
    }

    // Property input handlers
    function bindPropInput(id, setter) {
        const input = document.getElementById(id);
        if (!input) return;
        input.addEventListener('change', () => {
            const el = getSelectedEl();
            if (!el) return;
            mutate(() => setter(el, input));
        });
    }

    bindPropInput('prop-x', (el, input) => { el.x = Number(input.value); });
    bindPropInput('prop-y', (el, input) => { el.y = Number(input.value); });
    bindPropInput('prop-w', (el, input) => { el.width = Math.max(10, Number(input.value)); });
    bindPropInput('prop-h', (el, input) => { el.height = Math.max(10, Number(input.value)); });
    bindPropInput('prop-font-size', (el, input) => { if (!el.style) el.style = {}; el.style.fontSize = Number(input.value); });
    bindPropInput('prop-text-color', (el, input) => { if (!el.style) el.style = {}; el.style.color = input.value; });
    bindPropInput('prop-font-weight', (el, input) => { if (!el.style) el.style = {}; el.style.fontWeight = input.value; });
    bindPropInput('prop-text-align', (el, input) => { if (!el.style) el.style = {}; el.style.textAlign = input.value; });
    bindPropInput('prop-fill', (el, input) => { if (!el.style) el.style = {}; el.style.fill = input.value; });
    bindPropInput('prop-stroke', (el, input) => { if (!el.style) el.style = {}; el.style.stroke = input.value; });
    bindPropInput('prop-stroke-width', (el, input) => { if (!el.style) el.style = {}; el.style.strokeWidth = Number(input.value); });
    bindPropInput('prop-opacity', (el, input) => { if (!el.style) el.style = {}; el.style.opacity = Number(input.value); });
    bindPropInput('prop-img-opacity', (el, input) => { if (!el.style) el.style = {}; el.style.opacity = Number(input.value); });

    // Aspect ratio lock — direct handler (not through mutate/renderAll to avoid checkbox reset)
    document.getElementById('prop-lock-aspect').addEventListener('change', function () {
        const el = getSelectedEl();
        if (!el) return;
        pushUndo();
        el.lockAspect = this.checked;
        if (this.checked) {
            el.aspectRatio = el.width / el.height;
        }
        // Don't call renderAll — just update the properties display without re-rendering
    });

    // ==========================================
    // DRAG (MOVE ELEMENT)
    // ==========================================
    function startDrag(e, el, pageIndex) {
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = el.x;
        const origY = el.y;

        function onMove(e2) {
            const dx = (e2.clientX - startX) / scaleX;
            const dy = (e2.clientY - startY) / scaleY;
            el.x = Math.round(origX + dx);
            el.y = Math.round(origY + dy);
            renderSpread();
        }

        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            pushUndo();
            renderAll();
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    // ==========================================
    // RESIZE
    // ==========================================
    function startResize(e, dir) {
        e.preventDefault();
        const el = getSelectedEl();
        if (!el) return;

        const startX = e.clientX;
        const startY = e.clientY;
        const origX = el.x, origY = el.y, origW = el.width, origH = el.height;
        const ar = el.aspectRatio || (origW / origH);

        function onMove(e2) {
            const dx = (e2.clientX - startX) / scaleX;
            const dy = (e2.clientY - startY) / scaleY;

            let newW = origW, newH = origH, newX = origX, newY = origY;

            if (dir.includes('e')) newW = Math.max(10, Math.round(origW + dx));
            if (dir.includes('s')) newH = Math.max(10, Math.round(origH + dy));
            if (dir.includes('w')) {
                newW = Math.max(10, Math.round(origW - dx));
                newX = Math.round(origX + dx);
            }
            if (dir.includes('n')) {
                newH = Math.max(10, Math.round(origH - dy));
                newY = Math.round(origY + dy);
            }

            // Apply aspect ratio lock (read fresh from element)
            if (el.lockAspect) {
                const isCorner = dir.length === 2;
                const isHoriz = dir === 'e' || dir === 'w';
                const isVert = dir === 'n' || dir === 's';

                if (isCorner || isHoriz) {
                    // Width drives height
                    const lockedH = Math.round(newW / ar);
                    if (dir.includes('n')) {
                        newY = origY + origH - lockedH;
                    }
                    newH = lockedH;
                } else if (isVert) {
                    // Height drives width
                    const lockedW = Math.round(newH * ar);
                    if (dir.includes('w')) {
                        newX = origX + origW - lockedW;
                    }
                    newW = lockedW;
                }
            }

            el.width = newW;
            el.height = newH;
            el.x = newX;
            el.y = newY;

            renderSpread();
        }

        function onUp() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            pushUndo();
            renderAll();
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }

    // ==========================================
    // DRAG & DROP FROM LIBRARY
    // ==========================================
    function setupDropZone(pageEl) {
        pageEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            pageEl.classList.add('drop-hover');
        });
        pageEl.addEventListener('dragleave', () => {
            pageEl.classList.remove('drop-hover');
        });
        pageEl.addEventListener('drop', (e) => {
            e.preventDefault();
            pageEl.classList.remove('drop-hover');
            editingTextId = null; // clear any stuck editing state

            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;

            let dropData;
            try { dropData = JSON.parse(dataStr); } catch { return; }

            const rect = pageEl.getBoundingClientRect();
            const dropX = (e.clientX - rect.left) / scaleX;
            const dropY = (e.clientY - rect.top) / scaleY;

            const side = pageEl.dataset.side;
            const pageIndex = side === 'left' ? currentSpread : currentSpread + 1;
            const page = getPage(pageIndex);
            if (!page) return;

            let newEl = null;
            if (dropData.type === 'image') {
                // Scale image to fit within page while preserving aspect ratio
                let imgW = dropData.width || 400;
                let imgH = dropData.height || 300;
                const maxW = 350, maxH = 400;
                const scale = Math.min(maxW / imgW, maxH / imgH, 1);
                imgW = Math.round(imgW * scale);
                imgH = Math.round(imgH * scale);
                newEl = {
                    id: uid(), type: 'image',
                    x: Math.round(dropX - imgW / 2), y: Math.round(dropY - imgH / 2),
                    width: imgW, height: imgH, rotation: 0,
                    aspectRatio: imgW / imgH,
                    lockAspect: true,
                    src: dropData.url, cloudinaryId: dropData.publicId,
                    style: { opacity: 1 }
                };
            } else if (dropData.type === 'text') {
                const content = dropData.content || 'Text';
                // Size the text box based on content length
                const isLong = content.length > 200;
                newEl = {
                    id: uid(), type: 'text',
                    x: isLong ? 30 : Math.round(dropX - 100),
                    y: isLong ? 30 : Math.round(dropY - 15),
                    width: isLong ? 440 : 200,
                    height: isLong ? 640 : 60,
                    rotation: 0,
                    content: content,
                    style: { fontSize: isLong ? 11 : 16, fontFamily: 'Thonburi', color: '#ffffff', fontWeight: 'normal', textAlign: 'left' }
                };
            }

            if (newEl) {
                mutate(() => {
                    page.elements.push(newEl);
                });
                selectElement(pageIndex, newEl.id);
            }
        });
    }

    setupDropZone(pageLeftEl);
    setupDropZone(pageRightEl);

    // ==========================================
    // CONTENT LIBRARY
    // ==========================================
    function renderImageGrid() {
        const grid = document.getElementById('image-grid');
        if (!contentLibrary || !contentLibrary.images) {
            grid.innerHTML = '<p class="lib-loading">no images</p>';
            return;
        }
        grid.innerHTML = '';
        contentLibrary.images.forEach(img => {
            const imgEl = document.createElement('img');
            imgEl.src = img.thumbnailUrl;
            imgEl.alt = img.alt || '';
            imgEl.draggable = true;
            imgEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    type: 'image',
                    url: img.url,
                    publicId: img.publicId,
                    width: img.width,
                    height: img.height
                }));
            });
            grid.appendChild(imgEl);
        });
    }

    function populateSiteContent() {
        const container = document.getElementById('content-items');
        container.innerHTML = '';

        // Full essays from API (loaded with content library)
        if (contentLibrary && contentLibrary.essays) {
            contentLibrary.essays.forEach(essay => {
                const div = document.createElement('div');
                div.className = 'content-item content-item-essay';
                div.draggable = true;
                const preview = essay.text.slice(0, 120) + (essay.text.length > 120 ? '...' : '');
                div.innerHTML = `<div class="content-type">essay chapter</div><div class="content-title">${essay.title}</div><div class="content-preview">${preview}</div>`;
                div.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'text',
                        content: essay.text
                    }));
                });
                container.appendChild(div);
            });
        }

        // Substack essays from CARDS_DATA (title + excerpt, since full text is external)
        if (typeof CARDS_DATA !== 'undefined') {
            (CARDS_DATA.essays || []).forEach(essay => {
                const div = document.createElement('div');
                div.className = 'content-item';
                div.draggable = true;
                div.innerHTML = `<div class="content-type">essay (substack)</div><div class="content-title">${essay.title}</div><div class="content-preview">${essay.excerpt}</div>`;
                div.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'text',
                        content: essay.title + '\n\n' + essay.excerpt
                    }));
                });
                container.appendChild(div);
            });

            (CARDS_DATA.projects || []).forEach(proj => {
                const div = document.createElement('div');
                div.className = 'content-item';
                div.draggable = true;
                div.innerHTML = `<div class="content-type">project</div><div class="content-title">${proj.title}</div><div class="content-preview">${proj.excerpt}</div>`;
                div.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({
                        type: 'text',
                        content: proj.title + '\n\n' + proj.excerpt
                    }));
                });
                container.appendChild(div);
            });
        }
    }

    // ==========================================
    // TOOLBAR ACTIONS
    // ==========================================
    document.getElementById('btn-save').addEventListener('click', saveMagazine);

    document.getElementById('btn-add-page').addEventListener('click', () => {
        mutate(() => {
            const newOrder = magazineData.pages.length;
            magazineData.pages.push(makePage(newOrder));
        });
    });

    document.getElementById('btn-delete-page').addEventListener('click', () => {
        if (magazineData.pages.length <= 1) return;
        if (!confirm('Delete current page?')) return;
        mutate(() => {
            magazineData.pages.splice(currentSpread, 1);
            // Reindex orders
            magazineData.pages.forEach((p, i) => p.order = i);
            if (currentSpread >= magazineData.pages.length) {
                currentSpread = Math.max(0, magazineData.pages.length - 2);
                if (currentSpread % 2 !== 0) currentSpread--;
                if (currentSpread < 0) currentSpread = 0;
            }
            selectedElement = null;
        });
    });

    document.getElementById('page-bg-color').addEventListener('input', (e) => {
        const page = getPage(currentSpread);
        if (page) {
            page.backgroundColor = e.target.value;
            renderSpread();
        }
    });
    document.getElementById('page-bg-color').addEventListener('change', () => {
        pushUndo();
    });

    document.getElementById('btn-undo').addEventListener('click', undo);

    document.getElementById('btn-delete-el').addEventListener('click', () => {
        if (!selectedElement) return;
        mutate(() => {
            const page = getPage(selectedElement.pageIndex);
            if (page) {
                page.elements = page.elements.filter(e => e.id !== selectedElement.elementId);
            }
            selectedElement = null;
        });
    });

    document.getElementById('btn-bring-front').addEventListener('click', () => {
        const el = getSelectedEl();
        if (!el) return;
        mutate(() => {
            const page = getPage(selectedElement.pageIndex);
            const idx = page.elements.findIndex(e => e.id === el.id);
            if (idx < page.elements.length - 1) {
                page.elements.splice(idx, 1);
                page.elements.push(el);
            }
        });
    });

    document.getElementById('btn-send-back').addEventListener('click', () => {
        const el = getSelectedEl();
        if (!el) return;
        mutate(() => {
            const page = getPage(selectedElement.pageIndex);
            const idx = page.elements.findIndex(e => e.id === el.id);
            if (idx > 0) {
                page.elements.splice(idx, 1);
                page.elements.unshift(el);
            }
        });
    });

    // Shape buttons
    document.querySelectorAll('.shape-btn[data-shape]').forEach(btn => {
        btn.addEventListener('click', () => {
            const shapeType = btn.dataset.shape;
            const targetPageIndex = selectedElement ? selectedElement.pageIndex : currentSpread;
            const page = getPage(targetPageIndex);
            if (!page) return;
            const newEl = {
                id: uid(), type: 'shape',
                x: 150, y: 250,
                width: shapeType === 'line' ? 200 : 100,
                height: shapeType === 'line' ? 4 : 100,
                rotation: 0,
                shapeType,
                style: { fill: '#ffffff', stroke: '#ffffff', strokeWidth: shapeType === 'line' ? 2 : 0, opacity: 1, borderRadius: 0 }
            };
            mutate(() => { page.elements.push(newEl); });
            selectElement(targetPageIndex, newEl.id);
        });
    });

    // Text buttons
    document.getElementById('btn-add-heading').addEventListener('click', () => {
        const targetPageIndex = selectedElement ? selectedElement.pageIndex : currentSpread;
        const page = getPage(targetPageIndex);
        if (!page) return;
        const newEl = {
            id: uid(), type: 'text',
            x: 50, y: 100, width: 400, height: 60, rotation: 0,
            content: 'Heading',
            style: { fontSize: 36, fontFamily: 'Thonburi', color: '#ffffff', fontWeight: 'bold', textAlign: 'left' }
        };
        mutate(() => { page.elements.push(newEl); });
        selectElement(targetPageIndex, newEl.id);
    });

    document.getElementById('btn-add-body').addEventListener('click', () => {
        const targetPageIndex = selectedElement ? selectedElement.pageIndex : currentSpread;
        const page = getPage(targetPageIndex);
        if (!page) return;
        const newEl = {
            id: uid(), type: 'text',
            x: 50, y: 200, width: 400, height: 100, rotation: 0,
            content: 'Body text goes here',
            style: { fontSize: 16, fontFamily: 'Thonburi', color: '#ffffff', fontWeight: 'normal', textAlign: 'left' }
        };
        mutate(() => { page.elements.push(newEl); });
        selectElement(targetPageIndex, newEl.id);
    });

    // Library tabs
    document.querySelectorAll('.lib-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.lib-pane').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
        });
    });

    // Image upload
    document.getElementById('upload-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const res = await fetch('/api/archive/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + password
                    },
                    body: JSON.stringify({ image: reader.result })
                });
                if (res.ok) {
                    const data = await res.json();
                    // Add to library
                    if (!contentLibrary) contentLibrary = { images: [] };
                    contentLibrary.images.unshift({
                        url: data.url,
                        thumbnailUrl: data.thumbnailUrl,
                        publicId: data.publicId,
                        alt: file.name
                    });
                    renderImageGrid();
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================
    document.addEventListener('keydown', (e) => {
        // Ignore shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') return;

        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            undo();
        }
        if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            saveMagazine();
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedElement) {
                mutate(() => {
                    const page = getPage(selectedElement.pageIndex);
                    if (page) {
                        page.elements = page.elements.filter(el => el.id !== selectedElement.elementId);
                    }
                    selectedElement = null;
                });
            }
        }
        if (e.key === 'Escape') {
            editingTextId = null;
            selectedElement = null;
            renderAll();
        }
    });
})();
