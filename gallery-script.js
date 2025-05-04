document.addEventListener('DOMContentLoaded', async () => {
    // Set background image
    try {
        const bgResponse = await fetch('/api/image/cloud_horizontal');
        if (bgResponse.ok) {
            const { url } = await bgResponse.json();
            document.body.style.backgroundImage = `url('${url}')`;
        }
    } catch (error) {
        console.error('Error setting background:', error);
    }
});