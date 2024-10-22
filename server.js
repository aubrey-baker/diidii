const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Ensure the uploads directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// File filter to accept only video and audio files
const fileFilter = (req, file, cb) => {
    const allowedTypes = /mp4|mkv|avi|mp3|wav|m4a/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        return cb(null, true);
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
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
