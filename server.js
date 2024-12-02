const express = require('express');
const mongoose = require('mongoose');
const config = require('config');
const cors = require('cors');
const path = require('path'); // For static file paths

// Import routes
const userRoutes = require('./routes/api/users');
const productRoutes = require('./routes/api/products');
const categoryRoutes = require('./routes/api/categories');

const app = express();

// Middleware to parse JSON bodies and enable CORS
app.use(express.json());
app.use(cors()); // Enable CORS for all routes

// Serve static files from the /uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const mongo_url = config.get('mongo_url');
mongoose.set('strictQuery', true);
mongoose.connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Basic error handling middleware for routes
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).json({ error: 'Server Error' });
});

// Default route to handle non-existent endpoints
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.post('/upload', (req, res) => {
  const uploadedImages = req.files.map(file => `/uploads/products/${file.filename}`);
  console.log('Uploaded images:', uploadedImages); // Log here to verify
  res.json({ imageUrls: uploadedImages });
});


// Start server
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
