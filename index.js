require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const validUrl = require('valid-url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // This is needed to parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // This is needed to parse URL encoded request bodies

// MongoDB setup
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB', err));

// Define URL model
const URL = mongoose.model('URL', {
  original_url: String,
  short_url: Number
});

// POST /api/shorturl endpoint to create a short URL
app.post('/api/shorturl', async (req, res) => {
  const { url } = req.body;

  // Validate URL format
  if (!validUrl.isWebUri(url)) {
    return res.json({ error: 'invalid url' });
  }

  try {
    // Check if URL already exists in DB
    const foundURL = await URL.findOne({ original_url: url });

    if (foundURL) {
      return res.json({
        original_url: foundURL.original_url,
        short_url: foundURL.short_url
      });
    } else {
      // Generate a new short URL by counting existing documents
      const count = await URL.countDocuments({});

      const newURL = new URL({
        original_url: url,
        short_url: count + 1 // Increment based on the current count
      });

      await newURL.save();
      res.json({
        original_url: newURL.original_url,
        short_url: newURL.short_url
      });
    }
  } catch (err) {
    console.error("Error during short URL creation:", err); // Log the error
    res.json({ error: 'Database error' });
  }
});

// GET /api/shorturl/:short_url endpoint to redirect to the original URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;

  try {
    const foundURL = await URL.findOne({ short_url: short_url });

    if (!foundURL) {
      return res.json({ error: 'No short URL found for given input' });
    }

    // Redirect to the original URL
    res.redirect(foundURL.original_url);
  } catch (err) {
    console.error("Error during redirect:", err); // Log the error
    res.json({ error: 'Database error' });
  }
});

// Default route
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Start the server
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});