const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    rate: { type: Number, },
    count: { type: Number,}
});

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    type: { type: String, required: true },
    sizes: { type: [String], default: [] },
    size: { type: String },
    images: { type: [String], default: [], required: true}, // Array of image URLs
    stock: { type: String, required: true },
    price: { type: Number, required: true },
    prevprice: { type: Number, required: true },
    qty: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalprice: { type: Number, default: 0 },
    rating: { type: ratingSchema, }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
