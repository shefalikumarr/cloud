// Windows 95 Desktop Functionality
class DesktopManager {
    constructor() {
        this.activeWindow = null;
        this.windowZIndex = 100;
        this.galleryLoaded = false;
        this.selectedGalleryItem = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateClock();
        this.openWindow('about'); // Open about window by default
        
        // Update clock every second
        setInterval(() => this.updateClock(), 1000);
        
        // Handle window resize/orientation change
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    setupEventListeners() {
        // Desktop icon double-click
        document.querySelectorAll('.icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                const windowId = e.currentTarget.dataset.window;
                this.openWindow(windowId);
            });
            
            icon.addEventListener('click', (e) => {
                this.selectIcon(e.currentTarget);
            });
        });

        // Window controls - support both click and touch
        document.querySelectorAll('.window-control').forEach(control => {
            control.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Prevent dragging when clicking controls
                
                const window = e.target.closest('.window');
                const action = e.target.classList.contains('close') ? 'close' :
                              e.target.classList.contains('minimize') ? 'minimize' :
                              e.target.classList.contains('maximize') ? 'maximize' : null;
                
                if (action && window) {
                    this.handleWindowControl(window, action);
                }
            });
            
            // Add touch support for mobile
            control.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const window = e.target.closest('.window');
                const action = e.target.classList.contains('close') ? 'close' :
                              e.target.classList.contains('minimize') ? 'minimize' :
                              e.target.classList.contains('maximize') ? 'maximize' : null;
                
                if (action && window) {
                    this.handleWindowControl(window, action);
                }
            });
        });

        // Window dragging
        document.querySelectorAll('.window-header').forEach(header => {
            this.makeDraggable(header.parentElement);
        });

        // Window focus
        document.querySelectorAll('.window').forEach(window => {
            window.addEventListener('mousedown', () => {
                this.focusWindow(window);
            });
        });

        // Start button
        const startButton = document.querySelector('.start-button');
        const startMenu = document.getElementById('start-menu');
        
        startButton.addEventListener('click', () => {
            this.toggleStartMenu();
        });

        // Close start menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
                this.closeStartMenu();
            }
        });

        // Taskbar items
        document.querySelectorAll('.taskbar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const windowId = e.currentTarget.dataset.window;
                this.toggleWindow(windowId);
            });
        });

        // Form submission
        const contactForm = document.querySelector('.email-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactForm(e.target);
            });
        }

        // Link handling
        document.querySelectorAll('.retro-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // In a real implementation, you'd navigate to the actual pages
                alert(`Navigate to: ${link.textContent}`);
            });
        });

        // Desktop click to deselect icons
        document.querySelector('.desktop').addEventListener('click', (e) => {
            if (e.target.classList.contains('desktop') || e.target.classList.contains('desktop-background')) {
                this.deselectAllIcons();
            }
        });
    }

    selectIcon(icon) {
        this.deselectAllIcons();
        icon.classList.add('selected');
    }

    deselectAllIcons() {
        document.querySelectorAll('.icon').forEach(icon => {
            icon.classList.remove('selected');
        });
    }

    openWindow(windowId) {
        const window = document.getElementById(`${windowId}-window`);
        if (window) {
            window.classList.remove('hidden');
            
            // Position window appropriately for mobile
            this.positionWindowForDevice(window);
            
            this.focusWindow(window);
            this.updateTaskbar(windowId, true);
            
            // Load gallery images when gallery window is opened
            if (windowId === 'gallery' && !this.galleryLoaded) {
                this.loadGalleryImages();
            }
        }
    }

    positionWindowForDevice(windowElement) {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // On mobile, make windows smaller so background is visible
            const padding = 30;
            const windowWidth = window.innerWidth - (padding * 2);
            const windowHeight = Math.min(400, window.innerHeight - 120); // Max 400px height, leave room for background
            
            windowElement.style.top = '40px';
            windowElement.style.left = padding + 'px';
            windowElement.style.width = windowWidth + 'px';
            windowElement.style.height = windowHeight + 'px';
            windowElement.style.maxWidth = windowWidth + 'px';
            windowElement.style.maxHeight = windowHeight + 'px';
        }
    }

    closeWindow(window) {
        window.classList.add('hidden');
        const windowId = window.id.replace('-window', '');
        this.updateTaskbar(windowId, false);
        
        // Focus next available window
        const visibleWindows = document.querySelectorAll('.window:not(.hidden)');
        if (visibleWindows.length > 0) {
            this.focusWindow(visibleWindows[visibleWindows.length - 1]);
        }
    }

    minimizeWindow(window) {
        window.style.display = 'none';
        const windowId = window.id.replace('-window', '');
        const taskbarItem = document.querySelector(`.taskbar-item[data-window="${windowId}"]`);
        if (taskbarItem) {
            taskbarItem.classList.remove('active');
        }
    }

    maximizeWindow(window) {
        const isMobile = window.innerWidth <= 768;
        
        if (window.classList.contains('maximized')) {
            // Restore to original size
            window.classList.remove('maximized');
            if (isMobile) {
                // On mobile, restore to mobile-appropriate size
                this.positionWindowForDevice(window);
            } else {
                // On desktop, restore to stored dimensions
                window.style.top = window.dataset.originalTop || '100px';
                window.style.left = window.dataset.originalLeft || '100px';
                window.style.width = window.dataset.originalWidth || '500px';
                window.style.height = window.dataset.originalHeight || '400px';
            }
        } else {
            // Store original dimensions
            window.dataset.originalTop = window.style.top || window.offsetTop + 'px';
            window.dataset.originalLeft = window.style.left || window.offsetLeft + 'px';
            window.dataset.originalWidth = window.style.width || window.offsetWidth + 'px';
            window.dataset.originalHeight = window.style.height || window.offsetHeight + 'px';
            
            window.classList.add('maximized');
            
            if (isMobile) {
                // On mobile, maximize to full screen minus taskbar
                window.style.top = '0px';
                window.style.left = '0px';
                window.style.width = '100vw';
                window.style.height = 'calc(100vh - 40px)';
            }
        }
    }

    handleWindowControl(window, action) {
        // Special handling for carousel window
        if (window.id === 'carousel-window' && action === 'close') {
            this.closeCarouselWindow();
            return;
        }
        
        switch (action) {
            case 'close':
                this.closeWindow(window);
                break;
            case 'minimize':
                this.minimizeWindow(window);
                break;
            case 'maximize':
                this.maximizeWindow(window);
                break;
        }
    }

    focusWindow(window) {
        // Remove focus from all windows
        document.querySelectorAll('.window').forEach(w => {
            w.style.zIndex = '100';
        });
        
        // Focus the clicked window
        window.style.zIndex = ++this.windowZIndex;
        this.activeWindow = window;
        
        // Update taskbar
        const windowId = window.id.replace('-window', '');
        document.querySelectorAll('.taskbar-item').forEach(item => {
            item.classList.remove('active');
        });
        const taskbarItem = document.querySelector(`.taskbar-item[data-window="${windowId}"]`);
        if (taskbarItem) {
            taskbarItem.classList.add('active');
        }
    }

    toggleWindow(windowId) {
        const window = document.getElementById(`${windowId}-window`);
        if (window) {
            if (window.style.display === 'none') {
                window.style.display = 'block';
                this.focusWindow(window);
            } else if (window === this.activeWindow) {
                this.minimizeWindow(window);
            } else {
                this.focusWindow(window);
            }
        }
    }

    updateTaskbar(windowId, isOpen) {
        let taskbarItem = document.querySelector(`.taskbar-item[data-window="${windowId}"]`);
        
        if (isOpen && !taskbarItem) {
            // Create taskbar item
            const taskbarItems = document.querySelector('.taskbar-items');
            taskbarItem = document.createElement('div');
            taskbarItem.className = 'taskbar-item';
            taskbarItem.dataset.window = windowId;
            taskbarItem.textContent = this.getWindowTitle(windowId);
            taskbarItems.appendChild(taskbarItem);
            
            taskbarItem.addEventListener('click', (e) => {
                const windowId = e.currentTarget.dataset.window;
                this.toggleWindow(windowId);
            });
        } else if (!isOpen && taskbarItem) {
            // Remove taskbar item
            taskbarItem.remove();
        }
    }

    getWindowTitle(windowId) {
        const titles = {
            'about': 'About.exe',
            'gallery': 'Gallery',
            'essays': 'Essays.txt',
            'projects': 'Projects',
            'contact': 'Mail',
            'carousel': 'Image Viewer'
        };
        return titles[windowId] || windowId;
    }

    toggleStartMenu() {
        const startMenu = document.getElementById('start-menu');
        const startButton = document.querySelector('.start-button');
        
        if (startMenu.classList.contains('hidden')) {
            startMenu.classList.remove('hidden');
            startButton.classList.add('active');
        } else {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
        }
    }

    closeStartMenu() {
        const startMenu = document.getElementById('start-menu');
        const startButton = document.querySelector('.start-button');
        
        startMenu.classList.add('hidden');
        startButton.classList.remove('active');
    }

    makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let isDragging = false;
        const header = element.querySelector('.window-header');
        const self = this; // Store reference to 'this' for use in nested functions
        
        // Mouse events
        header.addEventListener('mousedown', startDrag);
        
        // Touch events for mobile
        header.addEventListener('touchstart', startDrag, { passive: false });
        
        function startDrag(e) {
            // Don't start dragging if clicking on window controls
            if (e.target.classList.contains('window-control')) {
                return;
            }
            
            e.preventDefault();
            isDragging = true;
            
            // Get coordinates from either mouse or touch event
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            pos3 = clientX;
            pos4 = clientY;
            
            // Add event listeners for mouse and touch
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('mousemove', drag);
            document.addEventListener('touchend', stopDrag);
            document.addEventListener('touchmove', drag, { passive: false });
            
            // Focus the window being dragged
            if (self && self.windowZIndex !== undefined) {
                element.style.zIndex = ++self.windowZIndex;
            }
        }
        
        function drag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            // Get coordinates from either mouse or touch event
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            pos1 = pos3 - clientX;
            pos2 = pos4 - clientY;
            pos3 = clientX;
            pos4 = clientY;
            
            const newTop = element.offsetTop - pos2;
            const newLeft = element.offsetLeft - pos1;
            
            // Boundary checking - keep window within viewport
            const maxTop = window.innerHeight - element.offsetHeight - 40; // Account for taskbar
            const maxLeft = window.innerWidth - element.offsetWidth;
            const minTop = 0;
            const minLeft = -20; // Allow slight off-screen positioning
            
            element.style.top = Math.max(minTop, Math.min(newTop, maxTop)) + "px";
            element.style.left = Math.max(minLeft, Math.min(newLeft, maxLeft)) + "px";
        }
        
        function stopDrag() {
            isDragging = false;
            
            // Remove all event listeners
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchend', stopDrag);
            document.removeEventListener('touchmove', drag);
        }
    }

    updateClock() {
        const clock = document.getElementById('clock');
        const now = new Date();
        const timeString = now.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        if (clock) {
            clock.textContent = timeString;
        }
    }

    handleContactForm(form) {
        const formData = new FormData(form);
        const from = formData.get('from') || form.querySelector('input[type="email"]').value;
        const subject = formData.get('subject') || form.querySelector('input[placeholder*="Subject"]').value;
        const message = formData.get('message') || form.querySelector('textarea').value;
        
        // Simulate sending email
        if (from && message) {
            alert(`Message sent successfully!\n\nFrom: ${from}\nSubject: ${subject || 'Hello from your website'}\nMessage: ${message.substring(0, 50)}...`);
            form.reset();
        } else {
            alert('Please fill in all required fields.');
        }
    }

    async loadGalleryImages() {
        const galleryGrid = document.getElementById('desktop-gallery-grid');
        const galleryStatus = document.getElementById('gallery-status');
        
        if (!galleryGrid) return;
        
        try {
            galleryStatus.textContent = 'Loading images...';
            
            const response = await fetch('/api/images');
            if (!response.ok) {
                throw new Error('Failed to fetch images');
            }

            const images = await response.json();
            galleryGrid.innerHTML = ''; // Clear loading message

            if (images.length === 0) {
                galleryGrid.innerHTML = '<div class="gallery-error">No images found in gallery.</div>';
                galleryStatus.textContent = 'No images available';
                return;
            }

            // Create and append images
            images.forEach((image, index) => {
                const container = document.createElement('div');
                container.className = 'gallery-item';
                container.dataset.imageIndex = index;
                container.dataset.fullUrl = image.fullResUrl;
                
                const img = document.createElement('img');
                img.src = image.url;
                img.alt = image.alt || 'Gallery image';
                img.draggable = false;
                
                // Create label for the image
                const label = document.createElement('span');
                label.className = 'icon-label';
                // Create a filename-like label from the publicId or alt text
                const filename = image.publicId ? 
                    image.publicId.split('/').pop() + '.jpg' : 
                    (image.alt || `Image_${String(index + 1).padStart(3, '0')}.jpg`);
                label.textContent = filename;
                
                // Add load handler for fade-in effect
                img.onload = () => {
                    container.classList.add('loaded');
                };
                
                // Add click handler for selection and double-click for viewing
                let clickCount = 0;
                container.addEventListener('click', (e) => {
                    clickCount++;
                    if (clickCount === 1) {
                        setTimeout(() => {
                            if (clickCount === 1) {
                                // Single click - select
                                this.selectGalleryItem(container);
                            } else {
                                // Double click - open image
                                this.openGalleryImage(image.fullResUrl, image.alt || filename, image);
                            }
                            clickCount = 0;
                        }, 300);
                    }
                });
                
                container.appendChild(img);
                container.appendChild(label);
                galleryGrid.appendChild(container);
            });

            galleryStatus.textContent = `${images.length} images loaded`;
            this.galleryLoaded = true;

        } catch (error) {
            console.error('Error loading gallery:', error);
            galleryGrid.innerHTML = '<div class="gallery-error">Failed to load gallery images. Please try again later.</div>';
            galleryStatus.textContent = 'Error loading images';
        }
    }

    selectGalleryItem(item) {
        // Remove selection from all items
        document.querySelectorAll('.gallery-item').forEach(galleryItem => {
            galleryItem.classList.remove('selected');
        });
        
        // Select the clicked item
        item.classList.add('selected');
        this.selectedGalleryItem = item;
        
        // Update status
        const galleryStatus = document.getElementById('gallery-status');
        const imageIndex = parseInt(item.dataset.imageIndex) + 1;
        const totalImages = document.querySelectorAll('.gallery-item').length;
        galleryStatus.textContent = `Image ${imageIndex} of ${totalImages} selected`;
    }

    openGalleryImage(fullUrl, alt, clickedImageData) {
        // Get all images from the gallery
        const allImages = this.getAllGalleryImages();
        
        // Find the index of the clicked image
        const currentIndex = allImages.findIndex(img => img.fullUrl === fullUrl);
        
        // Create carousel window
        this.createCarouselWindow(allImages, currentIndex);
    }

    getAllGalleryImages() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        const images = [];
        
        galleryItems.forEach((item, index) => {
            const img = item.querySelector('img');
            const label = item.querySelector('.icon-label');
            if (img && item.dataset.fullUrl) {
                images.push({
                    url: img.src, // thumbnail URL
                    fullUrl: item.dataset.fullUrl, // full resolution URL
                    alt: img.alt || label?.textContent || 'Gallery image',
                    index: index
                });
            }
        });
        
        return images;
    }

    createCarouselWindow(images, currentIndex) {
        // Check if carousel window already exists
        let carouselWindow = document.getElementById('carousel-window');
        if (carouselWindow) {
            carouselWindow.remove();
        }

        // Create carousel window HTML
        const windowHtml = `
            <div class="window" id="carousel-window">
                <div class="window-header">
                    <span class="window-title">Image Viewer - ${images[currentIndex].alt}</span>
                    <div class="window-controls">
                        <button class="window-control minimize">_</button>
                        <button class="window-control maximize">□</button>
                        <button class="window-control close">×</button>
                    </div>
                </div>
                <div class="window-content">
                    <div class="window-menu">
                        <span class="menu-item">File</span>
                        <span class="menu-item">Edit</span>
                        <span class="menu-item">View</span>
                        <span class="menu-item">Tools</span>
                    </div>
                    <div class="content-area carousel-content">
                        <div class="carousel-thumbnails" id="carousel-thumbnails">
                            ${images.map((img, index) => `
                                <div class="carousel-thumb ${index === currentIndex ? 'active' : ''}" data-index="${index}">
                                    <img src="${img.url}" alt="${img.alt}" />
                                </div>
                            `).join('')}
                        </div>
                        <div class="carousel-main-image">
                            <div class="carousel-nav-left">◀</div>
                            <img id="carousel-main-img" src="${images[currentIndex].fullUrl}" alt="${images[currentIndex].alt}" />
                            <div class="carousel-nav-right">▶</div>
                        </div>
                        <div class="carousel-info">
                            <span id="carousel-counter">${currentIndex + 1} of ${images.length}</span>
                            <span id="carousel-filename">${images[currentIndex].alt}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add window to desktop
        const desktop = document.querySelector('.desktop');
        desktop.insertAdjacentHTML('beforeend', windowHtml);
        
        carouselWindow = document.getElementById('carousel-window');
        
        // Position the window
        this.positionCarouselWindow(carouselWindow);
        
        // Make draggable
        this.makeDraggable(carouselWindow);
        
        // Setup carousel functionality
        this.setupCarouselNavigation(images, currentIndex);
        
        // Focus the window
        this.focusWindow(carouselWindow);
        this.updateTaskbar('carousel', true);
        
        return carouselWindow;
    }

    positionCarouselWindow(window) {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            window.style.top = '20px';
            window.style.left = '10px';
            window.style.width = 'calc(100vw - 20px)';
            window.style.height = 'calc(100vh - 80px)';
        } else {
            window.style.top = '60px';
            window.style.left = '100px';
            window.style.width = '700px';
            window.style.height = '500px';
        }
    }

    setupCarouselNavigation(images, initialIndex) {
        let currentIndex = initialIndex;
        const mainImg = document.getElementById('carousel-main-img');
        const counter = document.getElementById('carousel-counter');
        const filename = document.getElementById('carousel-filename');
        const thumbnails = document.querySelectorAll('.carousel-thumb');
        const navLeft = document.querySelector('.carousel-nav-left');
        const navRight = document.querySelector('.carousel-nav-right');

        const updateImage = (index) => {
            currentIndex = index;
            mainImg.src = images[index].fullUrl;
            mainImg.alt = images[index].alt;
            counter.textContent = `${index + 1} of ${images.length}`;
            filename.textContent = images[index].alt;
            
            // Update active thumbnail
            thumbnails.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
            
            // Update window title
            const windowTitle = document.querySelector('#carousel-window .window-title');
            windowTitle.textContent = `Image Viewer - ${images[index].alt}`;
        };

        // Navigation buttons
        navLeft.addEventListener('click', () => {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
            updateImage(newIndex);
        });

        navRight.addEventListener('click', () => {
            const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
            updateImage(newIndex);
        });

        // Thumbnail clicks
        thumbnails.forEach((thumb, index) => {
            thumb.addEventListener('click', () => {
                updateImage(index);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            const carouselWindow = document.getElementById('carousel-window');
            if (!carouselWindow || carouselWindow.classList.contains('hidden')) return;
            
            if (e.key === 'ArrowLeft') {
                const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
                updateImage(newIndex);
            } else if (e.key === 'ArrowRight') {
                const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
                updateImage(newIndex);
            }
        });

        // Window controls are handled by the existing setupEventListeners method
        // Just need to make sure our close method gets called for carousel windows
    }

    closeCarouselWindow() {
        const carouselWindow = document.getElementById('carousel-window');
        if (carouselWindow) {
            carouselWindow.remove();
            this.updateTaskbar('carousel', false);
        }
    }

    handleWindowResize() {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Reposition all visible windows to fit the new screen size
            document.querySelectorAll('.window:not(.hidden)').forEach(windowElement => {
                this.positionWindowForDevice(windowElement);
            });
        }
    }
}

// Initialize desktop when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DesktopManager();
});

// Add some retro sound effects (optional)
function playRetroSound(type) {
    // You could add actual sound files here
    // For now, we'll just add visual feedback
    const sounds = {
        'click': () => console.log('*click*'),
        'open': () => console.log('*window open*'),
        'close': () => console.log('*window close*'),
        'error': () => console.log('*error beep*')
    };
    
    if (sounds[type]) {
        sounds[type]();
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Alt + Tab for window switching (simplified)
    if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
        const visibleWindows = document.querySelectorAll('.window:not(.hidden)');
        if (visibleWindows.length > 1) {
            // Simple window cycling
            const currentIndex = Array.from(visibleWindows).findIndex(w => w.style.zIndex == Math.max(...Array.from(visibleWindows).map(w => parseInt(w.style.zIndex) || 100)));
            const nextIndex = (currentIndex + 1) % visibleWindows.length;
            const desktop = document.querySelector('.desktop-manager') || new DesktopManager();
            if (desktop.focusWindow) {
                desktop.focusWindow(visibleWindows[nextIndex]);
            }
        }
    }
    
    // Escape to close start menu
    if (e.key === 'Escape') {
        const startMenu = document.getElementById('start-menu');
        if (!startMenu.classList.contains('hidden')) {
            const desktop = document.querySelector('.desktop-manager') || new DesktopManager();
            if (desktop.closeStartMenu) {
                desktop.closeStartMenu();
            }
        }
    }
});
