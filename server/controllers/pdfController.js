const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const puppeteer = require('puppeteer');

// Directory for uploads
const uploadsDir = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to resolve file path
const resolveFilePath = (filename) => {
  // If the path is already absolute or contains directory separators, use it as is
  if (path.isAbsolute(filename) || filename.includes(path.sep)) {
    return filename;
  }
  // Otherwise, assume it's just a filename and join with uploads directory
  return path.join(uploadsDir, filename);
};

// Extract text and content from PDF
const extractPdfContent = async (filename) => {
  try {
    // Resolve the file path
    const filePath = resolveFilePath(filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`PDF file not found at path: ${filePath}`);
      return {
        success: false,
        error: 'PDF file not found',
        html: '<p>Could not find the specified PDF file.</p>'
      };
    }

    console.log(`Extracting content from PDF: ${filePath}`);
    
    // Get metadata to determine page count
    const metadata = await getPdfMetadata(filename);
    if (!metadata.success) {
      return {
        success: false,
        error: 'Failed to get PDF metadata',
        html: '<p>Could not extract metadata from this PDF.</p>'
      };
    }
    
    const pageCount = metadata.metadata.pageCount || 1;
    
    // Since we can't easily extract text with pdf-lib, create a structured HTML template
    // that at least shows the page structure
    let htmlContent = '<div class="pdf-extracted-content">';
    
    for (let i = 1; i <= pageCount; i++) {
      htmlContent += `
        <div class="pdf-page" data-page="${i}">
          <h2>Page ${i}</h2>
          <div class="pdf-page-content">
            <p>This is the editable content area for page ${i}.</p>
            <p>The original PDF is displayed on the right for reference.</p>
            <p>You can type or paste content here to replace this text.</p>
          </div>
        </div>
      `;
      
      if (i < pageCount) {
        htmlContent += '<hr class="page-divider" />';
      }
    }
    
    htmlContent += '</div>';
    
    return {
      success: true,
      content: {
        html: htmlContent,
        pageCount: pageCount
      },
      message: 'PDF structure created successfully. Please refer to the original PDF on the right for content.'
    };
  } catch (error) {
    console.error('Error extracting PDF content:', error);
    // Return a fallback response instead of throwing an error
    return {
      success: false,
      error: error.message,
      content: {
        html: '<p>Could not extract content from this PDF. It may be an image-based or scanned document.</p>',
        pageCount: 1
      }
    };
  }
};

// Convert HTML to PDF
const convertHtmlToPdf = async (html, outputFilename) => {
  try {
    // Ensure the output filename is valid
    if (!outputFilename) {
      outputFilename = `converted-${Date.now()}.pdf`;
    }
    
    // Resolve the output path
    const outputPath = path.join(uploadsDir, outputFilename);
    
    console.log(`Converting HTML to PDF: ${outputPath}`);
    
    // Ensure the HTML content is not empty
    if (!html || html.trim() === '') {
      return {
        success: false,
        error: 'HTML content is empty'
      };
    }
    
    // Launch a headless browser
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Create a new page
    const page = await browser.newPage();
    
    // Set the HTML content
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Add basic styling if not present
    await page.addStyleTag({
      content: `
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          line-height: 1.5;
        }
        h1, h2, h3 { color: #333; }
        p { margin-bottom: 10px; }
      `
    });
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    // Close the browser
    await browser.close();
    
    // Verify the PDF was created
    if (!fs.existsSync(outputPath)) {
      return {
        success: false,
        error: 'PDF file was not created'
      };
    }
    
    console.log(`PDF successfully created at: ${outputPath}`);
    
    return {
      success: true,
      pdfPath: path.basename(outputPath)
    };
  } catch (error) {
    console.error('Error converting HTML to PDF:', error);
    return {
      success: false,
      error: `Failed to convert HTML to PDF: ${error.message}`
    };
  }
};

// Get PDF metadata
const getPdfMetadata = async (filename) => {
  try {
    // Resolve the file path
    const filePath = resolveFilePath(filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`PDF file not found at path: ${filePath}`);
      return {
        success: false,
        error: 'PDF file not found'
      };
    }
    
    console.log(`Getting metadata for PDF: ${filePath}`);
    
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    const metadata = {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle() || 'Untitled',
      author: pdfDoc.getAuthor() || 'Unknown',
      creationDate: pdfDoc.getCreationDate() || new Date(),
      modificationDate: pdfDoc.getModificationDate() || new Date(),
      fileSize: fs.statSync(filePath).size
    };
    
    console.log(`PDF metadata retrieved: ${JSON.stringify(metadata)}`);
    
    return {
      success: true,
      metadata
    };
  } catch (error) {
    console.error('Error getting PDF metadata:', error);
    return {
      success: false,
      error: `Failed to get PDF metadata: ${error.message}`
    };
  }
};

module.exports = {
  extractPdfContent,
  convertHtmlToPdf,
  getPdfMetadata
}; 