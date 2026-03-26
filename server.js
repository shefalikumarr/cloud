require('dotenv').config();
const express = require('express');
const cloudinary = require('cloudinary').v2;
const path = require('path');

const app = express();

// Security headers middleware
app.use((req, res, next) => {
    res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    });
    
    // Redirect HTTP to HTTPS
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.hostname}${req.url}`);
    }
    
    next();
});

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

console.log('Starting server configuration...');

// Serve static files first
app.use(express.static(path.join(__dirname)));

// Request logging middleware
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        path: req.path,
        headers: req.headers
    });
    next();
});

// Parse JSON bodies (increased limit for image uploads)
app.use(express.json({ limit: '10mb' }));

// Configure CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ status: 'ok' });
});

console.log('Cloudinary configured with cloud name:', process.env.CLOUDINARY_CLOUD_NAME);


// Endpoint to get signed URLs for all gallery images (website folder)
app.get('/api/images', async (req, res) => {
    try {
        console.log('Fetching all gallery images from Cloudinary...');
        const result = await cloudinary.search
            .expression('folder:website')
            .with_field('context')
            .max_results(100)
            .execute();

        console.log('Found resources:', result.resources.length);
        const signedUrls = result.resources.map(resource => {
            const thumbnailUrl = cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: "auto" }
                ]
            });
            const fullUrl = cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [
                    { flags: "attachment" }
                ]
            });
            return {
                url: thumbnailUrl,
                fullResUrl: fullUrl,
                alt: resource.context?.custom?.title || 'Gallery image',
                description: resource.context?.custom?.description || '',
                publicId: resource.public_id,
                tags: resource.tags || []
            };
        });
        res.json(signedUrls);
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Endpoint to get images from the_wretchs_home folder
app.get('/api/wretchs-home-images', async (req, res) => {
    try {
        console.log('Fetching wretchs home images from Cloudinary...');
        const result = await cloudinary.search
            .expression('folder:website/the_wretchs_home')
            .with_field('context')
            .max_results(100)
            .execute();

        console.log('Found wretchs home resources:', result.resources.length);
        const signedUrls = result.resources.map(resource => {
            const thumbnailUrl = cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [
                    { width: 1200, crop: 'limit' },
                    { quality: "auto" }
                ]
            });
            return {
                url: thumbnailUrl,
                alt: resource.context?.custom?.title || 'Gallery image',
                publicId: resource.public_id
            };
        });
        res.json(signedUrls);
    } catch (error) {
        console.error('Error fetching wretchs home images:', error);
        res.status(500).json({ error: 'Failed to fetch images' });
    }
});

// Endpoint to get signed URLs for guided tour images by tag
// Usage: /api/guided-tour-images?tag=short_tour or medium_tour or long_tour
app.get('/api/guided-tour-images', async (req, res) => {
    const tag = req.query.tag;
    if (!tag) {
        return res.status(400).json({ error: 'Missing tag parameter' });
    }
    try {
        console.log(`Fetching guided tour images for tag: ${tag}`);
        const result = await cloudinary.search
            .expression(`folder:website AND tags:${tag}`)
            .with_field('context')
            .max_results(100)
            .execute();

        const signedUrls = result.resources.map(resource => {
            const thumbnailUrl = cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [
                    { width: 800, height: 800, crop: 'limit' },
                    { quality: "auto" }
                ]
            });
            const fullUrl = cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [
                    { flags: "attachment" }
                ]
            });
            return {
                url: thumbnailUrl,
                fullResUrl: fullUrl,
                alt: resource.context?.custom?.title || 'Gallery image',
                description: resource.context?.custom?.description || '',
                publicId: resource.public_id,
                tags: resource.tags || []
            };
        });
        res.json(signedUrls);
    } catch (error) {
        console.error('Error fetching guided tour images:', error);
        res.status(500).json({ error: 'Failed to fetch guided tour images' });
    }
});

// Endpoint to get signed URL for a specific image
app.get('/api/image/:id', async (req, res) => {
    try {        const signedUrl = cloudinary.url(req.params.id, {
            sign_url: true,
            secure: true,
            transformation: [
                { quality: "auto" }
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
        // Remove backgroundUrl, only return featuredUrl if needed
        const featuredUrl = cloudinary.url('DSC01893_xt8pgi.jpg', {
            sign_url: true,
            secure: true,
            resource_type: 'image',
            transformation: [
                { quality: "auto" }
            ]
        });
        console.log('Generated URL:', { featuredUrl });
        res.json({
            featured: featuredUrl
        });
    } catch (error) {
        console.error('Error in initial-images:', error);
        res.status(500).json({ error: 'Failed to generate signed URLs', details: error.message });
    }
});

// --- Archive Magazine API ---
const fs = require('fs');
const ARCHIVE_CLOUDINARY_ID = 'archive-magazine-data';

// Helper: fetch archive JSON from Cloudinary raw file
async function fetchArchiveData() {
    try {
        // Use cache-busting param to avoid Cloudinary CDN serving stale data
        const url = cloudinary.url(ARCHIVE_CLOUDINARY_ID, {
            resource_type: 'raw',
            secure: true
        }) + '?v=' + Date.now();
        const response = await fetch(url);
        if (!response.ok) throw new Error('Not found');
        return await response.json();
    } catch (e) {
        // Return default empty magazine if not found
        return {
            version: 1,
            title: 'Archive',
            pages: [
                {
                    id: 'page-1',
                    order: 0,
                    backgroundColor: '#111111',
                    elements: []
                },
                {
                    id: 'page-2',
                    order: 1,
                    backgroundColor: '#111111',
                    elements: []
                }
            ]
        };
    }
}

// Helper: save archive JSON to Cloudinary as raw file
function saveArchiveData(data) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                public_id: ARCHIVE_CLOUDINARY_ID,
                overwrite: true,
                invalidate: true
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(Buffer.from(JSON.stringify(data)));
    });
}

// Helper: check archive editor password
function checkArchivePassword(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return false;
    const password = auth.slice(7);
    return password === process.env.ARCHIVE_EDITOR_PASSWORD;
}

// GET /api/archive - fetch magazine data
app.get('/api/archive', async (req, res) => {
    try {
        const data = await fetchArchiveData();
        res.json(data);
    } catch (error) {
        console.error('Error fetching archive:', error);
        res.status(500).json({ error: 'Failed to fetch archive data' });
    }
});

// PUT /api/archive - save magazine data (password protected)
app.put('/api/archive', async (req, res) => {
    if (!checkArchivePassword(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        await saveArchiveData(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving archive:', error);
        res.status(500).json({ error: 'Failed to save archive data' });
    }
});

// POST /api/archive/auth - validate editor password
app.post('/api/archive/auth', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ARCHIVE_EDITOR_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// GET /api/archive/content-library - return all site content for the editor library
app.get('/api/archive/content-library', async (req, res) => {
    try {
        // Fetch images from Cloudinary
        const result = await cloudinary.search
            .expression('folder:website')
            .with_field('context')
            .max_results(100)
            .execute();

        const images = result.resources.map(resource => ({
            url: cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [{ quality: 'auto' }]
            }),
            thumbnailUrl: cloudinary.url(resource.public_id, {
                sign_url: true,
                secure: true,
                transformation: [{ width: 150, height: 150, crop: 'fill' }, { quality: 'auto' }]
            }),
            publicId: resource.public_id,
            width: resource.width,
            height: resource.height,
            alt: resource.context?.custom?.title || 'Image'
        }));

        // Load local essays
        const essays = [];
        try {
            const essayText = fs.readFileSync(path.join(__dirname, 'i-love-gush', 'essay.txt'), 'utf-8');
            // Split by chapter dividers
            const chapters = essayText.split(/—{5,}[^—]+—{5,}/g).filter(s => s.trim());
            const chapterNames = essayText.match(/—{5,}([^—]+)—{5,}/g) || [];
            chapterNames.forEach((header, i) => {
                const name = header.replace(/—/g, '').trim();
                const text = chapters[i] ? chapters[i].trim() : '';
                if (text) {
                    essays.push({
                        id: 'gush-ch-' + (i + 1),
                        title: 'I Love Gush — ' + name,
                        chapterName: name,
                        text: text
                    });
                }
            });
        } catch (e) {
            console.log('Could not load local essays:', e.message);
        }

        res.json({ images, essays });
    } catch (error) {
        console.error('Error fetching content library:', error);
        res.status(500).json({ error: 'Failed to fetch content library' });
    }
});

// POST /api/archive/upload - upload image to Cloudinary (password protected)
app.post('/api/archive/upload', async (req, res) => {
    if (!checkArchivePassword(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const { image } = req.body; // base64 data URL
        const result = await cloudinary.uploader.upload(image, {
            folder: 'website/archive',
            resource_type: 'image'
        });
        res.json({
            url: cloudinary.url(result.public_id, {
                secure: true,
                transformation: [{ quality: 'auto' }]
            }),
            thumbnailUrl: cloudinary.url(result.public_id, {
                secure: true,
                transformation: [{ width: 150, height: 150, crop: 'fill' }, { quality: 'auto' }]
            }),
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Serve livingroom.html at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'livingroom.html'));
});

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

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';  // This ensures the app listens on all network interfaces

app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
    console.log('Available endpoints:');
    console.log('- GET /api/test');
    console.log('- GET /api/initial-images');
});