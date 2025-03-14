const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfController = require('../controllers/pdfController');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Add timestamp to filename to make it unique
    const uniqueFilename = Date.now() + '-' + file.originalname;
    cb(null, uniqueFilename);
  }
});

// File filter to only allow PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

// Upload PDF file
router.post('/upload', upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log(`File uploaded: ${req.file.filename} (${req.file.path})`);
    
    return res.status(200).json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ success: false, error: 'Failed to upload file' });
  }
});

// Convert HTML to PDF
router.post('/convert', async (req, res) => {
  try {
    const { html, fileName } = req.body;
    
    if (!html) {
      return res.status(400).json({ success: false, error: 'No HTML content provided' });
    }
    
    // Sanitize filename and ensure it ends with .pdf
    let sanitizedFileName = fileName ? fileName.replace(/[^a-zA-Z0-9_.-]/g, '') : 'document.pdf';
    if (!sanitizedFileName.toLowerCase().endsWith('.pdf')) {
      sanitizedFileName = 'converted-' + sanitizedFileName;
    } else {
      sanitizedFileName = 'converted-' + sanitizedFileName;
    }
    
    const result = await pdfController.convertHtmlToPdf(html, sanitizedFileName);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        pdfPath: result.pdfPath
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to convert HTML to PDF'
      });
    }
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    return res.status(500).json({ success: false, error: 'Failed to convert HTML to PDF' });
  }
});

// Get PDF file
router.get('/:filename', (req, res) => {
  try {
    // Prevent directory traversal attacks
    const filename = path.basename(req.params.filename);
    const filePath = path.join(uploadsDir, filename);
    
    console.log(`Requested PDF file: ${filename}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'PDF file not found' });
    }
    
    // Set appropriate headers for PDF files
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Add security headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Handle errors in the stream
    fileStream.on('error', (error) => {
      console.error(`Error streaming PDF file ${filename}:`, error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Error streaming PDF file' });
      }
    });
  } catch (error) {
    console.error('Error serving PDF file:', error);
    return res.status(500).json({ success: false, error: 'Failed to serve PDF file' });
  }
});

// Get PDF metadata
router.get('/metadata/:filename', async (req, res) => {
  try {
    // Prevent directory traversal attacks
    const filename = path.basename(req.params.filename);
    
    console.log(`Requested metadata for PDF file: ${filename}`);
    
    const metadata = await pdfController.getPdfMetadata(filename);
    
    if (metadata.success) {
      return res.status(200).json({
        success: true,
        metadata: metadata.metadata
      });
    } else {
      return res.status(404).json({
        success: false,
        error: metadata.error || 'Failed to get PDF metadata'
      });
    }
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    return res.status(500).json({ success: false, error: 'Failed to get PDF metadata' });
  }
});

// Extract content from PDF
router.get('/extract/:filename', async (req, res) => {
  try {
    // Prevent directory traversal attacks
    const filename = path.basename(req.params.filename);
    
    console.log(`Extracting content from PDF file: ${filename}`);
    
    const content = await pdfController.extractPdfContent(filename);
    
    if (content.success) {
      return res.status(200).json({
        success: true,
        content: content.content
      });
    } else {
      return res.status(404).json({
        success: false,
        error: content.error || 'Failed to extract PDF content'
      });
    }
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    return res.status(500).json({ success: false, error: 'Failed to extract PDF content' });
  }
});

module.exports = router; 