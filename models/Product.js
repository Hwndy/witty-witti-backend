import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    enum: ['phones', 'laptops', 'fans', 'headphones', 'chargers', 'powerbanks', 'accessories']
  },
  description: { 
    type: String, 
    required: true 
  },
  image: { 
    type: String, 
    required: true 
  },
  imageType: {
    type: String,
    enum: ['upload', 'url'],
    required: true
  },
  stock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
