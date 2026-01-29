// Centralized card data for all pages
// Each card has: id, category, order, and type-specific content

const CARDS_DATA = {
    // About card (special - only on home)
    about: {
        id: 'about',
        category: 'about',
        order: 0,
        imageId: 'DSC00827_pgfocy',
        content: {
            excerpt: "Hi, I am Shefali. I am a software engineer and this is the stuff I do in my free time. I love photography, tinkering with new technology, and synthesizing my thoughts about it once in a while. Most recently, I have been working on a personal calendar with all the features I wish gcal had, and photography collections inspired by a summer I only sort of remember. Highlights on this page, left nav for more details.",
            socials: [
                { platform: 'instagram', url: 'https://instagram.com/cleaurpatra', handle: '@cleaurpatra' },
                { platform: 'twitter', url: 'https://x.com/shef4li', handle: '@shef4li' },
                { platform: 'tiktok', url: 'https://tiktok.com/@cleaurpatra201', handle: '@cleaurpatra201' }
            ]
        }
    },

    // Essays
    essays: [
        {
            id: 'essay-panopticon',
            category: 'essay',
            order: 7,
            title: 'Entering the Panopticon',
            date: 'September 2025',
            excerpt: 'A reflection on taking photography seriously, growing a TikTok following, and discovering what makes a photograph truly interesting.',
            url: 'https://shefali999.substack.com/p/entering-the-panopticon',
            imageId: 'DSC02974_ojpe0v'
        },
        {
            id: 'essay-dilly-dally',
            category: 'essay',
            order: 4,
            title: 'I Found Time to Dilly-Dally',
            date: 'September 2025',
            excerpt: 'A poetic meditation on memory, inheritance, and the spaces we carry within us.',
            url: 'https://shefali999.substack.com/p/i-found-time-to-dilly-dally',
            imageId: 'DSCN2116_tokicx'
        },
        {
            id: 'essay-ai-arms-race',
            category: 'essay',
            order: 9,
            title: 'The AI Arms Race',
            date: 'February 2025',
            excerpt: 'Examining the current state of AI development and ethical considerations.',
            url: 'https://shefali999.substack.com/p/the-ai-arms-race',
            imageId: 'DSC00933_qzsufd'
        }
    ],

    // Projects
    projects: [
        {
            id: 'project-you-have-time',
            category: 'project',
            order: 2,
            title: '☆you have time☆',
            url: 'https://you-have-time-calendar.vercel.app',
            status: 'constantly evolving',
            techTags: ['React', 'Vite', 'Vercel/AWS', 'JavaScript', 'Systems Design', 'Databases', 'UI/UX Design', '0-100'],
            excerpt: 'A calendar and task manager created to address personal pain points with existing tooling (and just cause I can).',
            description: 'A calendar and task manager created to address personal pain points with existing tooling. Built to support both short-term and long-term planning in a way that makes sense to me, while also deepening personal technical breadth.',
            imageId: 'Screenshot_2026-01-28_at_11.02.59_PM_xzsfkc'
        },
        {
            id: 'project-image-resizer',
            category: 'project',
            order: 3,
            title: 'no gotcha image resizer',
            url: 'https://shefalikumarr.github.io/no_gotcha_image_resizer/',
            status: 'complete',
            techTags: ['HTML', 'JavaScript'],
            excerpt: 'A no strings attached image resizer built as a byproduct of needing to resize my gigantic (25mb+) digital camera photos down to 10mb for one reason or another. No storage, no ads, no tracking.',
            description: 'A no strings attached image resizer built as a byproduct of needing to resize my gigantic (25mb+) digital camera photos down to 10mb for various websites. No storage, no ads, no tracking - just a simple tool that does one thing well.',
            imageId: 'Screenshot_2026-01-28_at_11.00.07_PM_gpmupd'
        }
    ],

    // Photos
    photos: [
        {
            id: 'photo-wretchs-home',
            category: 'photo',
            order: 1,
            label: "the wretch's house is a home to me",
            imageId: 'DSCF9503_nchrtm',
            alt: "The Wretch's Home",
            link: 'wretchs-home.html',
            isGalleryLink: true
        },
        {
            id: 'photo-pov-summer',
            category: 'photo',
            order: 3,
            label: 'exhibit a; /POV summer (in progress)',
            imageId: 'DSC04552_wsfjxp.jpg',
            alt: 'POV Summer',
            link: null,
            isGalleryLink: false
        },
        {
            id: 'photo-5in1',
            category: 'photo',
            order: 5,
            label: 'exhibit b; /1in4 or 4in1',
            imageId: 'DSCF4881_zdulbb.jpg',
            alt: '1in4 or 4in1',
            link: '5in1.html',
            isGalleryLink: true
        },
        {
            id: 'photo-people',
            category: 'photo',
            order: 6,
            label: 'exhibit c; /people (in progress)',
            imageId: 'DSCN0971_j757nb.jpg',
            alt: 'People',
            link: null,
            isGalleryLink: false
        },
        {
            id: 'photo-watermelon',
            category: 'photo',
            order: 2,
            label: 'scene: finding out the watermelon you bought is yellow',
            imageId: '749603EF-6C28-4EEF-A1C8-B61200813F31_xdkkfb',
            alt: 'Yellow Watermelon Scene',
            link: 'watermelon.html',
            isGalleryLink: true
        },
        {
            id: 'photo-full-gallery',
            category: 'photo',
            order: 10,
            label: 'view full gallery →',
            imageId: 'DSCF2064_o73ntf.jpg',
            alt: 'Gallery',
            link: 'gallery.html',
            isGalleryLink: true,
            isFullGallery: true
        }
    ]
};

