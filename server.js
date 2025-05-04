require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Starting server configuration...');

// Request logging middleware
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.path,
        headers: req.headers
    });
    next();
});

// Parse JSON bodies
app.use(express.json());

// Configure CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ status: 'ok' });
});

console.log('Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);

// Endpoint to get signed URLs for images
app.get('/api/images', async (req, res) => {
    try {
        console.log('Fetching images from Cloudinary...');
        const result = await cloudinary.search
            .expression('folder:website')
            .with_field('context')
            .max_results(100)
            .execute();

        console.log('Found resources:', result.resources.length);
        
        const signedUrls = result.resources.map(resource => {
            console.log('Processing resource:', resource.public_id);
            // Thumbnail version - optimized for grid view
            const thumbnailUrl = cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: "auto" },
                    { effect: 'grayscale' },
                    { effect: 'contrast:80' }
                ]
            });
            
            // Full resolution version - maximum quality with no transformations except style
            const fullUrl = cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [
                    { effect: 'grayscale' },
                    { effect: 'contrast:80' },
                    { flags: "attachment" } // Forces the original resolution
                ]
            });
            
            console.log({
                publicId: resource.public_id,
                thumbnailUrl,
                fullUrl
            });
            
            return {
                url: thumbnailUrl,
                fullResUrl: fullUrl,
                alt: resource.context?.alt || 'Gallery image',
                publicId: resource.public_id
            };
        });

        console.log('Sending response with', signedUrls.length, 'images');
        res.json(signedUrls);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Endpoint to get signed URL for a specific image
app.get('/api/image/:id', async (req, res) => {
    try {
        const signedUrl = cloudinary.url(req.params.id, {
            sign_url: true,
            secure: true,
            transformation: [
                { effect: 'grayscale' },
                { effect: 'contrast:50' }
            ]
        });
        res.json({ url: signedUrl });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        res.status(500).json({ error: 'Failed to generate signed URL' });
    }
});

// Endpoint to get initial page load images
app.get('/api/initial-images', async (req, res) => {
    console.log('Initial images endpoint hit');
    try {
        const backgroundUrl = cloudinary.url('DSC02805_yy1nkv.jpg', {
            sign_url: true,
            secure: true,
            resource_type: 'image',
            transformation: [
                { effect: 'grayscale' },
                { effect: 'contrast:50' }
            ]
        });
        const featuredUrl = cloudinary.url('DSC01893_xt8pgi.jpg', {
            sign_url: true,
            secure: true,
            resource_type: 'image',
            transformation: [
                { effect: 'grayscale' },
                { effect: 'contrast:50' }
            ]
        });
        
        console.log('Generated URLs:', { backgroundUrl, featuredUrl });
        res.json({
            background: backgroundUrl,
            featured: featuredUrl
        });
    } catch (error) {
        console.error('Error in initial-images:', error);
        res.status(500).json({ error: 'Failed to generate signed URLs', details: error.message });
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error middleware caught:', err);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

// 404 handler
app.use((req, res) => {
    console.log('404 for path:', req.path);
    res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('- GET /api/test');
    console.log('- GET /api/initial-images');
});