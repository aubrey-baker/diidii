const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const db = require('./database'); // Import the database module
const { exec } = require('child_process'); // Import child_process module

const app = express();
app.use(express.json({ limit: '10mb' })); // Set limit for large images

// Set up session middleware
app.use(session({
    secret: 'your-secret-key', // Replace with a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', (req, res, next) => {
    console.log('Request for:', req.url);
    next();
}, express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/memories.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'memories.html'));
});

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const username = req.session.username;
        const userDir = path.join(uploadDir, username);

        // Create user directory if it doesn't exist
        if (!fs.existsSync(userDir)){
            fs.mkdirSync(userDir);
        }

        // Determine the subdirectory based on file type
        let subDir;
        if (file.mimetype.startsWith('image/')) {
            subDir = 'images';
        } else if (file.mimetype.startsWith('video/')) {
            subDir = 'videos';
        } else if (file.mimetype.startsWith('audio/')) {
            subDir = 'audio';
        } else {
            return cb(new Error('Unsupported file type'), null);
        }

        const uploadPath = path.join(userDir, subDir);

        // Create subdirectory if it doesn't exist
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath);
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const fileName = req.body.fileName || Date.now().toString();
        cb(null, `${fileName}${path.extname(file.originalname)}`);
    }
});

// Create a single multer upload instance for handling all file types
const upload = multer({ storage: storage });

// Route for handling image uploads from "Upload Images" section
app.post('/upload-images', upload.array('images', 10), (req, res) => {
    const fileCount = req.body.fileCount;
    
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // Process files
    req.files.forEach((file, index) => {
        const customName = req.body[`fileName_${index}`];
        if (customName) {
            const newPath = path.join(file.destination, customName);
            fs.renameSync(file.path, newPath);
        }
    });

    res.status(200).send('Images uploaded successfully');
});

// Route for handling captured photo upload from "Take a Photo" section
app.post('/upload-photo', (req, res) => {
    const { image } = req.body;
    const username = req.session.username;
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const userDir = path.join(uploadDir, username, 'images');

    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDir)){
        fs.mkdirSync(userDir, { recursive: true });
    }

    const filePath = path.join(userDir, `photo_${Date.now()}.png`);

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

// Route for handling media uploads
app.post('/upload-media', upload.array('media', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    // Process files
    req.files.forEach((file, index) => {
        const customName = req.body[`fileName_${index}`];
        if (customName) {
            const newPath = path.join(file.destination, customName);
            fs.renameSync(file.path, newPath);
        }
    });

    res.status(200).send('Media uploaded successfully');
});

// Route to fetch user-specific files
app.get('/user-files', (req, res) => {
    const username = req.session.username;
    const userDir = path.join(uploadDir, username);

    if (!fs.existsSync(userDir)) {
        return res.status(404).send('User directory not found');
    }

    const files = [];
    const subDirs = ['images', 'videos', 'audio'];

    subDirs.forEach(subDir => {
        const subDirPath = path.join(userDir, subDir);
        if (fs.existsSync(subDirPath)) {
            fs.readdirSync(subDirPath).forEach(file => {
                files.push({ type: subDir, name: file, path: path.join(username, subDir, file) });
            });
        }
    });

    res.json(files);
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
            req.session.username = username; // Store username in session
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid username or password');
        }
    });
});

// Add signup route
app.post('/signup', (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Error querying database:', err);
            return res.status(500).send('Internal server error');
        }

        if (row) {
            return res.status(400).send('Username already exists');
        }

        // Insert new user
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Failed to create user');
            }
            res.status(200).send('User created successfully');
        });
    });
});

// Route to check if the user is logged in
app.get('/check-login', (req, res) => {
    if (req.session.username) {
        res.json({ loggedIn: true, username: req.session.username });
    } else {
        res.json({ loggedIn: false });
    }
});

// Route to handle logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Failed to log out');
        }
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.status(200).send('Logout successful');
    });
});

// Add specific CORS and debugging middleware
app.use('/uploads', (req, res, next) => {
    console.log('Requesting file:', req.url);
    res.header('Access-Control-Allow-Origin', '*');
    next();
}, express.static(uploadDir));

// Route to get artists
app.get('/get-artists', (req, res) => {
    // Example: Fetch artists from the database or any other source
    const artists = ['Artist 1', 'Artist 2', 'Artist 3'];
    res.json({ artists });
});

// Route to handle form submission and fetch recommendations
app.post('/submit-form', (req, res) => {
    const { tempo, decade, artist } = req.body;

    // Example: Fetch recommendations based on the provided data
    const recommendations = [
        {
            title: 'Song 1',
            artist_name: 'Artist 1',
            tempo: 'Fast',
            year: '1980',
            youtube_recommendations: [
                { youtube_link: 'https://www.youtube.com/watch?v=example1', video_title: 'Example Video 1' }
            ]
        },
        {
            title: 'Song 2',
            artist_name: 'Artist 2',
            tempo: 'Slow',
            year: '1990',
            youtube_recommendations: [
                { youtube_link: 'https://www.youtube.com/watch?v=example2', video_title: 'Example Video 2' }
            ]
        }
    ];

    res.json({ data: recommendations });
});

// Function to install Python packages and run Python scripts
function setupPythonEnvironment() {
    exec('pip install -r requirements.txt', (err, stdout, stderr) => {
        if (err) {
            console.error(`Error installing Python packages: ${stderr}`);
            return;
        }
        console.log(`Python packages installed: ${stdout}`);

        // Run All_access_keys.py
        exec('python All_access_keys.py', (err, stdout, stderr) => {
            if (err) {
                console.error(`Error running All_access_keys.py: ${stderr}`);
                return;
            }
            console.log(`All_access_keys.py output: ${stdout}`);

            // Run Llama.py
            exec('python Llama.py', (err, stdout, stderr) => {
                if (err) {
                    console.error(`Error running Llama.py: ${stderr}`);
                    return;
                }
                console.log(`Llama.py output: ${stdout}`);
            });
        });
    });
}

// Start server and setup Python environment
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    setupPythonEnvironment(); // Setup Python environment when server starts
});