// Helper to get Cloudinary URL
function getCloudinaryUrl(imageId, width = 600) {
    return `https://res.cloudinary.com/djfrhmsgw/image/upload/q_auto,w_${width}/${imageId}`;
}

// Render functions for different card types
const CardRenderers = {
    renderAboutCard(data) {
        const imageUrl = data.imageId ? getCloudinaryUrl(data.imageId, 800) : '';
        const bgStyle = data.imageId ? `style="background-image: url('${imageUrl}'); background-size: 100% 100%; background-position: center;"` : '';
        const tileClass = data.imageId ? 'content-tile tile-about tile-about-with-image' : 'content-tile tile-about';
        
        return `
            <article class="${tileClass}" data-category="about" data-order="${data.order}" ${bgStyle}>
                <div class="tile-content tile-content-overlay">
                    <h3 class="tile-title"></h3>
                    <p class="tile-excerpt">${data.content.excerpt}</p>
                    <div class="social-icons">
                        <a href="${data.content.socials[0].url}" target="_blank" class="social-link" title="Instagram">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                        <a href="${data.content.socials[1].url}" target="_blank" class="social-link" title="Twitter/X">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a href="${data.content.socials[2].url}" target="_blank" class="social-link" title="TikTok">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                        </a>
                    </div>
                </div>
            </article>
        `;
    },

    renderEssayCard(essay, variant = 'tile') {
        if (variant === 'tile') {
            // If essay has an image, render with background
            if (essay.imageId) {
                const imageUrl = getCloudinaryUrl(essay.imageId);
                return `
                    <article class="content-tile tile-essay tile-essay-with-image" data-category="essay" data-order="${essay.order}" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                        <span class="tile-tag tag-essay">essay</span>
                        <div class="tile-content tile-content-overlay">
                            <h3 class="tile-title">${essay.title}</h3>
                            <p class="tile-meta">${essay.date}</p>
                            <p class="tile-excerpt">${essay.excerpt}</p>
                            <a href="${essay.url}" class="tile-link" target="_blank">read →</a>
                        </div>
                    </article>
                `;
            }
            return `
                <article class="content-tile tile-essay" data-category="essay" data-order="${essay.order}">
                    <span class="tile-tag tag-essay">essay</span>
                    <div class="tile-content">
                        <h3 class="tile-title">${essay.title}</h3>
                        <p class="tile-meta">${essay.date}</p>
                        <p class="tile-excerpt">${essay.excerpt}</p>
                        <a href="${essay.url}" class="tile-link" target="_blank">read →</a>
                    </div>
                </article>
            `;
        }
        // Add other variants as needed
        return '';
    },

    renderProjectCard(project, variant = 'tile') {
        const techTagsHtml = project.techTags.slice(0, variant === 'tile' ? 3 : project.techTags.length)
            .map(tag => `<span class="tech-tag">${tag}</span>`).join('');
        
        if (variant === 'tile') {
            const titleHtml = project.url 
                ? `<a href="${project.url}" target="_blank">${project.title}</a>`
                : project.title;
            
            // If project has an image, render as photo-style tile with background
            if (project.imageId) {
                const imageUrl = getCloudinaryUrl(project.imageId);
                return `
                    <article class="content-tile tile-project tile-project-with-image" data-category="project" data-order="${project.order}" style="background-image: url('${imageUrl}'); background-size: cover; background-position: center;">
                        <span class="tile-tag tag-project">project</span>
                        <div class="tile-content tile-content-overlay">
                            <h3 class="tile-title">${titleHtml}</h3>
                            <div class="tech-tags">${techTagsHtml}</div>
                            <p class="tile-excerpt">${project.excerpt}</p>
                        </div>
                    </article>
                `;
            }
            
            return `
                <article class="content-tile tile-project" data-category="project" data-order="${project.order}">
                    <span class="tile-tag tag-project">project</span>
                    <div class="tile-content">
                        <h3 class="tile-title">${titleHtml}</h3>
                        <div class="tech-tags">${techTagsHtml}</div>
                        <p class="tile-excerpt">${project.excerpt}</p>
                    </div>
                </article>
            `;
        } else if (variant === 'full') {
            const allTagsHtml = project.techTags.map(tag => `<span class="tech-tag">${tag}</span>`).join('');
            const titleHtml = project.url 
                ? `<a href="${project.url}" target="_blank">${project.title}</a>`
                : project.title;
            
            // If project has an image, include it in full view
            const imageHtml = project.imageId 
                ? `<img src="${getCloudinaryUrl(project.imageId, 800)}" alt="${project.title}" class="project-image">`
                : '';
            
            return `
                <article class="project-card${project.imageId ? ' project-card-with-image' : ''}">
                    ${imageHtml}
                    <div class="project-card-content">
                        <h2 class="project-title">${titleHtml} <span class="project-status">${project.status}</span></h2>
                        <div class="tech-stack">${allTagsHtml}</div>
                        <p class="project-description">${project.description}</p>
                    </div>
                </article>
            `;
        }
        return '';
    },

    renderPhotoCard(photo, variant = 'tile') {
        const imageUrl = getCloudinaryUrl(photo.imageId);
        
        if (variant === 'diningroom') {
            // Skip gallery links for diningroom view (only show exhibits)
            if (photo.isFullGallery) return '';
            
            const linkWrapper = photo.link ? 
                [`<a href="${photo.link}" class="diningroom-tile" style="position:relative;display:block;text-decoration:none;">`, `</a>`] :
                [`<div class="diningroom-tile" style="position:relative;">`, `</div>`];
            
            return `
                ${linkWrapper[0]}
                    <img src="${imageUrl}" alt="${photo.alt}" style="width:100%;height:100%;object-fit:cover;">
                    <div style="position:absolute;bottom:0;left:0;width:100%;background:rgba(0,0,0,0.32);color:#fff;text-align:center;font-size:1em;padding:0.4em 0;">${photo.label}</div>
                ${linkWrapper[1]}
            `;
        }
        
        const overlayClass = photo.isFullGallery ? 'tile-overlay tile-overlay-gallery' : 'tile-overlay';
        
        if (photo.link) {
            return `
                <a href="${photo.link}" class="content-tile tile-photo tile-gallery-link" data-category="photo" data-order="${photo.order}">
                    <span class="tile-tag tag-photo">photo</span>
                    <img src="${imageUrl}" alt="${photo.alt}">
                    <div class="${overlayClass}">
                        <span class="tile-label">${photo.label}</span>
                    </div>
                </a>
            `;
        }
        return `
            <article class="content-tile tile-photo" data-category="photo" data-order="${photo.order}">
                <span class="tile-tag tag-photo">photo</span>
                <img src="${imageUrl}" alt="${photo.alt}">
                <div class="tile-overlay">
                    <span class="tile-label">${photo.label}</span>
                </div>
            </article>
        `;
    }
};

