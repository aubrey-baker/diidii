const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Serve static files (HTML, CSS, JS)
app.use(express.static('public'));

// Handle video upload
app.post('/upload-video', upload.single('videoFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No video file uploaded.');
    }
    res.send('Video uploaded successfully.');
});

// Start server
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
