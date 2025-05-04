document.addEventListener('DOMContentLoaded', async () => {
    // Load initial images
    try {
        const response = await fetch('/api/initial-images');
        if (!response.ok) {
            throw new Error('Failed to fetch images');
        }
        
        const { background } = await response.json();
        
        // Set background image without transition
        document.body.style.setProperty('--featured-image', `url('${background}')`);
    } catch (error) {
        console.error('Error loading images:', error);
    }

    // Add hover animations for navigation buttons
    const buttons = document.querySelectorAll('.nav-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            const arrow = button.textContent.split('→')[1] || '';
            button.textContent = button.textContent.split('→')[0] + ' →' + arrow;
        });
    });

    // Add click handlers for project links
    const projectLinks = document.querySelectorAll('.project-link');
    projectLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Add your project navigation logic here
            console.log('Project clicked:', link.textContent.trim());
        });
    });

    // Contact form handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fromEmail = contactForm.querySelector('#from').value;
            const message = contactForm.querySelector('#message').value;
            
            alert('Message sent!\nFrom: ' + fromEmail + '\nMessage: ' + message);
            contactForm.reset();
        });
    }

    // Create popup element for live previews
    const popup = document.createElement('div');
    popup.className = 'preview-popup';
    document.body.appendChild(popup);

    // Handle preview popups
    const links = document.querySelectorAll('.inline-link');
    links.forEach(link => {
        const href = link.getAttribute('href');
        
        link.addEventListener('mouseenter', (e) => {
            const rect = link.getBoundingClientRect();

            // Create iframe if it doesn't exist
            if (!popup.querySelector('iframe')) {
                const iframe = document.createElement('iframe');
                iframe.src = href;
                popup.appendChild(iframe);
            } else {
                // Update iframe src if it exists
                popup.querySelector('iframe').src = href;
            }
            
            // Position popup
            const left = Math.min(
                Math.max(rect.left - 200 + rect.width / 2, 10),
                window.innerWidth - 410
            );
            const top = rect.bottom + 10;
            
            popup.style.left = left + 'px';
            popup.style.top = top + 'px';
            popup.classList.add('visible');
        });

        link.addEventListener('mouseleave', () => {
            popup.classList.remove('visible');
            // Clear iframe src when hidden
            const iframe = popup.querySelector('iframe');
            if (iframe) {
                iframe.src = 'about:blank';
            }
        });
    });
});