// Main function to render cards into a container
function renderCards(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
        categories = ['about', 'essay', 'project', 'photo'], // which categories to include
        variant = 'tile', // 'tile' or 'full'
        sort = true // whether to sort by order
    } = options;

    let cards = [];

    // Collect cards based on categories
    if (categories.includes('about')) {
        cards.push({ ...CARDS_DATA.about, type: 'about' });
    }
    if (categories.includes('essay')) {
        CARDS_DATA.essays.forEach(e => cards.push({ ...e, type: 'essay' }));
    }
    if (categories.includes('project')) {
        CARDS_DATA.projects.forEach(p => cards.push({ ...p, type: 'project' }));
    }
    if (categories.includes('photo')) {
        CARDS_DATA.photos.forEach(p => cards.push({ ...p, type: 'photo' }));
    }

    // Sort by order if requested
    if (sort) {
        cards.sort((a, b) => a.order - b.order);
    }

    // Render each card
    let html = '';
    cards.forEach(card => {
        switch (card.type) {
            case 'about':
                html += CardRenderers.renderAboutCard(card);
                break;
            case 'essay':
                html += CardRenderers.renderEssayCard(card, variant);
                break;
            case 'project':
                html += CardRenderers.renderProjectCard(card, variant);
                break;
            case 'photo':
                html += CardRenderers.renderPhotoCard(card, variant);
                break;
        }
    });

    container.innerHTML = html;
}

// Export for use in other scripts (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CARDS_DATA, CardRenderers, renderCards, getCloudinaryUrl };
}
