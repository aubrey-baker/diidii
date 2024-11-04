const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
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
        // Store files based on their type (video or audio)
        if (file.mimetype.startsWith('video/')) {
            cb(null, videoUploadDir);
        } else if (file.mimetype.startsWith('audio/')) {
            cb(null, audioUploadDir);
        }
    },
    filename: (req, file, cb) => {
        // Generate unique filenames
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter to accept only video and audio files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /mp4|webm|mp3|wav/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb('Error: Only video and audio files are allowed!');
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

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

// Start server
const PORT = process.env.PORT || 80;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
})
