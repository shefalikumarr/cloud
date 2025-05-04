async function loadGalleryImages() {
    const photoGrid = document.getElementById('photo-grid');
    
    try {
        const response = await fetch('/api/images');
        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }

        const images = await response.json();
        photoGrid.innerHTML = ''; // Clear loading message

        // Create and append images
        images.forEach(image => {
            const container = document.createElement('div');
            container.className = 'gallery-image-container';
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.alt || 'Gallery image';
            img.className = 'gallery-image';
            
            // Store full resolution URL
            const fullResUrl = image.fullResUrl;
            if (!fullResUrl) {
                console.error('No full resolution URL for image:', image);
                return;
            }
            
            // Add load handler for fade-in effect
            img.onload = () => img.classList.add('loaded');
            
            // Add click handler
            container.addEventListener('click', () => {
                console.log('Opening image:', fullResUrl);
                openModal(fullResUrl);
            });
            
            container.appendChild(img);
            photoGrid.appendChild(container);
        });

    } catch (error) {
        console.error('Error loading gallery:', error);
        photoGrid.innerHTML = '<div class="error">Failed to load gallery images. Please try again later.</div>';
    }
}

// Load images when the page loads
document.addEventListener('DOMContentLoaded', loadGalleryImages);

// Modal functionality
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.querySelector('.modal');
    const modalImg = document.querySelector('.modal-content');
    const closeButton = document.querySelector('.modal-close');

    // Function to open the modal with the high-resolution image
    window.openModal = function(fullResUrl) {
        if (!fullResUrl) {
            console.error('No high-resolution URL provided');
            return;
        }
        
        // Preload the image
        const img = new Image();
        img.onload = function() {
            modalImg.src = fullResUrl;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };
        img.src = fullResUrl;
        console.log('Loading image:', fullResUrl);
    }

    function closeModal() {
        modal.classList.remove('active');
        modalImg.classList.remove('zoomed');
        modalImg.src = ''; // Clear the image source
        document.body.style.overflow = '';
    }

    closeButton.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    modalImg.addEventListener('click', (e) => {
        e.stopPropagation();
        modalImg.classList.toggle('zoomed');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});