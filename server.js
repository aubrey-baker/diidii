const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./database'); // Import the database module
const app = express();
app.use(express.json({ limit: '10mb' })); // Set limit for large images

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
const imageUploadDir = path.join(uploadDir, 'images');
const videoUploadDir = path.join(uploadDir, 'videos');
const audioUploadDir = path.join(uploadDir, 'audio');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(videoUploadDir)){
    fs.mkdirSync(videoUploadDir);
}
if (!fs.existsSync(audioUploadDir)){
    fs.mkdirSync(audioUploadDir);
}

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Store files based on their type (video, audio, or image)
        if (file.mimetype.startsWith('video/')) {
            cb(null, videoUploadDir);
        } else if (file.mimetype.startsWith('audio/')) {
            cb(null, audioUploadDir);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, imageUploadDir);
        } else {
            cb(new Error('Unsupported file type'), null);
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filenames
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Create a single multer upload instance for handling all file types
const upload = multer({ storage: storage });

// Route for handling image uploads from "Upload Images" section
app.post('/upload-images', upload.array('image', 10), (req, res) => {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }
    res.status(200).send('Images uploaded successfully');
});

// Route for handling captured photo upload from "Take a Photo" section
app.post('/upload-photo', (req, res) => {
    const { image } = req.body;
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const filePath = path.join(imageUploadDir, `photo_${Date.now()}.png`);

    fs.writeFile(filePath, base64Data, 'base64', err => {
        if (err) {
            console.error('Error saving photo:', err);
            return res.status(500).send('Error saving photo');
        }
        res.status(200).send('Photo uploaded successfully');
    });
});

// Handle video upload
app.post('/upload-video', upload.single('videoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No video file uploaded.');
    }
    res.send('Video uploaded successfully.');
});

// Handle audio upload
app.post('/upload-audio', upload.single('audioFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No audio file uploaded.');
    }
    res.send('Audio uploaded successfully.');
});

// Handle login requests
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Internal server error');
        }

        if (row) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
