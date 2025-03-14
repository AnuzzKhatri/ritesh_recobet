const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const pdfRoutes = require('./routes/pdfRoutes');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5001;

// Configure CORS with more options
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));

// Add security headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // Set Content-Security-Policy to allow PDFs
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; object-src 'self'; frame-src 'self'"
  );
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'fullscreen=self');
  
  next();
});

// Body parser middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files with proper headers
app.use('/uploads', (req, res, next) => {
  const requestedFile = path.basename(req.url);
  const filePath = path.join(uploadsDir, requestedFile);
  
  // Check if file exists and is a PDF
  if (fs.existsSync(filePath) && requestedFile.toLowerCase().endsWith('.pdf')) {
    // Set appropriate headers for PDF files
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${requestedFile}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    
    // Stream the file instead of using express.static
    const fileStream = fs.createReadStream(filePath);
    
    fileStream.on('error', (error) => {
      console.error(`Error streaming PDF file ${requestedFile}:`, error);
      if (!res.headersSent) {
        res.status(500).send('Error streaming PDF file');
      }
    });
    
    return fileStream.pipe(res);
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Use PDF routes
app.use('/api/pdf', pdfRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Ritesh_Recobet API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Server error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 