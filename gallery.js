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
            img.src = image.url; // Thumbnail URL for grid view
            img.alt = image.alt;
            img.className = 'gallery-image';
            img.dataset.fullResUrl = image.fullResUrl; // Store high-res URL as data attribute
            
            // Add load handler for fade-in effect
            img.onload = () => img.classList.add('loaded');
            
            // Add click handler for each image
            img.addEventListener('click', function() {
                openModal(this.dataset.fullResUrl);
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
        
        console.log('Opening modal with URL:', fullResUrl);
        modal.classList.add('active');
        modalImg.src = fullResUrl;
        document.body.style.overflow = 'hidden';
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