// backend/routes/api/users.js
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/profile-pictures'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, `${req.user}-${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// Register Route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Simple validation
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user instance
        const newUser = new User({
            username,
            email,
            password: await bcrypt.hash(password, 10) // Hash password
        });

        // Save user to the database
        const savedUser = await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: savedUser._id },
            config.get('jwtSecret'),
            { expiresIn: config.get('tokenExpire') || '1h' }
        );

        // Respond with token and user details
        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                username: savedUser.username,
                email: savedUser.email
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login Route
router.post("/login-user", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Please provide email and password" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            config.get("jwtSecret"),
            { expiresIn: config.get("tokenExpire") || "1h" }
        );

        // Respond with token, username, and role
        return res.status(200).json({
            token,
            username: user.username, // Ensure username is included
            role: user.role,
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: "Internal server error" });
    }
});


// Get user profile
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});

// Update user profile
router.put('/update', auth, async (req, res) => {
    const { username, email } = req.body;
    try {
        const user = await User.findByIdAndUpdate(
            req.user,
            { username, email },
            { new: true, fields: '-password' }
        );
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});

// Change user password
router.post('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ msg: 'Invalid current password' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.send('Password updated successfully');
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});

// Upload profile picture
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
    try {
        const user = await User.findById(req.user);
        user.profilePicture = req.file.path;
        await user.save();
        res.json({ message: 'Profile picture updated successfully' });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ msg: 'Internal server error' });
    }
});

module.exports = router;
