const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    products: { type: [String], default: [] }  // Array of product IDs
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
