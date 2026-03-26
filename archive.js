// Archive Magazine Reader
(function () {
    const CLOUD_BASE = 'https://res.cloudinary.com/djfrhmsgw/image/upload';
    function cloudinaryFullUrl(publicId, width) {
        if (width) return `${CLOUD_BASE}/q_auto,f_auto,w_${width}/${publicId}`;
        return `${CLOUD_BASE}/q_auto,f_auto/${publicId}`;
    }

    let magazineData = null;
    let currentSpread = 0; // index of the left page (0, 2, 4, ...)

    const pageLeft = document.getElementById('page-left');
    const pageRight = document.getElementById('page-right');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const indicator = document.getElementById('page-indicator');

    async function loadMagazine() {
        pageLeft.innerHTML = '<span class="loading-message">loading...</span>';
        pageRight.innerHTML = '';
        try {
            const res = await fetch('/api/archive');
            magazineData = await res.json();
            magazineData.pages.sort((a, b) => a.order - b.order);
            currentSpread = 0;
            renderSpread();
        } catch (e) {
            pageLeft.innerHTML = '<span class="loading-message">could not load archive</span>';
        }
    }

    function renderSpread() {
        if (!magazineData || !magazineData.pages.length) return;

        const pages = magazineData.pages;
        const leftPage = pages[currentSpread] || null;
        const rightPage = pages[currentSpread + 1] || null;

        renderPage(pageLeft, leftPage);
        renderPage(pageRight, rightPage);

        // Update controls
        prevBtn.disabled = currentSpread === 0;
        nextBtn.disabled = currentSpread + 2 >= pages.length;

        const leftNum = currentSpread + 1;
        const rightNum = Math.min(currentSpread + 2, pages.length);
        if (leftNum === rightNum) {
            indicator.textContent = `${leftNum} of ${pages.length}`;
        } else {
            indicator.textContent = `${leftNum}–${rightNum} of ${pages.length}`;
        }
    }

    function renderPage(container, pageData) {
        container.innerHTML = '';
        if (!pageData) {
            container.style.backgroundColor = '#111';
            return;
        }

        container.style.backgroundColor = pageData.backgroundColor || '#111';

        if (!pageData.elements || pageData.elements.length === 0) {
            container.innerHTML = '<span class="page-empty"></span>';
            return;
        }

        // Get container dimensions for scaling
        const containerRect = container.getBoundingClientRect();
        const scaleX = containerRect.width / 500;
        const scaleY = containerRect.height / 700;

        pageData.elements.forEach(el => {
            const div = document.createElement('div');
            div.className = 'page-element el-' + el.type;
            div.style.left = (el.x * scaleX) + 'px';
            div.style.top = (el.y * scaleY) + 'px';
            div.style.width = (el.width * scaleX) + 'px';
            div.style.height = (el.height * scaleY) + 'px';
            if (el.rotation) {
                div.style.transform = `rotate(${el.rotation}deg)`;
            }

            if (el.type === 'text') {
                div.textContent = el.content || '';
                if (el.style) {
                    if (el.style.fontSize) div.style.fontSize = (el.style.fontSize * scaleX) + 'px';
                    if (el.style.fontFamily) div.style.fontFamily = el.style.fontFamily;
                    if (el.style.color) div.style.color = el.style.color;
                    if (el.style.fontWeight) div.style.fontWeight = el.style.fontWeight;
                    if (el.style.textAlign) div.style.textAlign = el.style.textAlign;
                }
            } else if (el.type === 'image') {
                const img = document.createElement('img');
                if (el.cloudinaryId) {
                    const displayW = Math.round(el.width * scaleX * 2);
                    img.src = cloudinaryFullUrl(el.cloudinaryId, displayW);
                } else {
                    img.src = el.src || '';
                }
                img.alt = '';
                img.draggable = false;
                if (el.style?.opacity !== undefined) img.style.opacity = el.style.opacity;
                div.appendChild(img);
            } else if (el.type === 'shape') {
                div.innerHTML = renderShapeSVG(el);
            }

            container.appendChild(div);
        });
    }

    function renderShapeSVG(el) {
        const fill = el.style?.fill || '#ffffff';
        const stroke = el.style?.stroke || 'none';
        const strokeWidth = el.style?.strokeWidth || 0;
        const opacity = el.style?.opacity !== undefined ? el.style.opacity : 1;
        const borderRadius = el.style?.borderRadius || 0;

        switch (el.shapeType) {
            case 'rectangle':
                return `<svg viewBox="0 0 ${el.width} ${el.height}" preserveAspectRatio="none">
                    <rect x="${strokeWidth/2}" y="${strokeWidth/2}" width="${el.width - strokeWidth}" height="${el.height - strokeWidth}"
                        rx="${borderRadius}" ry="${borderRadius}"
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
                </svg>`;
            case 'circle':
                const cx = el.width / 2, cy = el.height / 2;
                const rx = (el.width - strokeWidth) / 2, ry = (el.height - strokeWidth) / 2;
                return `<svg viewBox="0 0 ${el.width} ${el.height}" preserveAspectRatio="none">
                    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
                </svg>`;
            case 'triangle':
                const tw = el.width - strokeWidth, th = el.height - strokeWidth;
                const off = strokeWidth / 2;
                return `<svg viewBox="0 0 ${el.width} ${el.height}" preserveAspectRatio="none">
                    <polygon points="${el.width/2},${off} ${off},${th + off} ${tw + off},${th + off}"
                        fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}"/>
                </svg>`;
            case 'line':
                return `<svg viewBox="0 0 ${el.width} ${el.height}" preserveAspectRatio="none">
                    <line x1="0" y1="${el.height/2}" x2="${el.width}" y2="${el.height/2}"
                        stroke="${stroke || fill}" stroke-width="${strokeWidth || 2}" opacity="${opacity}"/>
                </svg>`;
            default:
                return '';
        }
    }

    // Navigation
    prevBtn.addEventListener('click', () => {
        if (currentSpread > 0) {
            currentSpread -= 2;
            renderSpread();
        }
    });

    nextBtn.addEventListener('click', () => {
        if (magazineData && currentSpread + 2 < magazineData.pages.length) {
            currentSpread += 2;
            renderSpread();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prevBtn.click();
        if (e.key === 'ArrowRight') nextBtn.click();
    });

    // Touch/swipe support
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    document.addEventListener('touchend', (e) => {
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 60) {
            if (delta < 0) nextBtn.click();
            else prevBtn.click();
        }
    });

    // Responsive re-render on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => renderSpread(), 200);
    });

    // Init
    loadMagazine();
})();
