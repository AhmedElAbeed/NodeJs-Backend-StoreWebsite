const express = require('express');
const router = express.Router();
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose'); // Import mongoose

// Ensure the uploads/products folder exists
const uploadsFolder = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadsFolder)) {
    fs.mkdirSync(uploadsFolder, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsFolder); // Set the destination for the uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Create a unique filename
    }
});

// Multer file filter and limits
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },  // File size limit (5MB)
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Only images are allowed');
        }
    }
});

// Create a product
router.post('/', async (req, res) => {
    try {
        // Destructure product details from req.body
        const { title, description, category, type, images, sizes, size, stock, price, prevprice, qty, discount, rating } = req.body;
        console.log('Received body:', req.body); // Debug request body

        // Ensure required fields are provided
        if (!title || !category || !price || !images) {
            return res.status(400).json({ message: 'Required fields are missing' });
        }

        // Calculate total price after discount
        const totalprice = price - (price * (discount / 100));

        // Create new product with the provided details, including images from req.body
        const newProduct = new Product({
            title,
            description,
            category,
            type,
            sizes,
            size,
            images,  // Directly use images from req.body (assumed to be an array of image URLs)
            stock,
            price,
            prevprice,
            qty,
            discount,
            totalprice,
            rating
        });
        console.log('Received body:', req.body); // Debug request body

        // Save the product to the database
        const savedProduct = await newProduct.save();

        // Optionally, update the category's list of products
        const categoryDoc = await Category.findOne({ title: category });
        if (categoryDoc) {
            categoryDoc.products.push(savedProduct._id);
            await categoryDoc.save();
        }

        // Respond with the created product
        res.status(201).json(savedProduct);  // Created response
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: error.message });
    }
});

router.post('/upload', upload.array('images'), (req, res) => {
    if (req.files) {
        const imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
        console.log('Uploaded images:', imageUrls); // Debugging
        res.json({ imageUrls });
    } else {
        res.status(400).send({ message: 'No files uploaded' });
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products); // Return all products
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get a product by ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    try {
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (error) {
        console.error('Error fetching product by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update a product by ID
router.put('/:id', upload.array('images'), async (req, res) => {
    try {
        const { title, description, category, type, sizes, size, stock, price, prevprice, qty, discount, rating } = req.body;

        // Handle image URLs if images are uploaded
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            imageUrls = req.files.map(file => `/uploads/products/${file.filename}`);
        }

        const updatedProduct = {
            title,
            description,
            category,
            type,
            sizes,
            size,
            images: imageUrls.length > 0 ? imageUrls : undefined, // Only update images if new ones are provided
            stock,
            price,
            prevprice,
            qty,
            discount,
            totalprice: price - (price * (discount / 100)), // Recalculate totalprice after discount
            rating
        };

        const product = await Product.findByIdAndUpdate(req.params.id, updatedProduct, { new: true });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product); // Return updated product
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({ message: error.message });
    }
});

// Delete a product by ID
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
  
    // Check if the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }
  
    try {
      const product = await Product.findByIdAndDelete(id);
      if (!product) return res.status(404).json({ message: 'Product not found' });
  
      // Optionally, remove the product from the category
      const categoryDoc = await Category.findOne({ title: product.category });
      if (categoryDoc) {
        categoryDoc.products = categoryDoc.products.filter(productId => !product._id.equals(productId));
        await categoryDoc.save();
      }
  
      res.json({ message: 'Product deleted' }); // Successful deletion
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: error.message });
    }
});
  

module.exports = router;
