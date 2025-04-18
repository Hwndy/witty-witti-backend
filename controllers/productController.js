import Product from '../models/Product.js';

// Get all products with filtering, searching, and sorting
export const getProducts = async (req, res) => {
  try {
    console.log('Fetching products with query:', req.query);

    // Set explicit CORS headers for this route
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    const { category, search, sort } = req.query;

    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Create base query
    let productsQuery = Product.find(query);

    // Sort
    if (sort) {
      switch (sort) {
        case 'price-low-high':
          productsQuery = productsQuery.sort({ price: 1 });
          break;
        case 'price-high-low':
          productsQuery = productsQuery.sort({ price: -1 });
          break;
        case 'name-a-z':
          productsQuery = productsQuery.sort({ name: 1 });
          break;
        case 'name-z-a':
          productsQuery = productsQuery.sort({ name: -1 });
          break;
        case 'newest':
          productsQuery = productsQuery.sort({ createdAt: -1 });
          break;
        default:
          productsQuery = productsQuery.sort({ createdAt: -1 });
      }
    } else {
      // Default sort by newest
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    try {
      const products = await productsQuery.exec();
      console.log(`Found ${products.length} products`);
      return res.status(200).json(products);
    } catch (dbError) {
      console.error('Database error fetching products:', dbError);
      // Set CORS headers again to ensure they're present in error responses
      res.header('Access-Control-Allow-Origin', '*');
      return res.status(500).json({
        success: false,
        message: 'Database error while fetching products',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Unexpected error in getProducts:', error);
    // Set CORS headers again to ensure they're present in error responses
    res.header('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching products',
      error: error.message
    });
  }
};

// Get a single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id === 'undefined') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid product ID provided' 
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const { name, price, category, description, stock, featured, imageUrl } = req.body;

    let image;
    let imageType;

    if (imageUrl) {
      // Validate image URL
      try {
        const url = new URL(imageUrl);
        if (url.protocol !== 'https:') {
          return res.status(400).json({ message: 'Image URL must use HTTPS protocol' });
        }
        image = imageUrl;
        imageType = 'url';
      } catch (error) {
        return res.status(400).json({ message: 'Invalid image URL' });
      }
    } else if (req.file) {
      image = `/uploads/${req.file.filename}`;
      imageType = 'upload';
    } else {
      return res.status(400).json({ message: 'Product image is required (either URL or file upload)' });
    }

    const product = new Product({
      name,
      price: parseFloat(price),
      category,
      description,
      image,
      imageType,
      stock: parseInt(stock),
      featured: featured === 'true'
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a product
export const updateProduct = async (req, res) => {
  try {
    const { name, price, category, description, stock, featured, imageUrl } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update fields
    if (name) product.name = name;
    if (price) product.price = parseFloat(price);
    if (category) product.category = category;
    if (description) product.description = description;
    if (stock) product.stock = parseInt(stock);
    if (featured !== undefined) product.featured = featured === 'true';

    // Update image if provided
    if (imageUrl) {
      product.image = imageUrl;
      product.imageType = 'url';
    } else if (req.file) {
      product.image = `/uploads/${req.file.filename}`;
      product.imageType = 'upload';
    }

    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    console.log('Fetching featured products...');

    // Set explicit CORS headers for this route
    const origin = req.headers.origin;
    if (origin) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    } else {
      res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    // Use a try-catch block specifically for the database query
    try {
      const products = await Product.find({ featured: true }).limit(8);
      console.log(`Found ${products.length} featured products`);

      // Return the products
      return res.status(200).json(products);
    } catch (dbError) {
      console.error('Database error fetching featured products:', dbError);
      // Set CORS headers again to ensure they're present in error responses
      res.header('Access-Control-Allow-Origin', '*');
      return res.status(500).json({
        success: false,
        message: 'Database error while fetching featured products',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Unexpected error in getFeaturedProducts:', error);
    // Set CORS headers again to ensure they're present in error responses
    res.header('Access-Control-Allow-Origin', '*');
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching featured products',
      error: error.message
    });
  }
};

// Get products by category
export const getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
