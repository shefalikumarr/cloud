document.addEventListener('DOMContentLoaded', async () => {
    // (Background image is set by inline script in index.html, not here)

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
    // Navigation link handling can be added here if needed in the future
});