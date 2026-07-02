// ============================================
// 1. DEPENDENCIES
// ============================================
// Load environment variables from .env file (like MONGO_URI, PORT)
require('dotenv').config();

// Express: framework for building the web server and API routes
const express = require('express');

// Mongoose: library that lets us talk to MongoDB using JavaScript objects/models
const mongoose = require('mongoose');

// CORS: allows your frontend (running on a different port, e.g. 3001)
// to make requests to this backend (running on port 5000)
const cors = require('cors');

// Import your Product model/schema (defines what a "product" looks like in the DB)
const Product = require('./models/Product');

// --- NEW: Auth route (login) and middleware (protects write routes) ---
const authRoutes = require('./routes/authRoutes');
const verifyToken = require('./middleware/authMiddleware');


// ============================================
// 2. INITIALIZE APP
// ============================================
// Create the Express application instance — this "app" object
// is what we attach routes and middleware to
const app = express();


// ============================================
// 3. MIDDLEWARE
// ============================================
// Enables Cross-Origin Resource Sharing — without this, your React app
// (on a different port) would be blocked from calling this API
app.use(cors());

// Allows Express to automatically parse incoming JSON request bodies
// (e.g., when your frontend sends { title, price } in a POST/PUT request)
app.use(express.json());


// ============================================
// 4. CONNECT TO MONGODB ATLAS
// ============================================
// Read the database connection string from your .env file
const dbUri = process.env.MONGO_URI;

// Attempt to connect to MongoDB Atlas using that URI
mongoose.connect(dbUri)
    .then(() => console.log("🔥 Successfully connected to MongoDB Atlas!"))
    .catch(err => console.error("❌ Database connection error:", err.message));


// ============================================
// 5. ROUTES
// ============================================

// Simple health-check route — confirms the server is alive when you visit "/"
app.get('/', (req, res) => {
    res.send("Sporty Outfitters Backend is running!");
});


// --- NEW: Auth route — handles POST /api/auth/login ---
// Your React login form will call this to get a token
app.use('/api/auth', authRoutes);


// --- GET all products (public — your storefront needs this, unprotected) ---
// Fetches every product document from the "products" collection in MongoDB
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find(); // find() with no filter = get everything
        res.status(200).json(products);        // 200 = OK, send back the array of products
    } catch (err) {
        res.status(500).json({ error: err.message }); // 500 = server-side error
    }
});


// --- POST: create a new product (protected — requires a valid login token) ---
// Takes the JSON body sent by the client and saves it as a new document
app.post('/api/products', verifyToken, async (req, res) => {
    try {
        const newProduct = new Product(req.body); // build a new Product using request data
        const savedProduct = await newProduct.save(); // save it to MongoDB
        res.status(201).json(savedProduct); // 201 = Created, send back the saved product (with _id)
    } catch (err) {
        res.status(400).json({ error: err.message }); // 400 = bad request (e.g. missing required field)
    }
});


// --- DELETE: remove a product by ID (protected — requires a valid login token) ---
// :id in the URL is a route parameter — e.g. /api/products/6a44fdb...
app.delete('/api/products/:id', verifyToken, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id); // find the doc by its _id and delete it
        res.json({ message: 'Product deleted' });        // confirm deletion to the client
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// --- PUT: update an existing product by ID (protected — requires a valid login token) ---
// Used when editing a product's title, price, or description
app.put('/api/products/:id', verifyToken, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,      // which product to update (from the URL)
            req.body,           // the new data sent by the client (e.g. { price: 79.99 })
            {
                new: true,           // return the UPDATED document, not the old one
                runValidators: true  // re-check schema rules (e.g. required, type) on update
            }
        );

        // If no product was found with that ID, findByIdAndUpdate returns null
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json(updatedProduct); // 200 = OK, send back the updated product
    } catch (err) {
        res.status(400).json({ error: err.message }); // 400 = bad request (e.g. invalid data)
    }
});


// ============================================
// 6. START SERVER
// ============================================
// Use the PORT from .env if it exists, otherwise default to 5000
const PORT = process.env.PORT || 5000;

// Start listening for incoming requests on that port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));