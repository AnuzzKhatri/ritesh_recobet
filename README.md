# AcroBet_Anuzzz

A modern web application for editing and converting PDF documents.

## Features

- Upload PDF files
- View PDF documents in the browser
- Extract and edit PDF content
- Save edited content as new PDF files
- Multiple viewing options for PDF preview
- Responsive design for desktop and mobile

## Technology Stack

### Frontend
- React.js
- TinyMCE Editor
- Axios for API requests
- React Router for navigation

### Backend
- Node.js
- Express.js
- PDF-lib for PDF manipulation
- Puppeteer for HTML to PDF conversion
- Multer for file uploads

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
```
git clone https://github.com/AnuzzKhatri/ritesh-recobet.git
cd ritesh-recobet
```

2. Install dependencies for both client and server:
```
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Start the server:
```
# From the server directory
npm start
```

4. Start the client:
```
# From the client directory
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Upload a PDF file using the upload interface
2. Edit the extracted content in the TinyMCE editor
3. Preview the original PDF on the right side
4. Save your changes as a new PDF file

## API Endpoints

- `POST /api/pdf/upload` - Upload a PDF file
- `GET /api/pdf/:filename` - Get a PDF file
- `GET /api/pdf/metadata/:filename` - Get PDF metadata
- `GET /api/pdf/extract/:filename` - Extract content from a PDF
- `POST /api/pdf/convert` - Convert HTML to PDF

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- TinyMCE for the rich text editor
- PDF-lib for PDF manipulation
- Puppeteer for HTML to PDF conversion 
